<?php

namespace App\Services\Integrations;

use App\Models\Barbershop;
use App\Models\Charge;
use App\Models\InfinitePayConnection;
use App\Models\User;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class InfinitePayCheckoutService
{
    protected const CHECKOUT_LINK_URL = 'https://api.infinitepay.io/invoices/public/checkout/links';

    protected const PAYMENT_CHECK_URL = 'https://api.infinitepay.io/invoices/public/checkout/payment_check';

    public function __construct(
        protected HttpFactory $http,
    ) {
    }

    public function currentConfiguration(Barbershop $barbershop): ?InfinitePayConnection
    {
        return InfinitePayConnection::query()
            ->where('barbershop_id', $barbershop->id)
            ->latest('id')
            ->first();
    }

    public function configure(Barbershop $barbershop, ?User $user, array $attributes): InfinitePayConnection
    {
        $connection = InfinitePayConnection::query()->firstOrNew([
            'barbershop_id' => $barbershop->id,
        ]);

        $connection->fill([
            'created_by_user_id' => $user?->id,
            'handle' => $attributes['handle'],
            'redirect_url' => $attributes['redirect_url'] ?? null,
            'webhook_url' => $attributes['webhook_url'] ?? null,
            'is_active' => $attributes['is_active'] ?? true,
            'last_checked_at' => null,
        ]);
        $connection->save();

        return $connection->refresh();
    }

    public function createCheckoutLink(Charge $charge): array
    {
        $charge->loadMissing(['customer', 'items', 'barbershop']);

        $connection = InfinitePayConnection::query()
            ->where('barbershop_id', $charge->barbershop_id)
            ->where('is_active', true)
            ->first();

        if (! $connection) {
            throw ValidationException::withMessages([
                'infinitepay' => 'Nenhuma configuracao InfinitePay ativa encontrada para esta barbearia.',
            ]);
        }

        $items = $charge->items->map(fn ($item) => [
            'quantity' => max(1, (int) $item->quantity),
            'price' => (int) $item->unit_price_cents,
            'description' => $item->description,
        ])->values()->all();

        if ($items === []) {
            $items = [[
                'quantity' => 1,
                'price' => (int) $charge->total_cents,
                'description' => 'Servico BarberPro',
            ]];
        }

        $redirectUrl = $connection->redirect_url ?: config('services.infinitepay.redirect_url');
        $webhookUrl = $connection->webhook_url ?: config('services.infinitepay.webhook_url');

        if (! $redirectUrl || ! $webhookUrl) {
            throw ValidationException::withMessages([
                'infinitepay' => 'Configure redirect_url e webhook_url antes de gerar cobrancas reais na InfinitePay.',
            ]);
        }

        $payload = array_filter([
            'handle' => $connection->handle,
            'items' => $items,
            'order_nsu' => (string) $charge->id,
            'redirect_url' => $redirectUrl,
            'webhook_url' => $webhookUrl,
            'customer' => $charge->customer ? array_filter([
                'name' => $charge->customer->name,
                'email' => $charge->customer->email,
                'phone_number' => $this->normalizePhone($charge->customer->phone),
            ]) : null,
        ], fn ($value) => $value !== null && $value !== '');

        $response = $this->http
            ->acceptJson()
            ->post(self::CHECKOUT_LINK_URL, $payload)
            ->throw()
            ->json();

        $normalizedResponse = $this->normalizeProviderPayload($response);

        $charge->forceFill([
            'gateway' => 'infinitepay',
            'gateway_reference' => $this->resolveGatewayReference($normalizedResponse) ?? $charge->gateway_reference,
            'metadata' => $this->mergeInfinitePayMetadata($charge, $normalizedResponse),
        ])->save();

        $connection->forceFill([
            'last_checked_at' => now(),
        ])->save();

        return $response;
    }

    public function checkPaymentStatus(Charge $charge): array
    {
        $connection = InfinitePayConnection::query()
            ->where('barbershop_id', $charge->barbershop_id)
            ->where('is_active', true)
            ->first();

        if (! $connection) {
            throw ValidationException::withMessages([
                'infinitepay' => 'InfinitePay nao configurado para esta barbearia.',
            ]);
        }

        $providerData = $charge->metadata['infinitepay'] ?? [];
        $payload = array_filter([
            'handle' => $connection->handle,
            'order_nsu' => (string) $charge->id,
            'transaction_nsu' => $providerData['transaction_nsu'] ?? null,
            'slug' => $charge->gateway_reference ?? $providerData['slug'] ?? $providerData['invoice_slug'] ?? null,
        ], fn ($value) => $value !== null && $value !== '');

        $response = $this->http
            ->acceptJson()
            ->post(self::PAYMENT_CHECK_URL, $payload)
            ->throw()
            ->json();

        $normalizedResponse = $this->normalizeProviderPayload($response);
        $paid = $this->isPaidPayload($normalizedResponse);

        $charge->forceFill([
            'status' => $paid ? 'paid' : $charge->status,
            'payment_method' => $normalizedResponse['capture_method'] ?? $charge->payment_method,
            'gateway_reference' => $this->resolveGatewayReference($normalizedResponse) ?? $charge->gateway_reference,
            'paid_at' => $paid ? ($charge->paid_at ?? now()) : $charge->paid_at,
            'metadata' => $this->mergeInfinitePayMetadata($charge, $normalizedResponse),
        ])->save();

        return $response;
    }

    public function handleWebhook(array $payload): ?Charge
    {
        $orderNsu = $payload['order_nsu'] ?? null;

        if (! $orderNsu || ! ctype_digit((string) $orderNsu)) {
            return null;
        }

        $charge = Charge::query()->find((int) $orderNsu);

        if (! $charge) {
            return null;
        }

        $nextStatus = $this->resolveWebhookStatus($payload);
        $isPaid = $nextStatus === 'paid';
        $normalizedPayload = $this->normalizeProviderPayload($payload);

        $charge->forceFill([
            'gateway' => 'infinitepay',
            'gateway_reference' => $this->resolveGatewayReference($normalizedPayload) ?? $charge->gateway_reference,
            'status' => $nextStatus,
            'payment_method' => $normalizedPayload['capture_method'] ?? $charge->payment_method,
            'paid_at' => $isPaid ? ($charge->paid_at ?? now()) : $charge->paid_at,
            'metadata' => $this->mergeInfinitePayMetadata($charge, $normalizedPayload),
        ])->save();

        $this->recordWebhookDelivery($charge, $normalizedPayload, $isPaid ? 'sent' : 'failed');

        return $charge;
    }

    protected function normalizePhone(?string $phone): ?string
    {
        if (! $phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);

        if (! $digits) {
            return null;
        }

        if (! str_starts_with($digits, '55')) {
            $digits = '55'.$digits;
        }

        return '+'.$digits;
    }

    protected function resolveWebhookStatus(array $payload): string
    {
        $rawStatus = strtolower((string) ($payload['status'] ?? $payload['invoice_status'] ?? 'paid'));

        if (($payload['paid'] ?? null) === true || (int) ($payload['paid_amount'] ?? 0) > 0) {
            return 'paid';
        }

        if (in_array($rawStatus, ['paid', 'approved', 'captured', 'completed'], true)) {
            return 'paid';
        }

        if (in_array($rawStatus, ['cancelled', 'canceled', 'voided', 'refused', 'refunded'], true)) {
            return 'cancelled';
        }

        return 'pending';
    }

    protected function isPaidPayload(array $payload): bool
    {
        return $this->resolveWebhookStatus($payload) === 'paid';
    }

    protected function resolveGatewayReference(array $payload): ?string
    {
        return $payload['slug']
            ?? $payload['invoice_slug']
            ?? data_get($payload, 'data.slug')
            ?? data_get($payload, 'data.invoice_slug');
    }

    protected function normalizeProviderPayload(array $payload): array
    {
        $normalized = $payload;

        $normalized['slug'] ??= $this->resolveGatewayReference($payload);
        $normalized['transaction_nsu'] ??= data_get($payload, 'data.transaction_nsu');
        $normalized['receipt_url'] ??= data_get($payload, 'data.receipt_url');
        $normalized['checkout_url'] ??= data_get($payload, 'data.checkout_url')
            ?? data_get($payload, 'data.url')
            ?? data_get($payload, 'checkout.url');
        $normalized['capture_method'] ??= data_get($payload, 'data.capture_method');
        $normalized['paid'] ??= data_get($payload, 'data.paid');
        $normalized['paid_amount'] ??= data_get($payload, 'data.paid_amount');

        return $normalized;
    }

    protected function mergeInfinitePayMetadata(Charge $charge, array $payload): array
    {
        $existingMetadata = $charge->metadata ?? [];
        $existingProvider = is_array($existingMetadata['infinitepay'] ?? null)
            ? $existingMetadata['infinitepay']
            : [];

        return array_merge($existingMetadata, [
            'order_nsu' => (string) $charge->id,
            'infinitepay' => array_merge($existingProvider, $payload),
            'infinitepay_status' => $payload,
        ]);
    }

    protected function recordWebhookDelivery(Charge $charge, array $payload, string $status): void
    {
        if (! Schema::hasTable('webhook_deliveries')) {
            return;
        }

        $connection = InfinitePayConnection::query()
            ->where('barbershop_id', $charge->barbershop_id)
            ->where('is_active', true)
            ->latest('id')
            ->first();

        DB::table('webhook_deliveries')->insert([
            'barbershop_id' => $charge->barbershop_id,
            'source' => 'infinitepay',
            'event_type' => (string) ($payload['event_type'] ?? ($payload['status'] ?? 'payment')),
            'status' => $status,
            'url' => (string) ($connection?->webhook_url ?: config('services.infinitepay.webhook_url') ?: 'infinitepay://webhook'),
            'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'response_code' => null,
            'response_body' => null,
            'last_attempt_at' => now(),
            'attempt_count' => 1,
            'metadata' => json_encode([
                'charge_id' => $charge->id,
                'gateway_reference' => $charge->gateway_reference,
            ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
