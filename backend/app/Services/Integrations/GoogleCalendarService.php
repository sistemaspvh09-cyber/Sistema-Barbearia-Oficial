<?php

namespace App\Services\Integrations;

use App\Models\Appointment;
use App\Models\Barbershop;
use App\Models\GoogleCalendarConnection;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\Factory as HttpFactory;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\ValidationException;

class GoogleCalendarService
{
    public function __construct(
        protected HttpFactory $http,
    ) {
    }

    public function isConfigured(): bool
    {
        return filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect_uri'));
    }

    public function buildAuthorizationUrl(Barbershop $barbershop, User $user, string $calendarId = 'primary'): string
    {
        if (! $this->isConfigured()) {
            throw ValidationException::withMessages([
                'google' => 'Credenciais Google Calendar ausentes no ambiente.',
            ]);
        }

        $query = http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('services.google.redirect_uri'),
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/calendar',
            'access_type' => 'offline',
            'prompt' => 'consent',
            'include_granted_scopes' => 'true',
            'state' => $this->encryptState([
                'barbershop_id' => $barbershop->id,
                'user_id' => $user->id,
                'calendar_id' => $calendarId,
                'issued_at' => now()->timestamp,
            ]),
        ]);

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.$query;
    }

    public function handleCallback(string $code, string $state): GoogleCalendarConnection
    {
        $payload = $this->decryptState($state);
        $barbershop = Barbershop::query()->findOrFail($payload['barbershop_id']);
        $user = User::query()->findOrFail($payload['user_id']);
        $existing = GoogleCalendarConnection::query()->firstOrNew([
            'barbershop_id' => $barbershop->id,
        ]);

        $tokenData = $this->exchangeAuthorizationCode($code);

        $existing->fill([
            'created_by_user_id' => $user->id,
            'calendar_id' => $payload['calendar_id'] ?? 'primary',
            'access_token' => $tokenData['access_token'] ?? null,
            'refresh_token' => $tokenData['refresh_token'] ?? $existing->refresh_token,
            'scopes' => $tokenData['scope'] ?? null,
            'token_type' => $tokenData['token_type'] ?? 'Bearer',
            'expires_at' => isset($tokenData['expires_in'])
                ? now()->addSeconds((int) $tokenData['expires_in'])
                : null,
            'last_synced_at' => now(),
        ]);
        $existing->save();

        return $existing->refresh();
    }

    public function createEventForAppointment(Appointment $appointment): array
    {
        $appointment->loadMissing(['barbershop', 'customer', 'service', 'barber']);
        $connection = GoogleCalendarConnection::query()
            ->where('barbershop_id', $appointment->barbershop_id)
            ->first();

        if (! $connection) {
            throw ValidationException::withMessages([
                'google' => 'Nenhuma conexao Google Calendar encontrada para esta barbearia.',
            ]);
        }

        $accessToken = $this->getValidAccessToken($connection);
        $response = $this->http
            ->withToken($accessToken)
            ->acceptJson()
            ->post(
                'https://www.googleapis.com/calendar/v3/calendars/'.rawurlencode($connection->calendar_id).'/events',
                $this->buildEventPayload($appointment),
            )
            ->throw()
            ->json();

        $appointment->forceFill([
            'google_calendar_event_id' => $response['id'] ?? null,
            'google_calendar_sync_status' => 'synced',
            'google_calendar_synced_at' => now(),
        ])->save();

        $connection->forceFill([
            'last_synced_at' => now(),
        ])->save();

        return $response;
    }

    public function syncEventForAppointment(Appointment $appointment): ?array
    {
        $appointment->loadMissing(['barbershop', 'customer', 'service', 'barber']);
        $connection = GoogleCalendarConnection::query()
            ->where('barbershop_id', $appointment->barbershop_id)
            ->first();

        if (! $connection) {
            return null;
        }

        $accessToken = $this->getValidAccessToken($connection);
        $payload = $this->buildEventPayload($appointment);

        if ($appointment->google_calendar_event_id) {
            $response = $this->http
                ->withToken($accessToken)
                ->acceptJson()
                ->patch(
                    'https://www.googleapis.com/calendar/v3/calendars/'
                    .rawurlencode($connection->calendar_id)
                    .'/events/'
                    .rawurlencode($appointment->google_calendar_event_id),
                    $payload,
                )
                ->throw()
                ->json();
        } else {
            $response = $this->http
                ->withToken($accessToken)
                ->acceptJson()
                ->post(
                    'https://www.googleapis.com/calendar/v3/calendars/'
                    .rawurlencode($connection->calendar_id)
                    .'/events',
                    $payload,
                )
                ->throw()
                ->json();
        }

        $appointment->forceFill([
            'google_calendar_event_id' => $response['id'] ?? $appointment->google_calendar_event_id,
            'google_calendar_sync_status' => 'synced',
            'google_calendar_synced_at' => now(),
        ])->save();

        $connection->forceFill([
            'last_synced_at' => now(),
        ])->save();

        return $response;
    }

    public function deleteEventForAppointment(Appointment $appointment): ?array
    {
        $appointment->loadMissing(['barbershop']);
        $connection = GoogleCalendarConnection::query()
            ->where('barbershop_id', $appointment->barbershop_id)
            ->first();

        if (! $connection || ! $appointment->google_calendar_event_id) {
            return null;
        }

        $accessToken = $this->getValidAccessToken($connection);

        $this->http
            ->withToken($accessToken)
            ->acceptJson()
            ->delete(
                'https://www.googleapis.com/calendar/v3/calendars/'
                .rawurlencode($connection->calendar_id)
                .'/events/'
                .rawurlencode($appointment->google_calendar_event_id),
            )
            ->throw();

        $appointment->forceFill([
            'google_calendar_event_id' => null,
            'google_calendar_sync_status' => 'cancelled',
            'google_calendar_synced_at' => now(),
        ])->save();

        $connection->forceFill([
            'last_synced_at' => now(),
        ])->save();

        return [
            'status' => 'deleted',
        ];
    }

    public function frontendCallbackUrl(bool $connected): string
    {
        $base = rtrim((string) (config('services.google.frontend_url') ?? config('app.url')), '/');
        $separator = str_contains($base, '?') ? '&' : '?';

        return $base.$separator.http_build_query([
            'module' => 'integracoes',
            'screen' => 'integra-ogoogle-agenda-admin',
            'google_status' => $connected ? 'connected' : 'failed',
        ]);
    }

    protected function exchangeAuthorizationCode(string $code): array
    {
        return $this->http
            ->asForm()
            ->acceptJson()
            ->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => config('services.google.redirect_uri'),
                'grant_type' => 'authorization_code',
                'code' => $code,
            ])
            ->throw()
            ->json();
    }

    protected function refreshAccessToken(GoogleCalendarConnection $connection): string
    {
        if (! $connection->refresh_token) {
            throw ValidationException::withMessages([
                'google' => 'Refresh token indisponivel. Reconecte o Google Calendar.',
            ]);
        }

        $payload = $this->http
            ->asForm()
            ->acceptJson()
            ->post('https://oauth2.googleapis.com/token', [
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'grant_type' => 'refresh_token',
                'refresh_token' => $connection->refresh_token,
            ])
            ->throw()
            ->json();

        $connection->forceFill([
            'access_token' => $payload['access_token'] ?? $connection->access_token,
            'expires_at' => isset($payload['expires_in'])
                ? now()->addSeconds((int) $payload['expires_in'])
                : $connection->expires_at,
            'token_type' => $payload['token_type'] ?? $connection->token_type,
        ])->save();

        return (string) ($connection->fresh()->access_token);
    }

    protected function getValidAccessToken(GoogleCalendarConnection $connection): string
    {
        if ($connection->access_token && $connection->expires_at?->isFuture()) {
            return (string) $connection->access_token;
        }

        return $this->refreshAccessToken($connection);
    }

    protected function buildEventPayload(Appointment $appointment): array
    {
        $timezone = $appointment->barbershop?->timezone ?? config('app.timezone');
        $startAt = CarbonImmutable::instance($appointment->scheduled_start_at)->setTimezone($timezone);
        $endAt = $appointment->scheduled_end_at
            ? CarbonImmutable::instance($appointment->scheduled_end_at)->setTimezone($timezone)
            : $startAt->addMinutes(max(15, (int) ($appointment->service?->duration_minutes ?? 30)));

        $summaryParts = array_filter([
            $appointment->customer?->name,
            $appointment->service?->name,
        ]);

        return [
            'summary' => implode(' - ', $summaryParts) ?: 'Atendimento BarberPro',
            'description' => implode("\n", array_filter([
                'Canal: '.($appointment->channel ?? 'manual'),
                $appointment->notes ? 'Notas: '.$appointment->notes : null,
                $appointment->barber?->name ? 'Barbeiro: '.$appointment->barber->name : null,
            ])),
            'start' => [
                'dateTime' => $startAt->toIso8601String(),
                'timeZone' => $timezone,
            ],
            'end' => [
                'dateTime' => $endAt->toIso8601String(),
                'timeZone' => $timezone,
            ],
        ];
    }

    /**
     * @param  array{barbershop_id:int,user_id:int,calendar_id:string,issued_at:int}  $payload
     */
    protected function encryptState(array $payload): string
    {
        return Crypt::encryptString(json_encode($payload, JSON_THROW_ON_ERROR));
    }

    /**
     * @return array{barbershop_id:int,user_id:int,calendar_id:string,issued_at:int}
     */
    protected function decryptState(string $state): array
    {
        $payload = json_decode(Crypt::decryptString($state), true, 512, JSON_THROW_ON_ERROR);

        if (! is_array($payload) || ! isset($payload['issued_at'])) {
            throw ValidationException::withMessages([
                'state' => 'State OAuth invalido.',
            ]);
        }

        if (now()->diffInMinutes(CarbonImmutable::createFromTimestamp((int) $payload['issued_at'])) > 30) {
            throw ValidationException::withMessages([
                'state' => 'State OAuth expirado. Gere um novo link de conexao.',
            ]);
        }

        return $payload;
    }
}
