<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Foundation\Application;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StatusController extends Controller
{
    public function health(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
            'service' => config('app.name'),
            'timestamp' => now()->toISOString(),
        ]);
    }

    public function meta(Request $request): JsonResponse
    {
        return response()->json([
            'name' => config('app.name'),
            'environment' => config('app.env'),
            'version' => Application::VERSION,
            'php_version' => PHP_VERSION,
            'timezone' => config('app.timezone'),
            'api_prefix' => 'api/v1',
            'endpoints' => [
                'health' => url('/api/v1/health'),
                'meta' => url('/api/v1/meta'),
                'dashboard' => url('/api/v1/dashboard'),
                'agenda' => url('/api/v1/agenda'),
                'services' => url('/api/v1/services'),
                'customers' => url('/api/v1/customers'),
                'finance' => url('/api/v1/finance'),
                'integrations_status' => url('/api/v1/integrations/status'),
                'legacy_health' => url('/up'),
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }
}
