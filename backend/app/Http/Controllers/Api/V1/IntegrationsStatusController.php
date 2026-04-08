<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use App\Models\Charge;
use App\Models\GoogleCalendarConnection;
use App\Models\InfinitePayConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class IntegrationsStatusController extends Controller
{
    use ResolvesBarbershop;

    public function __invoke(Request $request): JsonResponse
    {
        $barbershop = $this->resolveBarbershop($request);
        $databaseStatus = $this->databaseStatus();
        $mailStatus = $this->mailStatus();
        $queueStatus = $this->queueStatus();
        $paymentsStatus = $this->paymentsStatus($barbershop->id);
        $calendarStatus = $this->calendarStatus($barbershop->id);

        $activeServices = $barbershop->services()->where('is_active', true)->count();
        $publicCatalogEnabled = (bool) data_get($barbershop->settings, 'public_catalog', false);

        $items = [
            $databaseStatus,
            [
                'key' => 'public_catalog',
                'label' => 'Catalogo publico',
                'status' => $publicCatalogEnabled && $activeServices > 0 ? 'online' : 'disabled',
                'details' => $publicCatalogEnabled
                    ? "Ativo com {$activeServices} servico(s) publicado(s)."
                    : 'Desabilitado nas configuracoes da barbearia.',
            ],
            $calendarStatus,
            $mailStatus,
            $queueStatus,
            $paymentsStatus,
        ];

        $healthyStatuses = collect($items)->filter(
            fn (array $item) => in_array($item['status'], ['online', 'configured', 'sandbox', 'manual'], true)
        )->count();

        return response()->json([
            'barbershop' => $this->barbershopPayload($barbershop),
            'summary' => [
                'healthy' => $healthyStatuses,
                'total' => count($items),
            ],
            'items' => $items,
            'checked_at' => now()->toISOString(),
        ]);
    }

    protected function databaseStatus(): array
    {
        try {
            DB::select('select 1 as ok');

            return [
                'key' => 'database',
                'label' => 'Database',
                'status' => 'online',
                'details' => sprintf('Conexao %s ativa.', DB::connection()->getDriverName()),
            ];
        } catch (Throwable $exception) {
            return [
                'key' => 'database',
                'label' => 'Database',
                'status' => 'offline',
                'details' => $exception->getMessage(),
            ];
        }
    }

    protected function mailStatus(): array
    {
        $mailer = config('mail.default');
        $status = in_array($mailer, ['log', 'array'], true) ? 'sandbox' : 'configured';

        if ($mailer === null) {
            $status = 'not_configured';
        }

        return [
            'key' => 'notifications',
            'label' => 'Notificacoes',
            'status' => $status,
            'details' => $mailer
                ? "Mailer ativo: {$mailer}."
                : 'Nenhum mailer configurado.',
        ];
    }

    protected function queueStatus(): array
    {
        $driver = config('queue.default');
        $pendingJobs = null;

        if ($driver === 'database' && DB::getSchemaBuilder()->hasTable('jobs')) {
            $pendingJobs = DB::table('jobs')->count();
        }

        return [
            'key' => 'queue',
            'label' => 'Filas',
            'status' => $driver ? 'online' : 'not_configured',
            'details' => $pendingJobs === null
                ? sprintf('Driver ativo: %s.', $driver ?? 'nenhum')
                : sprintf('Driver %s com %d job(s) pendente(s).', $driver, $pendingJobs),
        ];
    }

    protected function paymentsStatus(int $barbershopId): array
    {
        $connection = InfinitePayConnection::query()
            ->where('barbershop_id', $barbershopId)
            ->where('is_active', true)
            ->latest('id')
            ->first();

        $latestGateway = Charge::query()
            ->where('barbershop_id', $barbershopId)
            ->whereNotNull('gateway')
            ->orderByDesc(DB::raw('COALESCE(paid_at, due_at, created_at)'))
            ->first(['gateway', 'status', 'payment_method']);

        if ($connection !== null) {
            return [
                'key' => 'payments',
                'label' => 'Pagamentos',
                'status' => 'configured',
                'details' => sprintf(
                    'InfinitePay configurado com handle %s e webhook %s%s',
                    $connection->handle,
                    $connection->webhook_url ?: 'indefinido',
                    $latestGateway ? sprintf('; ultima cobranca com status %s.', $latestGateway->status) : '.',
                ),
            ];
        }

        if ($latestGateway === null) {
            return [
                'key' => 'payments',
                'label' => 'Pagamentos',
                'status' => 'idle',
                'details' => 'Nenhuma cobranca registrada ainda.',
            ];
        }

        $gateway = strtolower((string) $latestGateway->gateway);
        $status = $gateway === 'manual' ? 'manual' : 'configured';

        return [
            'key' => 'payments',
            'label' => 'Pagamentos',
            'status' => $status,
            'details' => sprintf(
                'Ultima cobranca via %s com status %s.',
                $latestGateway->gateway,
                $latestGateway->status,
            ),
        ];
    }

    protected function calendarStatus(int $barbershopId): array
    {
        $configured = filled(config('services.google.client_id'))
            && filled(config('services.google.client_secret'))
            && filled(config('services.google.redirect_uri'));

        $connection = GoogleCalendarConnection::query()
            ->where('barbershop_id', $barbershopId)
            ->latest('id')
            ->first();

        if ($connection !== null) {
            return [
                'key' => 'calendar',
                'label' => 'Agenda externa',
                'status' => 'configured',
                'details' => sprintf(
                    'Google Calendar conectado ao calendario %s%s',
                    $connection->calendar_id,
                    $connection->last_synced_at
                        ? sprintf('; ultimo sync em %s.', $connection->last_synced_at->toISOString())
                        : '.',
                ),
            ];
        }

        return [
            'key' => 'calendar',
            'label' => 'Agenda externa',
            'status' => $configured ? 'ready_to_connect' : 'not_configured',
            'details' => $configured
                ? 'Credenciais Google presentes; falta conectar a barbearia.'
                : 'Nenhuma credencial Google Calendar encontrada no ambiente.',
        ];
    }
}
