# Sanvi Machinery Complete System - Design Document

## Overview

The Sanvi Machinery Complete System is a comprehensive B2B e-commerce platform designed to transform traditional industrial machinery sales into a modern, digital-first experience. The system focuses on quotation management as the primary revenue driver while providing complete customer relationship management, order processing, and business analytics capabilities.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  Next.js 13+ Application                                       │
│  ├── Admin Dashboard (React + TypeScript)                      │
│  ├── Customer Portal (Public quotation viewing)                │
│  ├── Mobile-Responsive UI (Tailwind CSS)                       │
│  └── Real-time Updates (WebSocket/Server-Sent Events)          │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                             │
├─────────────────────────────────────────────────────────────────┤
│  ├── Authentication & Authorization (JWT)                      │
│  ├── Rate Limiting & Security                                  │
│  ├── Request/Response Logging                                  │
│  └── API Versioning (v1, v2)                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                           │
├─────────────────────────────────────────────────────────────────┤
│  Node.js + Express.js Application                              │
│  ├── Quotation Service (Core business logic)                   │
│  ├── Customer Service (CRM functionality)                      │
│  ├── Product Service (Catalog management)                      │
│  ├── Order Service (Order processing)                          │
│  ├── Email Service (Communication automation)                  │
│  ├── Analytics Service (Business intelligence)                 │
│  ├── PDF Service (Document generation)                         │
│  └── File Service (Document management)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  ├── PostgreSQL (Primary database)                             │
│  ├── Redis (Caching & session storage)                         │
│  ├── AWS S3 (File storage)                                     │
│  └── Elasticsearch (Search & analytics)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Integrations                         │
├─────────────────────────────────────────────────────────────────┤
│  ├── SendGrid (Email delivery)                                 │
│  ├── Razorpay (Payment processing)                             │
│  ├── AWS SES (Email fallback)                                  │
│  ├── Sentry (Error monitoring)                                 │
│  └── CloudFront (CDN)                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Database Architecture

```sql
-- Core Business Entities
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   Customers     │    │    Products     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ email           │    │ company_name    │    │ sku             │
│ password_hash   │    │ contact_person  │    │ name            │
│ role            │    │ email           │    │ description     │
│ permissions     │    │ phone           │    │ price           │
│ created_at      │    │ address         │    │ category_id     │
│ updated_at      │    │ credit_limit    │    │ specifications  │
└─────────────────┘    │ customer_type   │    │ images          │
                       │ created_at      │    │ created_at      │
                       └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Quotations                               │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                         │
│ quotation_number (UNIQUE)                                       │
│ customer_id (FK)                                                │
│ created_by_user_id (FK)                                         │
│ status (ENUM: DRAFT, SENT, APPROVED, REJECTED, EXPIRED)        │
│ subtotal                                                        │
│ tax_amount                                                      │
│ discount_amount                                                 │
│ total_amount                                                    │
│ valid_until                                                     │
│ terms_conditions                                                │
│ notes                                                           │
│ pdf_url                                                         │
│ email_sent_at                                                   │
│ customer_viewed_at                                              │
│ customer_responded_at                                           │
│ created_at                                                      │
│ updated_at                                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Quotation Items                              │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                         │
│ quotation_id (FK)                                               │
│ product_id (FK)                                                 │
│ quantity                                                        │
│ unit_price                                                      │
│ discount_percentage                                             │
│ discount_amount                                                 │
│ line_total                                                      │
│ custom_specifications                                           │
│ delivery_timeline                                               │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Frontend Components

#### 1. Admin Dashboard Components

```typescript
// Layout Components
interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
}

interface SidebarProps {
  sections: SidebarSection[];
  activeRoute: string;
  onNavigate: (route: string) => void;
}

// Business Components
interface QuotationBuilderProps {
  initialData?: Partial<QuotationFormData>;
  onSave: (data: QuotationFormData) => Promise<void>;
  onCancel: () => void;
  customers: Customer[];
  products: Product[];
}

interface CustomerManagementProps {
  customers: Customer[];
  onCreateCustomer: (customer: CustomerFormData) => Promise<void>;
  onUpdateCustomer: (id: string, customer: Partial<CustomerFormData>) => Promise<void>;
  onDeleteCustomer: (id: string) => Promise<void>;
}

