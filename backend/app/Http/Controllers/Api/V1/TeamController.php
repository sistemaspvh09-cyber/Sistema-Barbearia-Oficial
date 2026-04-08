<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\BarbershopMembership;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TeamController extends Controller
{
    use ResolvesBarbershop;

    public function index(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $memberships = BarbershopMembership::query()
            ->with(['user:id,name,email'])
            ->where('barbershop_id', $barbershop->id)
            ->where('is_active', true)
            ->when(
                $request->filled('role'),
                fn ($query) => $query->where('role', (string) $request->string('role')),
            )
            ->orderBy('role')
            ->orderBy('id')
            ->get();

        return response()->json([
            'items' => $memberships->map(fn (BarbershopMembership $membership) => [
                'user_id' => $membership->user_id,
                'name' => $membership->user?->name,
                'email' => $membership->user?->email,
                'role' => $membership->role,
                'commission_rate' => $membership->commission_rate !== null
                    ? (float) $membership->commission_rate
                    : null,
                'is_active' => (bool) $membership->is_active,
            ])->values(),
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function update(Request $request, string $user): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'role' => ['nullable', Rule::in(['owner', 'admin', 'barber', 'reception'])],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $membership = BarbershopMembership::query()
            ->with(['user:id,name,email'])
            ->where('barbershop_id', $barbershop->id)
            ->where('user_id', (int) $user)
            ->firstOrFail();

        $membership->fill($payload);
        $membership->save();
        $membership->refresh();

        return response()->json([
            'item' => [
                'user_id' => $membership->user_id,
                'name' => $membership->user?->name,
                'email' => $membership->user?->email,
                'role' => $membership->role,
                'commission_rate' => $membership->commission_rate !== null
                    ? (float) $membership->commission_rate
                    : null,
                'is_active' => (bool) $membership->is_active,
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }
}

