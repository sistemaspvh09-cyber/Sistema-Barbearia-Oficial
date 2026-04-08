<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('infinite_pay_connections', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('handle');
            $table->string('redirect_url')->nullable();
            $table->string('webhook_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('last_checked_at')->nullable();
            $table->timestamps();

            $table->unique('barbershop_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('infinite_pay_connections');
    }
};
