<?php

namespace Tests\Feature\Api;

use App\Models\Appointment;
use App\Models\Barbershop;
use App\Models\BarbershopMembership;
use App\Models\Charge;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OperationalEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $now = CarbonImmutable::parse('2026-04-03 12:00:00', 'UTC');

        CarbonImmutable::setTestNow($now);
        Carbon::setTestNow($now);
    }

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_dashboard_endpoint_returns_real_metrics(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/dashboard?barbershop_slug='.$context['barbershop']->slug.'&date=2026-04-03')
            ->assertOk()
            ->assertJsonPath('barbershop.slug', $context['barbershop']->slug)
            ->assertJsonPath('metrics.appointments_today.total', 2)
            ->assertJsonPath('metrics.appointments_today.completed', 1)
            ->assertJsonPath('metrics.appointments_today.scheduled', 1)
            ->assertJsonPath('metrics.customers.total', 2)
            ->assertJsonPath('metrics.services.active', 2)
            ->assertJsonPath('metrics.revenue.today_cents', 4500)
            ->assertJsonPath('metrics.revenue.pending_cents', 3000)
            ->assertJsonCount(1, 'next_appointments')
            ->assertJsonCount(3, 'top_services');
    }

    public function test_appointments_endpoint_returns_paginated_and_filtered_results(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/appointments?barbershop_slug='.$context['barbershop']->slug.'&status=scheduled&per_page=1&page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.scheduled', 1)
            ->assertJsonPath('filters.page', 1)
            ->assertJsonPath('filters.per_page', 1)
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.status', 'scheduled')
            ->assertJsonPath('items.0.customer.name', 'Lucas Gomes');
    }

    public function test_charges_endpoint_returns_paginated_and_filtered_results(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/charges?barbershop_slug='.$context['barbershop']->slug.'&status=paid&per_page=1&page=1')
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.paid', 1)
            ->assertJsonPath('filters.page', 1)
            ->assertJsonPath('filters.per_page', 1)
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.status', 'paid')
            ->assertJsonPath('items.0.total_cents', 4500);
    }

    public function test_agenda_endpoint_filters_appointments_by_status(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/agenda?barbershop_slug='.$context['barbershop']->slug.'&date=2026-04-03&status=scheduled')
            ->assertOk()
            ->assertJsonPath('summary.total', 1)
            ->assertJsonPath('summary.scheduled', 1)
            ->assertJsonPath('summary.estimated_revenue_cents', 3000)
            ->assertJsonPath('items.0.service.name', 'Barba Completa')
            ->assertJsonPath('items.0.customer.name', 'Lucas Gomes');
    }

    public function test_services_endpoint_returns_catalog_summary(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/services?barbershop_slug='.$context['barbershop']->slug)
            ->assertOk()
            ->assertJsonPath('summary.total', 3)
            ->assertJsonPath('summary.active', 2)
            ->assertJsonPath('summary.inactive', 1)
            ->assertJsonPath('summary.public_catalog_enabled', true)
            ->assertJsonPath('items.0.name', 'Corte Tradicional');
    }

    public function test_customers_endpoint_returns_lifetime_spend_and_activity(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/customers?barbershop_slug='.$context['barbershop']->slug)
            ->assertOk()
            ->assertJsonPath('summary.total', 2)
            ->assertJsonPath('summary.vip', 1)
            ->assertJsonPath('summary.with_email', 1)
            ->assertJsonPath('summary.birthdays_this_month', 1)
            ->assertJsonPath('items.0.name', 'Bruno Cabral')
            ->assertJsonPath('items.0.lifetime_spent_cents', 4500);
    }

    public function test_finance_endpoint_returns_period_breakdown(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/finance?barbershop_slug='.$context['barbershop']->slug.'&from=2026-04-01&to=2026-04-30')
            ->assertOk()
            ->assertJsonPath('summary.charge_count', 2)
            ->assertJsonPath('summary.total_cents', 7500)
            ->assertJsonPath('summary.paid_cents', 4500)
            ->assertJsonPath('summary.pending_cents', 3000)
            ->assertJsonPath('by_status.0.status', 'paid')
            ->assertJsonPath('by_payment_method.0.payment_method', 'cash')
            ->assertJsonPath('daily.0.paid_cents', 4500)
            ->assertJsonCount(2, 'recent_charges');
    }

    public function test_integrations_status_endpoint_reports_operational_state(): void
    {
        $context = $this->seedOperationalContext();

        $response = $this->getJson('/api/v1/integrations/status?barbershop_slug='.$context['barbershop']->slug)
            ->assertOk()
            ->assertJsonPath('summary.total', 6)
            ->assertJsonPath('items.0.key', 'database')
            ->assertJsonPath('items.0.status', 'online');

        $items = collect($response->json('items'))->keyBy('key');

        $this->assertSame('online', $items['public_catalog']['status']);
        $this->assertSame('manual', $items['payments']['status']);
    }

    public function test_team_endpoint_returns_active_memberships(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/team?barbershop_slug='.$context['barbershop']->slug)
            ->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonPath('items.0.role', 'owner')
            ->assertJsonPath('items.0.name', 'Thiago Silva');
    }

    public function test_reports_churn_endpoint_returns_summary(): void
    {
        $context = $this->seedOperationalContext();

        $this->getJson('/api/v1/reports/churn?barbershop_slug='.$context['barbershop']->slug.'&inactive_days=30')
            ->assertOk()
            ->assertJsonPath('summary.total_customers', 2)
            ->assertJsonPath('summary.at_risk_customers', 0)
            ->assertJsonPath('summary.inactive_days', 30)
            ->assertJsonPath('summary.churn_rate_percent', 0);
    }

    /**
     * @return array{barbershop: Barbershop}
     */
    protected function seedOperationalContext(): array
    {
        $barbershop = Barbershop::create([
            'name' => 'Barbearia Cabral',
            'slug' => 'barbearia-cabral',
            'phone' => '(65) 99999-0000',
            'email' => 'contato@barbeariacabral.com',
            'timezone' => 'America/Cuiaba',
            'currency' => 'BRL',
            'settings' => [
                'public_catalog' => true,
                'booking_interval_minutes' => 30,
            ],
            'is_active' => true,
        ]);

        $barber = User::factory()->create([
            'name' => 'Thiago Silva',
            'email' => 'thiago@barbeariacabral.com',
            'active_barbershop_id' => $barbershop->id,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $barbershop->id,
            'user_id' => $barber->id,
            'role' => 'owner',
            'commission_rate' => 45,
            'is_active' => true,
        ]);

        Sanctum::actingAs($barber);

        $corte = Service::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Corte Tradicional',
            'slug' => 'corte-tradicional',
            'description' => 'Corte classico com acabamento.',
            'duration_minutes' => 45,
            'price_cents' => 4500,
            'is_active' => true,
            'sort_order' => 10,
        ]);

        $barba = Service::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Barba Completa',
            'slug' => 'barba-completa',
            'description' => 'Modelagem completa da barba.',
            'duration_minutes' => 30,
            'price_cents' => 3000,
            'is_active' => true,
            'sort_order' => 20,
        ]);

        Service::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Hidratacao Premium',
            'slug' => 'hidratacao-premium',
            'description' => 'Servico desativado para teste.',
            'duration_minutes' => 20,
            'price_cents' => 2000,
            'is_active' => false,
            'sort_order' => 30,
        ]);

        $customerA = Customer::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Bruno Cabral',
            'phone' => '(65) 99999-1111',
            'email' => 'bruno@cliente.com',
            'birthday' => '1994-04-15',
            'notes' => 'Cliente recorrente.',
            'loyalty_points' => 120,
            'total_visits' => 8,
            'last_visit_at' => CarbonImmutable::parse('2026-04-03 11:50:00', 'UTC'),
        ]);

        $customerB = Customer::create([
            'barbershop_id' => $barbershop->id,
            'name' => 'Lucas Gomes',
            'phone' => '(65) 99999-2222',
            'email' => null,
            'birthday' => '1991-12-08',
            'notes' => 'Prefere horario da tarde.',
            'loyalty_points' => 20,
            'total_visits' => 2,
            'last_visit_at' => CarbonImmutable::parse('2026-03-20 18:00:00', 'UTC'),
        ]);

        $appointmentCompleted = Appointment::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customerA->id,
            'barber_user_id' => $barber->id,
            'service_id' => $corte->id,
            'scheduled_start_at' => CarbonImmutable::parse('2026-04-03 11:00:00', 'UTC'),
            'scheduled_end_at' => CarbonImmutable::parse('2026-04-03 11:45:00', 'UTC'),
            'status' => 'completed',
            'channel' => 'manual',
            'created_by_user_id' => $barber->id,
        ]);

        $appointmentScheduled = Appointment::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customerB->id,
            'barber_user_id' => $barber->id,
            'service_id' => $barba->id,
            'scheduled_start_at' => CarbonImmutable::parse('2026-04-03 15:00:00', 'UTC'),
            'scheduled_end_at' => CarbonImmutable::parse('2026-04-03 15:30:00', 'UTC'),
            'status' => 'scheduled',
            'channel' => 'online',
            'created_by_user_id' => $barber->id,
        ]);

        Charge::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customerA->id,
            'appointment_id' => $appointmentCompleted->id,
            'status' => 'paid',
            'subtotal_cents' => 4500,
            'discount_cents' => 0,
            'total_cents' => 4500,
            'payment_method' => 'cash',
            'gateway' => 'manual',
            'gateway_reference' => 'charge-001',
            'due_at' => CarbonImmutable::parse('2026-04-03 11:45:00', 'UTC'),
            'paid_at' => CarbonImmutable::parse('2026-04-03 11:50:00', 'UTC'),
            'metadata' => ['source' => 'test'],
        ]);

        Charge::create([
            'barbershop_id' => $barbershop->id,
            'customer_id' => $customerB->id,
            'appointment_id' => $appointmentScheduled->id,
            'status' => 'pending',
            'subtotal_cents' => 3000,
            'discount_cents' => 0,
            'total_cents' => 3000,
            'payment_method' => 'pix',
            'gateway' => 'manual',
            'gateway_reference' => 'charge-002',
            'due_at' => CarbonImmutable::parse('2026-04-03 15:30:00', 'UTC'),
            'paid_at' => null,
            'metadata' => ['source' => 'test'],
        ]);

        return [
            'barbershop' => $barbershop,
        ];
    }
}
