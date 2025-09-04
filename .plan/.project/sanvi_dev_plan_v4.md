# Sanvi Machinery - Complete Development Plan & System Design

## Executive Summary

Transform Sanvi Machinery from a simple product catalog into a comprehensive B2B e-commerce platform with intelligent quotation management using the PERN stack (PostgreSQL, Express.js, React.js, Node.js).

**Key Objectives:**
- Primary: Build sophisticated quotation generation system
- Secondary: Implement B2B customer management with CRM
- Tertiary: Create scalable inventory and order management

---

## System Architecture & Technology Stack

### 🏗️ **Core Technology Stack (PERN)**

```mermaid
graph TB
    A[React.js Frontend] --> B[Express.js API Gateway]
    B --> C[Node.js Business Logic]
    C --> D[PostgreSQL Database]
    
    E[Admin Panel - React] --> B
    F[Customer Portal - React] --> B
    G[Mobile App - React Native] --> B
    
    H[Redis Cache] --> B
    I[File Storage - AWS S3] --> B
    J[Email Service - SendGrid] --> B
    K[Payment Gateway - Razorpay] --> B
    L[PDF Generation - Puppeteer] --> C
```

### 📋 **Detailed Technology Specifications**

#### Frontend Stack
```javascript
// React.js Ecosystem
{
  "frontend": {
    "framework": "React 18+ with TypeScript",
    "styling": "Tailwind CSS + Headless UI",
    "stateManagement": "Redux Toolkit + RTK Query",
    "routing": "React Router v6",
    "forms": "React Hook Form + Zod validation",
    "ui": "Custom components + Radix UI primitives",
    "charts": "Recharts for analytics",
    "pdf": "React-PDF for document preview"
  }
}
```

#### Backend Stack
```javascript
// Node.js + Express Ecosystem
{
  "backend": {
    "runtime": "Node.js 18+ LTS",
    "framework": "Express.js with TypeScript",
    "database": "PostgreSQL 15+ with Prisma ORM",
    "authentication": "JWT + bcrypt",
    "validation": "Zod schemas",
    "fileUpload": "Multer + AWS S3",
    "email": "SendGrid API",
    "pdf": "Puppeteer",
    "cache": "Redis",
    "testing": "Jest + Supertest"
  }
}
```

#### Infrastructure & DevOps
```javascript
{
  "infrastructure": {
    "hosting": "AWS EC2 / DigitalOcean / Railway",
    "database": "AWS RDS PostgreSQL / Neon",
    "cdn": "CloudFront / Cloudinary",
    "monitoring": "Winston + Morgan logging",
    "deployment": "Docker + GitHub Actions",
    "ssl": "Let's Encrypt / Cloudflare",
    "backup": "Automated daily PostgreSQL backups"
  }
}
```

---

## Database Design (PostgreSQL)

### 🗄️ **Core Tables Schema**

#### 1. Users & Authentication
```sql
-- Users table (Admin, Sales, Customers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'customer',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role AS ENUM ('admin', 'sales', 'customer');
```

#### 2. Companies & Customer Management
```sql
-- Companies (B2B customers)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    company_type company_type NOT NULL,
    industry VARCHAR(100),
    gst_number VARCHAR(15),
    pan_number VARCHAR(10),
    website VARCHAR(255),
    established_year INTEGER,
    employee_count VARCHAR(20),
    annual_turnover VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE company_type AS ENUM ('proprietorship', 'partnership', 'private_limited', 'public_limited', 'llp');

-- Customer profiles (linked to users and companies)
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id),
    customer_number VARCHAR(20) UNIQUE NOT NULL,
    customer_type customer_type NOT NULL DEFAULT 'retail',
    customer_segment customer_segment NOT NULL DEFAULT 'retail',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    available_credit DECIMAL(15,2) DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    assigned_sales_rep UUID REFERENCES users(id),
    source customer_source DEFAULT 'website',
    priority customer_priority DEFAULT 'medium',
    status customer_status DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE customer_type AS ENUM ('individual', 'company', 'government', 'ngo');
CREATE TYPE customer_segment AS ENUM ('retail', 'wholesale', 'distributor', 'oem', 'reseller');
CREATE TYPE customer_source AS ENUM ('website', 'referral', 'advertisement', 'trade_show', 'cold_call');
CREATE TYPE customer_priority AS ENUM ('low', 'medium', 'high', 'vip');
CREATE TYPE customer_status AS ENUM ('active', 'inactive', 'blocked', 'prospect');
```

#### 3. Products & Inventory
```sql
-- Product categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    description TEXT,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    category_id UUID REFERENCES categories(id),
    brand VARCHAR(100),
    model VARCHAR(100),
    
    -- Pricing
    base_price DECIMAL(15,2) NOT NULL,
    cost_price DECIMAL(15,2),
    min_order_quantity INTEGER DEFAULT 1,
    max_order_quantity INTEGER,
    
    -- Product details
    specifications JSONB,
    images JSONB, -- Array of image URLs
    documents JSONB, -- Array of document URLs
    
    -- Business logic
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_customizable BOOLEAN DEFAULT false,
    lead_time VARCHAR(50),
    warranty VARCHAR(100),
    
    -- SEO
    seo_title VARCHAR(255),
    seo_description TEXT,
    keywords TEXT[],
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    order_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory management
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    warehouse_location VARCHAR(100) DEFAULT 'main',
    quantity_total INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_total - quantity_reserved) STORED,
    reorder_point INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(product_id, warehouse_location)
);
```

#### 4. Quotations (Core Feature)
```sql
-- Quotations
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customer_profiles(id),
    
    -- Customer info (for non-registered customers)
    customer_info JSONB NOT NULL,
    
    -- Financial summary
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    shipping_charges DECIMAL(15,2) DEFAULT 0,
    other_charges DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    
    -- Terms and validity
    valid_until DATE NOT NULL,
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    delivery_terms TEXT,
    warranty_terms TEXT,
    custom_terms TEXT[],
    
    -- Status and workflow
    status quotation_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    parent_quotation_id UUID REFERENCES quotations(id),
    
    -- Workflow tracking
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    responded_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Customer response
    customer_response JSONB,
    
    -- Conversion tracking
    converted_to_order UUID,
    converted_at TIMESTAMP,
    
    -- Attachments and communications
    attachments JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'rejected', 'expired', 'converted', 'revised');

-- Quotation items
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id UUID REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    -- Product details (snapshot)
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    specifications JSONB,
    
    -- Pricing and quantity
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    
    -- Delivery details
    delivery_time VARCHAR(50),
    delivery_location VARCHAR(255),
    
    -- Additional info
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Orders & Payments
```sql
-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id UUID REFERENCES quotations(id),
    customer_id UUID REFERENCES customer_profiles(id) NOT NULL,
    
    -- Order details
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    
    -- Status
    status order_status DEFAULT 'pending',
    
    -- Addresses
    billing_address JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    
    -- Payment
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending',
    paid_amount DECIMAL(15,2) DEFAULT 0,
    due_amount DECIMAL(15,2),
    
    -- Shipping
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Notes
    customer_notes TEXT,
    internal_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'partial');
