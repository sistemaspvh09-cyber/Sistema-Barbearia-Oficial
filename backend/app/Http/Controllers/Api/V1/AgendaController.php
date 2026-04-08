<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgendaController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        $day = $this->resolveDate($request, 'date', $barbershop->timezone);
        [$dayStartUtc, $dayEndUtc] = $this->asUtcDayBounds($day);

        $appointments = Appointment::query()
            ->with([
                'customer:id,name,phone,email',
                'service:id,name,duration_minutes,price_cents',
                'barber:id,name,email',
                'charge:id,appointment_id,status,total_cents,payment_method,paid_at',
            ])
            ->where('barbershop_id', $barbershop->id)
            ->whereBetween('scheduled_start_at', [$dayStartUtc, $dayEndUtc])
            ->when($request->filled('status'), fn ($query) => $query->where('status', (string) $request->string('status')))
            ->when($request->filled('barber_user_id'), fn ($query) => $query->where('barber_user_id', $request->integer('barber_user_id')))
            ->when($request->filled('customer_id'), fn ($query) => $query->where('customer_id', $request->integer('customer_id')))
            ->when($request->filled('service_id'), fn ($query) => $query->where('service_id', $request->integer('service_id')))
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = trim((string) $request->string('search'));

                if ($term === '') {
                    return;
                }

                $query->where(function ($searchQuery) use ($term) {
                    $searchQuery
                        ->whereHas('customer', fn ($customerQuery) => $customerQuery->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('service', fn ($serviceQuery) => $serviceQuery->where('name', 'like', "%{$term}%"))
                        ->orWhereHas('barber', fn ($barberQuery) => $barberQuery->where('name', 'like', "%{$term}%"))
                        ->orWhere('notes', 'like', "%{$term}%");
                });
            })
            ->orderBy('scheduled_start_at')
            ->get();

        $summary = [
            'total' => $appointments->count(),
            'scheduled' => $appointments->where('status', 'scheduled')->count(),
            'confirmed' => $appointments->where('status', 'confirmed')->count(),
            'waiting' => $appointments->where('status', 'waiting')->count(),
            'completed' => $appointments->where('status', 'completed')->count(),
            'cancelled' => $appointments->where('status', 'cancelled')->count(),
            'estimated_revenue_cents' => (int) $appointments
                ->filter(fn (Appointment $appointment) => $appointment->service !== null)
                ->sum(fn (Appointment $appointment) => $appointment->service->price_cents),
        ];

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'filters' => [
                'date' => $day->format('Y-m-d'),
                'status' => $request->filled('status') ? (string) $request->string('status') : null,
                'barber_user_id' => $request->filled('barber_user_id') ? $request->integer('barber_user_id') : null,
                'customer_id' => $request->filled('customer_id') ? $request->integer('customer_id') : null,
                'service_id' => $request->filled('service_id') ? $request->integer('service_id') : null,
                'search' => $request->filled('search') ? (string) $request->string('search') : null,
            ],
            'summary' => $summary,
            'items' => $appointments->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'channel' => $appointment->channel,
                'notes' => $appointment->notes,
                'scheduled_start_at' => $this->formatTimestamp($appointment->scheduled_start_at, $barbershop->timezone),
                'scheduled_end_at' => $this->formatTimestamp($appointment->scheduled_end_at, $barbershop->timezone),
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
                'charge' => $appointment->charge ? [
                    'status' => $appointment->charge->status,
                    'total_cents' => $appointment->charge->total_cents,
                    'payment_method' => $appointment->charge->payment_method,
                    'paid_at' => $this->formatTimestamp($appointment->charge->paid_at, $barbershop->timezone),
                ] : null,
            ])->values(),
            'generated_at' => now()->toISOString(),
        ]);
    }
}
