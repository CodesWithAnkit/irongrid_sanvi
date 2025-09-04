Sanvi Machinery B2B Quotation & CRM Platform Implementation Plan
1. Overview

Sanvi Machinery’s new platform is a comprehensive B2B e-commerce system focused on industrial machinery sales, transforming traditional sales into a modern digital-first experience. Its core emphasis is quotation management as the primary revenue driver, complemented by full customer relationship management (CRM), order processing, and business analytics. The architecture is service-oriented with a Next.js/React frontend and a Node.js/Express backend. External integrations include email (SendGrid/AWS SES), payments (Razorpay), and file storage (AWS S3). All functionality will be delivered end-to-end according to the provided requirements and wireframes, with CI/CD pipelines already assumed.

2. Functional Modules and Subsystems
Authentication

The platform uses JWT-based authentication with a full registration/login flow and secure password reset. Users register or are created with email/password (hashed with bcrypt) and are issued short-lived JWT tokens plus refresh tokens. Multi-tenant support is achieved by associating each user with an organization (tenant) ID (conceptual, since the docs don’t explicitly define tenancy). Role-Based Access Control (RBAC) is implemented on top of JWT – each user has a role (e.g. Admin, Sales Rep) and a set of permissions in the database. The auth subsystem includes: login/logout endpoints, registration endpoint, password reset via email with secure token, and token refresh endpoints. All auth APIs include rate limiting and input validation for security. Audit logging is enabled for all sensitive actions as per requirements.

Dashboard

The admin dashboard provides real-time business metrics and visualizations. On login, users see an overview with KPI cards (total quotations, open quotes, revenue, conversion rate, etc.) and trend charts. Key features include interactive charts (e.g. sales over time, top products) and filters by date range. The dashboard UI is fully responsive (Tailwind CSS) and updates via React Query with caching for smooth UX. Drill-down capabilities allow clicking metrics to navigate to detailed lists (e.g. clicking “Open Quotations” shows the quotation list filtered by status).

Customer Management (CRM)

Customers have a full CRUD interface with advanced searching and segmentation. The customer list page is searchable and filterable by company name, type, status, etc., showing credit limits and contact info at a glance. Creating or editing a customer captures business info (company name, contact person, email, phone, address, credit limit). Customer profiles display complete history: communication logs (email/call/meeting timeline), quotation history, purchase analytics, and credit utilization. The system supports bulk CSV import/export of customers with field validation and duplicate detection. Advanced CRM features include customer segmentation by type/volume/credit rating and automated credit-limit alerts. All customer APIs (GET/POST/PUT/DELETE) are provided by a CustomerService that supports filtering and full-text search on key fields.

Product Management

The product catalog module supports full CRUD on products and categories. Products have attributes like SKU, name, description, price, category, specifications (custom fields), images, and stock levels. Admins can create/edit products, assign them to categories, and track inventory. The list page includes filters by category, price range, and specifications. A category management interface allows organizing products hierarchically. Inventory levels are updated on order confirmation (order management hooks into stock updates). The backend ProductService provides search (with advanced filters), category listing, and a pricing-rules engine for customer-specific or volume discounts. Bulk import of products (with validation) is supported for migration.

Quotation Management

Quotations are handled via a multi-step builder and rich management tools. Sales reps create quotes using a wizard:

Step 1: Select or create a customer (with inline form).

Step 2: Add products (searchable catalog) and specify quantities, custom specifications, and delivery timeline.

Step 3: Apply pricing rules, discounts, taxes; select payment terms and any template attachments.

Step 4: Review summary, preview the PDF, and compose the cover email before sending.

The system allows saving quotes as Drafts. On save or send, the QuotationService generates a unique quote number (configurable format), calculates totals (subtotal, tax, discounts, grand total), and stores terms/notes. Quotes have statuses (DRAFT, SENT, APPROVED, REJECTED, EXPIRED) with business logic for state transitions. Users can duplicate existing quotes for speed. Approved quotes can be converted to orders with one click. The backend supports bulk quote generation (batch creation for multiple customers) and template reuse (save common quote configurations). A reminder email workflow sends expiration warnings and automated follow-ups if customers don’t respond. Analytics tracks quote performance: conversion rates, response times, and quote aging. All quote CRUD operations and custom endpoints (e.g. /quotations/:id/send-email, /quotations/:id/convert) are provided by the QuotationService.

