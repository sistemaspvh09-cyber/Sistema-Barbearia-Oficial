<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Models\Barbershop;
use App\Models\BarbershopMembership;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = User::query()->create([
            'name' => $payload['name'],
            'email' => $payload['email'],
            'password' => Hash::make($payload['password']),
            'active_barbershop_id' => null,
        ]);

        Auth::login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json($this->buildAuthPayload($user), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        if (! Auth::attempt([
            'email' => $payload['email'],
            'password' => $payload['password'],
        ], (bool) ($payload['remember'] ?? false))) {
            throw ValidationException::withMessages([
                'email' => 'Credenciais invalidas.',
            ]);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json($this->buildAuthPayload($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $response = response()->json([
            'status' => 'ok',
        ]);

        $sessionCookie = config('session.cookie');

        if (is_string($sessionCookie) && $sessionCookie !== '') {
            $response->withCookie(cookie()->forget($sessionCookie));
        }

        $response->withCookie(cookie()->forget('XSRF-TOKEN'));

        return $response;
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($this->buildAuthPayload($request->user()));
    }

    public function switchBarbershop(Request $request): JsonResponse
    {
        $data = $request->validate([
            'barbershop_id' => ['nullable', 'integer', 'exists:barbershops,id'],
            'barbershop_slug' => ['nullable', 'string'],
        ]);

        if (! $data['barbershop_id'] && ! $data['barbershop_slug']) {
            throw ValidationException::withMessages([
                'barbershop_id' => 'Informe barbershop_id ou barbershop_slug.',
            ]);
        }

        $barbershop = Barbershop::query()
            ->when($data['barbershop_id'] ?? null, fn ($q) => $q->whereKey($data['barbershop_id']))
            ->when($data['barbershop_slug'] ?? null, fn ($q) => $q->where('slug', $data['barbershop_slug']))
            ->where('is_active', true)
            ->first();

        if (! $barbershop) {
            abort(404, 'Barbearia nao encontrada.');
        }

        $membership = $request->user()
            ->memberships()
            ->where('barbershop_id', $barbershop->id)
            ->where('is_active', true)
            ->first();

        if (! $membership) {
            abort(403, 'Usuario sem acesso a esta barbearia.');
        }

        $request->user()->forceFill([
            'active_barbershop_id' => $barbershop->id,
        ])->save();

        return response()->json($this->buildAuthPayload($request->user(), $barbershop, $membership));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::query()->where('email', $payload['email'])->first();
        $token = $user ? Password::broker()->createToken($user) : null;

        return response()->json([
            'status' => Password::RESET_LINK_SENT,
            'token' => $token,
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ]);

        $status = Password::broker()->reset(
            [
                'email' => $payload['email'],
                'token' => $payload['token'],
                'password' => $payload['password'],
                'password_confirmation' => $payload['password_confirmation'],
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => __($status),
            ]);
        }

        return response()->json([
            'status' => $status,
        ]);
    }

    public function invite(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', Rule::in(['owner', 'admin', 'barber', 'reception'])],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $barbershop = $request->attributes->get('authenticated_barbershop');

        if (! $barbershop) {
            abort(403, 'Contexto de barbearia nao resolvido.');
        }

        $temporaryPassword = Str::password(16);
        $user = User::query()->firstOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'],
                'password' => Hash::make($temporaryPassword),
                'active_barbershop_id' => $barbershop->id,
            ],
        );

        if ($user->name !== $data['name']) {
            $user->forceFill([
                'name' => $data['name'],
            ])->save();
        }

        $membership = BarbershopMembership::query()->updateOrCreate(
            [
                'barbershop_id' => $barbershop->id,
                'user_id' => $user->id,
            ],
            [
                'role' => $data['role'],
                'commission_rate' => $data['commission_rate'],
                'is_active' => true,
            ],
        );

        return response()->json([
            'user' => $this->userPayload($user),
            'membership' => $this->membershipPayload($membership),
            'temporary_password' => $temporaryPassword,
        ], 201);
    }

    protected function buildAuthPayload(?User $user, ?Barbershop $barbershop = null, ?BarbershopMembership $membership = null): array
    {
        if (! $user) {
            abort(401, 'Autenticacao necessaria.');
        }

        $membership = $membership ?? $user->activeMembership();
        $barbershop = $barbershop ?? $membership?->barbershop;

        return [
            'user' => $this->userPayload($user),
            'barbershop' => $barbershop ? [
                'id' => $barbershop->id,
                'name' => $barbershop->name,
                'slug' => $barbershop->slug,
                'timezone' => $barbershop->timezone,
                'currency' => $barbershop->currency,
            ] : null,
            'membership' => $membership ? $this->membershipPayload($membership) : null,
        ];
    }

    protected function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'active_barbershop_id' => $user->active_barbershop_id,
        ];
    }

    protected function membershipPayload(BarbershopMembership $membership): array
    {
        return [
            'barbershop_id' => $membership->barbershop_id,
            'role' => $membership->role,
            'commission_rate' => $membership->commission_rate,
            'is_active' => $membership->is_active,
        ];
    }
}
