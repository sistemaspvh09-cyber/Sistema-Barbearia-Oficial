<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServicesController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $services = Service::query()
            ->withCount('appointments')
            ->where('barbershop_id', $barbershop->id)
            ->when($request->has('active'), fn ($query) => $query->where('is_active', filter_var($request->query('active'), FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? true))
            ->when($request->filled('search'), function ($query) use ($request) {
                $term = (string) $request->string('search');

                $query->where(function ($inner) use ($term) {
                    $inner->where('name', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%");
                });
            })
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'summary' => [
                'total' => $services->count(),
                'active' => $services->where('is_active', true)->count(),
                'inactive' => $services->where('is_active', false)->count(),
                'average_price_cents' => (int) round($services->avg('price_cents') ?? 0),
                'average_duration_minutes' => (int) round($services->avg('duration_minutes') ?? 0),
                'public_catalog_enabled' => (bool) data_get($barbershop->settings, 'public_catalog', false),
            ],
            'items' => $services->map(fn (Service $service) => [
                'id' => $service->id,
                'name' => $service->name,
                'slug' => $service->slug,
                'description' => $service->description,
                'duration_minutes' => $service->duration_minutes,
                'price_cents' => $service->price_cents,
                'is_active' => $service->is_active,
                'sort_order' => $service->sort_order,
                'appointments_count' => $service->appointments_count,
                'updated_at' => $this->formatTimestamp($service->updated_at, $barbershop->timezone),
            ])->values(),
            'generated_at' => now()->toISOString(),
        ]);
    }
}
