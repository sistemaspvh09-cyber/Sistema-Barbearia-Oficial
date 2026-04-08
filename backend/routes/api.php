<?php

use App\Http\Controllers\Api\V1\AgendaController;
use App\Http\Controllers\Api\V1\AppointmentsController;
use App\Http\Controllers\Api\V1\AppointmentsReadController;
use App\Http\Controllers\Api\V1\ChargesController;
use App\Http\Controllers\Api\V1\ChargesReadController;
use App\Http\Controllers\Api\V1\CustomersController;
use App\Http\Controllers\Api\V1\CustomersMutationController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DomainResourceController;
use App\Http\Controllers\Api\V1\FinanceController;
use App\Http\Controllers\Api\V1\GoogleCalendarController;
use App\Http\Controllers\Api\V1\InfinitePayCheckoutController;
use App\Http\Controllers\Api\V1\InfinitePayConfigController;
use App\Http\Controllers\Api\V1\InfinitePayWebhookController;
use App\Http\Controllers\Api\V1\IntegrationsStatusController;
use App\Http\Controllers\Api\V1\PublicBarbershopController;
use App\Http\Controllers\Api\V1\ReportsController;
use App\Http\Controllers\Api\V1\ServicesController;
use App\Http\Controllers\Api\V1\ServicesMutationController;
use App\Http\Controllers\Api\V1\StatusController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [StatusController::class, 'health'])->name('health');
Route::get('/meta', [StatusController::class, 'meta'])->name('meta');

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('/login', [AuthController::class, 'login'])->name('auth.login');
    Route::post('/password/forgot', [AuthController::class, 'forgotPassword'])->name('auth.password.forgot');
    Route::post('/password/reset', [AuthController::class, 'resetPassword'])->name('auth.password.reset');

    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('auth.me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::post('/switch-barbershop', [AuthController::class, 'switchBarbershop'])->name('auth.switch');
        Route::post('/invite', [AuthController::class, 'invite'])
            ->middleware(['barbershop.context', 'barbershop.role:owner,admin'])
            ->name('auth.invite');
    });
});

$domainResourceRoles = collect(config('barberpro_resources'))
    ->mapWithKeys(fn (array $config, string $resource) => [
        $resource => implode(',', $config['write_roles'] ?? ['owner', 'admin']),
    ])
    ->all();

