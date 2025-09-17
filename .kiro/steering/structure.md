# Project Structure & Organization

## Monorepo Layout
```
irongrid/
├── backend/           # NestJS API server
├── frontend/          # Next.js web application
├── infrastructure/    # Terraform IaC and operational scripts
├── monitoring/        # Observability stack (Prometheus, Grafana, Loki)
├── docs/              # Project-level documentation
├── .plan/             # Roadmaps, implementation plans, wireframes
├── .github/           # CI/CD workflows and GitHub configurations
├── .kiro/             # Kiro AI assistant configurations and specs
└── .vscode/           # VS Code workspace settings
```

## Backend Structure (NestJS)
```
backend/
├── src/
│   ├── auth/          # Authentication module (JWT, guards, strategies)
│   ├── customers/     # Customer management module
│   ├── quotations/    # Quotation creation and management
│   ├── products/      # Product catalog and inventory
│   ├── orders/        # Order processing and fulfillment
│   ├── users/         # User management and roles
│   ├── files/         # File upload and management
│   ├── email/         # Email service and templates
│   ├── common/        # Shared utilities, decorators, filters
│   ├── config/        # Configuration modules
│   └── main.ts        # Application bootstrap
├── prisma/            # Database schema and migrations
├── test/              # E2E and integration tests
├── docker/            # Docker configurations
├── docs/              # API documentation and guides
└── uploads/           # Local file storage (development)
```

## Frontend Structure (Next.js App Router)
```
frontend/
├── app/               # Next.js App Router pages
│   ├── (auth)/        # Authentication pages (login, register)
│   ├── dashboard/     # Main dashboard and analytics
│   ├── customers/     # Customer management pages
│   ├── quotations/    # Quotation builder and management
│   ├── orders/        # Order processing pages
│   ├── products/      # Product catalog pages
│   └── layout.tsx     # Root layout component
├── components/        # Reusable UI components
│   ├── ui/            # Base UI components (buttons, inputs, etc.)
│   ├── forms/         # Form components with validation
│   ├── charts/        # Chart and visualization components
│   └── layout/        # Layout-specific components
├── features/          # Feature-specific components and logic
│   ├── auth/          # Authentication components
│   ├── customers/     # Customer-related components
│   ├── quotations/    # Quotation builder components
│   └── dashboard/     # Dashboard-specific components
├── lib/               # Utility functions and configurations
│   ├── api/           # API client and hooks
│   ├── utils/         # Helper functions
│   ├── validations/   # Zod schemas
│   └── constants/     # Application constants
├── public/            # Static assets
└── src/               # Additional source files (if needed)
```

## Key Conventions

### File Naming
- **Components**: PascalCase (e.g., `CustomerForm.tsx`)
- **Pages**: kebab-case (e.g., `customer-details/page.tsx`)
- **Utilities**: camelCase (e.g., `formatCurrency.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)

### Module Organization
- **Backend**: Feature-based modules with controllers, services, DTOs, and entities
- **Frontend**: Feature-based organization with co-located components and logic
- **Shared**: Common utilities and types in dedicated folders

### Import Conventions
- **Backend**: Use relative imports within modules, absolute for cross-module
- **Frontend**: Use `@/` alias for absolute imports from root
- **External**: Group external imports at the top, internal imports below

### API Structure
```
/api/v1/
├── /auth              # Authentication endpoints
├── /customers         # Customer CRUD operations
├── /quotations        # Quotation management
├── /products          # Product catalog
├── /orders            # Order processing
├── /users             # User management
└── /files             # File upload/download
```

### Database Schema Organization
- **Core Entities**: Users, Customers, Products, Quotations, Orders
- **Supporting**: Files, EmailTemplates, AuditLogs, Settings
- **Relationships**: Proper foreign keys and indexes
- **Migrations**: Sequential numbering with descriptive names

### Configuration Management
- **Environment Variables**: Separate files for different environments
- **Secrets**: Never commit sensitive data, use environment variables
- **Feature Flags**: Configuration-based feature toggles
- **API Versions**: Support for API versioning and backward compatibility

### Testing Structure
- **Backend**: Unit tests alongside source files, E2E tests in `/test`
- **Frontend**: Component tests alongside components, integration tests in `/tests`
- **Shared**: Test utilities and mocks in dedicated test folders

### Documentation Organization
- **API**: Swagger/OpenAPI documentation with examples
- **Components**: JSDoc comments for complex components
- **Features**: README files for major features
- **Setup**: Environment setup and deployment guides