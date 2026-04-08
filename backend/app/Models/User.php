<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'active_barbershop_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(BarbershopMembership::class);
    }

    public function activeBarbershop(): BelongsTo
    {
        return $this->belongsTo(Barbershop::class, 'active_barbershop_id');
    }

    public function barberAppointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'barber_user_id');
    }

    public function createdAppointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'created_by_user_id');
    }

    public function activeMembership(): ?BarbershopMembership
    {
        $activeBarbershopId = $this->active_barbershop_id;

        if ($activeBarbershopId) {
            return $this->memberships()
                ->where('barbershop_id', $activeBarbershopId)
                ->where('is_active', true)
                ->first();
        }

        return $this->memberships()
            ->where('is_active', true)
            ->oldest('id')
            ->first();
    }
}