Order Management

Once a quote is approved, the Order module handles fulfillment. Users can convert quotes to orders, carrying over customer, products, pricing, and tax data. An OrderService manages order CRUD, status updates (e.g. Pending, Confirmed, Shipped, Delivered), and notifications. Real-time tracking shows order status and expected delivery milestones. Razorpay integration allows charging the customer upon order creation. On payment success (via webhook), the order status updates and inventory stock is decremented. An invoicing service generates professional invoices (with taxes) linked to each order. The system also handles returns (RMA workflow) – admins can initiate returns with restocking and refund actions. All order/payment lifecycle events are logged for audit. Backend Order and PaymentServices expose endpoints for creating orders from quotes, processing payments (including webhooks), generating invoices, and querying order history.

Analytics & Reports

A dedicated Analytics subsystem provides business intelligence. On the backend, an AnalyticsService aggregates data (quotations, sales, customers) into useful metrics. The admin analytics dashboard displays KPIs: quote conversion rates, revenue trends, top-selling products, and sales rep performance. Customer lifetime value (CLV) and segmentation breakdowns are computed. Forecasting tools use historical data to predict future sales trends. Pre-built reports (sales by period, quote aging, product margins, etc.) can be exported to PDF/Excel/CSV. All reports support filtering by date range, customer segment, or rep. The analytics layer also provides technical reports: API performance, system health, and error rate dashboards for DevOps. Each metric endpoint is exposed (e.g. /analytics/quotes, /analytics/revenue) and is visualized on the frontend with charts and tables.

Email Automation

The platform includes an email automation subsystem. When sending a quotation, the system generates the PDF and emails it via SendGrid (with AWS SES fallback). An EmailService handles template creation (HTML/text with merge fields) and sends emails (quote delivery, follow-ups, reminders). Users can manage email campaigns: e.g. drip sequences after sending a quote or mass-mail newsletters. The interface supports an email template library (with subject/body, WYSIWYG editor). Triggers can send automated reminders before quote expiration or after no response. Email opens, clicks, and bounces are tracked; statistics (open rate, click rate, ROI) are shown in an email analytics dashboard. Failed deliveries are retried per a queue (Bull.js) and error statuses stored. Integration with SendGrid/SES is abstracted via a unified service, and all email actions (sent time, status) are logged to the quotation record.

Multi-Tenant Support

The system is designed for multiple organizations (tenants) to share the platform while isolating data. Each record (user, customer, quote, etc.) can be scoped by an organization_id. The authentication identifies the tenant on login (e.g. via subdomain or user’s org field). Database queries include the tenant filter by default. This ensures one customer cannot see another tenant’s data. Configuration such as available roles, branding (logos, colors), and settings can be tenant-specific. While the documents don’t explicitly detail tenancy, best practice is to partition by org ID for isolation and to optionally use row-level security or separate schemas in Postgres for strong multi-tenancy.

Role-Based Access Control

RBAC is enforced throughout the app. Administrators can define roles (e.g. Admin, Sales, Support) and assign granular permissions (e.g. “create quote”, “approve order”, “view analytics”). The UI shows or hides functions based on these permissions. For example, only users with the “Manage Users” permission see user management pages. Role data is stored in the Users table (see DB schema). Backend middleware checks JWT+permissions on each request. The Roles/Permissions subsystem includes endpoints to create roles, assign permissions, and link users. All assignment changes and permission checks are audit-logged.

Settings

The Settings module includes user profile management, system configuration, and audit logging. Each user can update their profile (name, password) and preferences. Admins have a settings page to manage roles & permissions, system-wide parameters (e.g. default currency, email server settings), and import/export data tools. An audit log interface displays logged actions (login, record changes) for compliance. Settings also includes maintaining tax/discount rules and custom fields.

3. Backend Responsibilities and Endpoints

The backend consists of modular services (Quotation, Customer, Product, Order, Email, Analytics, PDF, File). Each service exposes RESTful endpoints (following versioning). Key endpoints include (v1 shown for brevity):

# Authentication
POST /api/v1/login            # Authenticate user
POST /api/v1/register         # Create new user/organization
POST /api/v1/token/refresh    # Refresh JWT
POST /api/v1/password-reset   # Request password reset email
PUT  /api/v1/password-reset   # Confirm password reset

