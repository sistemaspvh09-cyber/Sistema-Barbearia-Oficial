# Vercel Production

Este projeto publica o frontend React no Vercel e opera em modo Supabase-first no V1. O backend Laravel permanece opcional nesta fase.

## Frontend Vercel

Defina estas variaveis no projeto do Vercel:

- `VITE_SUPABASE_URL=https://llfohlqwythkozphwkfo.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_s1KyOnah6tYKs51oHYhvbQ_j9mRnTyz` ou `VITE_SUPABASE_ANON_KEY=sb_publishable_s1KyOnah6tYKs51oHYhvbQ_j9mRnTyz`
- `VITE_BACKEND_URL=https://<backend-public-url>` apenas se voce realmente for consumir a API publicada
- `VITE_BARBERSHOP_SLUG` vazio em producao

Use o mesmo projeto Supabase no frontend e, se existir backend, também nele.

No V1, o frontend funciona sem `VITE_BACKEND_URL` porque o núcleo operacional roda direto no Supabase.

## Backend Laravel

Esta seção so é necessária se você decidir publicar o backend agora.

Use `backend/.env.production.example` como base. Os campos obrigatorios para o fluxo real da InfinitePay sao:

- `APP_URL`
- `FRONTEND_URL`
- `SANCTUM_STATEFUL_DOMAINS`
- `DB_CONNECTION` e `DB_*`
- `SESSION_DRIVER=database`
- `QUEUE_CONNECTION=database`
- `INFINITEPAY_HANDLE`
- `INFINITEPAY_REDIRECT_URL`
- `INFINITEPAY_WEBHOOK_URL`
- `ENABLE_DEMO_SEED=false`

Para frontend em dominio diferente do backend, o cookie de sessao precisa estar apto a cross-site:

- `SESSION_SECURE_COOKIE=true`
- `SESSION_SAME_SITE=none`

Se frontend e backend compartilharem o mesmo dominio raiz, configure `SESSION_DOMAIN` para o dominio raiz, por exemplo `.seudominio.com`.

## Validacao

1. Backend:
   - `php artisan config:clear`
   - `php artisan route:clear`
   - `php artisan cache:clear`
   - `php artisan migrate --force`
2. Frontend:
   - `npm run lint`
   - `npm run build`
3. Fluxo InfinitePay:
   - salvar configuracao da unidade em `POST /api/v1/integrations/infinitepay/config`
   - gerar checkout em `POST /api/v1/integrations/infinitepay/charges/{charge}/checkout-link`
   - concluir pagamento real
   - validar `payment_check`, webhook e atualizacao da `charge`

## PHP 8.3 no Windows

O backend exige PHP `^8.3`. Se o XAMPP local ainda estiver em 8.2, use um PHP 8.3 isolado para `composer` e `artisan` antes de qualquer troca no Apache.

Exemplo:

```powershell
$env:PHP_BINARY = 'C:\tools\php83\php.exe'
cd backend
php artisan test --filter=InfinitePayIntegrationTest
```
