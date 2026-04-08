<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Charge;
use App\Models\Customer;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ChargesController extends Controller
{
    use ResolvesBarbershop;

    public function store(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'appointment_id' => ['required', 'integer', 'exists:appointments,id'],
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'subtotal_cents' => ['required', 'integer', 'min:0'],
            'discount_cents' => ['nullable', 'integer', 'min:0'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'due_at' => ['nullable', 'string'],
        ]);

        $this->assertAppointment($barbershop->id, (int) $payload['appointment_id']);
        $this->assertCustomer($barbershop->id, (int) $payload['customer_id']);

        $discountCents = (int) ($payload['discount_cents'] ?? 0);
        $subtotalCents = (int) $payload['subtotal_cents'];
        $totalCents = max(0, $subtotalCents - $discountCents);

        $charge = Charge::query()->create([
            'barbershop_id' => $barbershop->id,
            'appointment_id' => (int) $payload['appointment_id'],
            'customer_id' => (int) $payload['customer_id'],
            'status' => 'pending',
            'subtotal_cents' => $subtotalCents,
            'discount_cents' => $discountCents,
            'total_cents' => $totalCents,
            'payment_method' => $payload['payment_method'] ?? null,
            'due_at' => ! empty($payload['due_at']) ? $this->parseIsoDateTime($payload['due_at'], 'due_at') : null,
        ]);

        return response()->json([
            'item' => $this->chargePayload($charge->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'status' => ['sometimes', 'required', 'in:pending,paid,cancelled,refunded'],
            'payment_method' => ['sometimes', 'nullable', 'string', 'max:50'],
            'paid_at' => ['sometimes', 'nullable', 'string'],
            'due_at' => ['sometimes', 'nullable', 'string'],
            'discount_cents' => ['sometimes', 'required', 'integer', 'min:0'],
            'subtotal_cents' => ['sometimes', 'required', 'integer', 'min:0'],
        ]);

        $charge = Charge::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        $updates = [];

        foreach (['status', 'payment_method', 'discount_cents', 'subtotal_cents'] as $field) {
            if (array_key_exists($field, $payload)) {
                $updates[$field] = $payload[$field];
            }
        }

        if (array_key_exists('due_at', $payload)) {
            $updates['due_at'] = $payload['due_at'] === null ? null : $this->parseIsoDateTime($payload['due_at'], 'due_at');
        }

        if (array_key_exists('paid_at', $payload)) {
            $updates['paid_at'] = $payload['paid_at'] === null ? null : $this->parseIsoDateTime($payload['paid_at'], 'paid_at');
        }

        $targetStatus = $updates['status'] ?? $charge->status;
        $targetPaidAt = $updates['paid_at'] ?? $charge->paid_at;

        if ($targetStatus === 'paid' && $targetPaidAt === null) {
            $updates['paid_at'] = now();
        }

        if (array_key_exists('discount_cents', $updates) || array_key_exists('subtotal_cents', $updates)) {
            $subtotalCents = (int) ($updates['subtotal_cents'] ?? $charge->subtotal_cents);
            $discountCents = (int) ($updates['discount_cents'] ?? $charge->discount_cents);
            $updates['total_cents'] = max(0, $subtotalCents - $discountCents);
        }

        $charge->fill($updates);
        $charge->save();

        return response()->json([
            'item' => $this->chargePayload($charge->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $charge = Charge::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        if ($charge->status === 'paid') {
            throw ValidationException::withMessages([
                'charge_id' => 'Nao e possivel remover cobranca com status paid.',
            ]);
        }

        $charge->delete();

        return response()->json([], 204);
    }

    protected function chargePayload(Charge $charge, string $timezone): array
    {
        return [
            'id' => $charge->id,
            'barbershop_id' => $charge->barbershop_id,
            'appointment_id' => $charge->appointment_id,
            'customer_id' => $charge->customer_id,
            'status' => $charge->status,
            'subtotal_cents' => $charge->subtotal_cents,
            'discount_cents' => $charge->discount_cents,
            'total_cents' => $charge->total_cents,
            'payment_method' => $charge->payment_method,
            'due_at' => $this->formatTimestamp($charge->due_at, $timezone),
            'paid_at' => $this->formatTimestamp($charge->paid_at, $timezone),
        ];
    }

    protected function assertAppointment(int $barbershopId, int $appointmentId): void
    {
        $exists = Appointment::query()
            ->where('barbershop_id', $barbershopId)
            ->whereKey($appointmentId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'appointment_id' => 'Agendamento nao pertence a barbearia selecionada.',
            ]);
        }

        $hasCharge = Charge::query()
            ->where('barbershop_id', $barbershopId)
            ->where('appointment_id', $appointmentId)
            ->exists();

        if ($hasCharge) {
            throw ValidationException::withMessages([
                'appointment_id' => 'Este agendamento ja possui cobranca vinculada.',
            ]);
        }
    }

    protected function assertCustomer(int $barbershopId, int $customerId): void
    {
        $exists = Customer::query()
            ->where('barbershop_id', $barbershopId)
            ->whereKey($customerId)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'customer_id' => 'Cliente nao pertence a barbearia selecionada.',
            ]);
        }
    }

    protected function parseIsoDateTime(string $value, string $field): CarbonImmutable
    {
        try {
            return CarbonImmutable::parse($value);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                $field => 'Use formato ISO8601 valido.',
            ]);
        }
    }
}

