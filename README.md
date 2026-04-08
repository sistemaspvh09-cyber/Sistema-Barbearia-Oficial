# Sistema-Barbearia-Oficial

Repositório oficial do BarberPro V1, em arquitetura Supabase-first, com:

- frontend React + Vite na raiz
- backend Laravel em [`backend/`](backend) fora do caminho crítico do runtime atual

## Estrutura

- raiz: app web publicada no Vercel
- `backend/`: API Laravel preparada para deploy separado no Railway para evoluções futuras
- [`setup-database.sql`](setup-database.sql): schema canônico do V1 no Supabase
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
- `VITE_BACKEND_URL` opcional no V1; use apenas quando o frontend precisar falar com uma API publicada

Use [`.env.production.example`](.env.production.example) como base para produção.

## Backend

O backend usa:

- PHP `^8.3`
- Laravel 13
- Postgres/Supabase
- InfinitePay real com checkout, `payment_check` e webhook

O frontend V1 não depende do backend Laravel para login, agenda, clientes, equipe, estoque, financeiro, configurações e fluxo InfinitePay client-side.

Use [`backend/.env.production.example`](backend/.env.production.example) como base.

## Deploy

- frontend: Vercel
- backend: Railway com `backend/Dockerfile` ou com o [`Dockerfile`](Dockerfile) da raiz quando o servico apontar para o repositorio inteiro

Consulte:

- [docs/vercel-production.md](docs/vercel-production.md)
- [docs/railway-runbook.md](docs/railway-runbook.md)
