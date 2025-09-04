# 🤝 Contributing Guide (v2)

Welcome to **Sanvi Machinery**!  
This document ensures **consistent, clean, and safe contributions** to our **frontend (Next.js)** and **backend (NestJS)** codebases.

---

## 📜 General Rules
- **Do No Harm** → Never remove functionality unless explicitly required.  
- **Minimal Changes** → Keep PRs focused on one concern.  
- **Follow Conventions** → Respect existing naming, folder structure, and coding style.  
- **Explain Changes** → All PRs must include *what changed* and *why*.  
- **Run Checks Before Commit**:
  ```bash
  npm run lint
  npm run type-check
  npm run test
  ```

---

## 🌿 Branching & Workflow
- **Main Branches**:
  - `main` → Production-ready code.  
  - `develop` → Staging/testing branch.  
- **Feature Branches**:
  - `feature/*` → New features.  
  - `fix/*` → Bug fixes.  
  - `hotfix/*` → Urgent production fixes.  
- **Commit Style** → Use [Conventional Commits](https://www.conventionalcommits.org/)  
  Examples:  
  - `feat(auth): add JWT refresh flow`  
  - `fix(ui): correct button alignment`  
  - `chore(deps): upgrade React to 18.2`  
- **PR Requirements**:
  - Reference related issue/ticket.  
  - Keep PRs < 500 LOC where possible.  
  - At least **1 approval required** before merging.  

---

## 🎨 Frontend (Next.js + React 18 + Zustand + React Query)

### 📂 Folder Structure
```
frontend/
├── app/          # Pages & layouts
├── components/   # Reusable UI & business widgets
│   ├── ui/       # Atoms (Button, Input, Modal)
│   ├── layout/   # Header, Sidebar, Footer
│   ├── forms/    # Forms (LoginForm, ProductForm)
│   └── business/ # Business features (QuotationBuilder)
├── lib/          
│   ├── api/      # API clients (auth.ts, products.ts)
│   ├── hooks/    # Custom hooks (useAuth, useProducts)
│   ├── store/    # Zustand stores
│   └── utils/    # Helpers, constants, validation
└── types/        # Shared TypeScript types
```

### ✅ Coding Practices
- **UI** → Only in `components/ui` (SRP). Extend via props/variants (OCP).  
- **Feature Components** → Wrap base UI + hook logic (e.g., `LogoutButton`).  
- **API Calls** → Always in `lib/api/*`, never directly inside components.  
- **State** → Keep in Zustand stores or hooks, never in components.  
- **Validation** → Zod schemas in `lib/utils/validation.ts`.  
- **Tests** → Jest + React Testing Library for unit tests.  
- **E2E Tests** → Playwright for flows across pages.  

---

## ⚙️ Backend (NestJS + Prisma + Redis + BullMQ)

### 📂 Folder Structure
```
backend/
├── src/
│   ├── common/      # Guards, interceptors, filters
│   ├── config/      # Env configs
│   ├── modules/     
│   │   ├── auth/    # JWT, cookies, RBAC
│   │   ├── users/   # User accounts
│   │   ├── customers/
│   │   ├── products/
│   │   ├── quotations/
│   │   ├── orders/
│   │   ├── files/   # S3 pre-signed upload
│   │   └── notifications/ # Email, SMS, jobs
│   ├── jobs/        # BullMQ queues/workers
│   └── prisma/      # Schema & migrations
└── tests/           # Unit & integration tests
```

### ✅ Coding Practices
- **Controllers** → Only handle HTTP (req/res).  
- **Services** → All business logic (quotation calc, order rules).  
- **Repositories** → All DB access (via Prisma).  
- **DTOs** → Validate input with `class-validator`.  
- **Guards** → Role-based access control, authentication.  
- **Background Jobs** → Always in `jobs/`, never inside request/response cycle.  
- **Security** → Use httpOnly cookies for tokens (never `localStorage`).  
- **Docs** → Keep Swagger docs updated for new endpoints.  
- **Tests** →  
  - Unit: Jest  
  - Integration: Supertest  
  - Coverage: ≥ 80%  

---

## 🔑 SOLID Principles (Applied Across FE & BE)
- **S**: One responsibility per file/module.  
- **O**: Extend with new props/services, don’t modify existing code blindly.  
- **L**: Replaceable components/services (e.g., swap `Button` → `LinkButton`, Redis → Memcached).  
- **I**: Small, focused props/DTOs, not god-objects.  
- **D**: Depend on abstractions (services, APIs), not implementations (Axios/Prisma directly).  

---

## 🧠 Requirement First Mindset
Before writing code:  
- **Clarify the Requirement** → What exactly needs to be built?  
- **Define Acceptance Criteria** → What does "done" look like?  
- **Identify Impact Area** → Which files/modules will change?  
- **Confirm Boundaries** → What should *not* be touched?  

👉 This ensures development is **fast, accurate, and requires no repeated prompts** for the same issue.  

## 🧪 Test-First Policy (Components & Services)
Before creating any new component (frontend) or service (backend), you MUST write a failing test derived from the requirement, then implement until it passes.

- **Backend (NestJS + Prisma)**  
  - Place tests under `sanvi-backend/test/` or the relevant module directory as `*.spec.ts`.  
  - Use Jest for unit tests; use Supertest for HTTP/integration where appropriate.  
  - Cover DTO validation, service/business rules, and controller contracts.  

- **Frontend (Next.js)**  
  - Place tests under `sanvi-frontend/src/__tests__/` using Jest + React Testing Library.  
  - For UI primitives in `components/ui`, add tests for rendering, states, and interactions.  

- **Definition of Done for new code**  
  1) Requirement is captured by test(s) (red → green).  
  2) Linters/type-checks pass.  
  3) No regressions; coverage does not decrease (target ≥ 80% unless justified).  
  4) PR links the requirement/ticket and summarizes test coverage.  

