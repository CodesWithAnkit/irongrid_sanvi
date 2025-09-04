Sprint 1 Development Log

Date: 2025-08-24 Scope: Backend Foundation + Quotations MVP

Completed

Auth: JWT cookie-based, guards, validation pipes
DB: Prisma schema, seed, migrations
Customers: CRUD with DTO validation
Quotations: CRUD with totals and numbering
PDF:
pdf-lib A4 generator: POST /api/quotations/:id/pdf
HTML → PDF option: POST /api/quotations/:id/pdf?format=html (uses Puppeteer+Handlebars if installed)
Email:
Endpoint POST /api/quotations/:id/email (gracefully skipped until SMTP configured)
Security & DX: Helmet, CORS, Swagger, cookie-parser, Prisma generate, docker compose
Files: File download endpoint GET /api/files/:id (JWT protected)
In Progress

Template polish (logos, header/footer, signatures via COMPANY_LOGO_URL/COMPANY_SIGN_NAME)
File delivery flow for generated PDFs
Pending

Email provider (Nodemailer/SES) with templates
Tests: unit + e2e for Auth/Customers/Quotations
Staging environment and deployment pipeline
API Endpoints (key)

Auth: POST /api/auth/login, POST /api/auth/register, POST /api/auth/refresh, POST /api/auth/logout
Customers: GET/POST /api/customers, GET/PATCH/DELETE /api/customers/:id
Quotations: GET/POST /api/quotations, GET/PATCH/DELETE /api/quotations/:id
PDFs: POST /api/quotations/:id/pdf (add ?format=html for HTML → PDF)
Email: POST /api/quotations/:id/email
Files: GET /api/files/:id
Docs: GET /api/docs
Runbook

Env: ALLOWED_ORIGINS=http://localhost:3000,[https://irongrid.com](https://irongrid.com),[https://m.irongrid.com](https://m.irongrid.com)
Start: npm run prisma:generate && npm run start:dev
Optional deps: npm i puppeteer handlebars nodemailer
Next Steps

Implement email once SMTP is ready
Tests + staging rollout