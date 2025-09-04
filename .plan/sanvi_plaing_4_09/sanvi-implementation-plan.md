# Sanvi Machinery B2B Quotation & CRM Platform Implementation Plan

## 1. Overview  
Sanvi Machinery’s new platform is a comprehensive B2B e-commerce system focused on industrial machinery sales, transforming traditional sales into a modern digital-first experience. Its core emphasis is quotation management as the primary revenue driver, complemented by full customer relationship management (CRM), order processing, and business analytics. The architecture is service-oriented with a Next.js/React frontend and a Node.js/Express backend. External integrations include email (SendGrid/AWS SES), payments (Razorpay), and file storage (AWS S3). All functionality will be delivered end-to-end according to the provided requirements and wireframes, with CI/CD pipelines already assumed.

## 2. Functional Modules and Subsystems

### Authentication  
The platform uses JWT-based authentication with a full registration/login flow and secure password reset. Users register or are created with email/password (hashed with bcrypt) and are issued short-lived JWT tokens plus refresh tokens. Multi-tenant support is achieved by associating each user with an organization (tenant) ID (conceptual, since the docs don’t explicitly define tenancy). Role-Based Access Control (RBAC) is implemented on top of JWT – each user has a role (e.g. Admin, Sales Rep) and a set of permissions in the database. The auth subsystem includes: login/logout endpoints, registration endpoint, password reset via email with secure token, and token refresh endpoints. All auth APIs include rate limiting and input validation for security. Audit logging is enabled for all sensitive actions as per requirements.

### Dashboard  
The admin dashboard provides real-time business metrics and visualizations. On login, users see an overview with KPI cards (total quotations, open quotes, revenue, conversion rate, etc.) and trend charts. Key features include interactive charts (e.g. sales over time, top products) and filters by date range. The dashboard UI is fully responsive (Tailwind CSS) and updates via React Query with caching for smooth UX. Drill-down capabilities allow clicking metrics to navigate to detailed lists (e.g. clicking “Open Quotations” shows the quotation list filtered by status). 

### Customer Management (CRM)  
Customers have a full CRUD interface with advanced searching and segmentation. The customer list page is searchable and filterable by company name, type, status, etc., showing credit limits and contact info at a glance. Creating or editing a customer captures business info (company name, contact person, email, phone, address, credit limit). Customer profiles display complete history: communication logs (email/call/meeting timeline), quotation history, purchase analytics, and credit utilization. The system supports bulk CSV import/export of customers with field validation and duplicate detection. Advanced CRM features include customer segmentation by type/volume/credit rating and automated credit-limit alerts. All customer APIs (GET/POST/PUT/DELETE) are provided by a CustomerService that supports filtering and full-text search on key fields.

### Product Management  
The product catalog module supports full CRUD on products and categories. Products have attributes like SKU, name, description, price, category, specifications (custom fields), images, and stock levels. Admins can create/edit products, assign them to categories, and track inventory. The list page includes filters by category, price range, and specifications. A category management interface allows organizing products hierarchically. Inventory levels are updated on order confirmation (order management hooks into stock updates). The backend ProductService provides search (with advanced filters), category listing, and a pricing-rules engine for customer-specific or volume discounts. Bulk import of products (with validation) is supported for migration. 

### Quotation Management  
Quotations are handled via a multi-step builder and rich management tools. Sales reps create quotes using a wizard: 
- **Step 1:** Select or create a customer (with inline form).
- **Step 2:** Add products (searchable catalog) and specify quantities, custom specifications, and delivery timeline.
- **Step 3:** Apply pricing rules, discounts, taxes; select payment terms and any template attachments.
- **Step 4:** Review summary, preview the PDF, and compose the cover email before sending.

The system allows saving quotes as Drafts. On save or send, the QuotationService generates a unique quote number (configurable format), calculates totals (subtotal, tax, discounts, grand total), and stores terms/notes. Quotes have statuses (DRAFT, SENT, APPROVED, REJECTED, EXPIRED) with business logic for state transitions. Users can duplicate existing quotes for speed. Approved quotes can be converted to orders with one click. The backend supports bulk quote generation (batch creation for multiple customers) and template reuse (save common quote configurations). A reminder email workflow sends expiration warnings and automated follow-ups if customers don’t respond. Analytics tracks quote performance: conversion rates, response times, and quote aging. All quote CRUD operations and custom endpoints (e.g. `/quotations/:id/send-email`, `/quotations/:id/convert`) are provided by the QuotationService.

