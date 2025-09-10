# IronGrid - Sanvi Machinery B2B Quotation & CRM Platform

## Project Overview
This monorepo contains the complete Sanvi Machinery B2B Quotation & CRM Platform. It includes a NestJS backend, a Next.js frontend, Infrastructure-as-Code, and an observability stack. The goal is to streamline quotations, customer management, and operational workflows end-to-end.

## Monorepo Structure
```
irongrid/
├── backend/           # NestJS + Prisma API, Auth, Quotation, Customers, Files, etc.
├── frontend/          # Next.js 15 app (React 19, Tailwind v4, React Query)
├── infrastructure/    # Terraform modules and operational runbooks/scripts
├── monitoring/        # Prometheus, Loki, Grafana, Alertmanager configs
├── docs/              # Project-level documentation
├── .plan/             # Roadmaps, implementation plans, wireframes
└── .github/           # CI/CD workflows and environments
```

## Tech Stack
- Backend: NestJS 10, Prisma ORM, PostgreSQL, Redis, Bull queues, Swagger, Puppeteer (PDF), SendGrid
- Frontend: Next.js 15, React 19, Tailwind CSS v4, React Query, React Hook Form, Zod, Chart.js
- Infra/DevOps: Docker, Docker Compose, Terraform, Prometheus, Loki, Grafana, Alertmanager
- QA/Tooling: Jest (backend), Vitest + Testing Library (frontend), ESLint, Prettier, Husky (optional)

## Key Features
- Live Quotation Builder with real-time preview and Indian market specifics (INR formatting, amount in words, 9% SGST + 9% CGST)
- Dynamic items with quantity × unit price, live totals, and print/PDF export
- JSON import/export for quotations and seamless backend API integration
- Authentication, customers/products modules, and admin routes for quotation workflows
- Print-ready layouts aligned with Shanvi Machinery branding

## Getting Started
### Prerequisites
- Node.js 18+
- npm
- PostgreSQL (for Prisma database)
- Redis (for queues/cache)

### Environment Variables
- Backend: `backend/.env.example` (copy to `.env` and update values)
- Frontend: `frontend/.env.local.example` (copy to `.env.local` and update values)

### Backend Setup (NestJS)
```bash
cd backend
npm install
# Prepare environment
cp .env.example .env

# Initialize database (PostgreSQL must be running)
npm run prisma:generate
npm run prisma:migrate
npm run db:seed   # optional if seed data is provided

# Run API
npm run start:dev
```
- Common defaults: API runs on http://localhost:3000.
- Swagger/OpenAPI: enabled in development (URL is logged on startup if configured).
- Docker helpers: `npm run docker:up` / `npm run docker:down` use `backend/docker/docker-compose.yml`.

### Frontend Setup (Next.js)
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
- App runs on http://localhost:3000 or http://localhost:3001 depending on your setup. If the backend also uses 3000, start the frontend on a different port: `PORT=3001 npm run dev`.

### Monitoring Stack (optional)
Use the stack under `monitoring/` to run Prometheus, Loki, Grafana, and Alertmanager (see `monitoring/docker-compose.yml`). Point your applications’ logs/metrics to the provided configs.

## Development Guide
- Read `IMPLEMENTATION_PLAN.md` for the high-level plan and milestones.
- Refer to `.plan/` for detailed roadmaps and wireframes.
- See `backend/docs/` and `frontend/README.md` for module-level docs and notes.
- Testing:
  - Backend: `npm run test`, `npm run test:e2e`, `npm run test:cov` (see thresholds in `backend/package.json`).
  - Frontend: `npm run test` or `npm run test:run` (Vitest/RTL).
- Linting/Formatting: `npm run lint`, `npm run format` where available.

## Common Scripts
- Backend (`backend/package.json`):
  - `start:dev`, `start:prod`, `build`
  - `prisma:generate`, `prisma:migrate`, `db:seed`
  - `test`, `test:e2e`, `test:cov`, `lint`, `format`
  - `docker:up`, `docker:down`
- Frontend (`frontend/package.json`):
  - `dev`, `build`, `start`, `lint`, `test`, `test:run`

## Deployment
- Backend: build with `npm run build` and run `npm run start:prod`. Containerization via Docker is recommended.
- Frontend: build with `npm run build` and deploy the `.next/` output with your preferred platform.
- IaC: See `infrastructure/terraform/` for cloud provisioning and variables.

## Contributing
Please read `CONTRIBUTING.md` for branch strategy, commit conventions, issue templates, and code style.

## License
Proprietary - All Rights Reserved