# Users & Roles
GET    /api/v1/users             # List or filter users
POST   /api/v1/users             # Create user
GET    /api/v1/users/:id         # Get user profile
PUT    /api/v1/users/:id         # Update user/roles
DELETE /api/v1/users/:id         # Delete user
GET    /api/v1/roles             # List roles/permissions
POST   /api/v1/roles             # Create role with permissions
PUT    /api/v1/roles/:id         # Update role

# Customers (CRM)
GET    /api/v1/customers         # List/filter customers
POST   /api/v1/customers         # Create customer
GET    /api/v1/customers/:id     # Customer details (incl. history)
PUT    /api/v1/customers/:id     # Update customer
DELETE /api/v1/customers/:id     # Delete customer
POST   /api/v1/customers/import  # Bulk import via CSV

# Products
GET    /api/v1/products          # List/filter products
POST   /api/v1/products          # Create product
GET    /api/v1/products/:id      # Product details
PUT    /api/v1/products/:id      # Update product
DELETE /api/v1/products/:id      # Delete product
GET    /api/v1/categories        # List categories
POST   /api/v1/categories        # Create category

# Quotations
GET    /api/v1/quotations          # List/filter quotations
POST   /api/v1/quotations          # Create quotation
GET    /api/v1/quotations/:id      # Quotation details
PUT    /api/v1/quotations/:id      # Update quotation
DELETE /api/v1/quotations/:id      # Delete/Archive quotation
POST   /api/v1/quotations/:id/duplicate  # Duplicate quotation
POST   /api/v1/quotations/:id/send-email # Send email with quote PDF
POST   /api/v1/quotations/:id/convert    # Convert to order

# Orders
GET    /api/v1/orders             # List orders
GET    /api/v1/orders/:id         # Order details
POST   /api/v1/orders             # Create order (from quote)
PUT    /api/v1/orders/:id         # Update status or cancel order
POST   /api/v1/orders/:id/pay     # Initiate payment / webhook

# Analytics
GET    /api/v1/analytics/metrics   # Business metrics (revenue, conversion)
GET    /api/v1/analytics/sales     # Sales report data
GET    /api/v1/analytics/customers # Customer analytics (CLV, segments)

# Email & Templates
POST   /api/v1/emails/send         # Send an ad-hoc email
GET    /api/v1/email-templates     # List email templates
POST   /api/v1/email-templates     # Create email template
PUT    /api/v1/email-templates/:id # Update template
DELETE /api/v1/email-templates/:id # Delete template
POST   /api/v1/emails/campaigns    # Run email campaign (drip sequence)

# Files/Uploads
POST   /api/v1/uploads             # Upload file (customer CSV, product CSV, attachments)
GET    /api/v1/files/:id          # Retrieve file (secure S3 link)


Each endpoint includes request validation (Joi/Zod) and permission checks. All APIs adhere to RESTful design with consistent JSON responses. Swagger/OpenAPI docs describe each endpoint (automatically generated). API versioning is built-in (e.g. /api/v1/…) for future backward-compatible enhancements.

4. Frontend Responsibilities and Pages

The Next.js/React frontend consists of responsive pages and components for each module. Key pages include:

Authentication Pages: Login and Registration forms with client-side validation. Password Reset flow (email input, token form). A protected route wrapper redirects unauthenticated users to login.

Dashboard: Home page displaying KPI cards and charts (using Chart.js or similar). Real-time update via React Query, and skeleton loaders during fetch. Interactive filters (date range pickers).

Customer Management: Customer List with a table of customers (search box, filters, sortable columns). Customer Profile page showing details, contact info, purchase/quote history, and interaction timeline. UI to segment customers (tags/categories). Bulk import/export modals.

Product Management: Product List page with category sidebar and filters (price range, specs). Product Details page with editable fields (name, price, stock, images) and inventory thresholds. Category Manager page to add/edit categories.

Quotation Builder: A multi-step wizard component. Tabs/steps for Customer Selection, Product Configuration, Pricing & Terms, and Review. Each step has its own sub-component with form fields. Customer Selection Step includes a searchable dropdown (with “Add New Customer” button). Product Step allows adding multiple products (with quantity and custom spec fields). Pricing Step calculates totals on-the-fly. Review Step shows a quote summary and PDF preview. UI includes progress bar and next/back navigation. Validation (using Zod schemas) ensures each step’s data is valid before proceeding.

