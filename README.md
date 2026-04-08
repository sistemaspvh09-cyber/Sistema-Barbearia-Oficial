# Sistema-Barbearia-Oficial

Repositório oficial com:

- frontend React + Vite na raiz
- backend Laravel em [`backend/`](backend)

## Estrutura

- raiz: app web publicada no Vercel
- `backend/`: API Laravel preparada para deploy separado no Railway
- `docs/railway-runbook.md`: checklist de deploy do backend
- `docs/vercel-production.md`: variáveis e operação do frontend em produção

## Frontend

Scripts da raiz:

- `npm run dev`
- `npm run build`
- `npm run lint`

Variáveis esperadas no frontend:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` ou `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `VITE_BACKEND_URL` quando o frontend precisar consumir a API publicada

Use [`.env.production.example`](.env.production.example) como base para produção.

## Backend

O backend usa:

- PHP `^8.3`
- Laravel 13
- Postgres/Supabase
- InfinitePay real com checkout, `payment_check` e webhook

Use [`backend/.env.production.example`](backend/.env.production.example) como base.

## Deploy

- frontend: Vercel
- backend: Railway com `backend/Dockerfile` ou com o [`Dockerfile`](Dockerfile) da raiz quando o servico apontar para o repositorio inteiro

Consulte:

- [docs/vercel-production.md](docs/vercel-production.md)
- [docs/railway-runbook.md](docs/railway-runbook.md)
