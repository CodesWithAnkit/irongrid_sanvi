# Contribution Guidelines for IronGrid (Sanvi Machinery)

Thank you for contributing to the IronGrid platform! These guidelines ensure a consistent, high-quality development experience across frontend and backend repositories.

## 1. General Principles
- Follow the [SOLID principles](https://en.wikipedia.org/wiki/SOLID) for maintainable and scalable code.
- Adhere to established coding standards and style guides in each repository.
- Write clear, concise commit messages (use imperative mood, reference issue IDs).
- Ensure all code changes are covered by tests and pass existing test suites.
- Maintain comprehensive documentation for any new features, configuration changes, or workflows.

## 2. Repository Structure
- **Backend** (`irongrid_backend`): NestJS + Prisma + PostgreSQL
  - `/src/modules`: Domain modules (e.g., `quotations`, `customers`)
  - `/src/common`: Shared utilities, filters, guards, interceptors
  - `/prisma`: Schema, migrations, seed scripts
- **Frontend** (`irongrid_frontend`): Next.js + TypeScript + Tailwind CSS
  - `/components`: Reusable UI components
  - `/hooks`: Custom hooks for data-fetching and state management
  - `/pages` or `/app`: Next.js routing
  - `/styles`: Global and component-level styles

## 3. Setup & Development Workflow (Expanded for Monorepo)

This section provides a detailed, monorepo-specific workflow for contributing to IronGrid, which combines backend and frontend in a single repository. It includes steps for setting up the environment, developing features, testing, and deploying, with integration for key features like the live quotation builder and monitoring stack.

### Step-by-Step Workflow
1. **Fork and Branch**: Fork the repository and create a feature branch: `git checkout -b feature/your-feature`.
2. **Environment Setup**: 
   - Install global dependencies: Node.js 18+, npm, Git.
   - Use DevContainer or Docker Compose for consistent setup (run `docker compose up` from root if available).
   - Copy environment files: `cp backend/.env.example backend/.env` and `cp frontend/.env.local.example frontend/.env.local`, then configure variables.
3. **Dependency Installation**: Run `npm install` in the root or use monorepo tools if configured (e.g., TurboRepo or Nx); otherwise, install per directory: `cd backend && npm install`, then `cd ../frontend && npm install`.
4. **Code Development**:
   - For backend changes, use NestJS modules; for frontend, leverage Next.js components and hooks.
   - When working on features like the live quotation builder, ensure real-time updates (e.g., using WebSockets or React Query) are tested across both backend APIs and frontend UI.
   - Incorporate monitoring: Add Prometheus metrics in backend services and expose them; in frontend, log key events to Loki if applicable.
5. **Linting and Type Checking**: Run `npm run lint` and `npm run type-check` in affected directories to maintain code quality.
6. **Testing**:
   - Write unit tests for isolated components.
   - For integrated features like live quotation builder, run E2E tests covering GST calculations, INR formatting, and API calls (use Playwright or Cypress).
   - Include monitoring setup tests: Verify metric exports and alerting configurations.
   - Execute full test suite: `npm test` in backend, `npm run test` in frontend, or root-level scripts if defined.
7. **Review and CI/CD**: Open a PR against `develop`, ensure all CI checks pass (including linting, testing, and security scans), and address feedback.
8. **Deployment Preparation**: Containerize changes with Docker, update IaC (Terraform), and run smoke tests. For features like quotation builder, ensure PDF export works in staging.
9. **Merge and Monitor**: After merging, monitor production-like environments for issues, leveraging the observability stack (Prometheus, Grafana).

This workflow ensures seamless collaboration in the monorepo, with emphasis on key features for efficiency and reliability.

## 4. Coding Standards
### Backend
- Use **TypeScript** with strict type checking (`strict: true` in `tsconfig.json`).
- Format code with **Prettier** and enforce with **ESLint** (`npm run lint`).
- Follow NestJS style conventions: services for business logic, controllers for HTTP handlers.
- Use **class-validator** and **class-transformer** for DTO validation.
- Write database queries via **Prisma** with parameterized inputs.
- Handle errors with global exception filters, return consistent error DTOs.

### Frontend
- Use **TypeScript** and enforce types for props, state, and hooks.
- Style with **Tailwind CSS**; avoid inline styles and duplicate classes.
- Follow Next.js conventions for routing, API calls, and data fetching.
- Use **React Query** or **Zustand** for server state and caching.
- Ensure accessibility (WCAG 2.1 AA) in components (ARIA attributes, keyboard navigation).
- Format and lint with Prettier and ESLint.

## 5. Testing
- Aim for **90% code coverage** for unit tests.
- Use **Jest** for unit and integration tests.
- Use **Supertest** for backend API endpoint tests.
- Use **Playwright** for E2E tests covering critical user flows.
- Add meaningful test descriptions and clean up test data.

## 6. Documentation
- Update `README.md` with setup steps, environment variables, and common commands.
- Document new environment variables in `.env.example`.
- Add API documentation via Swagger (NestJS) and update as changes occur.
- For frontend, document component usage and props in JSDoc or Storybook.

## 7. Security
- Never commit secrets or credentials; use environment variables.
- Sanitize and validate all user inputs.
- Follow OWASP Top 10 guidelines for common security risks.
- Ensure HTTPS is enforced in production and secure cookie flags are set.

## 8. Performance
- Optimize database queries with proper indexing.
- Use caching (Redis) for frequently accessed data.
- Lazy-load frontend components and assets where appropriate.
- Monitor and fix performance regressions with APM tools.

## 9. Deployment
- Containerize services with production-ready Dockerfiles.
- Maintain IaC scripts (Terraform) for reproducible environments.
- Update CI/CD pipelines on changes to build, test, and deploy workflows.
- Perform smoke tests post-deployment to staging and production.

## 10. Communication
- Annotate significant decisions, trade-offs, and alternative approaches in PR descriptions.
- Use issues to track bugs, feature requests, and technical debt.
- Tag relevant teams (`@backend`, `@frontend`, `@infrastructure`, `@monitoring`) in discussions.

Thank you for helping make IronGrid robust, maintainable, and secure! 🎉