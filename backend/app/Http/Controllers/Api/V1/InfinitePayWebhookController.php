<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Integrations\InfinitePayCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class InfinitePayWebhookController extends Controller
{
    public function __construct(
        protected InfinitePayCheckoutService $service,
    ) {
    }

    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();
        $charge = $this->service->handleWebhook($payload);

        if (! $charge) {
            return response()->json([
                'ok' => false,
                'message' => 'Order NSU invalido ou cobranca nao encontrada.',
                'payload' => Arr::only($payload, ['order_nsu', 'invoice_slug', 'transaction_nsu']),
            ], 400);
        }

        return response()->json([
            'ok' => true,
            'charge_id' => $charge->id,
            'status' => $charge->status,
        ]);
    }
}
