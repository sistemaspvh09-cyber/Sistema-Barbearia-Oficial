<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'active_barbershop_id')) {
                $table->foreignId('active_barbershop_id')
                    ->nullable()
                    ->after('remember_token')
                    ->constrained('barbershops')
                    ->nullOnDelete();
            }
        });

        if (! filter_var(env('ENABLE_DEMO_SEED', false), FILTER_VALIDATE_BOOL)) {
            return;
        }

        $barbershopId = DB::table('barbershops')
            ->where('slug', 'barbearia-cabral')
            ->value('id');

        if (! $barbershopId) {
            return;
        }

        $email = 'barbeiro.demo@barbeariacabral.com';
        $password = Hash::make((string) env('DEMO_OWNER_PASSWORD', 'BarberPro123!'));
        $timestamp = now();

        $userId = DB::table('users')->where('email', $email)->value('id');

        if ($userId) {
            DB::table('users')
                ->where('id', $userId)
                ->update([
                    'name' => 'BarberPro Owner Demo',
                    'password' => $password,
                    'active_barbershop_id' => $barbershopId,
                    'updated_at' => $timestamp,
                ]);
        } else {
            $userId = DB::table('users')->insertGetId([
                'name' => 'BarberPro Owner Demo',
                'email' => $email,
                'password' => $password,
                'active_barbershop_id' => $barbershopId,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }

        DB::table('barbershop_memberships')->updateOrInsert(
            [
                'barbershop_id' => $barbershopId,
                'user_id' => $userId,
            ],
            [
                'role' => 'owner',
                'commission_rate' => 0,
                'is_active' => true,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        );
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'active_barbershop_id')) {
                $table->dropConstrainedForeignId('active_barbershop_id');
            }
        });
    }
};
