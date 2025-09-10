---
description: Development rules for IronGrid project, refined with business logic and coding standards from project specs
---

# Development Rules for IronGrid Project

This workflow defines the refined development rules for the IronGrid monorepo, incorporating business logic from specifications (e.g., quotation management, order processing) and coding standards from contribution guidelines. It ensures high-quality, consistent development aligned with project requirements.

## Business Logic Rules
- **Quotation Management**: Handle GST (9% SGST + 9% CGST), INR formatting, and amount-to-words conversion. Ensure real-time updates, dynamic item management, and integration with order conversion workflows. Validate all inputs for accuracy in pricing and customer data.
- **Authentication and Access Control**: Use JWT with role-based permissions; implement refresh tokens and secure password handling. Enforce access rules for sensitive operations, such as quotation approvals.
- **Data Integration and Management**: Sync frontend and backend for features like customer segmentation and analytics. Use caching (Redis) for performance and ensure data migration tools handle validation and duplicates.
- **Monitoring and Analytics**: Expose metrics via Prometheus for backend services and log events in frontend; integrate with Grafana for dashboards. Include analytics for sales performance, customer lifetime value, and revenue forecasting.

## Coding Standards Rules
- **General**: Enforce TypeScript with strict mode, SOLID principles, and automated linting (ESLint/Prettier). Follow RESTful API conventions and ensure 90% test coverage.
- **Backend (NestJS)**: Use class-validator for DTOs, parameterized Prisma queries, and global error handling. Implement API versioning and security middleware.
- **Frontend (Next.js)**: Adhere to WCAG 2.1 for accessibility, use React Query for state management, and style with Tailwind CSS. Validate forms with Zod and handle real-time updates efficiently.
- **Testing**: Use Jest for unit tests, Supertest for API testing, and Playwright for E2E tests. Include performance and security testing in CI/CD pipelines.

## Steps to Enforce Rules
1. Review business logic in code and specs (e.g., `.kiro/specs`) during development to ensure alignment.
2. Run coding standard checks (e.g., `npm run lint`) and automated tests in all PRs.
3. Document changes in PRs, referencing requirements from `.kiro/requirements.md`.
4. Validate rules through code reviews, focusing on security and performance metrics.
5. Update monitoring dashboards to track adherence and resolve issues proactively.
