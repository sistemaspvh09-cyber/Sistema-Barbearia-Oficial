<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'slug',
    'phone',
    'email',
    'timezone',
    'currency',
    'address',
    'settings',
    'is_active',
])]
class Barbershop extends Model
{
    protected function casts(): array
    {
        return [
            'address' => 'array',
            'settings' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }

    public function services(): HasMany
    {
        return $this->hasMany(Service::class);
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(BarbershopMembership::class);
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function charges(): HasMany
    {
        return $this->hasMany(Charge::class);
    }

    public function googleCalendarConnections(): HasMany
    {
        return $this->hasMany(GoogleCalendarConnection::class);
    }

    public function infinitePayConnections(): HasMany
    {
        return $this->hasMany(InfinitePayConnection::class);
    }
}
