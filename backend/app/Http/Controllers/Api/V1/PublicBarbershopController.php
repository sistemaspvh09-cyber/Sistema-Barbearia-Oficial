<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Barbershop;
use Illuminate\Http\JsonResponse;

class PublicBarbershopController extends Controller
{
    protected function findActiveBarbershop(string $slug): Barbershop
    {
        return Barbershop::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->firstOrFail();
    }

    public function profile(string $slug): JsonResponse
    {
        $barbershop = $this->findActiveBarbershop($slug);

        return response()->json([
            'item' => [
                'id' => $barbershop->id,
                'name' => $barbershop->name,
                'slug' => $barbershop->slug,
                'phone' => $barbershop->phone,
                'email' => $barbershop->email,
                'timezone' => $barbershop->timezone,
                'currency' => $barbershop->currency,
                'address' => $barbershop->address ?? [],
                'settings' => $barbershop->settings ?? [],
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function services(string $slug): JsonResponse
    {
        $barbershop = $this->findActiveBarbershop($slug);
        $services = $barbershop->services()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'items' => $services->map(fn ($service) => [
                'id' => $service->id,
                'name' => $service->name,
                'slug' => $service->slug,
                'description' => $service->description,
                'duration_minutes' => $service->duration_minutes,
                'price_cents' => $service->price_cents,
            ])->values(),
            'summary' => [
                'total' => $services->count(),
                'average_price_cents' => (int) round($services->avg('price_cents') ?? 0),
                'average_duration_minutes' => (int) round($services->avg('duration_minutes') ?? 0),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function pricing(string $slug): JsonResponse
    {
        $barbershop = $this->findActiveBarbershop($slug);
        $services = $barbershop->services()
            ->where('is_active', true)
            ->get(['id', 'name', 'price_cents']);

        return response()->json([
            'summary' => [
                'total_services' => $services->count(),
                'min_price_cents' => (int) ($services->min('price_cents') ?? 0),
                'max_price_cents' => (int) ($services->max('price_cents') ?? 0),
                'average_price_cents' => (int) round($services->avg('price_cents') ?? 0),
            ],
            'items' => $services->map(fn ($service) => [
                'id' => $service->id,
                'name' => $service->name,
                'price_cents' => $service->price_cents,
            ])->values(),
            'generated_at' => now()->toISOString(),
        ]);
    }
}

