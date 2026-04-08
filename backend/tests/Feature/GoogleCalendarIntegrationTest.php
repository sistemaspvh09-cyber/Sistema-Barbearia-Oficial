<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barbershop;
use App\Models\BarbershopMembership;
use App\Models\Customer;
use App\Models\GoogleCalendarConnection;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class GoogleCalendarIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('services.google.client_id', 'google-client-id');
        config()->set('services.google.client_secret', 'google-client-secret');
        config()->set('services.google.redirect_uri', 'http://127.0.0.1:8000/api/v1/integrations/google/callback');
        config()->set('services.google.frontend_url', 'http://127.0.0.1:5173');
    }

    public function test_authorize_endpoint_returns_oauth_url(): void
    {
        [$barbershop, $user] = $this->seedBarbershopUser();

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/integrations/google/authorize?barbershop_slug='.$barbershop->slug);

        $response->assertOk()
            ->assertJsonStructure(['authorization_url', 'calendar_id', 'barbershop' => ['id', 'slug']]);

        $authorizationUrl = $response->json('authorization_url');
        $this->assertStringContainsString('https://accounts.google.com/o/oauth2/v2/auth', $authorizationUrl);
        $this->assertStringContainsString('response_type=code', $authorizationUrl);
        $this->assertStringContainsString('access_type=offline', $authorizationUrl);
        $this->assertStringContainsString('include_granted_scopes=true', $authorizationUrl);
    }

    public function test_callback_persists_connection(): void
    {
        [$barbershop, $user] = $this->seedBarbershopUser();

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/v1/integrations/google/authorize?barbershop_slug='.$barbershop->slug);
        $authorizationUrl = $response->json('authorization_url');

        parse_str((string) parse_url($authorizationUrl, PHP_URL_QUERY), $query);

        Http::fake([
            'https://oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'access-token',
                'refresh_token' => 'refresh-token',
                'expires_in' => 3600,
                'scope' => 'https://www.googleapis.com/auth/calendar',
                'token_type' => 'Bearer',
            ], 200),
        ]);

        $callback = $this->getJson('/api/v1/integrations/google/callback?code=sample-code&state='.$query['state']);

        $callback->assertOk()
            ->assertJsonPath('status', 'connected');

        $this->assertDatabaseHas('google_calendar_connections', [
            'barbershop_id' => $barbershop->id,
            'calendar_id' => 'primary',
        ]);
    }

    public function test_create_event_for_appointment(): void
    {
        [$barbershop, $user] = $this->seedBarbershopUser();

        $customer = Customer::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Cliente Demo',
            'email' => 'cliente@demo.com',
        ]);

        $service = Service::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Corte Tradicional',
            'slug' => 'corte-tradicional',
            'duration_minutes' => 30,
            'price_cents' => 3500,
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $appointment = Appointment::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customer->id,
            'barber_user_id' => $user->id,
            'service_id' => $service->id,
            'scheduled_start_at' => now()->addDay(),
            'scheduled_end_at' => now()->addDay()->addMinutes(30),
            'status' => 'scheduled',
            'channel' => 'manual',
            'created_by_user_id' => $user->id,
        ]);

        GoogleCalendarConnection::create([
            'barbershop_id' => $barbershop->id,
            'created_by_user_id' => $user->id,
            'calendar_id' => 'primary',
            'access_token' => 'access-token',
            'refresh_token' => 'refresh-token',
            'expires_at' => now()->addHour(),
        ]);

        Http::fake([
            'https://www.googleapis.com/calendar/v3/calendars/primary/events' => Http::response([
                'id' => 'event-123',
            ], 200),
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/integrations/google/appointments/'.$appointment->id.'/event');

        $response->assertOk()
            ->assertJsonPath('status', 'synced')
            ->assertJsonPath('event.id', 'event-123');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'google_calendar_event_id' => 'event-123',
        ]);
    }

    /**
     * @return array{0: Barbershop, 1: User}
     */
    protected function seedBarbershopUser(): array
    {
        $barbershop = Barbershop::create([
            'name' => 'Barbearia Cabral',
            'slug' => 'barbearia-cabral',
            'timezone' => 'America/Cuiaba',
            'currency' => 'BRL',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'name' => 'Owner Demo',
            'email' => 'owner@demo.com',
            'active_barbershop_id' => $barbershop->id,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $barbershop->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'commission_rate' => 0,
            'is_active' => true,
        ]);

        return [$barbershop, $user];
    }
}
