<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\Barbershop;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

trait ResolvesBarbershop
{
    protected function resolveBarbershop(Request $request): Barbershop
    {
        $resolved = $request->attributes->get('authenticated_barbershop');

        if ($resolved instanceof Barbershop) {
            return $resolved;
        }

        $query = Barbershop::query()->where('is_active', true);

        if ($request->filled('barbershop_id')) {
            $query->whereKey($request->integer('barbershop_id'));
        } elseif ($request->filled('barbershop_slug')) {
            $query->where('slug', (string) $request->string('barbershop_slug'));
        }

        return $query->orderBy('id')->firstOrFail();
    }

    protected function barbershopPayload(Barbershop $barbershop): array
    {
        return [
            'id' => $barbershop->id,
            'name' => $barbershop->name,
            'slug' => $barbershop->slug,
            'timezone' => $barbershop->timezone,
            'currency' => $barbershop->currency,
            'phone' => $barbershop->phone,
            'email' => $barbershop->email,
            'settings' => $barbershop->settings ?? [],
        ];
    }

    protected function resolveDate(
        Request $request,
        string $parameter,
        string $timezone,
        ?CarbonImmutable $default = null,
    ): CarbonImmutable {
        $raw = $request->query($parameter);

        if ($raw === null || $raw === '') {
            return $default ?? CarbonImmutable::now($timezone);
        }

        try {
            $date = CarbonImmutable::createFromFormat('Y-m-d', (string) $raw, $timezone);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                $parameter => 'Use the Y-m-d format.',
            ]);
        }

        if ($date === false) {
            throw ValidationException::withMessages([
                $parameter => 'Use the Y-m-d format.',
            ]);
        }

        return $date;
    }

    protected function asUtcDayBounds(CarbonImmutable $date): array
    {
        return [
            $date->startOfDay()->utc(),
            $date->endOfDay()->utc(),
        ];
    }

    protected function formatTimestamp(?\DateTimeInterface $timestamp, string $timezone): ?array
    {
        if ($timestamp === null) {
            return null;
        }

        $value = CarbonImmutable::instance($timestamp);

        return [
            'utc' => $value->utc()->toISOString(),
            'local' => $value->setTimezone($timezone)->toISOString(),
            'label' => $value->setTimezone($timezone)->format('d/m/Y H:i'),
        ];
    }
}
