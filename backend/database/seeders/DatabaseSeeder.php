<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if ($this->shouldSeedDemoData()) {
            $this->call([
                BarbershopDemoSeeder::class,
            ]);
        }
    }

    protected function shouldSeedDemoData(): bool
    {
        if (! app()->environment(['local', 'testing'])) {
            return false;
        }

        return filter_var(env('ENABLE_DEMO_SEED', false), FILTER_VALIDATE_BOOL);
    }
}
