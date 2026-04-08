<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Customer;
use App\Models\Service;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        $day = $this->resolveDate($request, 'date', $barbershop->timezone);
        [$dayStartUtc, $dayEndUtc] = $this->asUtcDayBounds($day);
        $monthStartUtc = $day->startOfMonth()->utc();
        $monthEndUtc = $day->endOfMonth()->utc();

        $appointmentsSummary = Appointment::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereBetween('scheduled_start_at', [$dayStartUtc, $dayEndUtc])
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed")
            ->selectRaw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled")
            ->first();

        $customersQuery = Customer::query()->where('barbershop_id', $barbershop->id);
        $customerSummary = (object) [
            'total' => (clone $customersQuery)->count(),
            'new_this_month' => (clone $customersQuery)->whereBetween('created_at', [$monthStartUtc, $monthEndUtc])->count(),
            'birthdays_this_month' => (clone $customersQuery)->whereMonth('birthday', $day->month)->count(),
        ];

        $activeServices = Service::query()
            ->where('barbershop_id', $barbershop->id)
            ->where('is_active', true)
            ->count();

        $revenueSummary = $barbershop->charges()
            ->selectRaw("SUM(CASE WHEN status = 'paid' AND paid_at BETWEEN ? AND ? THEN total_cents ELSE 0 END) as today_cents", [$dayStartUtc, $dayEndUtc])
            ->selectRaw("SUM(CASE WHEN status = 'paid' AND paid_at BETWEEN ? AND ? THEN total_cents ELSE 0 END) as month_cents", [$monthStartUtc, $monthEndUtc])
            ->selectRaw("SUM(CASE WHEN status <> 'paid' THEN total_cents ELSE 0 END) as pending_cents")
            ->first();

        $nextAppointments = Appointment::query()
            ->with([
                'customer:id,name,phone',
                'service:id,name,duration_minutes',
                'barber:id,name',
            ])
            ->where('barbershop_id', $barbershop->id)
            ->where('scheduled_start_at', '>=', CarbonImmutable::now('UTC'))
            ->orderBy('scheduled_start_at')
            ->limit(5)
            ->get()
            ->map(fn (Appointment $appointment) => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'channel' => $appointment->channel,
                'scheduled_start_at' => $this->formatTimestamp($appointment->scheduled_start_at, $barbershop->timezone),
                'scheduled_end_at' => $this->formatTimestamp($appointment->scheduled_end_at, $barbershop->timezone),
                'customer' => $appointment->customer ? [
                    'id' => $appointment->customer->id,
                    'name' => $appointment->customer->name,
                    'phone' => $appointment->customer->phone,
                ] : null,
                'service' => $appointment->service ? [
                    'id' => $appointment->service->id,
                    'name' => $appointment->service->name,
                    'duration_minutes' => $appointment->service->duration_minutes,
                ] : null,
                'barber' => $appointment->barber ? [
                    'id' => $appointment->barber->id,
                    'name' => $appointment->barber->name,
                ] : null,
            ])
            ->values();

        $topServices = Service::query()
            ->withCount('appointments')
            ->where('barbershop_id', $barbershop->id)
            ->orderByDesc('appointments_count')
            ->orderBy('sort_order')
            ->limit(5)
            ->get()
            ->map(fn (Service $service) => [
                'id' => $service->id,
                'name' => $service->name,
                'price_cents' => $service->price_cents,
                'duration_minutes' => $service->duration_minutes,
                'appointments_count' => $service->appointments_count,
                'is_active' => $service->is_active,
            ])
            ->values();

        $recentCustomers = Customer::query()
            ->where('barbershop_id', $barbershop->id)
            ->orderByDesc(DB::raw('COALESCE(last_visit_at, created_at)'))
            ->limit(5)
            ->get()
            ->map(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'total_visits' => $customer->total_visits,
                'loyalty_points' => $customer->loyalty_points,
                'last_visit_at' => $this->formatTimestamp($customer->last_visit_at, $barbershop->timezone),
            ])
            ->values();

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'date' => [
                'reference' => $day->format('Y-m-d'),
                'timezone' => $barbershop->timezone,
            ],
            'metrics' => [
                'appointments_today' => [
                    'total' => (int) ($appointmentsSummary->total ?? 0),
                    'scheduled' => (int) ($appointmentsSummary->scheduled ?? 0),
                    'completed' => (int) ($appointmentsSummary->completed ?? 0),
                    'cancelled' => (int) ($appointmentsSummary->cancelled ?? 0),
                ],
                'customers' => [
                    'total' => (int) ($customerSummary->total ?? 0),
                    'new_this_month' => (int) ($customerSummary->new_this_month ?? 0),
                    'birthdays_this_month' => (int) ($customerSummary->birthdays_this_month ?? 0),
                ],
                'services' => [
                    'active' => $activeServices,
                ],
                'revenue' => [
                    'today_cents' => (int) ($revenueSummary->today_cents ?? 0),
                    'month_cents' => (int) ($revenueSummary->month_cents ?? 0),
                    'pending_cents' => (int) ($revenueSummary->pending_cents ?? 0),
                ],
            ],
            'next_appointments' => $nextAppointments,
            'top_services' => $topServices,
            'recent_customers' => $recentCustomers,
            'generated_at' => now()->toISOString(),
        ]);
    }
}
