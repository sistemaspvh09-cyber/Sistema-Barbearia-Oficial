<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\Integrations\GoogleCalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class GoogleCalendarController extends Controller
{
    use ResolvesBarbershop;

    public function authorize(Request $request, GoogleCalendarService $service): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Autenticacao necessaria.');
        }

        $barbershop = $request->attributes->get('authenticated_barbershop')
            ?? $this->resolveBarbershop($request);

        $calendarId = $request->string('calendar_id', 'primary');
        $authorizationUrl = $service->buildAuthorizationUrl($barbershop, $user, $calendarId);

        return response()->json([
            'authorization_url' => $authorizationUrl,
            'calendar_id' => $calendarId,
            'barbershop' => $this->barbershopPayload($barbershop),
        ]);
    }

    public function callback(Request $request, GoogleCalendarService $service): Response|JsonResponse
    {
        $code = (string) $request->string('code');
        $state = (string) $request->string('state');

        if ($code === '' || $state === '') {
            throw ValidationException::withMessages([
                'code' => 'Codigo OAuth ausente.',
                'state' => 'State OAuth ausente.',
            ]);
        }

        try {
            $connection = $service->handleCallback($code, $state);
        } catch (\Throwable $exception) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $exception->getMessage(),
                ], 422);
            }

            return redirect()->away($service->frontendCallbackUrl(false));
        }

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'connected',
                'connection' => [
                    'barbershop_id' => $connection->barbershop_id,
                    'calendar_id' => $connection->calendar_id,
                    'last_synced_at' => $connection->last_synced_at?->toISOString(),
                ],
            ]);
        }

        return redirect()->away($service->frontendCallbackUrl(true));
    }

    public function createEvent(Request $request, Appointment $appointment, GoogleCalendarService $service): JsonResponse
    {
        $barbershop = $request->attributes->get('authenticated_barbershop')
            ?? $this->resolveBarbershop($request);

        if ((int) $appointment->barbershop_id !== (int) $barbershop->id) {
            abort(403, 'Agendamento nao pertence a esta barbearia.');
        }

        $event = $service->syncEventForAppointment($appointment);

        if ($event === null) {
            throw ValidationException::withMessages([
                'google' => 'Nenhuma conexao Google Calendar encontrada para esta barbearia.',
            ]);
        }

        return response()->json([
            'status' => 'synced',
            'appointment_id' => $appointment->id,
            'event' => $event,
        ]);
    }
}
