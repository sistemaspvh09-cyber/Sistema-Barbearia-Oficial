<?php

namespace Tests\Feature\Api;

use Tests\TestCase;

class StatusEndpointsTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $this->getJson('/api/v1/health')
            ->assertOk()
            ->assertJson([
                'status' => 'ok',
            ]);
    }

    public function test_meta_endpoint_returns_service_metadata(): void
    {
        $this->getJson('/api/v1/meta')
            ->assertOk()
            ->assertJsonStructure([
                'name',
                'environment',
                'version',
                'php_version',
                'timezone',
                'api_prefix',
                'endpoints' => [
                    'health',
                    'meta',
                    'dashboard',
                    'agenda',
                    'services',
                    'customers',
                    'finance',
                    'integrations_status',
                    'legacy_health',
                ],
                'generated_at',
            ]);
    }
}
