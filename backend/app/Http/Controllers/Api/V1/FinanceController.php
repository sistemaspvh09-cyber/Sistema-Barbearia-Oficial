<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Charge;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        $from = $this->resolveDate(
            $request,
            'from',
            $barbershop->timezone,
            CarbonImmutable::now($barbershop->timezone)->startOfMonth(),
        );
        $to = $this->resolveDate(
            $request,
            'to',
            $barbershop->timezone,
            CarbonImmutable::now($barbershop->timezone)->endOfMonth(),
        );

        $chargesQuery = Charge::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereRaw('date(COALESCE(paid_at, due_at, created_at)) between ? and ?', [
                $from->format('Y-m-d'),
                $to->format('Y-m-d'),
            ]);

        $summary = (clone $chargesQuery)
            ->selectRaw('COUNT(*) as charge_count')
            ->selectRaw('SUM(subtotal_cents) as subtotal_cents')
            ->selectRaw('SUM(discount_cents) as discount_cents')
            ->selectRaw('SUM(total_cents) as total_cents')
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END) as paid_cents")
            ->selectRaw("SUM(CASE WHEN status <> 'paid' THEN total_cents ELSE 0 END) as pending_cents")
            ->selectRaw('AVG(total_cents) as average_ticket_cents')
            ->first();

        $byStatus = (clone $chargesQuery)
            ->select('status')
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(total_cents) as total_cents')
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'count' => (int) $row->count,
                'total_cents' => (int) $row->total_cents,
            ])
            ->values();

        $byPaymentMethod = (clone $chargesQuery)
            ->selectRaw("COALESCE(payment_method, 'unknown') as payment_method")
            ->selectRaw('COUNT(*) as count')
            ->selectRaw('SUM(total_cents) as total_cents')
            ->groupBy(DB::raw("COALESCE(payment_method, 'unknown')"))
            ->orderByDesc('total_cents')
            ->get()
            ->map(fn ($row) => [
                'payment_method' => $row->payment_method,
                'count' => (int) $row->count,
                'total_cents' => (int) $row->total_cents,
            ])
            ->values();

        $daily = $this->buildDailySeries($chargesQuery);

        $recentCharges = (clone $chargesQuery)
            ->with([
                'customer:id,name,phone',
                'appointment:id,service_id,scheduled_start_at',
                'appointment.service:id,name',
            ])
            ->orderByDesc(DB::raw('COALESCE(paid_at, due_at, created_at)'))
            ->limit(10)
            ->get()
            ->map(fn (Charge $charge) => [
                'id' => $charge->id,
                'status' => $charge->status,
                'total_cents' => $charge->total_cents,
                'discount_cents' => $charge->discount_cents,
                'payment_method' => $charge->payment_method,
                'gateway' => $charge->gateway,
                'gateway_reference' => $charge->gateway_reference,
                'paid_at' => $this->formatTimestamp($charge->paid_at, $barbershop->timezone),
                'due_at' => $this->formatTimestamp($charge->due_at, $barbershop->timezone),
                'customer' => $charge->customer ? [
                    'id' => $charge->customer->id,
                    'name' => $charge->customer->name,
                    'phone' => $charge->customer->phone,
                ] : null,
                'appointment' => $charge->appointment ? [
                    'id' => $charge->appointment->id,
                    'scheduled_start_at' => $this->formatTimestamp($charge->appointment->scheduled_start_at, $barbershop->timezone),
                    'service' => $charge->appointment->service ? [
                        'id' => $charge->appointment->service->id,
                        'name' => $charge->appointment->service->name,
                    ] : null,
                ] : null,
            ])
            ->values();

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'period' => [
                'from' => $from->format('Y-m-d'),
                'to' => $to->format('Y-m-d'),
                'timezone' => $barbershop->timezone,
            ],
            'summary' => [
                'charge_count' => (int) ($summary->charge_count ?? 0),
                'subtotal_cents' => (int) ($summary->subtotal_cents ?? 0),
                'discount_cents' => (int) ($summary->discount_cents ?? 0),
                'total_cents' => (int) ($summary->total_cents ?? 0),
                'paid_cents' => (int) ($summary->paid_cents ?? 0),
                'pending_cents' => (int) ($summary->pending_cents ?? 0),
                'average_ticket_cents' => (int) round($summary->average_ticket_cents ?? 0),
            ],
            'by_status' => $byStatus,
            'by_payment_method' => $byPaymentMethod,
            'daily' => $daily,
            'recent_charges' => $recentCharges,
            'generated_at' => now()->toISOString(),
        ]);
    }

    protected function buildDailySeries($chargesQuery): Collection
    {
        return (clone $chargesQuery)
            ->selectRaw('date(COALESCE(paid_at, due_at, created_at)) as reference_date')
            ->selectRaw('COUNT(*) as charges')
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN total_cents ELSE 0 END) as paid_cents")
            ->groupBy(DB::raw('date(COALESCE(paid_at, due_at, created_at))'))
            ->orderBy('reference_date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->reference_date,
                'charges' => (int) $row->charges,
                'paid_cents' => (int) $row->paid_cents,
            ])
            ->values();
    }
}
