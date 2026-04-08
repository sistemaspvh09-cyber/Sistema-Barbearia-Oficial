<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->string('google_calendar_event_id')->nullable()->after('cancelled_at');
            $table->string('google_calendar_sync_status')->nullable()->after('google_calendar_event_id');
            $table->timestampTz('google_calendar_synced_at')->nullable()->after('google_calendar_sync_status');
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table): void {
            $table->dropColumn([
                'google_calendar_event_id',
                'google_calendar_sync_status',
                'google_calendar_synced_at',
            ]);
        });
    }
};
