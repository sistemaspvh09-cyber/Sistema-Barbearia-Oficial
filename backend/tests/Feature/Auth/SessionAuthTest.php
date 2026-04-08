<?php

namespace Tests\Feature\Auth;

use App\Models\Barbershop;
use App\Models\BarbershopMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SessionAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_me_and_logout_flow(): void
    {
        $context = $this->seedAuthContext(role: 'owner');

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->postJson('/api/v1/auth/login', [
            'email' => $context['user']->email,
            'password' => 'Secret123!',
        ])->assertOk()
            ->assertJsonPath('user.email', $context['user']->email)
            ->assertJsonPath('membership.role', 'owner');

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', $context['user']->email);

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJson(['status' => 'ok']);

        $this->app['auth']->forgetGuards();

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->getJson('/api/v1/auth/me')
            ->assertStatus(401);
    }

    public function test_switch_barbershop_updates_active_context(): void
    {
        $context = $this->seedAuthContext(role: 'admin');

        $secondShop = Barbershop::create([
            'name' => 'Barbearia Centro',
            'slug' => 'barbearia-centro',
            'timezone' => 'America/Cuiaba',
            'currency' => 'BRL',
            'is_active' => true,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $secondShop->id,
            'user_id' => $context['user']->id,
            'role' => 'admin',
            'commission_rate' => 0,
            'is_active' => true,
        ]);

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->postJson('/api/v1/auth/login', [
            'email' => $context['user']->email,
            'password' => 'Secret123!',
        ])->assertOk();

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->postJson('/api/v1/auth/switch-barbershop', [
            'barbershop_id' => $secondShop->id,
        ])->assertOk()
            ->assertJsonPath('barbershop.slug', 'barbearia-centro');
    }

    public function test_invite_requires_owner_or_admin(): void
    {
        $context = $this->seedAuthContext(role: 'barber');

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->postJson('/api/v1/auth/login', [
            'email' => $context['user']->email,
            'password' => 'Secret123!',
        ])->assertOk();

        $this->withHeader('Origin', 'http://127.0.0.1:5173')->postJson('/api/v1/auth/invite', [
            'name' => 'Nova Pessoa',
            'email' => 'nova@barbearia.com',
            'role' => 'barber',
        ])->assertStatus(403);
    }

    /**
     * @return array{user: User, barbershop: Barbershop}
     */
    protected function seedAuthContext(string $role = 'owner'): array
    {
        $barbershop = Barbershop::create([
            'name' => 'Barbearia Cabral',
            'slug' => 'barbearia-cabral',
            'timezone' => 'America/Cuiaba',
            'currency' => 'BRL',
            'is_active' => true,
        ]);

        $user = User::create([
            'name' => 'Dono',
            'email' => 'dono@barbearia.com',
            'password' => Hash::make('Secret123!'),
            'active_barbershop_id' => $barbershop->id,
        ]);

        BarbershopMembership::create([
            'barbershop_id' => $barbershop->id,
            'user_id' => $user->id,
            'role' => $role,
            'commission_rate' => 0,
            'is_active' => true,
        ]);

        return [
            'user' => $user,
            'barbershop' => $barbershop,
        ];
    }
}
