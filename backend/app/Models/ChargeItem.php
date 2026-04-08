<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'charge_id',
    'service_id',
    'description',
    'quantity',
    'unit_price_cents',
    'total_price_cents',
])]
class ChargeItem extends Model
{
    public function charge(): BelongsTo
    {
        return $this->belongsTo(Charge::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}
