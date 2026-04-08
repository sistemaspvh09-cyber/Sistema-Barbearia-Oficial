<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Charge;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ChargesReadController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $query = Charge::query()
            ->with([
                'customer:id,name,phone,email',
                'appointment:id,barber_user_id,scheduled_start_at,status',
            ])
            ->where('barbershop_id', $barbershop->id);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        if ($request->filled('customer_id')) {
            $query->where('customer_id', $request->integer('customer_id'));
        }

        if ($request->filled('from')) {
            $query->whereRaw('COALESCE(paid_at, due_at, created_at) >= ?', [
                $this->parseDateBoundary((string) $request->string('from'), true, 'from'),
            ]);
        }

        if ($request->filled('to')) {
            $query->whereRaw('COALESCE(paid_at, due_at, created_at) <= ?', [
                $this->parseDateBoundary((string) $request->string('to'), false, 'to'),
            ]);
        }

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $page = max($request->integer('page', 1), 1);
        $total = (clone $query)->count();

        $items = (clone $query)
            ->orderByRaw('COALESCE(paid_at, due_at, created_at) desc')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (Charge $charge) => [
                'id' => $charge->id,
                'status' => $charge->status,
                'appointment_id' => $charge->appointment_id,
                'customer_id' => $charge->customer_id,
                'subtotal_cents' => $charge->subtotal_cents,
                'discount_cents' => $charge->discount_cents,
                'total_cents' => $charge->total_cents,
                'payment_method' => $charge->payment_method,
                'gateway' => $charge->gateway,
                'gateway_reference' => $charge->gateway_reference,
                'metadata' => $charge->metadata ?? [],
                'due_at' => $this->formatTimestamp($charge->due_at, $barbershop->timezone),
                'paid_at' => $this->formatTimestamp($charge->paid_at, $barbershop->timezone),
                'customer' => $charge->customer ? [
                    'id' => $charge->customer->id,
                    'name' => $charge->customer->name,
                    'phone' => $charge->customer->phone,
                    'email' => $charge->customer->email,
                ] : null,
                'appointment' => $charge->appointment ? [
                    'id' => $charge->appointment->id,
                    'barber_user_id' => $charge->appointment->barber_user_id,
                    'status' => $charge->appointment->status,
                    'scheduled_start_at' => $this->formatTimestamp($charge->appointment->scheduled_start_at, $barbershop->timezone),
                ] : null,
            ])
            ->values();

        return response()->json([
            'items' => $items,
            'summary' => [
                'total' => $total,
                'paid' => (clone $query)->where('status', 'paid')->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
                'cancelled' => (clone $query)->where('status', 'cancelled')->count(),
                'total_cents' => (int) ((clone $query)->sum('total_cents') ?? 0),
            ],
            'filters' => [
                'page' => $page,
                'per_page' => $perPage,
                'status' => $request->filled('status') ? (string) $request->string('status') : null,
                'customer_id' => $request->filled('customer_id') ? $request->integer('customer_id') : null,
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
