<?php

namespace Tests\Feature\Api;

use App\Models\Appointment;
use App\Models\Barbershop;
use App\Models\BarbershopMembership;
use App\Models\Charge;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CoreMutationsSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_reception_can_create_appointment_and_charge_but_cannot_delete_charge(): void
    {
        $context = $this->seedContext(role: 'reception');
        Sanctum::actingAs($context['user']);

        $appointmentResponse = $this->postJson("/api/v1/appointments?barbershop_slug={$context['barbershop']->slug}", [
            'barber_user_id' => $context['barber']->id,
            'service_id' => $context['service']->id,
            'customer_id' => $context['customer']->id,
            'scheduled_start_at' => now()->addHour()->toISOString(),
            'channel' => 'balcao',
        ])->assertCreated();

        $appointmentId = (int) $appointmentResponse->json('item.id');

        $chargeId = (int) $this->postJson("/api/v1/charges?barbershop_slug={$context['barbershop']->slug}", [
            'appointment_id' => $appointmentId,
            'customer_id' => $context['customer']->id,
            'subtotal_cents' => 4500,
            'discount_cents' => 500,
            'payment_method' => 'pix',
        ])->assertCreated()->json('item.id');

        $this->deleteJson("/api/v1/charges/{$chargeId}?barbershop_slug={$context['barbershop']->slug}")
            ->assertStatus(403);
    }

    public function test_barber_cannot_update_team_member(): void
    {
        $context = $this->seedContext(role: 'barber');
        Sanctum::actingAs($context['user']);

        $this->putJson("/api/v1/team/{$context['barber']->id}?barbershop_slug={$context['barbershop']->slug}", [
            'is_active' => false,
        ])->assertStatus(403);
    }

    public function test_core_resource_isolation_across_barbershops(): void
    {
        $contextA = $this->seedContext(role: 'owner', slug: 'barbearia-a', email: 'ownera@demo.com');
        $contextB = $this->seedContext(role: 'owner', slug: 'barbearia-b', email: 'ownerb@demo.com');

        Sanctum::actingAs($contextA['user']);

        $serviceId = (int) $this->postJson("/api/v1/services?barbershop_slug={$contextA['barbershop']->slug}", [
            'name' => 'Serv A',
            'duration_minutes' => 30,
            'price_cents' => 3000,
        ])->assertCreated()->json('item.id');

        Sanctum::actingAs($contextB['user']);

        $this->putJson("/api/v1/services/{$serviceId}?barbershop_slug={$contextB['barbershop']->slug}", [
            'name' => 'Serv B',
            'duration_minutes' => 30,
            'price_cents' => 3500,
        ])->assertNotFound();
    }

    /**
     * @return array{barbershop: Barbershop, user: User, barber: User, customer: Customer, service: Service}
     */
    protected function seedContext(
        string $role,
        string $slug = 'barbearia-cabral',
        string $email = 'owner@demo.com',
    ): array {
        $barbershop = Barbershop::create([
            'name' => 'Barbearia '.strtoupper(substr($slug, -1)),
            'slug' => $slug,
            'timezone' => 'America/Cuiaba',
            'currency' => 'BRL',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'name' => 'User '.strtoupper(substr($slug, -1)),
            'email' => $email,
            'active_barbershop_id' => $barbershop->id,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $barbershop->id,
            'user_id' => $user->id,
            'role' => $role,
            'commission_rate' => 0,
            'is_active' => true,
        ]);

        $barber = User::factory()->create([
            'name' => 'Barber '.strtoupper(substr($slug, -1)),
            'email' => 'barber.'.$slug.'@demo.com',
            'active_barbershop_id' => $barbershop->id,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $barbershop->id,
            'user_id' => $barber->id,
            'role' => 'barber',
            'commission_rate' => 40,
            'is_active' => true,
        ]);

        $customer = Customer::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Cliente '.$slug,
            'email' => 'cliente.'.$slug.'@demo.com',
            'phone' => '(65) 99999-7777',
        ]);

        $service = Service::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Corte '.$slug,
            'slug' => 'corte-'.$slug,
            'duration_minutes' => 45,
            'price_cents' => 4500,
            'is_active' => true,
            'sort_order' => 10,
        ]);

        Appointment::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customer->id,
            'barber_user_id' => $barber->id,
            'service_id' => $service->id,
            'scheduled_start_at' => now()->addDay(),
            'scheduled_end_at' => now()->addDay()->addMinutes(45),
            'status' => 'scheduled',
            'channel' => 'balcao',
            'created_by_user_id' => $user->id,
        ]);

        Charge::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customer->id,
            'status' => 'pending',
            'subtotal_cents' => 4500,
            'discount_cents' => 0,
            'total_cents' => 4500,
        ]);

        return [
            'barbershop' => $barbershop,
            'user' => $user,
            'barber' => $barber,
            'customer' => $customer,
            'service' => $service,
        ];
    }
}

