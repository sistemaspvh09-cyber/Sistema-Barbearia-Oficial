<?php

namespace Tests\Feature\Api;

use App\Models\Barbershop;
use App\Models\BarbershopMembership;
use App\Models\Charge;
use App\Models\ChargeItem;
use App\Models\Customer;
use App\Models\InfinitePayConnection;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InfinitePayIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_configure_infinitepay_handle(): void
    {
        $context = $this->seedChargeContext();

        Sanctum::actingAs($context['user']);

        $response = $this->postJson('/api/v1/integrations/infinitepay/config', [
            'handle' => 'barberpro',
            'redirect_url' => 'https://example.com/sucesso',
            'webhook_url' => 'https://example.com/webhook',
            'barbershop_slug' => $context['barbershop']->slug,
        ]);

        $response->assertOk()
            ->assertJsonPath('connection.handle', 'barberpro')
            ->assertJsonPath('connection.redirect_url', 'https://example.com/sucesso')
            ->assertJsonPath('connection.webhook_url', 'https://example.com/webhook');

        $this->assertDatabaseHas('infinite_pay_connections', [
            'barbershop_id' => $context['barbershop']->id,
            'handle' => 'barberpro',
        ]);
    }

    public function test_can_read_current_infinitepay_configuration(): void
    {
        $context = $this->seedChargeContext();

        InfinitePayConnection::create([
            'barbershop_id' => $context['barbershop']->id,
            'created_by_user_id' => $context['user']->id,
            'handle' => 'barberpro-live',
            'redirect_url' => 'https://example.com/return',
            'webhook_url' => 'https://example.com/webhook',
            'is_active' => true,
        ]);

        Sanctum::actingAs($context['user']);

        $response = $this->getJson(sprintf(
            '/api/v1/integrations/infinitepay/config?barbershop_slug=%s',
            $context['barbershop']->slug,
        ));

        $response->assertOk()
            ->assertJsonPath('connection.handle', 'barberpro-live')
            ->assertJsonPath('connection.redirect_url', 'https://example.com/return')
            ->assertJsonPath('connection.webhook_url', 'https://example.com/webhook');
    }

    public function test_can_create_checkout_link_for_charge(): void
    {
        $context = $this->seedChargeContext();

        InfinitePayConnection::create([
            'barbershop_id' => $context['barbershop']->id,
            'handle' => 'barberpro',
            'redirect_url' => 'https://example.com/return',
            'webhook_url' => 'https://example.com/webhook',
            'is_active' => true,
        ]);

        Http::fake([
            'https://api.infinitepay.io/invoices/public/checkout/links' => Http::response([
                'slug' => 'inv_123',
                'checkout_url' => 'https://pay.infinitepay.io/inv_123',
                'transaction_nsu' => 'txn_123',
                'receipt_url' => 'https://pay.infinitepay.io/receipt/inv_123',
                'capture_method' => 'credit_card',
            ], 200),
        ]);

        Sanctum::actingAs($context['user']);

        $response = $this->postJson(
            sprintf(
                '/api/v1/integrations/infinitepay/charges/%d/checkout-link?barbershop_slug=%s',
                $context['charge']->id,
                $context['barbershop']->slug,
            ),
        );

        $response->assertOk()
            ->assertJsonPath('charge.gateway_reference', 'inv_123')
            ->assertJsonPath('infinitepay.slug', 'inv_123')
            ->assertJsonPath('infinitepay.checkout_url', 'https://pay.infinitepay.io/inv_123');

        $this->assertDatabaseHas('charges', [
            'id' => $context['charge']->id,
            'gateway' => 'infinitepay',
            'gateway_reference' => 'inv_123',
        ]);

        $context['charge']->refresh();

        $this->assertSame('https://pay.infinitepay.io/inv_123', data_get($context['charge']->metadata, 'infinitepay.checkout_url'));
        $this->assertSame('txn_123', data_get($context['charge']->metadata, 'infinitepay.transaction_nsu'));
        $this->assertSame('https://pay.infinitepay.io/receipt/inv_123', data_get($context['charge']->metadata, 'infinitepay.receipt_url'));
    }

    public function test_payment_check_marks_charge_paid(): void
    {
        $context = $this->seedChargeContext();

        InfinitePayConnection::create([
            'barbershop_id' => $context['barbershop']->id,
            'handle' => 'barberpro',
            'redirect_url' => 'https://example.com/return',
            'webhook_url' => 'https://example.com/webhook',
            'is_active' => true,
        ]);

        $context['charge']->update([
            'status' => 'pending',
            'gateway_reference' => 'inv_999',
            'gateway' => 'infinitepay',
            'metadata' => [
                'infinitepay' => [
                    'slug' => 'inv_999',
                ],
            ],
        ]);

        Http::fake([
            'https://api.infinitepay.io/invoices/public/checkout/payment_check' => Http::response([
                'success' => true,
                'paid' => true,
                'amount' => 4500,
                'paid_amount' => 4500,
                'installments' => 1,
                'capture_method' => 'pix',
                'slug' => 'inv_999',
                'transaction_nsu' => 'txn_paid_1',
                'receipt_url' => 'https://example.com/receipt/txn_paid_1',
            ], 200),
        ]);

        Sanctum::actingAs($context['user']);

        $response = $this->postJson(
            sprintf(
                '/api/v1/integrations/infinitepay/charges/%d/payment-check?barbershop_slug=%s',
                $context['charge']->id,
                $context['barbershop']->slug,
            ),
        );

        $response->assertOk()
            ->assertJsonPath('charge.status', 'paid');

        $this->assertDatabaseHas('charges', [
            'id' => $context['charge']->id,
            'status' => 'paid',
            'payment_method' => 'pix',
        ]);

        $context['charge']->refresh();

        $this->assertSame('txn_paid_1', data_get($context['charge']->metadata, 'infinitepay.transaction_nsu'));
        $this->assertSame('https://example.com/receipt/txn_paid_1', data_get($context['charge']->metadata, 'infinitepay.receipt_url'));
    }

    public function test_webhook_marks_charge_paid_and_records_deliveries(): void
    {
        $context = $this->seedChargeContext();

        InfinitePayConnection::create([
            'barbershop_id' => $context['barbershop']->id,
            'created_by_user_id' => $context['user']->id,
            'handle' => 'barberpro',
            'redirect_url' => 'https://example.com/return',
            'webhook_url' => 'https://example.com/webhook',
            'is_active' => true,
        ]);

        $payload = [
            'invoice_slug' => 'inv_hook_1',
            'amount' => 4500,
            'paid_amount' => 4500,
            'installments' => 1,
            'capture_method' => 'credit_card',
            'transaction_nsu' => 'trx_123',
            'order_nsu' => (string) $context['charge']->id,
            'receipt_url' => 'https://example.com/receipt',
        ];

        $response = $this->postJson('/api/v1/integrations/infinitepay/webhook', $payload);
        $duplicateResponse = $this->postJson('/api/v1/integrations/infinitepay/webhook', $payload);

        $response->assertOk()->assertJsonPath('ok', true);
        $duplicateResponse->assertOk()->assertJsonPath('ok', true);

        $this->assertDatabaseHas('charges', [
            'id' => $context['charge']->id,
            'gateway' => 'infinitepay',
            'status' => 'paid',
            'gateway_reference' => 'inv_hook_1',
        ]);

        $this->assertDatabaseCount('webhook_deliveries', 2);

        $context['charge']->refresh();

        $this->assertSame('trx_123', data_get($context['charge']->metadata, 'infinitepay.transaction_nsu'));
        $this->assertSame('https://example.com/receipt', data_get($context['charge']->metadata, 'infinitepay.receipt_url'));
        $this->assertSame('https://example.com/webhook', \DB::table('webhook_deliveries')->value('url'));
    }

    /**
     * @return array{barbershop: Barbershop, charge: Charge, user: User}
     */
    protected function seedChargeContext(): array
    {
        $barbershop = Barbershop::create([
            'name' => 'Barbearia Cabral',
            'slug' => 'barbearia-cabral',
            'timezone' => 'America/Cuiaba',
            'currency' => 'BRL',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'name' => 'Owner Demo',
            'email' => 'owner@barbearia.com',
            'active_barbershop_id' => $barbershop->id,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $barbershop->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'commission_rate' => 0,
            'is_active' => true,
        ]);

        $customer = Customer::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Bruno Cabral',
            'phone' => '(65) 99999-1111',
            'email' => 'bruno@cliente.com',
            'loyalty_points' => 10,
            'total_visits' => 1,
        ]);

        $service = Service::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Corte Tradicional',
            'slug' => 'corte-tradicional',
            'description' => 'Corte classico com acabamento.',
            'duration_minutes' => 45,
            'price_cents' => 4500,
            'is_active' => true,
            'sort_order' => 10,
        ]);

        $charge = Charge::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
            'subtotal_cents' => 4500,
            'discount_cents' => 0,
            'total_cents' => 4500,
            'payment_method' => 'pix',
        ]);

        ChargeItem::create([
            'charge_id' => $charge->id,
            'service_id' => $service->id,
            'description' => 'Corte Tradicional',
            'quantity' => 1,
            'unit_price_cents' => 4500,
            'total_price_cents' => 4500,
        ]);

        return [
            'barbershop' => $barbershop,
            'charge' => $charge,
            'user' => $user,
        ];
    }
}
