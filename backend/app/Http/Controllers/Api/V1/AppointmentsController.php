<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\BarbershopMembership;
use App\Models\Customer;
use App\Models\Service;
use App\Services\Integrations\GoogleCalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AppointmentsController extends Controller
{
    use ResolvesBarbershop;

    public function store(Request $request, GoogleCalendarService $googleCalendar): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'barber_user_id' => ['required', 'integer', 'exists:users,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'scheduled_start_at' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
            'channel' => ['nullable', 'string', 'max:50'],
        ]);

        $this->assertBarberMembership($barbershop->id, (int) $payload['barber_user_id']);
        $service = $this->resolveService($barbershop->id, $payload['service_id'] ?? null);
        $this->assertCustomer($barbershop->id, $payload['customer_id'] ?? null);

        $scheduledStartAt = $this->parseIsoDateTime($payload['scheduled_start_at'], 'scheduled_start_at');
        $durationMinutes = $service?->duration_minutes ?? 30;
        $scheduledEndAt = $scheduledStartAt->addMinutes($durationMinutes);

        $appointment = Appointment::query()->create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $payload['customer_id'] ?? null,
            'barber_user_id' => (int) $payload['barber_user_id'],
            'service_id' => $payload['service_id'] ?? null,
            'scheduled_start_at' => $scheduledStartAt,
            'scheduled_end_at' => $scheduledEndAt,
            'status' => 'scheduled',
            'channel' => $payload['channel'] ?? 'balcao',
            'notes' => $payload['notes'] ?? null,
            'created_by_user_id' => $request->user()?->id,
        ]);

        $googleWarning = $this->syncGoogleEvent($appointment->fresh(), $googleCalendar);
        $response = [
            'item' => $this->appointmentPayload($appointment->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ];

        if ($googleWarning !== null) {
            $response['integration_warnings'] = [
                'google_calendar' => $googleWarning,
            ];
        }

        return response()->json($response, 201);
    }

    public function update(Request $request, string $id, GoogleCalendarService $googleCalendar): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'barber_user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'service_id' => ['sometimes', 'nullable', 'integer', 'exists:services,id'],
            'customer_id' => ['sometimes', 'nullable', 'integer', 'exists:customers,id'],
            'scheduled_start_at' => ['sometimes', 'required', 'string'],
            'scheduled_end_at' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', 'in:scheduled,confirmed,waiting,completed,cancelled,no_show'],
            'channel' => ['sometimes', 'nullable', 'string', 'max:50'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $appointment = Appointment::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        if (array_key_exists('barber_user_id', $payload) && $payload['barber_user_id'] !== null) {
            $this->assertBarberMembership($barbershop->id, (int) $payload['barber_user_id']);
        }

        if (array_key_exists('customer_id', $payload) && $payload['customer_id'] !== null) {
            $this->assertCustomer($barbershop->id, (int) $payload['customer_id']);
        }

        $service = null;
        if (array_key_exists('service_id', $payload)) {
            $service = $this->resolveService($barbershop->id, $payload['service_id']);
        }

        $updates = [];

        foreach (['barber_user_id', 'service_id', 'customer_id', 'status', 'channel', 'notes'] as $field) {
            if (array_key_exists($field, $payload)) {
                $updates[$field] = $payload[$field];
            }
        }

        if (array_key_exists('scheduled_start_at', $payload)) {
            $updates['scheduled_start_at'] = $this->parseIsoDateTime($payload['scheduled_start_at'], 'scheduled_start_at');
        }

        if (array_key_exists('scheduled_end_at', $payload)) {
            $updates['scheduled_end_at'] = $payload['scheduled_end_at'] === null
                ? null
                : $this->parseIsoDateTime($payload['scheduled_end_at'], 'scheduled_end_at');
        } elseif (array_key_exists('scheduled_start_at', $payload) || array_key_exists('service_id', $payload)) {
            $baseStart = $updates['scheduled_start_at'] ?? $appointment->scheduled_start_at;

            if (! $baseStart) {
                throw ValidationException::withMessages([
                    'scheduled_start_at' => 'Informe scheduled_start_at para recalcular scheduled_end_at.',
                ]);
            }

            $resolvedService = $service;

            if (! $resolvedService) {
                $resolvedService = $appointment->service_id
                    ? Service::query()
                        ->where('barbershop_id', $barbershop->id)
                        ->whereKey($appointment->service_id)
                        ->first()
                    : null;
            }

            $durationMinutes = $resolvedService?->duration_minutes ?? 30;
            $updates['scheduled_end_at'] = CarbonImmutable::instance($baseStart)->addMinutes($durationMinutes);
        }

        if (($updates['status'] ?? $appointment->status) === 'cancelled') {
            $updates['cancelled_at'] = now();
        } elseif (array_key_exists('status', $updates)) {
            $updates['cancelled_at'] = null;
        }

        $appointment->fill($updates);
        $appointment->save();

        $googleWarning = ($appointment->status === 'cancelled')
            ? $this->cancelGoogleEvent($appointment, $googleCalendar)
            : $this->syncGoogleEvent($appointment->fresh(), $googleCalendar);

        $response = [
            'item' => $this->appointmentPayload($appointment->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ];

        if ($googleWarning !== null) {
            $response['integration_warnings'] = [
                'google_calendar' => $googleWarning,
            ];
        }

        return response()->json($response);
    }

    public function destroy(Request $request, string $id, GoogleCalendarService $googleCalendar): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $appointment = Appointment::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        if ($appointment->google_calendar_event_id) {
            $this->cancelGoogleEvent($appointment, $googleCalendar);
        }

        if (! $appointment->charge()->exists()) {
            $appointment->delete();

            return response()->json([], 204);
        }

        $appointment->forceFill([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ])->save();

        return response()->json([], 204);
    }

    protected function syncGoogleEvent(Appointment $appointment, GoogleCalendarService $googleCalendar): ?string
    {
        try {
            $synced = $googleCalendar->syncEventForAppointment($appointment);

            if ($synced === null) {
                $appointment->forceFill([
                    'google_calendar_sync_status' => 'not_configured',
                    'google_calendar_synced_at' => null,
                ])->save();
            }

            return null;
        } catch (\Throwable $exception) {
            report($exception);

            $appointment->forceFill([
                'google_calendar_sync_status' => 'failed',
            ])->save();

            return 'Agendamento salvo, mas falhou a sincronizacao com Google Calendar.';
        }
    }

    protected function cancelGoogleEvent(Appointment $appointment, GoogleCalendarService $googleCalendar): ?string
    {
        try {
            $googleCalendar->deleteEventForAppointment($appointment);

            return null;
        } catch (\Throwable $exception) {
            report($exception);

            $appointment->forceFill([
                'google_calendar_sync_status' => 'failed',
            ])->save();

            return 'Agendamento atualizado, mas falhou o cancelamento no Google Calendar.';
        }
    }

    protected function appointmentPayload(Appointment $appointment, string $timezone): array
    {
        return [
            'id' => $appointment->id,
            'barbershop_id' => $appointment->barbershop_id,
            'barber_user_id' => $appointment->barber_user_id,
            'service_id' => $appointment->service_id,
            'customer_id' => $appointment->customer_id,
            'status' => $appointment->status,
            'channel' => $appointment->channel,
            'notes' => $appointment->notes,
            'scheduled_start_at' => $this->formatTimestamp($appointment->scheduled_start_at, $timezone),
            'scheduled_end_at' => $this->formatTimestamp($appointment->scheduled_end_at, $timezone),
            'cancelled_at' => $this->formatTimestamp($appointment->cancelled_at, $timezone),
        ];
    }

    protected function assertBarberMembership(int $barbershopId, int $userId): void
    {
        $exists = BarbershopMembership::query()
            ->where('barbershop_id', $barbershopId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (! $exists) {
            throw ValidationException::withMessages([
                'barber_user_id' => 'Barbeiro sem vinculo ativo nesta barbearia.',
            ]);
        }
    }

    protected function resolveService(int $barbershopId, mixed $serviceId): ?Service
    {
        if ($serviceId === null) {
            return null;
        }

        $service = Service::query()
            ->where('barbershop_id', $barbershopId)
            ->whereKey((int) $serviceId)
            ->first();

        if (! $service) {
            throw ValidationException::withMessages([
                'service_id' => 'Servico nao pertence a barbearia selecionada.',
            ]);
        }

        return $service;
    }

    protected function assertCustomer(int $barbershopId, mixed $customerId): void
    {
        if ($customerId === null) {
            return;
        }

        $exists = Customer::query()
            ->where('barbershop_id', $barbershopId)
            ->whereKey((int) $customerId)
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