```

---

## API Architecture & Routes

### 🚀 **RESTful API Design**

#### Authentication Routes
```javascript
// auth.routes.js
POST   /api/auth/register         // Customer registration
POST   /api/auth/login            // User login
POST   /api/auth/logout           // User logout
POST   /api/auth/refresh          // Refresh JWT token
POST   /api/auth/forgot-password  // Password reset request
POST   /api/auth/reset-password   // Password reset
POST   /api/auth/verify-email     // Email verification
GET    /api/auth/profile          // Get user profile
PUT    /api/auth/profile          // Update user profile
```

#### Quotation Management Routes
```javascript
// quotations.routes.js
POST   /api/quotations                    // Create quotation
GET    /api/quotations                    // List quotations (with filters)
GET    /api/quotations/:id                // Get specific quotation
PUT    /api/quotations/:id                // Update quotation
DELETE /api/quotations/:id                // Delete quotation
POST   /api/quotations/:id/duplicate      // Duplicate quotation
POST   /api/quotations/:id/send           // Send quotation to customer
POST   /api/quotations/:id/approve        // Customer approval
GET    /api/quotations/public/:token      // Public quotation view
POST   /api/quotations/public/:token/respond // Customer response
POST   /api/quotations/:id/convert-order  // Convert to order
GET    /api/quotations/:id/pdf            // Generate PDF
POST   /api/quotations/bulk-send          // Bulk send quotations
GET    /api/quotations/analytics          // Quotation analytics
```

#### Customer Management Routes
```javascript
// customers.routes.js
POST   /api/customers                     // Create customer
GET    /api/customers                     // List customers
GET    /api/customers/:id                 // Get customer details
PUT    /api/customers/:id                 // Update customer
DELETE /api/customers/:id                 // Delete customer
GET    /api/customers/:id/quotations      // Customer quotations
GET    /api/customers/:id/orders          // Customer orders
GET    /api/customers/:id/analytics       // Customer analytics
POST   /api/customers/import              // Import customers from CSV
```

#### Product Management Routes
```javascript
// products.routes.js
POST   /api/products                      // Create product
GET    /api/products                      // List products
GET    /api/products/:id                  // Get product details
PUT    /api/products/:id                  // Update product
DELETE /api/products/:id                  // Delete product
GET    /api/products/search               // Advanced search
POST   /api/products/bulk-upload          // Bulk product upload
GET    /api/products/:id/inventory        // Inventory details
PUT    /api/products/:id/inventory        // Update inventory
```

---

## Frontend Architecture

### 🎨 **React Application Structure**

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorBoundary.tsx
│   ├── forms/
│   │   ├── FormField.tsx
│   │   ├── FormValidation.tsx
│   │   └── FileUpload.tsx
│   ├── quotations/
│   │   ├── QuotationBuilder/
│   │   │   ├── index.tsx
│   │   │   ├── CustomerStep.tsx
│   │   │   ├── ProductStep.tsx
│   │   │   ├── PricingStep.tsx
│   │   │   └── ReviewStep.tsx
│   │   ├── QuotationList.tsx
│   │   ├── QuotationCard.tsx
│   │   └── QuotationDetails.tsx
│   ├── customers/
│   │   ├── CustomerList.tsx
│   │   ├── CustomerForm.tsx
│   │   └── CustomerDetails.tsx
│   └── products/
│       ├── ProductCatalog.tsx
│       ├── ProductCard.tsx
│       └── ProductDetails.tsx
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ForgotPassword.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Analytics.tsx
│   │   └── Reports.tsx
│   ├── quotations/
│   │   ├── QuotationsList.tsx
│   │   ├── CreateQuotation.tsx
│   │   └── QuotationView.tsx
│   ├── customers/
│   │   ├── CustomersList.tsx
│   │   └── CustomerProfile.tsx
│   └── products/
│       ├── ProductsList.tsx
│       └── ProductManagement.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useQuotations.ts
│   ├── useCustomers.ts
│   └── useProducts.ts
├── store/
│   ├── index.ts
│   ├── authSlice.ts
│   ├── quotationsSlice.ts
│   ├── customersSlice.ts
│   └── productsSlice.ts
├── services/
│   ├── api.ts
│   ├── auth.service.ts
│   ├── quotation.service.ts
│   ├── customer.service.ts
│   └── product.service.ts
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   ├── validation.ts
│   └── formatting.ts
└── types/
    ├── auth.types.ts
    ├── quotation.types.ts
    ├── customer.types.ts
    └── product.types.ts
```

### 📱 **Key Frontend Components**

#### Quotation Builder Component
```typescript
// components/quotations/QuotationBuilder/index.tsx
import React, { useState } from 'react';
import { useQuotationBuilder } from '@/hooks/useQuotationBuilder';

interface QuotationBuilderProps {
  mode: 'create' | 'edit' | 'duplicate';
  quotationId?: string;
}

export const QuotationBuilder: React.FC<QuotationBuilderProps> = ({
  mode,
  quotationId
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const {
    quotation,
    updateQuotation,
    saveQuotation,
    sendQuotation,
    loading,
    error
  } = useQuotationBuilder(mode, quotationId);

  const steps = [
    { title: 'Customer Details', component: CustomerStep },
    { title: 'Select Products', component: ProductStep },
    { title: 'Pricing & Terms', component: PricingStep },
    { title: 'Review & Send', component: ReviewStep }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="quotation-builder">
      {/* Step Progress Indicator */}
      <div className="steps-indicator">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`step ${index === currentStep ? 'active' : ''} ${
              index < currentStep ? 'completed' : ''
            }`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-title">{step.title}</div>
          </div>
        ))}
      </div>

      {/* Current Step Component */}
      <div className="step-content">
        {React.createElement(steps[currentStep].component, {
          quotation,
          updateQuotation,
          onNext: handleNext,
          onPrevious: handlePrevious
        })}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="btn btn-secondary"
        >
          Previous
        </button>
        
        {currentStep === steps.length - 1 ? (
          <div className="final-actions">
            <button
              onClick={() => saveQuotation('draft')}
              className="btn btn-outline"
              disabled={loading}
            >
              Save as Draft
            </button>
            <button
              onClick={() => sendQuotation()}
              className="btn btn-primary"
              disabled={loading}
            >
              Send Quotation
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            className="btn btn-primary"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## Backend Architecture

### 🔧 **Express.js Server Structure**

```
server/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── quotation.controller.js
│   │   ├── customer.controller.js
│   │   └── product.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── upload.middleware.js
│   │   └── rateLimiting.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── quotation.routes.js
│   │   ├── customer.routes.js
│   │   └── product.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── quotation.service.js
│   │   ├── email.service.js
│   │   ├── pdf.service.js
│   │   └── payment.service.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Product.js
│   │   └── Quotation.js
│   ├── utils/
│   │   ├── database.js
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   └── validators.js
│   └── app.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── Dockerfile
└── docker-compose.yml
```

### 📦 **Core Backend Services**

#### Quotation Service
```javascript
// services/quotation.service.js
const { PrismaClient } = require('@prisma/client');
const PDFService = require('./pdf.service');
const EmailService = require('./email.service');

class QuotationService {
  constructor() {
    this.prisma = new PrismaClient();
    this.pdfService = new PDFService();
    this.emailService = new EmailService();
  }

  async createQuotation(quotationData, userId) {
    try {
      // Generate quotation number
      const quotationNumber = await this.generateQuotationNumber();
      
      // Create quotation with items
      const quotation = await this.prisma.quotation.create({
        data: {
          ...quotationData,
          quotationNumber,
          createdBy: userId,
          items: {
            create: quotationData.items
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          customer: true
        }
      });

      return quotation;
    } catch (error) {
      throw new Error(`Failed to create quotation: ${error.message}`);
    }
  }

  async sendQuotation(quotationId, emailConfig) {
    try {
      const quotation = await this.getQuotationById(quotationId);
      
      // Generate PDF
      const pdfBuffer = await this.pdfService.generateQuotationPDF(quotation);
      
      // Send email with PDF attachment
      await this.emailService.sendQuotationEmail({
        to: quotation.customerInfo.email,
        quotation,
        pdfAttachment: pdfBuffer,
        ...emailConfig
      });

      // Update quotation status
      await this.prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: 'sent',
          sentAt: new Date()
        }
      });

      return { success: true, message: 'Quotation sent successfully' };
    } catch (error) {
      throw new Error(`Failed to send quotation: ${error.message}`);
    }
  }

  async generateQuotationNumber() {
    const year = new Date().getFullYear();
    const lastQuotation = await this.prisma.quotation.findFirst({
      where: {
        quotationNumber: {
          startsWith: `QUO-${year}-`
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    let sequence = 1;
    if (lastQuotation) {
      const lastSequence = parseInt(lastQuotation.quotationNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `QUO-${year}-${sequence.toString().padStart(3, '0')}`;
  }

  async getQuotationById(id) {
    return await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        customer: true,
        createdBy: true
      }
    });
  }

  async convertQuotationToOrder(quotationId) {
    try {
      const quotation = await this.getQuotationById(quotationId);
      
      if (!quotation) {
        throw new Error('Quotation not found');
      }

      if (quotation.status !== 'approved') {
        throw new Error('Quotation must be approved before conversion');
      }

      // Create order from quotation
      const order = await this.prisma.order.create({
        data: {
          orderNumber: await this.generateOrderNumber(),
          quotationId: quotationId,
          customerId: quotation.customerId,
          subtotal: quotation.subtotal,
          taxAmount: quotation.taxAmount,
          totalAmount: quotation.totalAmount,
          billingAddress: quotation.customerInfo.address,
          shippingAddress: quotation.customerInfo.address,
          items: {
            create: quotation.items.map(item => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.lineTotal
            }))
          }
        },
        include: {
          items: true
        }
      });

      // Update quotation status
      await this.prisma.quotation.update({
        where: { id: quotationId },
        data: {
          status: 'converted',
          convertedToOrder: order.id,
          convertedAt: new Date()
        }
      });

      return order;
    } catch (error) {
      throw new Error(`Failed to convert quotation: ${error.message}`);
    }
  }
}

