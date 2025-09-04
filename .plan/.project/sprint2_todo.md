🚀 Sanvi Machinery — Phase 2 Development Plan
🎯 Objectives

Phase 2 focuses on business-critical features beyond infra setup:

Dynamic Pricing Engine (AI-assisted)

Multi-location Inventory Management

Enhanced Order Processing

Communication & Engagement System

Analytics & Reporting

Mobile App (sales + customer portal)

🗂️ Workstreams
1. Dynamic Pricing Engine

Backend (NestJS + Prisma)

Pricing rules table (conditions, priority, status, audit log).

Rule evaluation service (scoring engine).

API endpoints: CRUD for rules, preview calculation, simulation.

Frontend (Next.js + Zustand/React Query)

UI for creating & editing rules.

Visualization: Revenue impact, applied orders (use Nivo charts).

Audit logs visible to admins.

2. Inventory Management (Multi-location)

Backend

Schema: Warehouse, stock levels, transfers, reorder thresholds.

Services: Low-stock alerts, transfer workflows.

Frontend

Dashboard with location-level stock & value (already mocked in phase2-dashboard.tsx
).

Filtering by location.

Actions: Transfer, reorder, adjust stock.

3. Order Processing Enhancements

Backend

Add workflow states: Received → Credit Check → Allocation → Payment → Fulfillment.

Track efficiency & avg times (metrics table).

Frontend

Funnel visualization (drop-offs, avg stage time).

Order detail view with processing timeline.

4. Communication System

Backend

Integrate Twilio/WhatsApp API + SMTP service.

Templates for automated messages (order confirmed, payment link).

Frontend

Dashboard: response rates, avg response times.

Settings for channels (enable/disable, set templates).

5. Analytics & Reporting

Backend

Pre-aggregated reporting tables (sales by month, margin trends).

Expose via REST or GraphQL.

Frontend

Advanced analytics page (use Nivo charts).

Download CSV/PDF option.

6. Mobile App (Phase 2 Preview)

Stack: React Native (Expo).

Sales team features: quotation builder, customer CRM, product catalog.

Customer portal: quotation viewer, order tracking, notifications.

Backend: Same APIs, extend auth with JWT + refresh tokens.

⚙️ Engineering Process

Requirements First (document before coding — avoids re-prompts).

SOLID Principles (FE components = UI-only, hooks = logic, BE services = business logic).

Testing:

Unit tests (Jest, Vitest).

API tests with Supertest.

E2E smoke tests (Playwright).

CI/CD:

Phase 2 features merged only after PR checklist compliance.

Deploy to staging env → UAT → Production.

📅 Suggested Timeline
Sprint	Scope
Sprint 2	Dynamic Pricing Engine + Inventory foundations
Sprint 3