Quotation List/Detail: Quotation List shows all quotes in a table with status badges (Draft/Sent/etc.), date, total, and actions (View, Duplicate, Archive). Filters by status/date/customer. Quotation Detail page displays full quote information, attached PDF, conversation threads, and buttons to send/re-send email or convert to order.

Order Pages: Order List and Order Detail pages. The list shows recent orders with status. Order detail shows line items, shipping status, payment status, and a link to the invoice PDF. Admin actions like “Mark Shipped” or “Issue Refund” are available based on user role.

Analytics & Reports: Dedicated analytics dashboard pages with charts and tables. Components include metrics cards, trend graphs, and a report builder interface. Users can filter by date/customer. A Reports page allows exporting data (CSV/PDF).

Email Campaigns: Pages for composing and managing email templates and campaigns. Template editor with fields (subject/body preview). Campaign page to configure triggers (e.g. send quote follow-ups every X days) and view campaign statistics (open/click rates).

Settings: Profile Settings for updating name/password. Admin Settings pages for managing user accounts, roles, permissions, system parameters, and viewing audit logs.

Reusable components are built for forms (Input, Select, Textarea, FileUpload with drag-drop, etc.) with consistent styling. Loading and error states are handled with spinners and toast notifications.

5. Data Models and Database Considerations

The PostgreSQL database stores the core entities. Key tables (with example fields) are:

-- Users (stores login, roles, and tenant info)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR NOT NULL UNIQUE,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL,            -- e.g. 'Admin', 'Sales', etc.
  permissions JSONB,               -- optional granular perms
  organization_id INT NOT NULL,     -- tenant identifier
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Customers
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR NOT NULL,
  contact_person VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  credit_limit NUMERIC,
  customer_type VARCHAR,
  organization_id INT NOT NULL,    -- tenant scope
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR UNIQUE,
  name VARCHAR NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category_id INT REFERENCES categories(id),
  specifications JSONB,           -- custom spec fields
  images TEXT[],                  -- URLs or S3 keys
  inventory_count INT DEFAULT 0,
  organization_id INT NOT NULL,    -- tenant scope
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Quotations
CREATE TABLE quotations (
  id SERIAL PRIMARY KEY,
  quotation_number VARCHAR UNIQUE,
  customer_id INT REFERENCES customers(id),
  created_by_user_id INT REFERENCES users(id),
  status VARCHAR CHECK (status IN ('DRAFT','SENT','APPROVED','REJECTED','EXPIRED')),
  subtotal NUMERIC,
  tax_amount NUMERIC,
  discount_amount NUMERIC,
  total_amount NUMERIC,
  valid_until DATE,
  terms_conditions TEXT,
  notes TEXT,
  pdf_url TEXT,
  email_sent_at TIMESTAMP,
  customer_viewed_at TIMESTAMP,
  customer_responded_at TIMESTAMP,
  organization_id INT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Quotation Items (line items of a quote)
CREATE TABLE quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INT REFERENCES quotations(id),
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC NOT NULL,
  discount_pct NUMERIC,
  discount_amount NUMERIC,
  line_total NUMERIC,
  custom_specifications JSONB,
  delivery_timeline VARCHAR
);


These schemas (derived from the design document) ensure relational integrity. Indexes are added on frequently queried fields (e.g. email, quotation_number, foreign keys) for performance. The organization_id column on each table (not shown in the design doc) enforces tenant data isolation. Reference tables (categories, roles, permissions) are similarly scoped. Data access uses parameterized queries and ORM models (e.g. Sequelize or TypeORM) with validation on fields. The system includes migration scripts and seed data loaders.

6. Validation, Error Handling, Feedback