module.exports = QuotationService;
```

---

## Development Phases & Timeline

### 🚀 **Phase 1: Foundation (8-10 weeks)**

#### Week 1-2: Project Setup & Database
```bash
# Project initialization
npx create-react-app sanvi-frontend --template typescript
mkdir sanvi-backend && cd sanvi-backend
npm init -y
npm install express prisma @prisma/client bcryptjs jsonwebtoken

# Database setup
npx prisma init
# Configure PostgreSQL connection
# Create database schemas
# Run migrations
npx prisma migrate dev --name init
```

**Deliverables:**
- [x] PostgreSQL database with complete schema
- [x] Prisma ORM setup with migrations
- [x] Basic Express.js server with middleware
- [x] JWT authentication system
- [x] React frontend with routing setup

#### Week 3-4: Authentication & User Management
```javascript
// Key features to implement:
const authFeatures = {
  userRegistration: 'Customer and admin registration',
  jwtLogin: 'Secure login with JWT tokens',
  roleBasedAuth: 'Admin, sales, customer roles',
  passwordReset: 'Email-based password reset',
  profileManagement: 'User profile CRUD operations'
};
```

#### Week 5-6: Quotation System Backend
```javascript
// Quotation API endpoints
const quotationEndpoints = [
  'POST /api/quotations - Create quotation',
  'GET /api/quotations - List with filters',
  'GET /api/quotations/:id - Get details', 
  'PUT /api/quotations/:id - Update quotation',
  'POST /api/quotations/:id/send - Send to customer',
  'POST /api/quotations/:id/pdf - Generate PDF'
];
```

#### Week 7-8: Quotation System Frontend
```typescript
// React components to build:
interface QuotationComponents {
  QuotationBuilder: 'Multi-step quotation creation';
  QuotationList: 'Quotation management dashboard';
  CustomerSelection: 'Customer search and selection';
  ProductSelection: 'Product catalog integration';
  PricingCalculator: 'Dynamic pricing calculation';
  PDFPreview: 'Quotation PDF preview';
}
```

#### Week 9-10: Customer Management
```javascript
// Customer management features:
const customerFeatures = {
  customerProfiles: 'Detailed customer information',
  companyManagement: 'B2B company profiles',
  creditManagement: 'Credit limits and terms',
  segmentation: 'Customer type categorization',
  communicationHistory: 'Track all interactions'
};
```

### 🎯 **Phase 2: Advanced Features (6-8 weeks)**

#### Week 11-12: Product Management Enhancement
```javascript
// Advanced product features:
const productFeatures = {
  categoryManagement: 'Hierarchical product categories',
  bulkProductUpload: 'CSV/Excel product import',
  inventoryTracking: 'Multi-location inventory',
  productVariants: 'Customizable specifications',
  priceManagement: 'Tiered pricing rules',
  productAnalytics: 'Sales performance tracking'
};
```

#### Week 13-14: Order Processing & Payment Integration
```javascript
// Order management system:
const orderFeatures = {
  quoteToOrder: 'Seamless quotation conversion',
  orderTracking: 'Real-time order status updates',
  paymentGateway: 'Razorpay integration for payments',
  invoiceGeneration: 'Automated invoice creation',
  shippingIntegration: 'Logistics partner APIs',
  orderAnalytics: 'Sales performance metrics'
};
```

#### Week 15-16: Communication & Automation
```javascript
// Communication systems:
const communicationFeatures = {
  emailAutomation: 'SendGrid integration for notifications',
  smsIntegration: 'SMS alerts for order updates',
  whatsappAPI: 'WhatsApp Business API integration',
  followUpReminders: 'Automated quotation follow-ups',
  customerPortal: 'Self-service customer dashboard',
  notificationCenter: 'Centralized notification management'
};
```

#### Week 17-18: Analytics & Reporting
```javascript
// Business intelligence features:
const analyticsFeatures = {
  salesDashboard: 'Real-time sales metrics',
  quotationAnalytics: 'Conversion rate tracking',
  customerInsights: 'Customer behavior analysis',
  productPerformance: 'Best-selling products',
  revenueForecasting: 'Sales prediction algorithms',
  customReports: 'Exportable business reports'
};
```

### 🚀 **Phase 3: Optimization & Mobile (4-6 weeks)**

#### Week 19-20: Performance Optimization
```javascript
// Performance improvements:
const optimizations = {
  databaseOptimization: 'Query optimization and indexing',
  caching: 'Redis caching for frequent queries',
  imageOptimization: 'CloudFront CDN integration',
  codeOptimization: 'Bundle splitting and lazy loading',
  searchOptimization: 'ElasticSearch for product search',
  apiOptimization: 'Response time improvements'
};
```

#### Week 21-22: Mobile Application (React Native)
```javascript
// Mobile app features:
const mobileFeatures = {
  authentication: 'Secure mobile login',
  quotationManagement: 'Create and manage quotations',
  productCatalog: 'Browse products offline',
  customerManagement: 'Customer profiles and history',
  orderTracking: 'Real-time order updates',
  pushNotifications: 'Order and quotation alerts'
};
```

#### Week 23-24: Testing & Deployment
```javascript
// Testing and deployment:
const testingPhase = {
  unitTesting: 'Jest for component testing',
  integrationTesting: 'API endpoint testing',
  e2eTesting: 'Cypress for user workflows',
  performanceTesting: 'Load testing with Artillery',
  securityTesting: 'Security audit and penetration testing',
  productionDeployment: 'AWS/DigitalOcean deployment'
};
```

---

## System Implementation Details

### 🔧 **Development Environment Setup**

#### Prerequisites Installation
```bash
# Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Redis (for caching)
sudo apt-get install redis-server

# Git and development tools
sudo apt-get install git curl wget
```

#### Project Initialization
```bash
# Create project structure
mkdir sanvi-machinery
cd sanvi-machinery

# Frontend setup (React with TypeScript)
npx create-react-app frontend --template typescript
cd frontend
npm install @reduxjs/toolkit react-redux react-router-dom
npm install tailwindcss @headlessui/react @heroicons/react
npm install react-hook-form zod @hookform/resolvers
npm install recharts react-pdf axios
cd ..

# Backend setup (Express with TypeScript)
mkdir backend
cd backend
npm init -y
npm install express cors helmet morgan
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken
npm install nodemailer puppeteer multer
npm install joi express-rate-limit
npm install --save-dev @types/node @types/express typescript ts-node nodemon

# Initialize Prisma
npx prisma init
cd ..
```

#### Database Configuration
```javascript
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Environment configuration
// backend/.env
DATABASE_URL="postgresql://username:password@localhost:5432/sanvi_machinery"
JWT_SECRET="your-super-secret-jwt-key"
SENDGRID_API_KEY="your-sendgrid-api-key"
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
S3_BUCKET_NAME="sanvi-machinery-files"
```

### 🏗️ **Core Implementation Components**

#### 1. Authentication Middleware
```javascript
// backend/src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };
```

#### 2. Quotation Controller
```javascript
// backend/src/controllers/quotation.controller.js
const QuotationService = require('../services/quotation.service');
const { quotationValidationSchema } = require('../utils/validators');

class QuotationController {
  constructor() {
    this.quotationService = new QuotationService();
  }

