<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesBarbershop;
use App\Http\Controllers\Controller;
use Carbon\CarbonImmutable;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DomainResourceController extends Controller
{
    use ResolvesBarbershop;

    public function index(Request $request, ?string $resource = null): JsonResponse
    {
        $resource = $this->resolveRouteResource($request, $resource);
        $barbershop = $this->resolveBarbershop($request);
        $config = $this->resolveResourceConfig($resource);
        $table = $config['table'];

        $query = DB::table($table)->where('barbershop_id', $barbershop->id);
        $this->applyCommonFilters($query, $request, $config);

        $perPage = min(max($request->integer('per_page', 20), 1), 100);
        $page = max($request->integer('page', 1), 1);
        $total = (clone $query)->count();

        $sortBy = (string) $request->string('sort_by', $config['default_sort'] ?? 'id');
        $sortDirection = strtolower((string) $request->string('sort_direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        if (! $this->isAllowedSort($sortBy, $config)) {
            $sortBy = $config['default_sort'] ?? 'id';
        }

        $items = (clone $query)
            ->orderBy($sortBy, $sortDirection)
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn ($row) => $this->normalizeRow((array) $row, $config))
            ->values();

        $summary = [
            'total' => $total,
        ];

        if ($this->hasField($config, 'status')) {
            $summary['by_status'] = (clone $query)
                ->select('status')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('status')
                ->orderBy('status')
                ->get()
                ->map(fn ($row) => [
                    'status' => $row->status,
                    'count' => (int) $row->count,
                ])
                ->values();
        }

        return response()->json([
            'items' => $items,
            'summary' => $summary,
            'filters' => [
                'page' => $page,
                'per_page' => $perPage,
                'search' => $request->filled('search') ? (string) $request->string('search') : null,
                'status' => $request->filled('status') ? (string) $request->string('status') : null,
                'from' => $request->filled('from') ? (string) $request->string('from') : null,
                'to' => $request->filled('to') ? (string) $request->string('to') : null,
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function show(Request $request, ?string $id = null): JsonResponse
    {
        $resource = $this->resolveRouteResource($request);
        $id = $this->resolveRouteId($request, $id);
        $barbershop = $this->resolveBarbershop($request);
        $config = $this->resolveResourceConfig($resource);
        $table = $config['table'];

        $item = DB::table($table)
            ->where('barbershop_id', $barbershop->id)
            ->where('id', $id)
            ->first();

        if (! $item) {
            abort(404);
        }

        return response()->json([
            'item' => $this->normalizeRow((array) $item, $config),
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function store(Request $request, ?string $resource = null): JsonResponse
    {
        $resource = $this->resolveRouteResource($request, $resource);
        $barbershop = $this->resolveBarbershop($request);
        $config = $this->resolveResourceConfig($resource);
        $table = $config['table'];

        $payload = $request->validate($this->buildRulesForStore($config));
        $normalized = $this->normalizePayload($payload, $config);
        $this->validateScopedRelations($barbershop->id, $normalized, $config);

        $normalized['barbershop_id'] = $barbershop->id;
        $normalized['created_at'] = now();
        $normalized['updated_at'] = now();

        if (! empty($config['auto_user_field']) && filled($request->user()?->id)) {
            $normalized[$config['auto_user_field']] = $request->user()->id;
        }

        $id = DB::table($table)->insertGetId($normalized);
        $item = DB::table($table)
            ->where('barbershop_id', $barbershop->id)
            ->where('id', $id)
            ->first();

        return response()->json([
            'item' => $this->normalizeRow((array) $item, $config),
            'generated_at' => now()->toISOString(),
        ], 201);
    }

    public function update(Request $request, ?string $id = null): JsonResponse
    {
        $resource = $this->resolveRouteResource($request);
        $id = $this->resolveRouteId($request, $id);
        $barbershop = $this->resolveBarbershop($request);
        $config = $this->resolveResourceConfig($resource);
        $table = $config['table'];

        $existing = DB::table($table)
            ->where('barbershop_id', $barbershop->id)
            ->where('id', $id)
            ->first();

        if (! $existing) {
            abort(404);
        }

        $payload = $request->validate($this->buildRulesForUpdate($config));
        $normalized = $this->normalizePayload($payload, $config);
        $this->validateScopedRelations($barbershop->id, $normalized, $config);

        if ($normalized === []) {
            throw ValidationException::withMessages([
                'payload' => 'Nenhum campo valido foi informado para atualizacao.',
            ]);
        }

        $normalized['updated_at'] = now();

        DB::table($table)
            ->where('barbershop_id', $barbershop->id)
            ->where('id', $id)
            ->update($normalized);

        $item = DB::table($table)
            ->where('barbershop_id', $barbershop->id)
            ->where('id', $id)
            ->first();

        return response()->json([
            'item' => $this->normalizeRow((array) $item, $config),
            'generated_at' => now()->toISOString(),
        ]);
    }

    public function destroy(Request $request, ?string $id = null): JsonResponse
    {
        $resource = $this->resolveRouteResource($request);
        $id = $this->resolveRouteId($request, $id);
        $barbershop = $this->resolveBarbershop($request);
        $config = $this->resolveResourceConfig($resource);
        $table = $config['table'];

        $deleted = DB::table($table)
            ->where('barbershop_id', $barbershop->id)
            ->where('id', $id)
            ->delete();

        if ($deleted === 0) {
            abort(404);
        }

        return response()->json([], 204);
    }

    protected function resolveResourceConfig(string $resource): array
    {
        $resourceConfig = config('barberpro_resources');

        if (! is_array($resourceConfig) || ! array_key_exists($resource, $resourceConfig)) {
            abort(404, 'Recurso nao encontrado.');
        }

        return $resourceConfig[$resource];
    }

    protected function resolveRouteResource(Request $request, ?string $resource = null): string
    {
        $resolved = trim((string) ($resource ?? $request->route('resource', '')));

        if ($resolved === '') {
            $routeName = (string) ($request->route()?->getName() ?? '');

            if ($routeName !== '') {
                $resolved = Str::beforeLast($routeName, '.');
                $resolved = str_replace('.', '/', $resolved);
            }
        }

        if ($resolved === '') {
            abort(404, 'Recurso nao encontrado.');
        }

        return $resolved;
    }

    protected function resolveRouteId(Request $request, ?string $id): int
    {
        $resolved = trim((string) ($id ?? $request->route('id', '')));

        if ($resolved === '' || ! is_numeric($resolved)) {
            abort(404, 'Registro nao encontrado.');
        }

        return (int) $resolved;
    }

    protected function applyCommonFilters(Builder $query, Request $request, array $config): void
    {
        if ($request->filled('search') && ! empty($config['searchable'])) {
            $term = (string) $request->string('search');
            $searchable = (array) $config['searchable'];

            $query->where(function (Builder $inner) use ($searchable, $term) {
                foreach ($searchable as $index => $field) {
                    if ($index === 0) {
                        $inner->where($field, 'like', "%{$term}%");
                    } else {
                        $inner->orWhere($field, 'like', "%{$term}%");
                    }
                }
            });
        }

        if ($request->filled('status') && $this->hasField($config, 'status')) {
            $query->where('status', (string) $request->string('status'));
        }

        $dateField = $config['date_field'] ?? null;

        if (! $dateField) {
            return;
        }

        if ($request->filled('from')) {
            $from = $this->parseDateBoundary((string) $request->string('from'), true, 'from');
            $query->where($dateField, '>=', $from);
        }

        if ($request->filled('to')) {
            $to = $this->parseDateBoundary((string) $request->string('to'), false, 'to');
            $query->where($dateField, '<=', $to);
        }
    }

    protected function buildRulesForStore(array $config): array
    {
        $rules = [];

        foreach ($config['fields'] as $field => $meta) {
            $rules[$field] = $this->fieldRules($meta, true);
        }

        return $rules;
    }

    protected function buildRulesForUpdate(array $config): array
    {
        $rules = [];

        foreach ($config['fields'] as $field => $meta) {
            $baseRules = $this->fieldRules($meta, false);
            $rules[$field] = array_values(array_unique(['sometimes', ...$baseRules]));
        }

        return $rules;
    }

    protected function fieldRules(array $meta, bool $forStore): array
    {
        $rules = [];
        $required = (bool) ($meta['required'] ?? false);

        $rules[] = ($forStore && $required) ? 'required' : 'nullable';

        $type = $meta['type'] ?? 'string';

        switch ($type) {
            case 'email':
                $rules[] = 'email';
                $rules[] = 'max:255';
                break;
            case 'text':
                $rules[] = 'string';
                break;
            case 'integer':
                $rules[] = 'integer';
                break;
            case 'unsigned_integer':
                $rules[] = 'integer';
                $rules[] = 'min:0';
                break;
            case 'boolean':
                $rules[] = 'boolean';
                break;
            case 'json':
                $rules[] = 'array';
                break;
            case 'date':
                $rules[] = 'date_format:Y-m-d';
                break;
            case 'datetime':
                $rules[] = 'date';
                break;
            case 'decimal':
                $rules[] = 'numeric';
                break;
            default:
                $rules[] = 'string';
                $rules[] = 'max:255';
                break;
        }

        if (! empty($meta['enum']) && is_array($meta['enum'])) {
            $rules[] = Rule::in($meta['enum']);
        }

        return $rules;
    }

    protected function normalizePayload(array $payload, array $config): array
    {
        $normalized = [];

        foreach ($config['fields'] as $field => $meta) {
            if (! array_key_exists($field, $payload)) {
                continue;
            }

            $value = $payload[$field];
            $type = $meta['type'] ?? 'string';

            if ($value === null) {
                $normalized[$field] = null;
                continue;
            }

            switch ($type) {
                case 'boolean':
                    $normalized[$field] = (bool) $value;
                    break;
                case 'integer':
                case 'unsigned_integer':
                    $normalized[$field] = (int) $value;
                    break;
                case 'decimal':
                    $normalized[$field] = (float) $value;
                    break;
                case 'date':
                    $normalized[$field] = CarbonImmutable::createFromFormat('Y-m-d', (string) $value)->format('Y-m-d');
                    break;
                case 'datetime':
                    $normalized[$field] = CarbonImmutable::parse((string) $value)->toISOString();
                    break;
                case 'json':
                    $normalized[$field] = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                    break;
                default:
                    $normalized[$field] = is_string($value) ? trim($value) : (string) $value;
                    break;
            }
        }

        return $normalized;
    }

    protected function normalizeRow(array $row, array $config): array
    {
        foreach ($config['fields'] as $field => $meta) {
            if (! array_key_exists($field, $row) || $row[$field] === null) {
                continue;
            }

            $type = $meta['type'] ?? 'string';

            if ($type === 'json' && is_string($row[$field])) {
                $decoded = json_decode($row[$field], true);
                $row[$field] = is_array($decoded) ? $decoded : [];
            }
        }

        return $row;
    }

    protected function hasField(array $config, string $field): bool
    {
        return array_key_exists($field, Arr::get($config, 'fields', []));
    }

    protected function isAllowedSort(string $sortBy, array $config): bool
    {
        if ($sortBy === 'id') {
            return true;
        }

        if (array_key_exists($sortBy, $config['fields'] ?? [])) {
            return true;
        }

        return $sortBy === ($config['default_sort'] ?? '');
    }

    protected function parseDateBoundary(string $value, bool $start, string $field): string
    {
        try {
            $date = CarbonImmutable::parse($value);
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                $field => 'Use data valida para o filtro.',
            ]);
        }

        return ($start ? $date->startOfDay() : $date->endOfDay())->toISOString();
    }

    protected function validateScopedRelations(int $barbershopId, array $payload, array $config): void
    {
        $relations = Arr::get($config, 'scoped_relations', []);

        if (! is_array($relations)) {
            return;
        }

        foreach ($relations as $field => $relationConfig) {
            if (! array_key_exists($field, $payload) || $payload[$field] === null) {
                continue;
            }

            $table = is_array($relationConfig) ? ($relationConfig['table'] ?? null) : $relationConfig;
            $column = is_array($relationConfig) ? ($relationConfig['column'] ?? 'id') : 'id';
            $scopeByBarbershop = is_array($relationConfig)
                ? (bool) ($relationConfig['scope_barbershop'] ?? true)
                : true;

            if (! is_string($table) || $table === '') {
                continue;
            }

            $query = DB::table($table)->where($column, (int) $payload[$field]);

            if ($scopeByBarbershop) {
                $query->where('barbershop_id', $barbershopId);
            }

            if (! $query->exists()) {
                throw ValidationException::withMessages([
                    $field => 'Relacionamento invalido para esta barbearia.',
                ]);
            }
        }
    }
}
