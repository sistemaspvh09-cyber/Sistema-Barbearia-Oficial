<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('google_calendar_connections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('google_email')->nullable();
            $table->string('calendar_id')->default('primary');
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->text('scopes')->nullable();
            $table->string('token_type')->nullable();
            $table->timestampTz('expires_at')->nullable();
            $table->timestampTz('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique('barbershop_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('google_calendar_connections');
    }
};
