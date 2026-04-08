<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomersMutationController extends Controller
{
    use ResolvesBarbershop;

    public function store(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers', 'email')->where(fn ($query) => $query->where('barbershop_id', $barbershop->id)),
            ],
            'birthday' => ['nullable', 'date_format:Y-m-d'],
            'notes' => ['nullable', 'string'],
        ]);

        $customer = Customer::query()->create([
            'barbershop_id' => $barbershop->id,
            'name' => $payload['name'],
            'phone' => $payload['phone'] ?? null,
            'email' => $payload['email'] ?? null,
            'birthday' => $payload['birthday'] ?? null,
            'notes' => $payload['notes'] ?? null,
        ]);

        return response()->json([
            'item' => $this->customerPayload($customer->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $customer = Customer::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        $payload = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('customers', 'email')
                    ->where(fn ($query) => $query->where('barbershop_id', $barbershop->id))
                    ->ignore($customer->id),
            ],
            'birthday' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $customer->fill($payload);
        $customer->save();

        return response()->json([
            'item' => $this->customerPayload($customer->fresh(), $barbershop->timezone),
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);

        $customer = Customer::query()
            ->where('barbershop_id', $barbershop->id)
            ->whereKey((int) $id)
            ->firstOrFail();

        $customer->delete();

        return response()->json([], 204);
    }

    protected function customerPayload(Customer $customer, string $timezone): array
    {
        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'birthday' => $customer->birthday?->format('Y-m-d'),
            'notes' => $customer->notes,
            'loyalty_points' => $customer->loyalty_points,
            'total_visits' => $customer->total_visits,
            'last_visit_at' => $this->formatTimestamp($customer->last_visit_at, $timezone),
        ];
    }
}

