# Sprint 1 TODO / Spec — Infra Setup (Local, no Docker)

Status: In progress
Owner: Engineering
Scope: Local dev setup, DX polish, baseline theme alignment

## Completed
- [x] Backend runs locally without Docker (NestJS)
- [x] Prisma migrations + seed with admin user
  - User: admin@sanvi.local / Admin@12345
- [x] Fix PrismaService shutdown typing (use `process.on('beforeExit')`)
  - File: `sanvi-backend/src/prisma/prisma.service.ts`
- [x] Switch `cookie-parser` to default import for runtime stability
  - File: `sanvi-backend/src/main.ts`
- [x] Backend docs updated with non-Docker run steps
  - File: `sanvi-backend/docs/README.md`
- [x] Frontend theme aligned with machinery palette via CSS vars
  - File: `sanvi-frontend/app/globals.css`
- [x] Dashboard uses brand tokens
  - File: `sanvi-frontend/app/dashboard/page.tsx`
- [x] Provide frontend env example for API base URL
  - File: `sanvi-frontend/.env.local.example`

## Pending (Sprint 1 wrap-up)
- [ ] Create local `.env.local` from example (dev machine, not committed)
  - Copy command (PowerShell): `Copy-Item .env.local.example .env.local`
  - Copy command (bash): `cp .env.local.example .env.local`
- [ ] Consolidate Next.js routes (decide on single `app/` over `src/app/`)
  - Requires confirmation; plan migration if approved
- [ ] Add `sanvi-frontend/README.md` with:
  - Env vars and API URL override
  - Brand tokens usage guideline (Tailwind v4 + CSS variables)

## Notes
- Frontend API base URL: `sanvi-frontend/lib/api.ts` reads `NEXT_PUBLIC_API_BASE_URL` and defaults to `http://localhost:3001/api`.
- Known lint warning: `@theme` at-rule in Tailwind v4 is safe to ignore for now.
- CORS is enabled for `http://localhost:3000` in backend.

## Quick Run
- Backend: `cd sanvi-backend && npm install && npm run prisma:migrate && npm run prisma:seed && npm run start:dev`
- Frontend: `cd sanvi-frontend && npm install && cp .env.local.example .env.local && npm run dev`

## References
- Plan: `/.plan/.project/sanvi_development_plan_sprint_v1.md`
- Roadmap: `/.plan/.project/sanvi_complete_roadmap_v2.md`
- BE/FE split: `/.plan/.project/separate_be_fe_plan.md`