interface AnalyticsDashboardProps {
  metrics: BusinessMetrics;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}
```

#### 2. Form Components

```typescript
// Multi-step Quotation Builder
interface QuotationStepProps {
  data: QuotationFormData;
  onUpdate: (updates: Partial<QuotationFormData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isValid: boolean;
}

// Customer Selection Step
interface CustomerSelectionStepProps extends QuotationStepProps {
  customers: Customer[];
  onCreateCustomer: (customer: CustomerFormData) => Promise<Customer>;
}

// Product Configuration Step
interface ProductConfigurationStepProps extends QuotationStepProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (productId: string, quantity: number, customizations?: CustomSpecification[]) => void;
  onRemoveProduct: (itemId: string) => void;
}

// Pricing and Terms Step
interface PricingTermsStepProps extends QuotationStepProps {
  pricingRules: PricingRule[];
  termsTemplates: TermsTemplate[];
  onCalculatePricing: () => Promise<PricingCalculation>;
}
```

### Backend Service Interfaces

#### 1. Core Services

```typescript
// Quotation Service
interface QuotationService {
  create(data: CreateQuotationDto, userId: string): Promise<Quotation>;
  findAll(filters: QuotationFilters, pagination: Pagination): Promise<PaginatedResult<Quotation>>;
  findById(id: string): Promise<Quotation>;
  update(id: string, data: UpdateQuotationDto): Promise<Quotation>;
  delete(id: string): Promise<void>;
  generatePDF(id: string): Promise<string>;
  sendEmail(id: string, emailOptions: EmailOptions): Promise<void>;
  convertToOrder(id: string): Promise<Order>;
  duplicate(id: string): Promise<Quotation>;
  getAnalytics(filters: AnalyticsFilters): Promise<QuotationAnalytics>;
}

// Customer Service
interface CustomerService {
  create(data: CreateCustomerDto): Promise<Customer>;
  findAll(filters: CustomerFilters, pagination: Pagination): Promise<PaginatedResult<Customer>>;
  findById(id: string): Promise<Customer>;
  update(id: string, data: UpdateCustomerDto): Promise<Customer>;
  delete(id: string): Promise<void>;
  getInteractionHistory(id: string): Promise<CustomerInteraction[]>;
  calculateLifetimeValue(id: string): Promise<number>;
  segmentCustomers(criteria: SegmentationCriteria): Promise<CustomerSegment[]>;
  importCustomers(file: Express.Multer.File): Promise<ImportResult>;
}

// Product Service
interface ProductService {
  create(data: CreateProductDto): Promise<Product>;
  findAll(filters: ProductFilters, pagination: Pagination): Promise<PaginatedResult<Product>>;
  findById(id: string): Promise<Product>;
  update(id: string, data: UpdateProductDto): Promise<Product>;
  delete(id: string): Promise<void>;
  search(query: string, filters: SearchFilters): Promise<Product[]>;
  getCategories(): Promise<Category[]>;
  updateInventory(id: string, quantity: number): Promise<void>;
  getPricingRules(productId: string, customerId?: string): Promise<PricingRule[]>;
}
```

#### 2. Integration Services

```typescript
// Email Service
interface EmailService {
  sendQuotation(quotationId: string, recipientEmail: string, options?: EmailOptions): Promise<void>;
  sendFollowUp(quotationId: string, templateId: string): Promise<void>;
  sendExpiryReminder(quotationId: string): Promise<void>;
  trackDelivery(messageId: string): Promise<EmailDeliveryStatus>;
  createTemplate(template: EmailTemplate): Promise<string>;
  scheduleEmail(emailData: ScheduledEmail): Promise<void>;
}

// Payment Service
interface PaymentService {
  createPaymentLink(orderId: string, amount: number): Promise<string>;
  verifyPayment(paymentId: string, signature: string): Promise<boolean>;
  processRefund(paymentId: string, amount?: number): Promise<RefundResult>;
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  handleWebhook(payload: any, signature: string): Promise<void>;
}

