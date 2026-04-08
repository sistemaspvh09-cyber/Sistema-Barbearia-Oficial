# Railway Runbook

## Backend Laravel

O backend fica na pasta `backend/` e publica via `backend/Dockerfile`.
Se o servico Railway estiver configurado na raiz do repositorio, o [`Dockerfile`](../Dockerfile) da raiz publica o mesmo backend e evita que o Railway trate o projeto como site Vite estatico.

### Variaveis obrigatorias no Railway

- `APP_NAME=BarberPro`
- `APP_ENV=production`
- `APP_KEY=base64:...`
- `APP_DEBUG=false`
- `APP_URL=https://<railway-public-url>`
- `FRONTEND_URL=https://<frontend-public-url>`
- `SANCTUM_STATEFUL_DOMAINS=<frontend-public-host>`
- `SESSION_DRIVER=database`
- `QUEUE_CONNECTION=database`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=none`
- `SESSION_DOMAIN=` vazio
- `DB_CONNECTION=pgsql`
- `DB_HOST=aws-1-us-east-1.pooler.supabase.com`
- `DB_PORT=5432`
- `DB_DATABASE=postgres`
- `DB_USERNAME=postgres.llfohlqwythkozphwkfo`
- `DB_PASSWORD=<supabase-db-password>`
- `DB_SSLMODE=require`
- `INFINITEPAY_HANDLE=<handle-real>`
- `INFINITEPAY_REDIRECT_URL=https://<frontend-public-url>/?module=financeiro&screen=pagamento-aprovado-infinitetap`
- `INFINITEPAY_WEBHOOK_URL=https://<railway-public-url>/api/v1/integrations/infinitepay/webhook`
- `ENABLE_DEMO_SEED=false`

### Runtime esperado

- Healthcheck: `/up`
- API base: `/api/v1`
- O container executa:
  - `php artisan package:discover`
  - `php artisan config:clear`
  - `php artisan route:clear`
  - `php artisan cache:clear`
  - `php artisan migrate --force`

## Frontend Vercel

No projeto Vercel do frontend, definir:

- `VITE_BACKEND_URL=https://<railway-public-url>`
- `VITE_SUPABASE_URL=https://llfohlqwythkozphwkfo.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_s1KyOnah6tYKs51oHYhvbQ_j9mRnTyz` ou `VITE_SUPABASE_ANON_KEY=sb_publishable_s1KyOnah6tYKs51oHYhvbQ_j9mRnTyz`
- `VITE_BARBERSHOP_SLUG=` vazio

Use o mesmo projeto Supabase no frontend e no backend.

## Validacao

1. `GET https://<railway-public-url>/up`
2. `GET https://<railway-public-url>/api/v1/health`
3. login no frontend publicado
4. salvar configuracao InfinitePay
5. gerar checkout link
6. concluir pagamento real
7. confirmar:
   - `charges.status=paid`
   - `charges.gateway=infinitepay`
   - `charges.gateway_reference` preenchido
   - `charges.metadata.infinitepay` preenchido
   - linha em `webhook_deliveries`