  createQuotation = async (req, res) => {
    try {
      // Validate request body
      const { error, value } = quotationValidationSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: error.details 
        });
      }

      // Create quotation
      const quotation = await this.quotationService.createQuotation(
        value, 
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Quotation created successfully',
        data: quotation
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to create quotation',
        message: error.message
      });
    }
  };

  getQuotations = async (req, res) => {
    try {
      const { page = 1, limit = 10, status, customerId } = req.query;
      
      const quotations = await this.quotationService.getQuotations({
        page: parseInt(page),
        limit: parseInt(limit),
        filters: { status, customerId },
        userId: req.user.id,
        userRole: req.user.role
      });

      res.json({
        success: true,
        data: quotations.data,
        pagination: {
          currentPage: quotations.currentPage,
          totalPages: quotations.totalPages,
          totalCount: quotations.totalCount
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to fetch quotations',
        message: error.message
      });
    }
  };

  sendQuotation = async (req, res) => {
    try {
      const { id } = req.params;
      const { emailSubject, emailMessage, cc, bcc } = req.body;

      const result = await this.quotationService.sendQuotation(id, {
        emailSubject,
        emailMessage,
        cc,
        bcc,
        sentBy: req.user.id
      });

      res.json({
        success: true,
        message: 'Quotation sent successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to send quotation',
        message: error.message
      });
    }
  };

  generateQuotationPDF = async (req, res) => {
    try {
      const { id } = req.params;
      
      const pdfBuffer = await this.quotationService.generateQuotationPDF(id);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=quotation-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        error: 'Failed to generate PDF',
        message: error.message
      });
    }
  };
}

module.exports = new QuotationController();
```

#### 3. React Quotation Builder Hook
```typescript
// frontend/src/hooks/useQuotationBuilder.ts
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { quotationService } from '../services/quotation.service';
import { Quotation, QuotationItem } from '../types/quotation.types';

interface UseQuotationBuilderReturn {
  quotation: Partial<Quotation>;
  items: QuotationItem[];
  loading: boolean;
  error: string | null;
  updateQuotation: (updates: Partial<Quotation>) => void;
  addItem: (item: Omit<QuotationItem, 'id'>) => void;
  updateItem: (itemId: string, updates: Partial<QuotationItem>) => void;
  removeItem: (itemId: string) => void;
  calculateTotals: () => void;
  saveQuotation: (status: 'draft' | 'sent') => Promise<void>;
  sendQuotation: (emailConfig: EmailConfig) => Promise<void>;
}

export const useQuotationBuilder = (
  mode: 'create' | 'edit' | 'duplicate',
  quotationId?: string
): UseQuotationBuilderReturn => {
  const dispatch = useDispatch();
  const [quotation, setQuotation] = useState<Partial<Quotation>>({
    customerInfo: {},
    items: [],
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    status: 'draft',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    paymentTerms: 'Net 30',
    customTerms: []
  });

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing quotation for edit/duplicate mode
  useEffect(() => {
    if ((mode === 'edit' || mode === 'duplicate') && quotationId) {
      loadQuotation(quotationId);
    }
  }, [mode, quotationId]);

  const loadQuotation = async (id: string) => {
    try {
      setLoading(true);
      const data = await quotationService.getQuotationById(id);
      
      if (mode === 'duplicate') {
        // Reset fields for duplication
        data.id = undefined;
        data.quotationNumber = undefined;
        data.status = 'draft';
        data.sentAt = undefined;
      }
      
      setQuotation(data);
      setItems(data.items || []);
    } catch (err) {
      setError('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const updateQuotation = (updates: Partial<Quotation>) => {
    setQuotation(prev => ({ ...prev, ...updates }));
  };

  const addItem = (item: Omit<QuotationItem, 'id'>) => {
    const newItem: QuotationItem = {
      ...item,
      id: `temp-${Date.now()}`, // Temporary ID
      lineTotal: item.quantity * item.unitPrice * (1 - (item.discountPercentage || 0) / 100)
    };
    
    setItems(prev => [...prev, newItem]);
    calculateTotals();
  };

  const updateItem = (itemId: string, updates: Partial<QuotationItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updated = { ...item, ...updates };
        // Recalculate line total
        updated.lineTotal = updated.quantity * updated.unitPrice * 
          (1 - (updated.discountPercentage || 0) / 100);
        return updated;
      }
      return item;
    }));
    calculateTotals();
  };

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    calculateTotals();
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
    const discountAmount = quotation.discountAmount || 0;
    const discountedSubtotal = subtotal - discountAmount;
    const taxRate = quotation.taxRate || 18; // Default 18% GST
    const taxAmount = (discountedSubtotal * taxRate) / 100;
    const totalAmount = discountedSubtotal + taxAmount + (quotation.shippingCharges || 0);

    setQuotation(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }));
  };

  const saveQuotation = async (status: 'draft' | 'sent') => {
    try {
      setLoading(true);
      setError(null);

      const quotationData = {
        ...quotation,
        items,
        status
      };

      let result;
      if (mode === 'edit' && quotationId) {
        result = await quotationService.updateQuotation(quotationId, quotationData);
      } else {
        result = await quotationService.createQuotation(quotationData);
      }

      setQuotation(result);
      return result;
    } catch (err) {
      setError('Failed to save quotation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendQuotation = async (emailConfig: EmailConfig) => {
    try {
      setLoading(true);
      
      // First save the quotation if it's new
      let quotationToSend = quotation;
      if (!quotation.id) {
        quotationToSend = await saveQuotation('draft');
      }

      // Send the quotation
      await quotationService.sendQuotation(quotationToSend.id!, emailConfig);
      
      // Update local state
      setQuotation(prev => ({ ...prev, status: 'sent', sentAt: new Date() }));
    } catch (err) {
      setError('Failed to send quotation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    quotation,
    items,
    loading,
    error,
    updateQuotation,
    addItem,
    updateItem,
    removeItem,
    calculateTotals,
    saveQuotation,
    sendQuotation
  };
};
```

### 📧 **Email Service Implementation**

#### SendGrid Email Service
```javascript
// backend/src/services/email.service.js
const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@sanvimachinery.com';
    this.companyName = 'Sanvi Machinery';
  }

  async sendQuotationEmail({ to, quotation, pdfAttachment, emailSubject, emailMessage, cc, bcc }) {
    try {
      // Load email template
      const templatePath = path.join(__dirname, '../templates/quotation-email.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf8');

      // Replace template variables
      const templateData = {
        customerName: quotation.customerInfo.name,
        quotationNumber: quotation.quotationNumber,
        totalAmount: this.formatCurrency(quotation.totalAmount),
        validityDate: this.formatDate(quotation.validUntil),
        deliveryTime: quotation.deliveryTerms || '2-3 weeks',
        companyName: this.companyName,
        quotationUrl: `${process.env.FRONTEND_URL}/quotations/view/${quotation.publicToken}`,
        salesPersonName: quotation.createdBy?.firstName + ' ' + quotation.createdBy?.lastName,
        phoneNumber: process.env.COMPANY_PHONE || '+91-XXXXXXXXXX',
        emailAddress: this.fromEmail,
        companyAddress: process.env.COMPANY_ADDRESS || 'Your Company Address',
        currentYear: new Date().getFullYear()
      };

      // Replace placeholders in template
      htmlTemplate = this.replacePlaceholders(htmlTemplate, templateData);

      // Prepare email
      const emailData = {
        to: to,
        from: {
          email: this.fromEmail,
          name: this.companyName
        },
        subject: emailSubject || `Quotation ${quotation.quotationNumber} from ${this.companyName}`,
        html: htmlTemplate,
        attachments: [{
          content: pdfAttachment.toString('base64'),
          filename: `quotation-${quotation.quotationNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      };

      // Add CC and BCC if provided
      if (cc && cc.length > 0) emailData.cc = cc;
      if (bcc && bcc.length > 0) emailData.bcc = bcc;

      // Send email
      await sgMail.send(emailData);

      return { success: true, messageId: emailData.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendQuotationFollowUp({ quotation, daysOverdue }) {
    try {
      const templatePath = path.join(__dirname, '../templates/quotation-followup.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf8');

      const templateData = {
        customerName: quotation.customerInfo.name,
        quotationNumber: quotation.quotationNumber,
        sentDate: this.formatDate(quotation.sentAt),
        validityDate: this.formatDate(quotation.validUntil),
        daysRemaining: this.getDaysUntilExpiry(quotation.validUntil),
        totalAmount: this.formatCurrency(quotation.totalAmount),
        itemCount: quotation.items?.length || 0,
        productSummary: this.getProductSummary(quotation.items),
        quotationUrl: `${process.env.FRONTEND_URL}/quotations/view/${quotation.publicToken}`,
        companyName: this.companyName
      };

      htmlTemplate = this.replacePlaceholders(htmlTemplate, templateData);

      const emailData = {
        to: quotation.customerInfo.email,
        from: {
          email: this.fromEmail,
          name: this.companyName
        },
        subject: `Gentle Reminder - Quotation ${quotation.quotationNumber}`,
        html: htmlTemplate
      };

      await sgMail.send(emailData);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send follow-up email: ${error.message}`);
    }
  }

  // Helper methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getProductSummary(items) {
    if (!items || items.length === 0) return 'No items';
    
    if (items.length === 1) {
      return items[0].productName;
    } else {
      return `${items[0].productName} and ${items.length - 1} other item${items.length > 2 ? 's' : ''}`;
    }
  }

  replacePlaceholders(template, data) {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, value);
    }
    return result;
  }
}

