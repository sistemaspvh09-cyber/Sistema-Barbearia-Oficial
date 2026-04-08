<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportsController extends Controller
{
    use ResolvesBarbershop;

    public function financial(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        [$from, $to] = $this->resolvePeriod($request);

        $charges = DB::table('charges')
            ->where('barbershop_id', $barbershop->id)
            ->whereBetween(DB::raw('COALESCE(paid_at, due_at, created_at)'), [$from, $to]);

        $summary = (clone $charges)
            ->selectRaw('COUNT(*) as charges')
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END) as paid_cents")
            ->selectRaw("SUM(CASE WHEN status <> 'paid' THEN total_cents ELSE 0 END) as pending_cents")
            ->selectRaw('SUM(total_cents) as gross_cents')
            ->first();

        $expenses = DB::table('expenses')
            ->where('barbershop_id', $barbershop->id)
            ->whereBetween(DB::raw('COALESCE(paid_at, due_at, created_at)'), [$from, $to])
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN amount_cents ELSE 0 END) as paid_expenses_cents")
            ->selectRaw("SUM(CASE WHEN status <> 'paid' THEN amount_cents ELSE 0 END) as pending_expenses_cents")
            ->first();

        $netCents = (int) ($summary->paid_cents ?? 0) - (int) ($expenses->paid_expenses_cents ?? 0);

        return response()->json([
            'summary' => [
                'charges' => (int) ($summary->charges ?? 0),
                'paid_cents' => (int) ($summary->paid_cents ?? 0),
                'pending_cents' => (int) ($summary->pending_cents ?? 0),
                'gross_cents' => (int) ($summary->gross_cents ?? 0),
                'paid_expenses_cents' => (int) ($expenses->paid_expenses_cents ?? 0),
                'pending_expenses_cents' => (int) ($expenses->pending_expenses_cents ?? 0),
                'net_cents' => $netCents,
            ],
            'filters' => [
                'from' => CarbonImmutable::parse($from)->format('Y-m-d'),
                'to' => CarbonImmutable::parse($to)->format('Y-m-d'),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function teamPerformance(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        [$from, $to] = $this->resolvePeriod($request);

        $items = DB::table('appointments')
            ->leftJoin('users', 'appointments.barber_user_id', '=', 'users.id')
            ->where('appointments.barbershop_id', $barbershop->id)
            ->whereBetween('appointments.scheduled_start_at', [$from, $to])
            ->groupBy('appointments.barber_user_id', 'users.name')
            ->selectRaw('appointments.barber_user_id as user_id')
            ->selectRaw('COALESCE(users.name, \'Nao atribuido\') as name')
            ->selectRaw('COUNT(*) as total_appointments')
            ->selectRaw("SUM(CASE WHEN appointments.status = 'completed' THEN 1 ELSE 0 END) as completed_appointments")
            ->orderByDesc('completed_appointments')
            ->get()
            ->map(fn ($row) => [
                'user_id' => $row->user_id,
                'name' => $row->name,
                'total_appointments' => (int) $row->total_appointments,
                'completed_appointments' => (int) $row->completed_appointments,
            ])
            ->values();

        return response()->json([
            'items' => $items,
            'filters' => [
                'from' => CarbonImmutable::parse($from)->format('Y-m-d'),
                'to' => CarbonImmutable::parse($to)->format('Y-m-d'),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function churn(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        $inactiveDays = max(1, $request->integer('inactive_days', 60));
        $threshold = now()->subDays($inactiveDays);

        $totalCustomers = DB::table('customers')
            ->where('barbershop_id', $barbershop->id)
            ->count();

        $atRiskCustomers = DB::table('customers')
            ->where('barbershop_id', $barbershop->id)
            ->where(function ($query) use ($threshold) {
                $query->whereNull('last_visit_at')
                    ->orWhere('last_visit_at', '<=', $threshold);
            })
            ->count();

        $churnRate = $totalCustomers > 0
            ? round(($atRiskCustomers / $totalCustomers) * 100, 2)
            : 0;

        return response()->json([
            'summary' => [
                'total_customers' => (int) $totalCustomers,
                'at_risk_customers' => (int) $atRiskCustomers,
                'inactive_days' => $inactiveDays,
                'churn_rate_percent' => $churnRate,
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function nps(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        [$from, $to] = $this->resolvePeriod($request);

        $surveyRows = DB::table('analytics_snapshots')
            ->where('barbershop_id', $barbershop->id)
            ->where('scope', 'nps')
            ->whereBetween('snapshot_date', [
                CarbonImmutable::parse($from)->format('Y-m-d'),
                CarbonImmutable::parse($to)->format('Y-m-d'),
            ])
            ->orderBy('snapshot_date')
            ->get();

        $series = $surveyRows->map(function ($row) {
            $metrics = is_string($row->metrics) ? json_decode($row->metrics, true) : $row->metrics;
            $metrics = is_array($metrics) ? $metrics : [];

            return [
                'date' => $row->snapshot_date,
                'nps_score' => (float) ($metrics['nps_score'] ?? 0),
                'responses' => (int) ($metrics['responses'] ?? 0),
            ];
        })->values();

        $latest = $series->last();

        return response()->json([
            'summary' => [
                'latest_nps_score' => (float) ($latest['nps_score'] ?? 0),
                'latest_responses' => (int) ($latest['responses'] ?? 0),
                'series_points' => $series->count(),
            ],
            'items' => $series,
            'filters' => [
                'from' => CarbonImmutable::parse($from)->format('Y-m-d'),
                'to' => CarbonImmutable::parse($to)->format('Y-m-d'),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    protected function resolvePeriod(Request $request): array
    {
        $from = $request->filled('from')
            ? CarbonImmutable::parse((string) $request->string('from'))->startOfDay()
            : CarbonImmutable::now('UTC')->startOfMonth();

        $to = $request->filled('to')
            ? CarbonImmutable::parse((string) $request->string('to'))->endOfDay()
            : CarbonImmutable::now('UTC')->endOfMonth();

        return [$from->toISOString(), $to->toISOString()];
    }
}

