<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AppointmentsReadController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $query = Appointment::query()
            ->with([
                'customer:id,name,phone,email',
                'service:id,name,duration_minutes,price_cents',
                'barber:id,name,email',
            ])
            ->where('barbershop_id', $barbershop->id);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->integer('customer_id'));
        }

        if ($request->filled('barber_user_id')) {
            $query->where('barber_user_id', $request->integer('barber_user_id'));
        }

        if ($request->filled('from')) {
            $query->where('scheduled_start_at', '>=', $this->parseDateBoundary((string) $request->string('from'), true, 'from'));
        }

        if ($request->filled('to')) {
            $query->where('scheduled_start_at', '<=', $this->parseDateBoundary((string) $request->string('to'), false, 'to'));
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $page = max($request->integer('page', 1), 1);
        $total = (clone $query)->count();

        $items = (clone $query)
            ->orderBy('scheduled_start_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'channel' => $appointment->channel,
                'notes' => $appointment->notes,
                'barber_user_id' => $appointment->barber_user_id,
                'customer_id' => $appointment->customer_id,
                'service_id' => $appointment->service_id,
                'scheduled_start_at' => $this->formatTimestamp($appointment->scheduled_start_at, $barbershop->timezone),
                'scheduled_end_at' => $this->formatTimestamp($appointment->scheduled_end_at, $barbershop->timezone),
                'cancelled_at' => $this->formatTimestamp($appointment->cancelled_at, $barbershop->timezone),
                'customer' => $appointment->customer ? [
                    'id' => $appointment->customer->id,
                    'name' => $appointment->customer->name,
                    'phone' => $appointment->customer->phone,
                    'email' => $appointment->customer->email,
                ] : null,
                'service' => $appointment->service ? [
                    'id' => $appointment->service->id,
                    'name' => $appointment->service->name,
                    'duration_minutes' => $appointment->service->duration_minutes,
                    'price_cents' => $appointment->service->price_cents,
                ] : null,
                'barber' => $appointment->barber ? [
                    'id' => $appointment->barber->id,
                    'name' => $appointment->barber->name,
                    'email' => $appointment->barber->email,
                ] : null,
            ])
            ->values();

        return response()->json([
            'items' => $items,
            'summary' => [
                'total' => $total,
                'scheduled' => (clone $query)->where('status', 'scheduled')->count(),
                'confirmed' => (clone $query)->where('status', 'confirmed')->count(),
                'completed' => (clone $query)->where('status', 'completed')->count(),
                'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
            ],
            'filters' => [
                'page' => $page,
                'per_page' => $perPage,
                'status' => $request->filled('status') ? (string) $request->string('status') : null,
                'customer_id' => $request->filled('customer_id') ? $request->integer('customer_id') : null,
                'barber_user_id' => $request->filled('barber_user_id') ? $request->integer('barber_user_id') : null,
                'from' => $request->filled('from') ? (string) $request->string('from') : null,
                'to' => $request->filled('to') ? (string) $request->string('to') : null,
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    protected function parseDateBoundary(string $value, bool $start, string $field): string
    {
        try {
            $date = CarbonImmutable::parse($value);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                $field => 'Use data valida para o filtro.',
            ]);
        }

        return ($start ? $date->startOfDay() : $date->endOfDay())->toISOString();
    }
}

