<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Charge;
use App\Services\Integrations\InfinitePayCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InfinitePayCheckoutController extends Controller
{
    use ResolvesBarbershop;

    public function __construct(
        protected InfinitePayCheckoutService $service,
    ) {
    }

    public function createLink(Request $request, Charge $charge): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        if ((int) $charge->barbershop_id !== (int) $barbershop->id) {
            abort(404, 'Cobranca nao encontrada para esta barbearia.');
        }

        $payload = $this->service->createCheckoutLink($charge);

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'charge' => [
                'id' => $charge->id,
                'status' => $charge->status,
                'gateway_reference' => $charge->gateway_reference,
                'total_cents' => $charge->total_cents,
            ],
            'infinitepay' => $payload,
        ]);
    }

    public function paymentCheck(Request $request, Charge $charge): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        if ((int) $charge->barbershop_id !== (int) $barbershop->id) {
            abort(404, 'Cobranca nao encontrada para esta barbearia.');
        }

        $payload = $this->service->checkPaymentStatus($charge);

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'charge' => [
                'id' => $charge->id,
                'status' => $charge->status,
                'paid_at' => optional($charge->paid_at)->toISOString(),
                'payment_method' => $charge->payment_method,
            ],
            'infinitepay' => $payload,
        ]);
    }
}
