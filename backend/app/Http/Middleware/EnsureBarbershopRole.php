<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureBarbershopRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $membership = $request->attributes->get('authenticated_membership');

        if (! $membership) {
            abort(403, 'Contexto da barbearia nao resolvido.');
        }

        if ($roles === []) {
            return $next($request);
        }

        if (! in_array($membership->role, $roles, true)) {
            abort(403, 'Permissao insuficiente para esta operacao.');
        }

        return $next($request);
    }
}