// File Service
interface FileService {
  uploadFile(file: Express.Multer.File, folder: string): Promise<FileUploadResult>;
  generateSignedUrl(key: string, expiresIn?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
  generatePDF(template: string, data: any): Promise<Buffer>;
  optimizeImage(file: Buffer, options: ImageOptimizationOptions): Promise<Buffer>;
}
```

### API Endpoints

#### 1. Quotation Management APIs

```typescript
// Quotation CRUD Operations
POST   /api/v1/quotations                    // Create quotation
GET    /api/v1/quotations                    // List quotations with filters
GET    /api/v1/quotations/:id                // Get quotation details
PUT    /api/v1/quotations/:id                // Update quotation
DELETE /api/v1/quotations/:id                // Delete quotation

// Quotation Actions
POST   /api/v1/quotations/:id/send           // Send quotation via email
POST   /api/v1/quotations/:id/duplicate      // Duplicate quotation
POST   /api/v1/quotations/:id/convert        // Convert to order
GET    /api/v1/quotations/:id/pdf            // Generate PDF
POST   /api/v1/quotations/:id/approve        // Approve quotation (workflow)

// Public Quotation Access
GET    /api/v1/quotations/public/:token      // View quotation (customer)
POST   /api/v1/quotations/public/:token/respond // Customer response

// Quotation Templates
GET    /api/v1/quotations/templates          // List templates
POST   /api/v1/quotations/templates          // Create template
PUT    /api/v1/quotations/templates/:id      // Update template
DELETE /api/v1/quotations/templates/:id      // Delete template
```

#### 2. Customer Management APIs

```typescript
// Customer CRUD Operations
POST   /api/v1/customers                     // Create customer
GET    /api/v1/customers                     // List customers with filters
GET    /api/v1/customers/:id                 // Get customer details
PUT    /api/v1/customers/:id                 // Update customer
DELETE /api/v1/customers/:id                 // Delete customer

// Customer Analytics
GET    /api/v1/customers/:id/analytics       // Customer analytics
GET    /api/v1/customers/:id/quotations      // Customer quotation history
GET    /api/v1/customers/:id/orders          // Customer order history
GET    /api/v1/customers/:id/interactions    // Interaction history

// Customer Management
POST   /api/v1/customers/import              // Bulk import customers
GET    /api/v1/customers/segments            // Customer segments
POST   /api/v1/customers/:id/interactions    // Log interaction
PUT    /api/v1/customers/:id/credit-limit    // Update credit limit
```

#### 3. Analytics and Reporting APIs

```typescript
// Business Analytics
GET    /api/v1/analytics/dashboard           // Dashboard metrics
GET    /api/v1/analytics/quotations          // Quotation analytics
GET    /api/v1/analytics/customers           // Customer analytics
GET    /api/v1/analytics/products            // Product performance
GET    /api/v1/analytics/revenue             // Revenue analytics

// Reports
GET    /api/v1/reports/sales                 // Sales reports
GET    /api/v1/reports/conversion            // Conversion reports
GET    /api/v1/reports/customer-lifetime     // CLV reports
POST   /api/v1/reports/custom               // Custom report generation
GET    /api/v1/reports/:id/export           // Export report
```

## Data Models

### Core Data Models

```typescript
// User Model
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Customer Model
interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  customerType: CustomerType;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Model
interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: Category;
  basePrice: number;
  currency: Currency;
  specifications: ProductSpecification[];
  images: string[];
  inventoryCount?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Quotation Model
interface Quotation {
  id: string;
  quotationNumber: string;
  customer: Customer;
  createdBy: User;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  validUntil: Date;
  termsConditions: string;
  notes?: string;
  pdfUrl?: string;
  emailSentAt?: Date;
  customerViewedAt?: Date;
  customerRespondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Business Logic Models

```typescript
// Pricing Calculation
interface PricingCalculation {
  subtotal: number;
  discounts: DiscountApplication[];
  taxes: TaxApplication[];
  shipping: ShippingCalculation;
  total: number;
  breakdown: PricingBreakdown[];
}

// Email Template
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: TemplateVariable[];
  category: EmailCategory;
  isActive: boolean;
}

// Analytics Data
interface BusinessMetrics {
  quotationMetrics: {
    totalQuotations: number;
    conversionRate: number;
    averageValue: number;
    responseTime: number;
  };
  customerMetrics: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    customerLifetimeValue: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyGrowth: number;
    forecastedRevenue: number;
    topProducts: ProductRevenue[];
  };
}
```

## Error Handling

### Error Response Format

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Error Codes
enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  BUSINESS_LOGIC_ERROR = 'BUSINESS_LOGIC_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR'
}
```

### Error Handling Strategy

```typescript
// Global Error Handler
class GlobalErrorHandler {
  static handle(error: Error, req: Request, res: Response, next: NextFunction) {
    const errorResponse = this.formatError(error);
    this.logError(error, req);
    this.notifyIfCritical(error);
    res.status(errorResponse.statusCode).json(errorResponse);
  }