Both frontend and backend perform thorough validation. Frontend forms use Zod/React Hook Form schemas to validate inputs in real-time (showing inline error messages). Backend endpoints validate payloads with Joi or Zod as well; on error, a consistent JSON error format is returned. Error responses include user-friendly messages (e.g. “Email format invalid”, “Insufficient permissions”) and an error code. The UI catches API errors and displays toasts or form error hints with a “retry” or “back” option. Network or server errors show generic fallback messages with a link to retry. Loading states (spinners or skeletons) give immediate feedback on actions. All validation rules (e.g. required fields, number ranges) match the wireframes. Server-side validation catches edge cases as fallback. Form auto-save is implemented so data is not lost on navigation away. Error cases (like duplicate quote number, or failed payment) trigger clear alerts. Accessibility considerations (ARIA labels, focus management) are included in error feedback as part of UX compliance.

7. PDF Generation & Email Integration

A dedicated PDF Service generates quotation documents. Using Puppeteer or a templating library, it renders a branded HTML template into PDF. The template includes company logo, quote number, line items table, totals, and terms. Generated PDFs are optimized for size and stored on AWS S3 (secure URLs). The quotation record stores the pdf_url for retrieval. The Email Service sends these PDFs as attachments via SendGrid (with AWS SES fallback). It uses defined templates to merge customer and quote data into the email body. An email queue (Bull.js) manages sending with retry/backoff on failure and logs delivery status. Bounce and open/click tracking webhooks update the quotation record (e.g. email_sent_at, customer_viewed_at) for analytics. Email templates support dynamic fields (customer name, quote details) and can be edited in the UI. Emails about quoting (initial quote, follow-ups, expirations) and order confirmations/invoices are handled by this integration.

8. Accessibility & UX

The UI is fully responsive and mobile-friendly. Layouts (admin sidebar, forms, tables) adapt to small screens with collapsible navigation. All interactive elements are keyboard-accessible. Visual hierarchy is clear: primary actions (e.g. “Send Quote”, “Approve”) have distinct colors. Components use accessible color contrast and ARIA labels. Loading spinners and skeletons indicate progress; success/failure toasts provide feedback. Form fields have placeholder and helper text. Real-time validation shows inline errors. Error pages display a friendly message and recovery options (“Go back”, “Home”). Icons and status badges (with text labels) communicate state. Charts and tables are optimized for readability on any device. The design follows WCAG 2.1 AA standards (per testing plan). Tooltips and modals improve usability (e.g. explain status codes or limits). Overall UX is intuitive: consistent navigation (breadcrumbs, side menu) and prompt feedback for all actions.

9. Security Best Practices

Security is paramount. Authentication uses JWT with HTTPS and secure cookie flags; refresh tokens are stored securely (HTTP-only cookie or local storage with care). Passwords are hashed (bcrypt). All sensitive data (passwords, tokens) are never sent in cleartext. HTTPS/TLS is enforced on all endpoints. RBAC is enforced at middleware: each endpoint checks user role/permissions from the token. Multi-tenant isolation (via organization_id) ensures data cannot leak between tenants. Input validation and parameterized queries protect against injections. Rate limiting and request throttling (via API Gateway) mitigate brute-force attacks. CORS and CSP headers are correctly set. Audit logs record all admin and security-related events. Sensitive fields (e.g. credit card info) are never stored on our servers; we rely on Razorpay for payments. We encrypt data at rest (Postgres) and in transit (TLS). Regular vulnerability scans (Snyk/Sentry integration) are in place. Additionally, API versioning and strong typing (OpenAPI/Swagger) help catch mismatches early.

10. Future-Proofing & Extensibility Notes

The architecture is modular and scalable. All APIs are versioned (e.g. /api/v1/...) so future changes remain backward compatible. The service-based design allows adding new services (e.g. a chat bot or warranty service) without disrupting others. The use of a React/Next.js frontend with a clear component hierarchy (layouts, forms, dashboards) makes it easy to add pages or UI features later. Database schema uses JSONB fields (for permissions, specifications, etc.) to allow flexible extensions. Future business rules (new quote states, custom fields) can be added via configuration or DB schema changes with migrations. The system supports horizontal scaling: stateless API servers behind a load balancer, Redis for sessions/cache, and PostgreSQL for data (with read replicas if needed). CDN (CloudFront) caches static assets. CI/CD pipelines (GitHub Actions) automate testing and rolling deployments (zero-downtime). Documentation (Swagger + developer guides) and containerization (Docker) ensure maintainability. Overall, the plan aligns with all given requirements and is ready for iterative growth and additional integrations.

Sources: The above plan is based on the provided design and requirements documents and detailed implementation tasks.