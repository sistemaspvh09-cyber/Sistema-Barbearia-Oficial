<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomersController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        $customers = Customer::query()
            ->withSum([
                'charges as lifetime_spent_cents' => fn ($query) => $query->where('status', 'paid'),
            ], 'total_cents')
            ->withMax('appointments as latest_appointment_at', 'scheduled_start_at')
            ->where('barbershop_id', $barbershop->id)
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = (string) $request->string('search');

                $query->where(function ($inner) use ($term) {
                    $inner->where('name', 'like', "%{$term}%")
                        ->orWhere('email', 'like', "%{$term}%")
                        ->orWhere('phone', 'like', "%{$term}%");
                });
            })
            ->when($request->filled('inactive_days'), function ($query) use ($request) {
                $threshold = now()->subDays(max(1, $request->integer('inactive_days')));

                $query->where(function ($inner) use ($threshold) {
                    $inner->whereNull('last_visit_at')
                        ->orWhere('last_visit_at', '<=', $threshold);
                });
            })
            ->orderByDesc('last_visit_at')
            ->orderByDesc('total_visits')
            ->get();

        $month = now($barbershop->timezone)->format('m');

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'summary' => [
                'total' => $customers->count(),
                'vip' => $customers->filter(fn (Customer $customer) => $customer->loyalty_points >= 100)->count(),
                'with_email' => $customers->filter(fn (Customer $customer) => filled($customer->email))->count(),
                'birthdays_this_month' => $customers->filter(fn (Customer $customer) => $customer->birthday?->format('m') === $month)->count(),
            ],
            'items' => $customers->map(fn (Customer $customer) => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'birthday' => $customer->birthday?->format('Y-m-d'),
                'notes' => $customer->notes,
                'loyalty_points' => $customer->loyalty_points,
                'total_visits' => $customer->total_visits,
                'last_visit_at' => $this->formatTimestamp($customer->last_visit_at, $barbershop->timezone),
                'latest_appointment_at' => $customer->latest_appointment_at
                    ? $this->formatTimestamp(CarbonImmutable::parse($customer->latest_appointment_at, 'UTC'), $barbershop->timezone)
                    : null,
                'lifetime_spent_cents' => (int) ($customer->lifetime_spent_cents ?? 0),
            ])->values(),
            'generated_at' => now()->toISOString(),
        ]);
    }
}