module.exports = EmailService;
```

### 📄 **PDF Generation Service**

```javascript
// backend/src/services/pdf.service.js
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class PDFService {
  constructor() {
    this.companyInfo = {
      name: 'Sanvi Machinery',
      address: process.env.COMPANY_ADDRESS || 'Your Company Address',
      phone: process.env.COMPANY_PHONE || '+91-XXXXXXXXXX',
      email: process.env.COMPANY_EMAIL || 'info@sanvimachinery.com',
      gst: process.env.COMPANY_GST || 'GST Number',
      website: process.env.COMPANY_WEBSITE || 'www.sanvimachinery.com'
    };
  }

  async generateQuotationPDF(quotation) {
    try {
      // Load HTML template
      const templatePath = path.join(__dirname, '../templates/quotation-pdf.html');
      let htmlTemplate = await fs.readFile(templatePath, 'utf8');

      // Prepare template data
      const templateData = {
        ...this.companyInfo,
        quotation: quotation,
        items: quotation.items || [],
        customerInfo: quotation.customerInfo,
        subtotal: this.formatCurrency(quotation.subtotal),
        taxAmount: this.formatCurrency(quotation.taxAmount),
        totalAmount: this.formatCurrency(quotation.totalAmount),
        quotationDate: this.formatDate(quotation.createdAt),
        validUntil: this.formatDate(quotation.validUntil),
        currentDate: this.formatDate(new Date())
      };

      // Generate HTML content
      const htmlContent = this.generateQuotationHTML(templateData);

      // Create PDF using Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  generateQuotationHTML(data) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Quotation ${data.quotation.quotationNumber}</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
            
            .header { 
                background: linear-gradient(135deg, #2c3e50, #34495e); 
                color: white; 
                padding: 30px 20px; 
                margin-bottom: 30px; 
            }
            .header h1 { font-size: 28px; margin-bottom: 10px; }
            .header p { font-size: 14px; opacity: 0.9; }
            
            .quotation-info { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px; 
                padding: 0 20px; 
            }
            
            .customer-info, .quotation-details { 
                flex: 1; 
                padding: 20px; 
                background: #f8f9fa; 
                border-radius: 8px; 
                margin: 0 10px; 
            }
            
            .customer-info h3, .quotation-details h3 { 
                color: #2c3e50; 
                margin-bottom: 15px; 
                font-size: 16px; 
            }
            
            .items-table { 
                width: 100%; 
                border-collapse: collapse; 
                margin: 30px 20px; 
                background: white; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
            }
            
            .items-table th { 
                background: #34495e; 
                color: white; 
                padding: 12px 8px; 
                text-align: left; 
                font-size: 12px; 
            }
            
            .items-table td { 
                padding: 12px 8px; 
                border-bottom: 1px solid #eee; 
                font-size: 11px; 
            }
            
            .items-table tbody tr:nth-child(even) { 
                background: #f8f9fa; 
            }
            
            .totals { 
                margin: 30px 20px; 
                text-align: right; 
            }
            
            .totals table { 
                margin-left: auto; 
                border-collapse: collapse; 
            }
            
            .totals td { 
                padding: 8px 15px; 
                border: 1px solid #ddd; 
            }
            
            .totals .total-row { 
                background: #2c3e50; 
                color: white; 
                font-weight: bold; 
            }
            
            .terms { 
                margin: 30px 20px; 
                padding: 20px; 
                background: #f8f9fa; 
                border-radius: 8px; 
            }
            
            .footer { 
                margin-top: 50px; 
                text-align: center; 
                color: #666; 
                font-size: 12px; 
                border-top: 1px solid #eee; 
                padding-top: 20px; 
            }
            
            .text-right { text-align: right; }
            .text-center { text-align: center; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${data.name}</h1>
            <p>Industrial Machinery Solutions</p>
            <p>${data.address} | ${data.phone} | ${data.email}</p>
        </div>

        <div class="quotation-info">
            <div class="customer-info">
                <h3>Bill To:</h3>
                <p><strong>${data.customerInfo.name}</strong></p>
                ${data.customerInfo.company ? `<p>${data.customerInfo.company}</p>` : ''}
                <p>${data.customerInfo.address?.street || ''}</p>
                <p>${data.customerInfo.address?.city || ''}, ${data.customerInfo.address?.state || ''} ${data.customerInfo.address?.pincode || ''}</p>
                <p>Phone: ${data.customerInfo.phone || ''}</p>
                <p>Email: ${data.customerInfo.email || ''}</p>
                ${data.customerInfo.gstNumber ? `<p>GST: ${data.customerInfo.gstNumber}</p>` : ''}
            </div>

            <div class="quotation-details">
                <h3>Quotation Details:</h3>
                <p><strong>Quotation #:</strong> ${data.quotation.quotationNumber}</p>
                <p><strong>Date:</strong> ${data.quotationDate}</p>
                <p><strong>Valid Until:</strong> ${data.validUntil}</p>
                <p><strong>Payment Terms:</strong> ${data.quotation.paymentTerms}</p>
                <p><strong>Delivery Terms:</strong> ${data.quotation.deliveryTerms || '2-3 weeks'}</p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 5%">#</th>
                    <th style="width: 35%">Product Description</th>
                    <th style="width: 10%">Qty</th>
                    <th style="width: 12%">Unit Price</th>
                    <th style="width: 10%">Discount</th>
                    <th style="width: 13%">Line Total</th>
                    <th style="width: 15%">Delivery Time</th>
                </tr>
            </thead>
            <tbody>
                ${data.items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <strong>${item.productName}</strong><br>
                            <small>SKU: ${item.productSku}</small>
                            ${item.specifications ? `<br><small>${this.formatSpecifications(item.specifications)}</small>` : ''}
                            ${item.notes ? `<br><small><em>${item.notes}</em></small>` : ''}
                        </td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-right">${this.formatCurrency(item.unitPrice)}</td>
                        <td class="text-center">${item.discountPercentage || 0}%</td>
                        <td class="text-right">${this.formatCurrency(item.lineTotal)}</td>
                        <td class="text-center">${item.deliveryTime || 'Standard'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td><strong>Subtotal:</strong></td>
                    <td class="text-right">${data.subtotal}</td>
                </tr>
                ${data.quotation.discountAmount > 0 ? `
                    <tr>
                        <td><strong>Discount:</strong></td>
                        <td class="text-right">-${this.formatCurrency(data.quotation.discountAmount)}</td>
                    </tr>
                ` : ''}
                ${data.quotation.shippingCharges > 0 ? `
                    <tr>
                        <td><strong>Shipping:</strong></td>
                        <td class="text-right">${this.formatCurrency(data.quotation.shippingCharges)}</td>
                    </tr>
                ` : ''}
                <tr>
                    <td><strong>Tax (${data.quotation.taxRate || 18}%):</strong></td>
                    <td class="text-right">${data.taxAmount}</td>
                </tr>
                <tr class="total-row">
                    <td><strong>Total Amount:</strong></td>
                    <td class="text-right"><strong>${data.totalAmount}</strong></td>
                </tr>
            </table>
        </div>

        <div class="terms">
            <h3>Terms & Conditions:</h3>
            <ul>
                <li>This quotation is valid until ${data.validUntil}</li>
                <li>Payment Terms: ${data.quotation.paymentTerms}</li>
                <li>Warranty: ${data.quotation.warrantyTerms || 'As per manufacturer warranty'}</li>
                ${data.quotation.customTerms ? data.quotation.customTerms.map(term => `<li>${term}</li>`).join('') : ''}
                <li>Prices are subject to change without prior notice</li>
                <li>Delivery charges may apply based on location</li>
            </ul>
        </div>

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>${data.name} | GST: ${data.gst} | ${data.website}</p>
            <p>This is a computer-generated quotation and does not require a signature.</p>
        </div>
    </body>
    </html>
    `;
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatSpecifications(specs) {
    if (Array.isArray(specs)) {
      return specs.map(spec => `${spec.key}: ${spec.value}`).join(', ');
    }
    return JSON.stringify(specs);
  }
}

module.exports = PDFService;
```

---

## Frontend Implementation Details

### 🎨 **React Component Architecture**

#### Main Quotation Builder Component
```typescript
// frontend/src/components/quotations/QuotationBuilder/index.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuotationBuilder } from '@/hooks/useQuotationBuilder';
import { toast } from 'react-hot-toast';

import StepProgress from './StepProgress';
import CustomerStep from './CustomerStep';
import ProductStep from './ProductStep';
import PricingStep from './PricingStep';
import ReviewStep from './ReviewStep';

interface QuotationBuilderProps {
  mode: 'create' | 'edit' | 'duplicate';
}

const QuotationBuilder: React.FC<QuotationBuilderProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);

  const {
    quotation,
    items,
    loading,
    error,
    updateQuotation,
    addItem,
    updateItem,
    removeItem,
    calculateTotals,
    saveQuotation,
    sendQuotation
  } = useQuotationBuilder(mode, id);

  const steps = [
    {
      title: 'Customer Details',
      description: 'Select or add customer information',
      component: CustomerStep,
      isValid: () => quotation.customerInfo?.name && quotation.customerInfo?.email
    },
    {
      title: 'Select Products',
      description: 'Add products and specify quantities',
      component: ProductStep,
      isValid: () => items.length > 0
    },
    {
      title: 'Pricing & Terms',
      description: 'Configure pricing and terms',
      component: PricingStep,
      isValid: () => quotation.validUntil && quotation.paymentTerms
    },
    {
      title: 'Review & Send',
      description: 'Review quotation and send to customer',
      component: ReviewStep,
      isValid: () => true
    }
  ];

  useEffect(() => {
    calculateTotals();
  }, [items, quotation.discountAmount, quotation.shippingCharges]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleNext = () => {
    const currentStepData = steps[currentStep];
    if (!currentStepData.isValid()) {
      toast.error('Please complete all required fields before proceeding');
      return;
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveQuotation('draft');
      toast.success('Quotation saved as draft');
      navigate('/dashboard/quotations');
    } catch (error) {
      toast.error('Failed to save quotation');
    }
  };

  const handleSendQuotation = async (emailConfig: any) => {
    try {
      await sendQuotation(emailConfig);
      toast.success('Quotation sent successfully');
      navigate('/dashboard/quotations');
    } catch (error) {
      toast.error('Failed to send quotation');
    }
  };

  const getCurrentStepComponent = () => {
    const StepComponent = steps[currentStep].component;
    return (
      <StepComponent
        quotation={quotation}
        items={items}
        updateQuotation={updateQuotation}
        addItem={addItem}
        updateItem={updateItem}
        removeItem={removeItem}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSaveDraft={handleSaveDraft}
        onSendQuotation={handleSendQuotation}
        loading={loading}
      />
    );
  };

  if (loading && mode !== 'create') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Quotation' : 
             mode === 'edit' ? 'Edit Quotation' : 'Duplicate Quotation'}
          </h1>
          <p className="text-gray-600 mt-2">
            Follow the steps below to create a professional quotation
          </p>
        </div>

        {/* Step Progress */}
        <StepProgress 
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          {getCurrentStepComponent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-4">
            {currentStep === steps.length - 1 ? (
              <>
                <button
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSendQuotation({})}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Send Quotation
                </button>
              </>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationBuilder;
```

#### Product Selection Step
```typescript
// frontend/src/components/quotations/QuotationBuilder/ProductStep.tsx
import React, { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Product, QuotationItem } from '@/types';
import ProductSearch from './ProductSearch';
import ProductCard from './ProductCard';
import SelectedItemsList from './SelectedItemsList';

interface ProductStepProps {
  items: QuotationItem[];
  addItem: (item: Omit<QuotationItem, 'id'>) => void;
  updateItem: (itemId: string, updates: Partial<QuotationItem>) => void;
  removeItem: (itemId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const ProductStep: React.FC<ProductStepProps> = ({
  items,
  addItem,
  updateItem,
  removeItem,
  onNext,
  onPrevious
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    searchProducts
  } = useProducts();

  useEffect(() => {
    if (searchQuery) {
      searchProducts(searchQuery, { category: selectedCategory, page: currentPage });
    } else {
      fetchProducts({ category: selectedCategory, page: currentPage });
    }
  }, [searchQuery, selectedCategory, currentPage]);

  const handleProductSelect = (product: Product) => {
    // Check if product already added
    const existingItem = items.find(item => item.productId === product.id);
    if (existingItem) {
      // Update quantity instead of adding duplicate
      updateItem(existingItem.id, { quantity: existingItem.quantity + 1 });
      return;
    }

    // Add new item
    const newItem: Omit<QuotationItem, 'id'> = {
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: 1,
      unitPrice: product.basePrice,
      discountPercentage: 0,
      lineTotal: product.basePrice,
      specifications: product.specifications?.map(spec => ({
        key: spec.key,
        value: spec.value,
        isCustom: false
      })) || [],
      deliveryTime: product.leadTime || '2-3 weeks',
      notes: ''
    };

    addItem(newItem);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Select Products
        </h2>
        <p className="text-gray-600 mb-6">
          Search and add products to your quotation. You can customize specifications and quantities for each item.
        </p>
      </div>

      {/* Selected Items Summary */}
      {items.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Selected Items ({items.length})
          </h3>
          <div className="text-sm text-blue-700">
            Total Value: ₹{items.reduce((sum, item) => sum + item.lineTotal, 0).toLocaleString()}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & Selection */}
        <div className="lg:col-span-2">
          {/* Search and Filters */}
          <ProductSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">Error loading products</div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={handleProductSelect}
                  isSelected={items.some(item => item.productId === product.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {products.length > 0 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 bg-blue-600 text-white rounded-md">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Items List */}
        <div className="lg:col-span-1">
          <SelectedItemsList
            items={items}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onPrevious}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Previous
        </button>
        
        <button
          onClick={onNext}
          disabled={items.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Pricing
        </button>
      </div>
    </div>
  );
};

export default ProductStep;
```

---

## Deployment & DevOps Setup

### 🚀 **Docker Configuration**

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]
```

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sanvi_machinery
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/sanvi_machinery
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - SENDGRID_API_KEY=${SENDGRID_API_KEY}
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/uploads:/app/uploads
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: 
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - REACT_APP_API_URL=http://backend:5000/api

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

### ⚙️ **CI/CD Pipeline (GitHub Actions)**

```yaml
# .github/workflows/deploy.yml
name: Deploy Sanvi Machinery

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          backend/package-lock.json
          frontend/package-lock.json

    # Backend Tests
    - name: Install backend dependencies
      working-directory: ./backend
      run: npm ci

    - name: Run backend tests
      working-directory: ./backend
      run: |
        npm run test:unit
        npm run test:integration
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
        JWT_SECRET: test-secret

    # Frontend Tests
    - name: Install frontend dependencies
      working-directory: ./frontend
      run: npm ci

    - name: Run frontend tests
      working-directory: ./frontend
      run: |
        npm run test -- --coverage --watchAll=false
        npm run test:e2e

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Setup Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Login to Docker Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ secrets.DOCKER_REGISTRY }}
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push backend image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ secrets.DOCKER_REGISTRY }}/sanvi-backend:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Build and push frontend image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: true
        tags: ${{ secrets.DOCKER_REGISTRY }}/sanvi-frontend:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Deploy to production
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/sanvi-machinery
          docker-compose pull
          docker-compose up -d --remove-orphans
          docker system prune -f
```

---

## Missing Pieces & Critical Implementation Details

### 🔍 **Critical Missing Components**

#### 1. Advanced Search & Filtering
```javascript
// backend/src/services/search.service.js
const { PrismaClient } = require('@prisma/client');

class SearchService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async searchProducts(query, filters = {}) {
    const {
      category,
      priceRange,
      brand,
      inStock,
      page = 1,
      limit = 20,
      sortBy = 'name',
      sortOrder = 'asc'
    } = filters;

    const where = {
      AND: [
        { isActive: true },
        query ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
            { keywords: { hasSome: [query] } }
          ]
        } : {},
        category ? { category: { slug: category } } : {},
        brand ? { brand: { contains: brand, mode: 'insensitive' } } : {},
        priceRange ? {
          basePrice: {
            gte: priceRange.min || 0,
            lte: priceRange.max || 999999999
          }
        } : {},
        inStock ? {
          inventory: {
            some: {
              quantityAvailable: { gt: 0 }
            }
          }
        } : {}
      ].filter(condition => Object.keys(condition).length > 0)
    };

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          inventory: true
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.product.count({ where })
    ]);

    return {
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    };
  }
}

