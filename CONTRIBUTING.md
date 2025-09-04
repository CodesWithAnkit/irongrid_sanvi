# Contributing

This repo uses a test-first approach for all new components (frontend) and services (backend).

- Write a failing test from the requirement first.
- Implement until the test passes; keep the change minimal.
- Open a PR with a clear description and link to the relevant requirement/issue.

Detailed guidelines (templates, examples, coverage targets) live here:
- `/.plan/.agent/CONTRIBUTING_v2.md`

## Development quick start

Backend (no Docker):
1) Ensure local PostgreSQL is running and set `sanvi-backend/.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/sanvi_db?schema=public"
```
2) From `sanvi-backend/`:
```
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```
- Swagger: http://localhost:3001/api/docs
- Seeded admin: `admin@sanvi.local` / `Admin@12345`

Frontend:
1) From `sanvi-frontend/`:
```
npm install
npm run dev
```
2) Optionally create `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

## Code style
- Frontend uses Tailwind v4; brand tokens are exposed via CSS variables in `sanvi-frontend/app/globals.css`.
- Backend uses NestJS + Prisma; avoid tight coupling to Prisma models in controllers (use DTOs).

## SOLID and frontend architecture
- Follow SOLID across both backend and frontend:
  - Single Responsibility: keep UI components dumb; business logic in hooks/services.
  - Open/Closed: extend via composition (new components/hooks), avoid modifying shared primitives.
  - Liskov Substitution: program to interfaces (types) and avoid leaky concrete implementations.
  - Interface Segregation: prefer small, focused props and service functions over god objects.
  - Dependency Inversion: components depend on abstractions (e.g., `features/*/api.ts`), not axios directly.
- Frontend layering:
  - `lib/api.ts`: shared HTTP client (axios) with interceptors.
  - `features/<domain>/types.ts`: DTO and domain types mirrored from backend contracts.
  - `features/<domain>/api.ts`: pure functions performing API calls (no React imports).
  - `features/<domain>/hooks.ts`: React Query hooks wrapping `api.ts` with caching and invalidation.
  - `app/**`: route components that compose hooks and present UI.
- Rules of thumb:
  - No direct axios calls in React components; always go through `features/*/api.ts` or hooks.
  - Keep components pure and presentational; side-effects live in hooks.
  - Zod for client-side validation; map 1:1 with backend DTOs.
  - Tests: write a failing unit test for `api.ts` or `hooks.ts` before implementing complex logic.

## Commit/PR hygiene
- Conventional commits preferred (feat, fix, docs, chore).
- Keep PRs small, focused, and include tests.
