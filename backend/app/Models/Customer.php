<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'barbershop_id',
    'name',
    'phone',
    'email',
    'birthday',
    'notes',
    'loyalty_points',
    'total_visits',
    'last_visit_at',
])]
class Customer extends Model
{
    protected function casts(): array
    {
        return [
            'birthday' => 'date',
            'last_visit_at' => 'datetime',
        ];
    }

    public function barbershop(): BelongsTo
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function charges(): HasMany
    {
        return $this->hasMany(Charge::class);
    }
}