module.exports = SearchService;
```

#### 2. Real-time Notifications
```typescript
// frontend/src/hooks/useNotifications.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';

interface Notification {
  id: string;
  type: 'quotation_viewed' | 'quotation_approved' | 'order_placed' | 'payment_received';
  title: string;
  message: string;
  data: any;
  createdAt: Date;
  isRead: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      const newSocket = io(process.env.REACT_APP_WS_URL!, {
        auth: { token: localStorage.getItem('token') }
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification service');
      });

      newSocket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          });
        }
      });

      setSocket(newSocket);

      return () => newSocket.close();
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead
  };
};
```

#### 3. Advanced Analytics Dashboard
```typescript
// frontend/src/components/dashboard/AnalyticsDashboard.tsx
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';

const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date()
  });

  const {
    salesMetrics,
    quotationMetrics,
    customerMetrics,
    productMetrics,
    revenueData,
    conversionData,
    loading,
    error
  } = useAnalytics(dateRange);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex space-x-4">
          <select
            className="border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) => {
              const days = parseInt(e.target.value);
              setDateRange({
                startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                endDate: new Date()
              });
            }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={salesMetrics.totalRevenue}
          change={salesMetrics.revenueGrowth}
          format="currency"
          icon="💰"
        />
        <MetricCard
          title="Quotations Sent"
          value={quotationMetrics.totalSent}
          change={quotationMetrics.sentGrowth}
          format="number"
          icon="📋"
        />
        <MetricCard
          title="Conversion Rate"
          value={quotationMetrics.conversionRate}
          change={quotationMetrics.conversionGrowth}
          format="percentage"
          icon="📈"
        />
        <MetricCard
          title="Active Customers"
          value={customerMetrics.activeCount}
          change={customerMetrics.customerGrowth}
          format="number"
          icon="👥"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#0088FE" 
                fill="#0088FE" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Quotation Conversion Funnel */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Quotation Conversion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={conversionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Top Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productMetrics.topProducts}
                dataKey="sales"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {productMetrics.topProducts.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Segments */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
          <div className="space-y-4">
            {customerMetrics.segments.map((segment) => (
              <div key={segment.type} className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{segment.type}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({segment.count} customers)
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₹{segment.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">
                    Avg: ₹{segment.averageOrderValue.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Recent Quotations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quotation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quotationMetrics.recent.map((quotation) => (
                  <tr key={quotation.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quotation.quotationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quotation.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{quotation.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={quotation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Top Customers</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {customerMetrics.topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {customer.orderCount} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ₹{customer.totalSpent.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      LTV: ₹{customer.lifetimeValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard: React.FC<{
  title: string;
  value: number;
  change: number;
  format: 'currency' | 'number' | 'percentage';
  icon: string;
}> = ({ title, value, change, format, icon }) => {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `₹${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      <div className="mt-4 flex items-center">
        <div className={`flex items-center text-sm ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{isPositive ? '↗' : '↘'}</span>
          <span className="ml-1">{Math.abs(change).toFixed(1)}%</span>
        </div>
        <span className="text-sm text-gray-500 ml-2">vs last period</span>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default AnalyticsDashboard;
```

#### 4. Advanced Inventory Management
```javascript
// backend/src/services/inventory.service.js
const { PrismaClient } = require('@prisma/client');

class InventoryService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async updateInventory(productId, locationId, quantity, type = 'adjustment') {
    try {
      // Create inventory transaction
      const transaction = await this.prisma.inventoryTransaction.create({
        data: {
          productId,
          locationId,
          quantity,
          type, // 'sale', 'purchase', 'adjustment', 'transfer'
          notes: `${type} - ${quantity} units`,
          createdAt: new Date()
        }
      });

      // Update current inventory
      const currentInventory = await this.prisma.inventory.findUnique({
        where: {
          productId_warehouseLocation: {
            productId,
            warehouseLocation: locationId
          }
        }
      });

      if (currentInventory) {
        await this.prisma.inventory.update({
          where: { id: currentInventory.id },
          data: {
            quantityTotal: currentInventory.quantityTotal + quantity,
            updatedAt: new Date()
          }
        });
      } else {
        await this.prisma.inventory.create({
          data: {
            productId,
            warehouseLocation: locationId,
            quantityTotal: Math.max(0, quantity),
            quantityReserved: 0,
            reorderPoint: 10 // Default reorder point
          }
        });
      }

      // Check for low stock alerts
      await this.checkLowStockAlerts(productId, locationId);

      return transaction;
    } catch (error) {
      throw new Error(`Failed to update inventory: ${error.message}`);
    }
  }

  async reserveInventory(productId, locationId, quantity, orderId) {
    try {
      const inventory = await this.prisma.inventory.findUnique({
        where: {
          productId_warehouseLocation: {
            productId,
            warehouseLocation: locationId
          }
        }
      });

      if (!inventory || inventory.quantityAvailable < quantity) {
        throw new Error('Insufficient inventory available');
      }

      // Update reserved quantity
      await this.prisma.inventory.update({
        where: { id: inventory.id },
        data: {
          quantityReserved: inventory.quantityReserved + quantity
        }
      });

      // Create reservation record
      await this.prisma.inventoryReservation.create({
        data: {
          productId,
          locationId,
          quantity,
          orderId,
          status: 'active',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      return { success: true, message: 'Inventory reserved successfully' };
    } catch (error) {
      throw new Error(`Failed to reserve inventory: ${error.message}`);
    }
  }

  async checkLowStockAlerts(productId, locationId) {
    const inventory = await this.prisma.inventory.findUnique({
      where: {
        productId_warehouseLocation: {
          productId,
          warehouseLocation: locationId
        }
      },
      include: {
        product: {
          select: { name: true, sku: true }
        }
      }
    });

    if (inventory && inventory.quantityAvailable <= inventory.reorderPoint) {
      // Create low stock alert
      await this.prisma.stockAlert.create({
        data: {
          productId,
          locationId,
          alertType: 'low_stock',
          currentQuantity: inventory.quantityAvailable,
          reorderPoint: inventory.reorderPoint,
          message: `Low stock alert: ${inventory.product.name} (${inventory.product.sku}) has ${inventory.quantityAvailable} units remaining`,
          status: 'active'
        }
      });

      // Send notification to admin users
      // This would integrate with your notification service
    }
  }

  async generateInventoryReport(filters = {}) {
    const { locationId, categoryId, lowStockOnly, dateRange } = filters;

    let where = {
      AND: []
    };

    if (locationId) {
      where.AND.push({ warehouseLocation: locationId });
    }

    if (categoryId) {
      where.AND.push({ 
        product: { categoryId } 
      });
    }

    if (lowStockOnly) {
      where.AND.push({
        quantityAvailable: { lte: { reorderPoint: true } }
      });
    }

    const inventory = await this.prisma.inventory.findMany({
      where: where.AND.length > 0 ? where : {},
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        product: {
          name: 'asc'
        }
      }
    });

    // Calculate inventory value and other metrics
    const report = {
      totalProducts: inventory.length,
      totalValue: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      items: inventory.map(item => ({
        ...item,
        inventoryValue: item.quantityTotal * (item.product.costPrice || item.product.basePrice),
        isLowStock: item.quantityAvailable <= item.reorderPoint,
        isOutOfStock: item.quantityAvailable === 0
      }))
    };

    report.totalValue = report.items.reduce((sum, item) => sum + item.inventoryValue, 0);
    report.lowStockItems = report.items.filter(item => item.isLowStock).length;
    report.outOfStockItems = report.items.filter(item => item.isOutOfStock).length;

    return report;
  }
}

module.exports = InventoryService;
```

#### 5. Payment Gateway Integration
```javascript
// backend/src/services/payment.service.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async createPaymentLink(orderData) {
    try {
      const paymentLink = await this.razorpay.paymentLink.create({
        amount: orderData.totalAmount * 100, // Amount in paisa
        currency: 'INR',
        description: `Payment for Order ${orderData.orderNumber}`,
        customer: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: orderData.customerPhone
        },
        notify: {
          sms: true,
          email: true
        },
        reminder_enable: true,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        callback_method: 'get'
      });

      // Save payment link to database
      await this.prisma.payment.create({
        data: {
          orderId: orderData.id,
          paymentLinkId: paymentLink.id,
          amount: orderData.totalAmount,
          currency: 'INR',
          status: 'created',
          paymentLink: paymentLink.short_url
        }
      });

      return paymentLink;
    } catch (error) {
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }

  async verifyPaymentSignature(signature, orderId, paymentId) {
    try {
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(body.toString())
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  async handlePaymentWebhook(event) {
    try {
      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentSuccess(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailure(event.payload.payment.entity);
          break;
        default:
          console.log(`Unhandled event type: ${event.event}`);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
      throw error;
    }
  }

  async handlePaymentSuccess(paymentData) {
    // Update payment status in database
    await this.prisma.payment.update({
      where: { paymentId: paymentData.id },
      data: {
        status: 'completed',
        paidAt: new Date(),
        transactionId: paymentData.id
      }
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: paymentData.order_id },
      data: {
        paymentStatus: 'completed',
        status: 'confirmed'
      }
    });

    // Send payment confirmation email
    // Trigger order fulfillment process
  }

  async handlePaymentFailure(paymentData) {
    await this.prisma.payment.update({
      where: { paymentId: paymentData.id },
      data: {
        status: 'failed',
        failureReason: paymentData.error_description
      }
    });

    // Send payment failure notification
  }
}

module.exports = PaymentService;
```

---

## Final Implementation Checklist

### 🎯 **Phase 1 Critical Tasks (Weeks 1-10)**

#### Week 1-2: Foundation Setup
- [ ] **Database Setup**
  - [ ] PostgreSQL installation and configuration
  - [ ] Prisma schema design and migration
  - [ ] Database seeding with sample data
  - [ ] Connection pooling setup

- [ ] **Backend Infrastructure**
  - [ ] Express.js server with TypeScript
  - [ ] JWT authentication middleware
  - [ ] Request validation with Zod
  - [ ] Error handling middleware
  - [ ] Logging setup with Winston

- [ ] **Frontend Foundation**
  - [ ] React app with TypeScript
  - [ ] Redux Toolkit setup
  - [ ] Tailwind CSS configuration
  - [ ] React Router setup
  - [ ] Axios HTTP client configuration

#### Week 3-4: Authentication System
- [ ] **User Management**
  - [ ] User registration/login APIs
  - [ ] Password hashing with bcrypt
  - [ ] JWT token generation and validation
  - [ ] Role-based access control
  - [ ] Password reset functionality

- [ ] **Frontend Auth**
  - [ ] Login/register forms
  - [ ] Protected routes
  - [ ] Auth state management
  - [ ] Token refresh mechanism

#### Week 5-8: Core Quotation System
- [ ] **Backend APIs**
  - [ ] Quotation CRUD operations
  - [ ] Quotation numbering system
  - [ ] PDF generation service
  - [ ] Email service integration
  - [ ] File upload handling

- [ ] **Frontend Components**
  - [ ] Quotation builder wizard
  - [ ] Customer selection component
  - [ ] Product selection with search
  - [ ] Pricing calculator
  - [ ] PDF preview and download

#### Week 9-10: Customer Management
- [ ] **Customer APIs**
  - [ ] Customer CRUD operations
  - [ ] Customer segmentation
  - [ ] Credit management
  - [ ] Communication history tracking

- [ ] **Frontend CRM**
  - [ ] Customer list with filters
  - [ ] Customer profile pages
  - [ ] Customer forms
  - [ ] Communication timeline

### 🎯 **Phase 2 Advanced Features (Weeks 11-18)**

#### Week 11-14: Product & Inventory Management
- [ ] **Product Management**
  - [ ] Advanced product CRUD
  - [ ] Category management
  - [ ] Product specifications
  - [ ] Image and document management
  - [ ] Bulk product import

- [ ] **Inventory System**
  - [ ] Multi-location inventory
  - [ ] Stock tracking and reservations
  - [ ] Low stock alerts
  - [ ] Inventory reporting

#### Week 15-18: Order Processing & Analytics
- [ ] **Order Management**
  - [ ] Quote to order conversion
  - [ ] Order tracking system
  - [ ] Payment gateway integration
  - [ ] Shipping integration

- [ ] **Analytics Dashboard**
  - [ ] Sales metrics and KPIs
  - [ ] Quotation conversion tracking
  - [ ] Customer analytics
  - [ ] Product performance metrics

### 🎯 **Phase 3 Optimization & Deployment (Weeks 19-24)**

#### Week 19-20: Performance Optimization
- [ ] **Backend Optimization**
  - [ ] Database query optimization
  - [ ] Redis caching implementation
  - [ ] API response time optimization
  - [ ] Background job processing

- [ ] **Frontend Optimization**
  - [ ] Code splitting and lazy loading
  - [ ] Image optimization
  - [ ] Bundle size optimization
  - [ ] Performance monitoring

#### Week 21-22: Mobile Application
- [ ] **React Native App**
  - [ ] Basic app structure
  - [ ] Authentication flows
  - [ ] Quotation management
  - [ ] Customer management
  - [ ] Offline capability

#### Week 23-24: Testing & Deployment
- [ ] **Testing Suite**
  - [ ] Unit tests (90% coverage)
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Performance tests
  - [ ] Security tests

- [ ] **Production Deployment**
  - [ ] Docker containerization
  - [ ] CI/CD pipeline setup
  - [ ] Production environment setup
  - [ ] Monitoring and logging
  - [ ] Backup and disaster recovery

---

## Development Cost & Timeline Summary

### 💰 **Cost Breakdown**

#### Development Costs
```
Frontend Development:     ₹6,00,000
Backend Development:      ₹8,00,000
Database Design:          ₹1,50,000
UI/UX Design:            ₹2,00,000
Testing & QA:            ₹2,50,000
DevOps & Deployment:     ₹1,50,000
Project Management:       ₹1,50,000
---
Total Development:       ₹23,00,000
```

#### Ongoing Costs (Monthly)
```
Server Hosting (AWS):    ₹15,000
Database (RDS):          ₹8,000
CDN & Storage:           ₹5,000
Email Service:           ₹3,000
SMS/WhatsApp API:        ₹5,000
SSL Certificates:        ₹1,000
Monitoring Tools:        ₹7,000
---
Total Monthly:           ₹44,000
```

### ⏰ **Timeline Summary**

```
Phase 1 (Foundation):    10 weeks
Phase 2 (Advanced):       8 weeks
Phase 3 (Optimization):   6 weeks
---
Total Timeline:          24 weeks (6 months)
```

### 📈 **Expected ROI**

```
Year 1:
- Development Cost: ₹23,00,000
- Operational Savings: ₹12,00,000
- Revenue Increase: ₹35,00,000
- Net ROI: 104%

Year 2-3:
- Additional Features: ₹8,00,000
- Cumulative Savings: ₹25,00,000
- Cumulative Revenue: ₹75,00,000
- Total ROI: 285%
```

This comprehensive development plan provides a complete roadmap for transforming Sanvi Machinery into a market-leading B2B e-commerce platform with sophisticated quotation management capabilities. The PERN stack provides a robust, scalable foundation that can handle the complexity of industrial machinery sales while maintaining excellent performance and user experience.