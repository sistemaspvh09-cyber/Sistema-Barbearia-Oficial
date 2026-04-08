<?php

namespace App\Http\Middleware;

use App\Models\Barbershop;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveAuthenticatedBarbershop
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(401, 'Autenticacao necessaria.');
        }

        $barbershop = $this->resolveTargetBarbershop($request, $user);

        if (! $barbershop) {
            abort(403, 'Nenhuma barbearia ativa disponivel para este usuario.');
        }

        $membership = $user->memberships()
            ->where('barbershop_id', $barbershop->id)
            ->where('is_active', true)
            ->first();

        if (! $membership) {
            abort(403, 'Usuario sem acesso a esta barbearia.');
        }

        if ((int) $user->active_barbershop_id !== (int) $barbershop->id) {
            $user->forceFill([
                'active_barbershop_id' => $barbershop->id,
            ])->save();
        }

        $request->attributes->set('authenticated_barbershop', $barbershop);
        $request->attributes->set('authenticated_membership', $membership);

        return $next($request);
    }

    protected function resolveTargetBarbershop(Request $request, mixed $user): ?Barbershop
    {
        $query = Barbershop::query()->where('is_active', true);

        if ($request->filled('barbershop_id')) {
            return $query->whereKey($request->integer('barbershop_id'))->first();
        }

        if ($request->filled('barbershop_slug')) {
            return $query->where('slug', (string) $request->string('barbershop_slug'))->first();
        }

        if ($request->headers->has('X-Barbershop-Slug')) {
            return $query->where('slug', (string) $request->header('X-Barbershop-Slug'))->first();
        }

        if ($user->active_barbershop_id) {
            return $query->whereKey($user->active_barbershop_id)->first();
        }

        $membership = $user->memberships()
            ->where('is_active', true)
            ->with('barbershop')
            ->oldest('id')
            ->first();

        return $membership?->barbershop;
    }
}