Route::middleware(['auth:sanctum', 'barbershop.context'])->group(function () use ($domainResourceRoles) {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');
    Route::get('/agenda', AgendaController::class)->name('agenda.index');
    Route::get('/services', ServicesController::class)->name('services.index');
    Route::get('/customers', CustomersController::class)->name('customers.index');
    Route::get('/finance', FinanceController::class)->name('finance.index');
    Route::get('/integrations/status', IntegrationsStatusController::class)->name('integrations.status');
    Route::get('/appointments', AppointmentsReadController::class)->name('appointments.index');
    Route::get('/charges', ChargesReadController::class)->name('charges.index');

    Route::get('/team', [TeamController::class, 'index'])->name('team.index');
    Route::put('/team/{user}', [TeamController::class, 'update'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('team.update');

    Route::post('/appointments', [AppointmentsController::class, 'store'])
        ->middleware(['barbershop.role:owner,admin,reception,barber'])
        ->name('appointments.store');
    Route::put('/appointments/{id}', [AppointmentsController::class, 'update'])
        ->middleware(['barbershop.role:owner,admin,reception,barber'])
        ->name('appointments.update');
    Route::delete('/appointments/{id}', [AppointmentsController::class, 'destroy'])
        ->middleware(['barbershop.role:owner,admin,reception'])
        ->name('appointments.destroy');

    Route::post('/services', [ServicesMutationController::class, 'store'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('services.store');
    Route::put('/services/{id}', [ServicesMutationController::class, 'update'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('services.update');
    Route::delete('/services/{id}', [ServicesMutationController::class, 'destroy'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('services.destroy');

    Route::post('/customers', [CustomersMutationController::class, 'store'])
        ->middleware(['barbershop.role:owner,admin,reception'])
        ->name('customers.store');
    Route::put('/customers/{id}', [CustomersMutationController::class, 'update'])
        ->middleware(['barbershop.role:owner,admin,reception'])
        ->name('customers.update');
    Route::delete('/customers/{id}', [CustomersMutationController::class, 'destroy'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('customers.destroy');

    Route::post('/charges', [ChargesController::class, 'store'])
        ->middleware(['barbershop.role:owner,admin,reception,barber'])
        ->name('charges.store');
    Route::put('/charges/{id}', [ChargesController::class, 'update'])
        ->middleware(['barbershop.role:owner,admin,reception,barber'])
        ->name('charges.update');
    Route::delete('/charges/{id}', [ChargesController::class, 'destroy'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('charges.destroy');

    Route::get('/reports/financial', [ReportsController::class, 'financial'])
        ->middleware(['barbershop.role:owner,admin,reception'])
        ->name('reports.financial');
    Route::get('/reports/team-performance', [ReportsController::class, 'teamPerformance'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('reports.team-performance');
    Route::get('/reports/churn', [ReportsController::class, 'churn'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('reports.churn');
    Route::get('/reports/nps', [ReportsController::class, 'nps'])
        ->middleware(['barbershop.role:owner,admin'])
        ->name('reports.nps');

    foreach ($domainResourceRoles as $resource => $roles) {
        $routeBase = '/'.$resource;

        Route::get($routeBase, [DomainResourceController::class, 'index'])
            ->defaults('resource', $resource)
            ->name(str_replace('/', '.', $resource).'.index');
        Route::get($routeBase.'/{id}', [DomainResourceController::class, 'show'])
            ->defaults('resource', $resource)
            ->name(str_replace('/', '.', $resource).'.show');
        Route::post($routeBase, [DomainResourceController::class, 'store'])
            ->defaults('resource', $resource)
            ->middleware(['barbershop.role:'.$roles])
            ->name(str_replace('/', '.', $resource).'.store');
        Route::put($routeBase.'/{id}', [DomainResourceController::class, 'update'])
            ->defaults('resource', $resource)
            ->middleware(['barbershop.role:'.$roles])
            ->name(str_replace('/', '.', $resource).'.update');
        Route::delete($routeBase.'/{id}', [DomainResourceController::class, 'destroy'])
            ->defaults('resource', $resource)
            ->middleware(['barbershop.role:'.$roles])
            ->name(str_replace('/', '.', $resource).'.destroy');
    }
});

Route::prefix('public/barbershops/{slug}')->group(function () {
    Route::get('/profile', [PublicBarbershopController::class, 'profile'])->name('public.barbershops.profile');
    Route::get('/services', [PublicBarbershopController::class, 'services'])->name('public.barbershops.services');
    Route::get('/pricing', [PublicBarbershopController::class, 'pricing'])->name('public.barbershops.pricing');
});

Route::prefix('integrations/google')->group(function () {
    Route::get('/authorize', [GoogleCalendarController::class, 'authorize'])
        ->middleware(['auth:sanctum', 'barbershop.context', 'barbershop.role:owner,admin'])
        ->name('integrations.google.authorize');
    Route::get('/callback', [GoogleCalendarController::class, 'callback'])
        ->name('integrations.google.callback');
    Route::post('/appointments/{appointment}/event', [GoogleCalendarController::class, 'createEvent'])
        ->middleware(['auth:sanctum', 'barbershop.context', 'barbershop.role:owner,admin,reception,barber'])
        ->name('integrations.google.appointments.event');
});

Route::prefix('integrations/infinitepay')->group(function () {
    Route::get('/config', [InfinitePayConfigController::class, 'show'])
        ->middleware(['auth:sanctum', 'barbershop.context', 'barbershop.role:owner,admin,reception,barber'])
        ->name('infinitepay.config.show');
    Route::post('/config', [InfinitePayConfigController::class, 'store'])
        ->middleware(['auth:sanctum', 'barbershop.context', 'barbershop.role:owner,admin'])
        ->name('infinitepay.config');
    Route::post('/charges/{charge}/checkout-link', [InfinitePayCheckoutController::class, 'createLink'])
        ->middleware(['auth:sanctum', 'barbershop.context', 'barbershop.role:owner,admin,reception,barber'])
        ->name('infinitepay.checkout-link');
    Route::post('/charges/{charge}/payment-check', [InfinitePayCheckoutController::class, 'paymentCheck'])
        ->middleware(['auth:sanctum', 'barbershop.context', 'barbershop.role:owner,admin,reception,barber'])
        ->name('infinitepay.payment-check');
    Route::post('/webhook', [InfinitePayWebhookController::class, 'handle'])->name('infinitepay.webhook');
});