  private static formatError(error: Error): ApiErrorResponse {
    // Format different error types consistently
  }

  private static logError(error: Error, req: Request) {
    // Log to monitoring service (Sentry, CloudWatch)
  }

  private static notifyIfCritical(error: Error) {
    // Send alerts for critical errors
  }
}
```

## Testing Strategy

### Testing Pyramid

```typescript
// Unit Tests (70% of tests)
describe('QuotationService', () => {
  describe('create', () => {
    it('should create quotation with valid data', async () => {
      const quotationData = createMockQuotationData();
      const result = await quotationService.create(quotationData, 'user-id');
      expect(result.quotationNumber).toMatch(/QUO-\d{4}-\d{6}/);
    });

    it('should throw error for invalid customer', async () => {
      const invalidData = { ...createMockQuotationData(), customerId: 'invalid' };
      await expect(quotationService.create(invalidData, 'user-id'))
        .rejects.toThrow('Customer not found');
    });
  });
});

// Integration Tests (20% of tests)
describe('Quotation API Integration', () => {
  it('should create and retrieve quotation', async () => {
    const createResponse = await request(app)
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validQuotationData)
      .expect(201);

    const getResponse = await request(app)
      .get(`/api/v1/quotations/${createResponse.body.data.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(getResponse.body.data.quotationNumber).toBeDefined();
  });
});

// E2E Tests (10% of tests)
describe('Complete Quotation Flow', () => {
  it('should create, send, and track quotation', async ({ page }) => {
    await page.goto('/admin/quotations/create');
    await page.selectOption('[data-testid="customer-select"]', 'customer-1');
    await page.click('[data-testid="add-product"]');
    await page.selectOption('[data-testid="product-select"]', 'product-1');
    await page.fill('[data-testid="quantity"]', '5');
    await page.click('[data-testid="create-quotation"]');
    
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Test email sending
    await page.click('[data-testid="send-email"]');
    await expect(page.locator('[data-testid="email-sent"]')).toBeVisible();
  });
});
```

### Performance Testing

```javascript
// Load Testing Configuration
module.exports = {
  config: {
    target: 'https://api.sanvi-machinery.com',
    phases: [
      { duration: 60, arrivalRate: 10 },   // Warm up
      { duration: 300, arrivalRate: 50 },  // Sustained load
      { duration: 120, arrivalRate: 100 }, // Peak load
      { duration: 60, arrivalRate: 10 }    // Cool down
    ],
    processor: './test-processor.js'
  },
  scenarios: [
    {
      name: 'Create Quotation Flow',
      weight: 40,
      flow: [
        { post: { url: '/api/v1/auth/login', json: { email: '{{ email }}', password: '{{ password }}' } } },
        { post: { url: '/api/v1/quotations', json: '{{ quotationData }}' } },
        { get: { url: '/api/v1/quotations/{{ quotationId }}' } }
      ]
    },
    {
      name: 'Browse Quotations',
      weight: 60,
      flow: [
        { get: { url: '/api/v1/quotations?page=1&limit=20' } },
        { get: { url: '/api/v1/quotations?status=SENT&page=1&limit=10' } }
      ]
    }
  ]
};
```

This comprehensive design document provides the technical foundation for implementing the complete Sanvi Machinery B2B e-commerce platform, covering all aspects from architecture to testing strategies.