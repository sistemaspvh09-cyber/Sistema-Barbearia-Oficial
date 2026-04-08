<?php

namespace Tests\Feature\Api;

use App\Models\Barbershop;
use App\Models\BarbershopMembership;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DomainResourcesCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_crud_domain_resources(): void
    {
        $context = $this->seedContext(role: 'owner');
        Sanctum::actingAs($context['user']);

        $cases = $this->resourcePayloadCases($context['customer']->id);

        foreach ($cases as $resource => $payload) {
            $store = $this->postJson("/api/v1/{$resource}?barbershop_slug={$context['barbershop']->slug}", $payload)
                ->assertCreated()
                ->assertJsonStructure(['item' => ['id']]);

            $id = (int) $store->json('item.id');

            $this->getJson("/api/v1/{$resource}/{$id}?barbershop_slug={$context['barbershop']->slug}")
                ->assertOk()
                ->assertJsonPath('item.id', $id);

            $this->putJson("/api/v1/{$resource}/{$id}?barbershop_slug={$context['barbershop']->slug}", $payload)
                ->assertOk()
                ->assertJsonPath('item.id', $id);

            $this->deleteJson("/api/v1/{$resource}/{$id}?barbershop_slug={$context['barbershop']->slug}")
                ->assertNoContent();
        }
    }

    public function test_barber_cannot_write_admin_only_resource(): void
    {
        $context = $this->seedContext(role: 'barber');
        Sanctum::actingAs($context['user']);

        $this->postJson("/api/v1/products?barbershop_slug={$context['barbershop']->slug}", [
            'name' => 'Pomada Matte',
        ])->assertStatus(403);
    }

    public function test_resource_is_isolated_by_barbershop(): void
    {
        $contextA = $this->seedContext(role: 'owner', email: 'owner-a@demo.com', slug: 'shop-a');
        $contextB = $this->seedContext(role: 'owner', email: 'owner-b@demo.com', slug: 'shop-b');

        Sanctum::actingAs($contextA['user']);

        $id = (int) $this->postJson("/api/v1/products?barbershop_slug={$contextA['barbershop']->slug}", [
            'name' => 'Produto A',
            'price_cents' => 1000,
        ])->assertCreated()->json('item.id');

        Sanctum::actingAs($contextB['user']);

        $this->getJson("/api/v1/products/{$id}?barbershop_slug={$contextB['barbershop']->slug}")
            ->assertNotFound();
    }

    protected function resourcePayloadCases(int $customerId): array
    {
        return [
            'products' => [
                'name' => 'Pomada Matte',
                'sku' => 'POM-001',
                'category' => 'finalizacao',
                'price_cents' => 3500,
            ],
            'suppliers' => [
                'name' => 'Fornecedor Demo',
                'email' => 'fornecedor@demo.com',
                'status' => 'active',
            ],
            'expenses' => [
                'name' => 'Energia',
                'category' => 'fixa',
                'amount_cents' => 12990,
                'status' => 'pending',
            ],
            'loyalty-programs' => [
                'name' => 'Clube VIP',
                'points_per_currency_unit' => 1,
                'is_active' => true,
            ],
            'points' => [
                'customer_id' => $customerId,
                'change_points' => 20,
                'reason' => 'bonus',
            ],
            'coupons' => [
                'code' => 'BEMVINDO10',
                'name' => 'Cupom de Boas-vindas',
                'discount_type' => 'percent',
                'discount_value' => 10,
                'is_active' => true,
            ],
            'campaigns' => [
                'name' => 'Campanha Abril',
                'channel' => 'whatsapp',
                'status' => 'draft',
            ],
            'support/tickets' => [
                'customer_id' => $customerId,
                'title' => 'Duvida',
                'description' => 'Nao recebi confirmacao.',
                'status' => 'open',
                'priority' => 'medium',
            ],
            'faq' => [
                'title' => 'Como remarcar?',
                'slug' => 'como-remarcar',
                'content' => 'Use a agenda para remarcar.',
                'status' => 'published',
            ],
            'notifications' => [
                'type' => 'reminder',
                'title' => 'Lembrete',
                'body' => 'Seu horario e amanha',
                'status' => 'queued',
            ],
            'templates' => [
                'key' => 'reminder_whatsapp',
                'channel' => 'whatsapp',
                'body_template' => 'Oi {{name}}',
                'is_active' => true,
            ],
            'dispatches' => [
                'channel' => 'whatsapp',
                'status' => 'queued',
                'attempt_count' => 0,
            ],
            'security/events' => [
                'event_type' => 'login',
                'severity' => 'info',
            ],
            'audit/logs' => [
                'action' => 'service.updated',
                'entity_type' => 'service',
                'entity_id' => 1,
            ],
            'webhooks/logs' => [
                'source' => 'infinitepay',
                'event_type' => 'payment.paid',
                'status' => 'pending',
                'url' => 'https://example.com/webhook',
                'payload' => ['id' => 'evt_1'],
            ],
            'analytics/snapshots' => [
                'scope' => 'nps',
                'snapshot_date' => now()->format('Y-m-d'),
                'metrics' => [
                    'nps_score' => 78,
                    'responses' => 34,
                ],
            ],
        ];
    }

    /**
     * @return array{barbershop: Barbershop, user: User, customer: Customer}
     */
    protected function seedContext(string $role, string $email = 'owner@demo.com', string $slug = 'barbearia-cabral'): array
    {
        $barbershop = Barbershop::create([
            'name' => 'Barbearia '.strtoupper(substr($slug, -1)),
            'slug' => $slug,
            'timezone' => 'America/Cuiaba',
            'currency' => 'BRL',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'name' => 'User '.strtoupper(substr($slug, -1)),
            'email' => $email,
            'active_barbershop_id' => $barbershop->id,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $barbershop->id,
            'user_id' => $user->id,
            'role' => $role,
            'commission_rate' => 0,
            'is_active' => true,
        ]);

        $customer = Customer::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Cliente Teste',
            'phone' => '(65) 99999-0000',
            'email' => 'cliente.'.$slug.'@demo.com',
        ]);

        return [
            'barbershop' => $barbershop,
            'user' => $user,
            'customer' => $customer,
        ];
    }
}

