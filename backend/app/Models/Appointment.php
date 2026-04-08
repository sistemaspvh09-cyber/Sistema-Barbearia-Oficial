<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'barbershop_id',
    'customer_id',
    'barber_user_id',
    'service_id',
    'scheduled_start_at',
    'scheduled_end_at',
    'status',
    'channel',
    'notes',
    'created_by_user_id',
    'cancelled_at',
    'google_calendar_event_id',
    'google_calendar_sync_status',
    'google_calendar_synced_at',
])]
class Appointment extends Model
{
    protected function casts(): array
    {
        return [
            'scheduled_start_at' => 'datetime',
            'scheduled_end_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'google_calendar_synced_at' => 'datetime',
        ];
    }

    public function barbershop(): BelongsTo
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function barber(): BelongsTo
    {
        return $this->belongsTo(User::class, 'barber_user_id');
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function charge(): HasOne
    {
        return $this->hasOne(Charge::class);
    }
}
