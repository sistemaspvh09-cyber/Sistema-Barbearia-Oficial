<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ServicesMutationController extends Controller
{
    use ResolvesBarbershop;

    public function store(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:480'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ]);

        $service = Service::query()->create([
            'barbershop_id' => $barbershop->id,
            'name' => $payload['name'],
            'slug' => $this->generateUniqueSlug($barbershop->id, $payload['name']),
            'duration_minutes' => $payload['duration_minutes'],
            'price_cents' => $payload['price_cents'],
            'description' => $payload['description'] ?? null,
            'is_active' => $payload['is_active'] ?? true,
            'sort_order' => $payload['sort_order'] ?? 0,
        ]);

        return response()->json([
            'item' => $this->servicePayload($service->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'duration_minutes' => ['sometimes', 'required', 'integer', 'min:1', 'max:480'],
            'price_cents' => ['sometimes', 'required', 'integer', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'sort_order' => ['sometimes', 'required', 'integer', 'min:0', 'max:65535'],
        ]);

        $service = Service::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        if (array_key_exists('name', $payload) && $payload['name'] !== $service->name) {
            $payload['slug'] = $this->generateUniqueSlug($barbershop->id, $payload['name'], $service->id);
        }

        $service->fill($payload);
        $service->save();

        return response()->json([
            'item' => $this->servicePayload($service->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $service = Service::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        $scheduledAppointmentsCount = $service->appointments()
            ->where('status', 'scheduled')
            ->count();

        if ($scheduledAppointmentsCount > 0) {
            throw ValidationException::withMessages([
                'service_id' => 'Nao e possivel remover servico com agendamentos em status scheduled.',
            ]);
        }

        $service->delete();

        return response()->json([], 204);
    }

    protected function servicePayload(Service $service, string $timezone): array
    {
        return [
            'id' => $service->id,
            'name' => $service->name,
            'slug' => $service->slug,
            'description' => $service->description,
            'duration_minutes' => $service->duration_minutes,
            'price_cents' => $service->price_cents,
            'is_active' => (bool) $service->is_active,
            'sort_order' => $service->sort_order,
            'updated_at' => $this->formatTimestamp($service->updated_at, $timezone),
        ];
    }

    protected function generateUniqueSlug(int $barbershopId, string $name, ?int $ignoreServiceId = null): string
    {
        $baseSlug = Str::slug($name);

        if ($baseSlug === '') {
            $baseSlug = 'servico';
        }

        $slug = $baseSlug;
        $suffix = 2;

        while (Service::query()
            ->where('barbershop_id', $barbershopId)
            ->where('slug', $slug)
            ->when($ignoreServiceId, fn ($query) => $query->where('id', '<>', $ignoreServiceId))
            ->exists()) {
            $slug = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
