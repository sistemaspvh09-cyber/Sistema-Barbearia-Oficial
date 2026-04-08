<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('GRANT USAGE ON SCHEMA public TO anon, authenticated');
        DB::statement('GRANT SELECT ON TABLE public.services TO anon, authenticated');
        DB::statement('ALTER TABLE public.services ENABLE ROW LEVEL SECURITY');
        DB::statement('DROP POLICY IF EXISTS services_public_read ON public.services');
        DB::statement('CREATE POLICY services_public_read ON public.services FOR SELECT TO anon, authenticated USING (is_active = true)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('DROP POLICY IF EXISTS services_public_read ON public.services');
        DB::statement('REVOKE SELECT ON TABLE public.services FROM anon, authenticated');
    }
};