---

## 🚦 Safety Nets
- Never store tokens in `localStorage` or `sessionStorage`.  
- Never hardcode secrets → always use environment variables.  
- Secrets must be stored in Vault/AWS SSM/secure store, not `.env` in repo.  
- Never log sensitive info (tokens, passwords).  
- Run dependency audit regularly (`npm audit`).  
- Never mix UI + state + API in one place.  
- Never run background jobs in controllers (always async workers).  
- If unsure → **create a new file** rather than editing multiple unrelated ones.  

---

## ⚡ CI/CD Guidelines
- **GitHub Actions** → Run lint, type-check, tests, build before merging.  
- **Frontend** → Preview deployments auto-created in Vercel.  
- **Backend** → Deploys to Railway/Docker staging automatically.  
- **Production Deploy** → Manual approval required.  

---

## 📘 Documentation Standards
- **Frontend** → Update `README.md` for setup/usage changes.  
- **Backend** → Update Swagger for all new endpoints.  
- **Architecture** → Create/update ADRs (Architecture Decision Records) for significant design changes.  
- **Code** → Use JSDoc/TSDoc comments for services, hooks, utilities.  

---

## ✅ Contribution Workflow
1. **Fork & Branch** → `feature/my-feature`  
2. **Implement Changes** (follow folder boundaries).  
3. **Run Checks** → Lint, type-check, tests.  
4. **Commit** → Use conventional commits (`feat:`, `fix:`, `chore:`).  
5. **Open PR** → Explain *what changed* + *why*, link related ticket.  
6. **Get Review** → At least 1 approval required.  
7. **Merge** → Squash & merge into `develop`, auto-deploy to staging.  

---

🔥 With this guide:  
- Frontend stays **modular, composable**.  
- Backend stays **layered, scalable**.  
- Everyone (human + AI) writes **predictable, safe, and clean code**.