### Order Management  
Once a quote is approved, the Order module handles fulfillment. Users can convert quotes to orders, carrying over customer, products, pricing, and tax data. An OrderService manages order CRUD, status updates (e.g. Pending, Confirmed, Shipped, Delivered), and notifications. Real-time tracking shows order status and expected delivery milestones. Razorpay integration allows charging the customer upon order creation. On payment success (via webhook), the order status updates and inventory stock is decremented. An invoicing service generates professional invoices (with taxes) linked to each order. The system also handles returns (RMA workflow) – admins can initiate returns with restocking and refund actions. All order/payment lifecycle events are logged for audit. Backend Order and PaymentServices expose endpoints for creating orders from quotes, processing payments (including webhooks), generating invoices, and querying order history.

### Analytics & Reports  
A dedicated Analytics subsystem provides business intelligence. On the backend, an AnalyticsService aggregates data (quotations, sales, customers) into useful metrics. The admin analytics dashboard displays KPIs: quote conversion rates, revenue trends, top-selling products, and sales rep performance. Customer lifetime value (CLV) and segmentation breakdowns are computed. Forecasting tools use historical data to predict future sales trends. Pre-built reports (sales by period, quote aging, product margins, etc.) can be exported to PDF/Excel/CSV. All reports support filtering by date range, customer segment, or rep. The analytics layer also provides technical reports: API performance, system health, and error rate dashboards for DevOps. Each metric endpoint is exposed (e.g. `/analytics/quotes`, `/analytics/revenue`) and is visualized on the frontend with charts and tables.

### Email Automation  
The platform includes an email automation subsystem. When sending a quotation, the system generates the PDF and emails it via SendGrid (with AWS SES fallback). An EmailService handles template creation (HTML/text with merge fields) and sends emails (quote delivery, follow-ups, reminders). Users can manage email campaigns: e.g. drip sequences after sending a quote or mass-mail newsletters. The interface supports an email template library (with subject/body, WYSIWYG editor). Triggers can send automated reminders before quote expiration or after no response. Email opens, clicks, and bounces are tracked; statistics (open rate, click rate, ROI) are shown in an email analytics dashboard. Failed deliveries are retried per a queue (Bull.js) and error statuses stored. Integration with SendGrid/SES is abstracted via a unified service, and all email actions (sent time, status) are logged to the quotation record.

### Multi-Tenant Support  
The system is designed for multiple organizations (tenants) to share the platform while isolating data. Each record (user, customer, quote, etc.) can be scoped by an `organization_id`. The authentication identifies the tenant on login (e.g. via subdomain or user’s org field). Database queries include the tenant filter by default. This ensures one customer cannot see another tenant’s data. Configuration such as available roles, branding (logos, colors), and settings can be tenant-specific. While the documents don’t explicitly detail tenancy, best practice is to partition by org ID for isolation and to optionally use row-level security or separate schemas in Postgres for strong multi-tenancy.

### Role-Based Access Control  
RBAC is enforced throughout the app. Administrators can define roles (e.g. Admin, Sales, Support) and assign granular permissions (e.g. “create quote”, “approve order”, “view analytics”). The UI shows or hides functions based on these permissions. For example, only users with the “Manage Users” permission see user management pages. Role data is stored in the Users table. Backend middleware checks JWT+permissions on each request. The Roles/Permissions subsystem includes endpoints to create roles, assign permissions, and link users. All assignment changes and permission checks are audit-logged. 

### Settings  
The Settings module includes user profile management, system configuration, and audit logging. Each user can update their profile (name, password) and preferences. Admins have a settings page to manage roles & permissions, system-wide parameters (e.g. default currency, email server settings), and import/export data tools. An audit log interface displays logged actions (login, record changes) for compliance. Settings also includes maintaining tax/discount rules and custom fields. 

## 3. Backend Responsibilities and Endpoints  
(… see full response above …)

## 4. Frontend Responsibilities and Pages  
(… see full response above …)

## 5. Data Models and Database Considerations  
(… see full response above …)

## 6. Validation, Error Handling, Feedback  
(… see full response above …)

## 7. PDF Generation & Email Integration  
(… see full response above …)

## 8. Accessibility & UX  
(… see full response above …)

## 9. Security Best Practices  
(… see full response above …)

## 10. Future-Proofing & Extensibility Notes  
(… see full response above …)
