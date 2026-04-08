<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class BarbershopDemoSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = now();
        $slug = 'barbearia-cabral';

        DB::table('barbershops')->updateOrInsert(
            ['slug' => $slug],
            [
                'name' => 'Barbearia Cabral',
                'phone' => '(65) 99999-0000',
                'email' => 'contato@barbeariacabral.com',
                'timezone' => 'America/Cuiaba',
                'currency' => 'BRL',
                'address' => json_encode([
                    'street' => 'Av. Principal, 100',
                    'district' => 'Centro',
                    'city' => 'Cuiaba',
                    'state' => 'MT',
                ]),
                'settings' => json_encode([
                    'booking_interval_minutes' => 30,
                    'allow_walk_ins' => true,
                    'public_catalog' => true,
                ]),
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $barbershopId = DB::table('barbershops')->where('slug', $slug)->value('id');

        if (!$barbershopId) {
            return;
        }

        $services = [
            [
                'name' => 'Corte Tradicional',
                'slug' => 'corte-tradicional',
                'description' => 'Corte masculino classico com acabamento.',
                'duration_minutes' => 45,
                'price_cents' => 4500,
                'sort_order' => 10,
            ],
            [
                'name' => 'Barba Completa',
                'slug' => 'barba-completa',
                'description' => 'Modelagem e toalha quente para barba.',
                'duration_minutes' => 30,
                'price_cents' => 3000,
                'sort_order' => 20,
            ],
            [
                'name' => 'Combo Corte + Barba',
                'slug' => 'combo-corte-barba',
                'description' => 'Pacote completo para atendimento premium.',
                'duration_minutes' => 75,
                'price_cents' => 7000,
                'sort_order' => 30,
            ],
        ];

        foreach ($services as $service) {
            DB::table('services')->updateOrInsert(
                [
                    'barbershop_id' => $barbershopId,
                    'slug' => $service['slug'],
                ],
                [
                    'name' => $service['name'],
                    'description' => $service['description'],
                    'duration_minutes' => $service['duration_minutes'],
                    'price_cents' => $service['price_cents'],
                    'is_active' => true,
                    'sort_order' => $service['sort_order'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        DB::table('customers')->updateOrInsert(
            [
                'barbershop_id' => $barbershopId,
                'email' => 'cliente.demo@barbeariacabral.com',
            ],
            [
                'name' => 'Cliente Demo',
                'phone' => '(65) 99999-1111',
                'birthday' => '1994-06-15',
                'notes' => 'Cliente seed para smoke tests do catalogo.',
                'loyalty_points' => 120,
                'total_visits' => 6,
                'last_visit_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]
        );

        $barberEmail = 'barbeiro.staff@barbeariacabral.com';
        $barberUserId = DB::table('users')->where('email', $barberEmail)->value('id');

        $barberPayload = [
            'name' => 'BarberPro Staff Demo',
            'email' => $barberEmail,
            'password' => Hash::make((string) env('DEMO_BARBER_PASSWORD', 'BarberPro123!')),
            'updated_at' => $now,
        ];

        if (Schema::hasColumn('users', 'active_barbershop_id')) {
            $barberPayload['active_barbershop_id'] = $barbershopId;
        }

        if ($barberUserId) {
            DB::table('users')
                ->where('id', $barberUserId)
                ->update($barberPayload);
        } else {
            $barberPayload['created_at'] = $now;
            $barberUserId = DB::table('users')->insertGetId($barberPayload);
        }

        DB::table('barbershop_memberships')->updateOrInsert(
            [
                'barbershop_id' => $barbershopId,
                'user_id' => $barberUserId,
            ],
            [
                'role' => 'barber',
                'commission_rate' => 45,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        );
    }
}
