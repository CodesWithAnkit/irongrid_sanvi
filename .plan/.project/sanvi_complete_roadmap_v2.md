# Sanvi Machinery - Complete Development Roadmap & Future Requirements

## Table of Contents
1. [Project Overview](#project-overview)
2. [Current State Analysis](#current-state-analysis)
3. [Critical Missing Features](#critical-missing-features)
4. [Phase-wise Development Plan](#phase-wise-development-plan)
5. [Quotation Generator - Detailed Specification](#quotation-generator-detailed-specification)
6. [Future Enhancement Roadmap](#future-enhancement-roadmap)
7. [Technical Architecture](#technical-architecture)
8. [Business Impact Analysis](#business-impact-analysis)
9. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
10. [ROI Projections](#roi-projections)

---

## Project Overview

### Vision
Transform Sanvi Machinery from a simple product catalog into a comprehensive B2B e-commerce platform with intelligent quotation management, customer relationship tools, and automated sales processes.

### Mission Critical Features
1. **Quotation Generator System** - Primary revenue driver
2. **B2B Customer Management** - Segmented pricing and credit management
3. **Inventory & Supply Chain** - Multi-location stock management
4. **Sales Pipeline Automation** - Lead to order conversion tracking

---

## Current State Analysis

### ✅ What's Working Well
```typescript
// Existing Strengths
✓ Clean, responsive UI design
✓ Complete product catalog structure
✓ Admin panel with CRUD operations
✓ Shopping cart functionality
✓ Basic order management
✓ Mobile-friendly design
✓ Tailwind CSS implementation
```

### ❌ Critical Gaps Identified

#### 1. **No Backend Infrastructure**
- **Issue**: All data stored in component state
- **Impact**: Data lost on page refresh, no persistence
- **Priority**: CRITICAL

#### 2. **Missing B2B Features**
- **Issue**: Built for B2C, not B2B machinery sales
- **Impact**: Cannot handle enterprise customers
- **Priority**: HIGH

#### 3. **No Quotation System**
- **Issue**: Industrial buyers need custom quotes
- **Impact**: Losing 70% of potential B2B sales
- **Priority**: CRITICAL

#### 4. **No Customer Segmentation**
- **Issue**: All customers treated equally
- **Impact**: Cannot offer wholesale/distributor pricing
- **Priority**: HIGH

---

## Critical Missing Features

### 🎯 **1. Quotation Generator System** (Primary Focus)

#### Why This is Critical:
- 80% of industrial machinery sales start with quotation requests
- Average quotation value: ₹50,000 - ₹5,00,000
- Competitors lack sophisticated quotation systems
- Can increase conversion rate by 300%

#### Core Features Needed:
```typescript
interface QuotationSystem {
  // Quote Builder
  dynamicQuoteBuilder: {
    customSpecifications: boolean;
    bulkPricingRules: boolean;
    multiProductQuotes: boolean;
    templateSystem: boolean;
  };
  
  // Customer Management
  customerSegmentation: {
    wholesaleCustomers: boolean;
    distributorPricing: boolean;
    creditTerms: boolean;
    customDiscounts: boolean;
  };
  
  // Workflow Management
  approvalWorkflow: {
    managerApproval: boolean;
    customerFeedback: boolean;
    revisionHistory: boolean;
    expiryManagement: boolean;
  };
  
  // Integration
  systemIntegration: {
    inventorySync: boolean;
    orderConversion: boolean;
    paymentGateway: boolean;
    emailAutomation: boolean;
  };
}
```

### 🔥 **2. B2B Customer Management (CRM)**

#### Business Need:
- Track customer purchase history
- Manage credit limits and payment terms
- Segment customers by type (retail/wholesale/distributor)
- Personalized pricing strategies

#### Technical Requirements:
```typescript
interface CustomerManagement {
  customerTypes: 'retail' | 'wholesale' | 'distributor' | 'government';
  creditManagement: {
    creditLimit: number;
    paymentTerms: string; // '30 days', '45 days', etc.
    outstandingAmount: number;
    creditScore: number;
  };
  pricingTiers: {
    discountPercentage: number;
    volumeDiscounts: boolean;
    specialRates: boolean;
  };
  communicationLog: {
    emails: EmailRecord[];
    calls: CallRecord[];
    meetings: MeetingRecord[];
    quotations: QuotationRecord[];
  };
}
```

### 📊 **3. Dynamic Pricing Engine**

#### Why Critical for Machinery Business:
- Prices vary based on quantity, customer type, seasonal demand
- Competitor pricing needs to be factored
- Bulk orders need special pricing
- Regional pricing variations

#### Implementation:
```typescript
interface PricingEngine {
  rules: PricingRule[];
  algorithms: {
    volumeDiscount: VolumeDiscountRule[];
    seasonalPricing: SeasonalRule[];
    competitorPricing: CompetitorPriceData[];
    regionBasedPricing: RegionalPricing[];
  };
  automation: {
    priceAlerts: boolean;
    autoApproval: boolean;
    priceValidation: boolean;
  };
}
```

### 🔄 **4. Inventory & Supply Chain Management**

#### Current Gap:
- No real-time inventory tracking
- No supplier management
- No procurement planning
- No multi-location inventory

#### Required Features:
```typescript
interface InventorySystem {
  multiLocation: {
    warehouses: Warehouse[];
    stockTransfer: boolean;
    locationWisePricing: boolean;
  };
  supplierManagement: {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    leadTimes: LeadTimeData[];
  };
  forecasting: {
    demandPlanning: boolean;
    seasonalTrends: boolean;
    reorderPoints: boolean;
  };
}
```

---

## Phase-wise Development Plan

### 🚀 **Phase 1: Foundation & Quotation System** (8-10 weeks)

#### Week 1-2: Backend Foundation
```bash
# Technology Stack Setup
Next.js 13+ with App Router
MongoDB Atlas with Mongoose
NextAuth.js for authentication
Tailwind CSS (existing)
React Query for state management
```

**Deliverables:**
- [ ] Database design and setup
- [ ] Authentication system
- [ ] Basic API structure
- [ ] Environment configuration

#### Week 3-4: Quotation System Backend
**API Endpoints:**
```typescript
POST /api/quotations              // Create quotation
GET /api/quotations               // List all quotations
GET /api/quotations/[id]          // Get specific quotation
PUT /api/quotations/[id]          // Update quotation
DELETE /api/quotations/[id]       // Delete quotation
POST /api/quotations/[id]/send    // Send to customer
POST /api/quotations/[id]/approve // Customer approval
GET /api/quotations/public/[token] // Public quotation view
POST /api/quotations/templates    // Quotation templates
```

**Database Models:**
```typescript
// Quotation Schema
{
  _id: ObjectId,
  quotationNumber: string, // Auto-generated: QUO-2025-001
  customerId: ObjectId,
  customerInfo: {
    name: string,
    company: string,
    email: string,
    phone: string,
    address: string,
    gst: string?
  },
  items: [{
    productId: ObjectId,
    productName: string,
    specifications: Record<string, any>,
    quantity: number,
    unitPrice: number,
    discount: number,
    total: number,
    deliveryTime: string?
  }],
  subtotal: number,
  taxRate: number, // GST rate
  taxAmount: number,
  discount: number,
  total: number,
  validUntil: Date,
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired' | 'converted',
  terms: string[],
  notes: string?,
  createdBy: ObjectId, // Admin user
  approvedBy: ObjectId?,
  convertedToOrder: ObjectId?,
  revisionHistory: [{
    version: number,
    changes: string,
    modifiedBy: ObjectId,
    modifiedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

#### Week 5-6: Quotation System Frontend
**UI Components:**
- Quotation builder interface
- Customer information forms
- Product selection with specifications
- Dynamic pricing calculator
- PDF generation and preview
- Template selection
- Approval workflow interface

#### Week 7-8: Customer Management (CRM)
**Features:**
- Customer segmentation
- Credit management
- Communication history
- Custom pricing tiers

#### Week 9-10: Integration & Testing
**Tasks:**
- API integration with existing frontend
- End-to-end testing
- Performance optimization
- Security implementation

### 🎯 **Phase 2: Advanced Features** (6-8 weeks)

#### Week 11-12: Dynamic Pricing Engine
```typescript
interface PricingRule {
  name: string;
  type: 'volume' | 'customer_type' | 'seasonal' | 'regional';
  conditions: {
    minQuantity?: number;
    customerType?: string;
    dateRange?: { start: Date; end: Date };
    location?: string;
  };
  discount: {
    type: 'percentage' | 'fixed' | 'tiered';
    value: number | TieredDiscount[];
  };
  priority: number; // Higher number = higher priority
  isActive: boolean;
}
```

#### Week 13-14: Inventory Management
- Multi-location inventory
- Real-time stock updates
- Low stock alerts
- Supplier management

#### Week 15-16: Order Processing Enhancement
- Quote to order conversion
- Bulk order processing
- Payment integration improvements
- Advanced order tracking

#### Week 17-18: Communication Systems
- WhatsApp integration
- Email automation
- SMS notifications
- Customer portal

### 🚀 **Phase 3: Automation & Analytics** (4-6 weeks)

#### Week 19-20: Sales Pipeline Automation
- Lead scoring
- Follow-up reminders
- Conversion tracking
- Performance analytics

#### Week 21-22: Advanced Analytics
- Sales forecasting
- Customer lifetime value
- Profit margin analysis
- Market trend analysis

#### Week 23-24: Mobile Application
- React Native app
- Offline functionality
- Push notifications
- Mobile-optimized quotation system

---

## Quotation Generator - Detailed Specification

### 🎨 **User Interface Design**

#### Admin Quotation Builder:
```typescript
interface QuotationBuilder {
  // Step 1: Customer Selection
  customerSelection: {
    existingCustomer: CustomerDropdown;
    newCustomer: CustomerForm;
    customerType: 'retail' | 'wholesale' | 'distributor';
  };
  
  // Step 2: Product Selection
  productSelection: {
    searchAndFilter: ProductSearch;
    customSpecifications: SpecificationEditor;
    quantityInput: QuantitySelector;
    bulkImport: CSVUploader; // For large quotations
  };
  
  // Step 3: Pricing Configuration
  pricingConfig: {
    basePricing: ProductPricing;
    discountRules: DiscountCalculator;
    taxConfiguration: TaxCalculator;
    shippingCosts: ShippingCalculator;
  };
  
  // Step 4: Terms & Conditions
  termsConfig: {
    templateSelector: TermsTemplateSelector;
    customTerms: TermsEditor;
    validityPeriod: DatePicker;
    paymentTerms: PaymentTermsSelector;
  };
  
  // Step 5: Review & Send
  reviewSend: {
    quotationPreview: PDFPreview;
    emailComposer: EmailEditor;
    trackingSetup: FollowUpScheduler;
  };
}
```

### 📧 **Email Integration**

#### Automated Email Workflows:
1. **Quotation Sent**: Professional email with PDF attachment
2. **Follow-up Reminders**: Automated follow-ups at 3, 7, 14 days
3. **Expiry Notifications**: Alerts before quotation expires
4. **Approval Confirmations**: When customer approves quotation
5. **Order Conversion**: When quotation converts to order

### 📊 **Analytics Dashboard**

#### Quotation Metrics:
```typescript
interface QuotationAnalytics {
  metrics: {
    totalQuotations: number;
    conversionRate: number; // Quotes converted to orders
    averageQuotationValue: number;
    responseTime: number; // Time to generate quotation
  };
  
  trends: {
    monthlyQuotations: ChartData[];
    conversionTrends: ChartData[];
    topProducts: ProductAnalytics[];
    customerSegmentAnalysis: SegmentAnalytics[];
  };
  
  performance: {
    salesPersonPerformance: UserAnalytics[];
    customerSatisfactionScore: number;
    quotationAccuracyScore: number;
  };
}
```

---

## Future Enhancement Roadmap

### 🎯 **Phase 4: AI & Automation** (6-8 months from now)

#### 1. AI-Powered Quotation Assistant
```typescript
interface AIQuotationAssistant {
  features: {
    smartPricing: {
      competitorAnalysis: boolean;
      demandPrediction: boolean;
      profitOptimization: boolean;
    };
    
    customerInsights: {
      buyingPatterns: boolean;
      priceNegotiation: boolean;
      churnPrediction: boolean;
    };
    
    processAutomation: {
      autoQuoteGeneration: boolean;
      intelligentFollowUp: boolean;
      predictiveInventory: boolean;
    };
  };
}
```

#### 2. Advanced Integration Ecosystem
- **ERP Integration**: SAP, Oracle, Tally integration
- **Logistics Partners**: Shiprocket, Delhivery, Blue Dart
- **Payment Gateways**: Multiple gateway support
- **Accounting Software**: QuickBooks, Zoho Books

### 🌍 **Phase 5: Market Expansion** (12-18 months)

#### 1. Multi-language Support
- Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi
- Regional pricing and tax configurations
- Local payment methods

#### 2. International Markets
- Export quotation formats
- Multi-currency support
- International shipping calculations
- Compliance with international trade regulations

#### 3. Marketplace Integration
- IndiaMART integration
- Amazon Business
- Government e-Marketplace (GeM)
- Export marketplaces (Alibaba, etc.)

### 🤖 **Phase 6: Next-Gen Features** (18-24 months)

#### 1. AR/VR Product Visualization
- 3D product models
- Virtual showroom
- Augmented reality product placement

#### 2. IoT Integration
- Machine health monitoring
- Predictive maintenance
- Remote diagnostics

#### 3. Blockchain Integration
- Supply chain transparency
- Product authenticity verification
- Smart contracts for transactions

---

## Technical Architecture

### 🏗️ **System Architecture Overview**

```mermaid
graph TB
    A[Frontend - Next.js] --> B[API Layer]
    B --> C[Authentication - NextAuth.js]
    B --> D[Database - MongoDB]
    B --> E[File Storage - Cloudinary]
    B --> F[Email Service - SendGrid]
    B --> G[Payment Gateway - Razorpay]
    B --> H[PDF Generation - Puppeteer]
    
    I[Admin Panel] --> B
    J[Customer Portal] --> B
    K[Mobile App] --> B
    
    L[WhatsApp API] --> B
    M[SMS Gateway] --> B
    N[Analytics - Google Analytics] --> A
```

### 🔒 **Security Architecture**

```typescript
interface SecurityMeasures {
  authentication: {
    multiFactorAuth: boolean;
    roleBasedAccess: boolean;
    sessionManagement: boolean;
  };
  
  dataProtection: {
    encryptionAtRest: boolean;
    encryptionInTransit: boolean;
    dataBackup: boolean;
    gdprCompliance: boolean;
  };
  
  apiSecurity: {
    rateLimiting: boolean;
    inputValidation: boolean;
    sqlInjectionPrevention: boolean;
    csrfProtection: boolean;
  };
}
```

### 📈 **Scalability Planning**

#### Current Scale Requirements:
- **Users**: 100 concurrent users
- **Products**: 1,000 products
- **Quotations**: 500 quotations/month
- **Orders**: 100 orders/month

#### Future Scale Targets (2-3 years):
- **Users**: 10,000 concurrent users
- **Products**: 100,000 products
- **Quotations**: 10,000 quotations/month
- **Orders**: 2,000 orders/month

#### Scaling Strategy:
1. **Database Optimization**: Indexing, query optimization
2. **Caching Layer**: Redis implementation
3. **CDN Integration**: CloudFront for static assets
4. **Microservices**: Break into smaller services
5. **Load Balancing**: Multiple server instances

---

## Business Impact Analysis

### 💰 **Revenue Impact Projections**

#### Current Business Model Issues:
- Manual quotation process takes 2-4 hours per quote
- 40% of quotation requests are not followed up
- Average conversion rate: 15%
- Limited customer segmentation leads to pricing inefficiencies

#### Expected Improvements with New System:
```typescript
interface BusinessImpact {
  efficiency: {
    quotationTime: '2-4 hours → 15 minutes';
    responseTime: '24 hours → 2 hours';
    followUpRate: '60% → 95%';
    dataAccuracy: '70% → 98%';
  };
  
  revenue: {
    conversionRate: '15% → 35%';
    averageOrderValue: '+25%';
    customerRetention: '+40%';
    newCustomerAcquisition: '+60%';
  };
  
  cost: {
    operationalCost: '-30%';
    customerAcquisitionCost: '-50%';
    inventoryCarryingCost: '-20%';
    adminOverhead: '-40%';
  };
}
```

### 📊 **ROI Calculations**

#### Year 1 Projections:
```
Development Cost: ₹15,00,000
Operational Savings: ₹8,00,000
Revenue Increase: ₹25,00,000
Net ROI: 120% (₹18,00,000 profit)
```

#### Year 2-3 Projections:
```
Additional Features Cost: ₹10,00,000
Operational Savings: ₹15,00,000
Revenue Increase: ₹50,00,000
Cumulative ROI: 280%
```

---

## Risk Assessment & Mitigation

### 🚨 **High-Risk Areas**

#### 1. Technical Risks
```typescript
interface TechnicalRisks {
  risks: [
    {
      risk: 'Database performance issues with scale';
      probability: 'Medium';
      impact: 'High';
      mitigation: 'Implement proper indexing, query optimization, and caching';
    },
    {
      risk: 'Integration complexities with existing systems';
      probability: 'High';
      impact: 'Medium';
      mitigation: 'Phased implementation, extensive testing, fallback plans';
    },
    {
      risk: 'Security vulnerabilities';
      probability: 'Low';
      impact: 'Very High';
      mitigation: 'Regular security audits, penetration testing, compliance checks';
    }
  ];
}
```

#### 2. Business Risks
- **Customer Adoption**: Some customers may resist digital quotation process
- **Competition**: Competitors may launch similar features
- **Market Changes**: Economic downturns affecting machinery demand

#### 3. Mitigation Strategies
1. **Change Management**: Training programs for staff and customers
2. **Competitive Advantage**: Focus on unique features and superior UX
3. **Market Diversification**: Expand to multiple machinery categories

---

## Implementation Timeline & Milestones

### 🗓️ **Detailed Timeline**

#### Phase 1: Foundation (Weeks 1-10)
```
Week 1-2: ✅ Backend setup and database design
Week 3-4: ✅ Authentication and user management
Week 5-6: 🎯 Quotation system backend
Week 7-8: 🎯 Quotation system frontend
Week 9-10: ✅ Integration and testing
```

#### Phase 2: Advanced Features (Weeks 11-18)
```
Week 11-12: 💰 Dynamic pricing engine
Week 13-14: 📦 Inventory management
Week 15-16: 🛒 Enhanced order processing
Week 17-18: 📱 Communication systems
```

#### Phase 3: Automation (Weeks 19-24)
```
Week 19-20: 🤖 Sales pipeline automation
Week 21-22: 📊 Advanced analytics
Week 23-24: 📱 Mobile application
```

### 🎯 **Success Metrics & KPIs**

#### Technical KPIs:
- System uptime: 99.9%
- Page load time: < 2 seconds
- API response time: < 200ms
- Bug fix time: < 24 hours

#### Business KPIs:
- Quotation response time: < 2 hours
- Conversion rate: > 30%
- Customer satisfaction: > 4.5/5
- Monthly recurring revenue: 25% growth

---

## Conclusion

This comprehensive roadmap transforms Sanvi Machinery from a basic product catalog into a sophisticated B2B e-commerce platform with intelligent quotation management. The phased approach ensures manageable development cycles while delivering immediate business value through the quotation system.

The focus on quotation generation as the primary feature addresses the core need of industrial machinery buyers and provides a significant competitive advantage in the market.

**Next Steps:**
1. Approve this roadmap and allocate resources
2. Begin Phase 1 development immediately
3. Set up development team and infrastructure
4. Start with quotation system as priority feature
5. Plan for continuous deployment and testing

**Expected Timeline**: 6-8 months for core system, 12-18 months for advanced features
**Investment**: ₹15-25 lakhs for complete system
**Expected ROI**: 120% in first year, 280% by year 3

---

## Appendices

### Appendix A: Detailed Database Schemas

#### 1. Complete Product Schema
```typescript
interface Product {
  _id: ObjectId;
  name: string;
  slug: string;
  sku: string; // Stock Keeping Unit
  description: string;
  shortDescription: string;
  category: 'machinery' | 'rawMaterials' | 'spareParts';
  subCategory: string;
  brand: string;
  model: string;
  
  // Pricing
  basePrice: number;
  costPrice: number; // For margin calculations
  minimumOrderQuantity: number;
  maximumOrderQuantity?: number;
  
  // Inventory
  stock: {
    total: number;
    reserved: number; // Items in pending orders
    available: number; // total - reserved
    locations: [{
      warehouseId: ObjectId;
      quantity: number;
      reorderPoint: number;
    }];
  };
  
  // Product Details
  specifications: [{
    key: string;
    value: string;
    unit?: string;
    isCustomizable: boolean;
  }];
  
  images: [{
    url: string;
    alt: string;
    isPrimary: boolean;
    order: number;
  }];
  
  documents: [{
    name: string;
    url: string;
    type: 'brochure' | 'manual' | 'certificate' | 'datasheet';
  }];
  
  // SEO & Marketing
  seoTitle?: string;
  seoDescription?: string;
  keywords: string[];
  
  // Business Logic
  isActive: boolean;
  isFeatured: boolean;
  isCustomizable: boolean;
  leadTime: string; // "2-3 weeks"
  warranty: string; // "2 years"
  
  // Analytics
  viewCount: number;
  orderCount: number;
  rating: {
    average: number;
    count: number;
  };
  
  // Relationships
  relatedProducts: ObjectId[];
  compatibleProducts: ObjectId[];
  requiredProducts: ObjectId[]; // Dependencies
  
  // Pricing Rules
  pricingTiers: [{
    minQuantity: number;
    maxQuantity?: number;
    price: number;
    discount: number;
  }];
  
  // Supplier Information
  suppliers: [{
    supplierId: ObjectId;
    supplierSku: string;
    supplierPrice: number;
    leadTime: string;
    isPrimary: boolean;
  }];
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  updatedBy: ObjectId;
}
```

#### 2. Enhanced Customer Schema
```typescript
interface Customer {
  _id: ObjectId;
  
  // Basic Information
  customerNumber: string; // Auto-generated: CUST-001
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  
  // Company Information
  company?: {
    name: string;
    industry: string;
    establishedYear: number;
    employeeCount: string; // "10-50", "50-100", etc.
    annualTurnover: string;
    website?: string;
  };
  
  // Classification
  type: 'individual' | 'company' | 'government' | 'ngo';
  segment: 'retail' | 'wholesale' | 'distributor' | 'oem' | 'reseller';
  priority: 'low' | 'medium' | 'high' | 'vip';
  
  // Address Information
  addresses: [{
    type: 'billing' | 'shipping' | 'office';
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    isPrimary: boolean;
  }];
  
  // Business Details
  businessInfo: {
    gstNumber?: string;
    panNumber?: string;
    licenseNumber?: string;
    businessType: 'proprietorship' | 'partnership' | 'private_limited' | 'public_limited' | 'llp';
  };
  
  // Financial Information
  credit: {
    creditLimit: number;
    availableCredit: number;
    paymentTerms: string; // "Net 30", "Net 45", etc.
    creditRating: 'excellent' | 'good' | 'fair' | 'poor';
    overdueDays: number;
  };
  
  // Pricing & Discounts
  pricing: {
    discountPercentage: number;
    specialPricing: boolean;
    priceList: string; // Reference to price list
    currency: string;
  };
  
  // Relationship Management
  assignedTo: ObjectId; // Sales representative
  source: 'website' | 'referral' | 'advertisement' | 'trade_show' | 'cold_call';
  tags: string[];
  notes: string;
  
  // Communication Preferences
  preferences: {
    communicationChannel: 'email' | 'phone' | 'whatsapp' | 'sms';
    marketingConsent: boolean;
    language: string;
    timezone: string;
  };
  
  // Purchase History
  stats: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    lastOrderDate?: Date;
    firstOrderDate?: Date;
    lifetimeValue: number;
  };
  
  // Status
  status: 'active' | 'inactive' | 'blocked' | 'prospect';
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
  updatedBy: ObjectId;
}
```

#### 3. Comprehensive Quotation Schema
```typescript
interface Quotation {
  _id: ObjectId;
  
  // Identification
  quotationNumber: string; // QUO-2025-001
  version: number; // For revision tracking
  parentQuotationId?: ObjectId; // For revisions
  
  // Customer Information
  customerId?: ObjectId; // null for new customers
  customerInfo: {
    name: string;
    company?: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
    gstNumber?: string;
  };
  
  // Quotation Items
  items: [{
    productId: ObjectId;
    productName: string;
    productSku: string;
    
    // Specifications
    specifications: [{
      key: string;
      value: string;
      isCustom: boolean;
    }];
    
    // Pricing
    quantity: number;
    unitPrice: number;
    discount: {
      type: 'percentage' | 'fixed';
      value: number;
      reason?: string;
    };
    lineTotal: number;
    
    // Delivery
    deliveryTime: string;
    deliveryLocation?: string;
    
    // Notes
    notes?: string;
  }];
  
  // Financial Summary
  summary: {
    subtotal: number;
    discountAmount: number;
    discountPercentage: number;
    
    // Taxes
    taxDetails: [{
      type: 'CGST' | 'SGST' | 'IGST' | 'CESS';
      rate: number;
      amount: number;
    }];
    totalTax: number;
    
    // Additional Charges
    shippingCharges: number;
    handlingCharges: number;
    packagingCharges: number;
    otherCharges: number;
    
    // Final Total
    grandTotal: number;
  };
  
  // Terms & Conditions
  terms: {
    validity: Date; // Quote valid until
    paymentTerms: string;
    deliveryTerms: string;
    warrantyTerms: string;
    customTerms: string[];
  };
  
  // Status & Workflow
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'rejected' | 'expired' | 'converted' | 'revised';
  
  workflow: {
    createdBy: ObjectId;
    approvedBy?: ObjectId;
    sentAt?: Date;
    viewedAt?: Date;
    respondedAt?: Date;
    expiresAt: Date;
  };
  
  // Customer Response
  customerResponse?: {
    status: 'approved' | 'rejected' | 'needs_revision';
    comments?: string;
    requestedChanges?: string[];
    respondedAt: Date;
  };
  
  // Conversion
  conversion?: {
    orderId?: ObjectId;
    convertedAt?: Date;
    conversionRate: number; // Percentage of quote converted
  };
  
  // Communication
  communications: [{
    type: 'email' | 'call' | 'meeting' | 'whatsapp';
    subject?: string;
    content?: string;
    sentBy: ObjectId;
    sentAt: Date;
    response?: string;
  }];
  
  // File Attachments
  attachments: [{
    filename: string;
    url: string;
    type: 'image' | 'pdf' | 'document';
    uploadedAt: Date;
  }];
  
  // Revision History
  revisions: [{
    version: number;
    changes: string[];
    revisedBy: ObjectId;
    revisedAt: Date;
    reason: string;
  }];
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### 4. Order Schema Enhancement
```typescript
interface Order {
  _id: ObjectId;
  
  // Order Identification
  orderNumber: string; // ORD-2025-001
  quotationId?: ObjectId; // Reference to quotation if converted
  
  // Customer Information
  customerId: ObjectId;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  
  // Billing & Shipping
  billingAddress: Address;
  shippingAddress: Address;
  
  // Order Items
  items: [{
    productId: ObjectId;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
    
    // Fulfillment
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    trackingNumber?: string;
    expectedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
  }];
  
  // Financial Summary
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  
  // Order Status & Workflow
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  
  // Payment Information
  payment: {
    method: 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'wallet' | 'cod' | 'credit';
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partial';
    transactionId?: string;
    paidAmount: number;
    paidAt?: Date;
    dueAmount: number;
    dueDate?: Date;
  };
  
  // Shipping Information
  shipping: {
    method: string;
    provider: string;
    trackingNumber?: string;
    shippedAt?: Date;
    estimatedDelivery?: Date;
    actualDelivery?: Date;
  };
  
  // Order Timeline
  timeline: [{
    status: string;
    timestamp: Date;
    notes?: string;
    updatedBy: ObjectId;
  }];
  
  // Notes
  customerNotes?: string;
  internalNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: ObjectId;
}
```

### Appendix B: API Endpoint Specifications

#### 1. Quotation API Endpoints
```typescript
// Quotation Management
POST   /api/quotations                    // Create new quotation
GET    /api/quotations                    // List all quotations (admin)
GET    /api/quotations/[id]               // Get specific quotation
PUT    /api/quotations/[id]               // Update quotation
DELETE /api/quotations/[id]               // Delete quotation
POST   /api/quotations/[id]/duplicate     // Duplicate quotation

// Quotation Workflow
POST   /api/quotations/[id]/send          // Send quotation to customer
POST   /api/quotations/[id]/approve       // Admin approval
POST   /api/quotations/[id]/reject        // Admin rejection
POST   /api/quotations/[id]/revise        // Create revision

// Customer Actions
GET    /api/quotations/public/[token]     // Public quotation view
POST   /api/quotations/public/[token]/respond // Customer response
POST   /api/quotations/[id]/convert-to-order  // Convert to order

// Templates & Bulk Operations
GET    /api/quotation-templates           // List templates
POST   /api/quotation-templates           // Create template
PUT    /api/quotation-templates/[id]      // Update template
POST   /api/quotations/bulk-create        // Bulk quotation creation
POST   /api/quotations/bulk-send          // Bulk send quotations

// Analytics & Reporting
GET    /api/quotations/analytics          // Quotation analytics
GET    /api/quotations/reports            // Generate reports
POST   /api/quotations/[id]/pdf           // Generate PDF
GET    /api/quotations/conversion-funnel  // Conversion analytics
```

#### 2. Customer Management API
```typescript
// Customer CRUD
POST   /api/customers                     // Create customer
GET    /api/customers                     // List customers
GET    /api/customers/[id]                // Get customer details
PUT    /api/customers/[id]                // Update customer
DELETE /api/customers/[id]                // Delete customer

// Customer Segmentation
GET    /api/customers/segments            // List customer segments
POST   /api/customers/[id]/segment        // Assign segment
GET    /api/customers/search              // Advanced customer search
POST   /api/customers/bulk-import         // Import customers from CSV

// Customer Analytics
GET    /api/customers/[id]/analytics      // Customer purchase analytics
GET    /api/customers/[id]/quotations     // Customer quotations
GET    /api/customers/[id]/orders         // Customer orders
GET    /api/customers/[id]/timeline       // Customer interaction timeline

// Credit Management
GET    /api/customers/[id]/credit         // Credit information
POST   /api/customers/[id]/credit/update  // Update credit limit
GET    /api/customers/credit-report       // Credit report
```

#### 3. Advanced Product API
```typescript
// Product Management
POST   /api/products                      // Create product
GET    /api/products                      // List products with filters
GET    /api/products/[id]                 // Get product details
PUT    /api/products/[id]                 // Update product
DELETE /api/products/[id]                 // Delete product

// Inventory Management
GET    /api/products/[id]/inventory       // Get inventory details
PUT    /api/products/[id]/inventory       // Update inventory
POST   /api/products/inventory/transfer   // Transfer between locations
GET    /api/products/low-stock            // Low stock alert

// Pricing Management
GET    /api/products/[id]/pricing         // Get pricing rules
POST   /api/products/[id]/pricing         // Create pricing rule
PUT    /api/pricing-rules/[id]            // Update pricing rule
POST   /api/products/bulk-pricing         // Bulk pricing updates

// Product Analytics
GET    /api/products/analytics            // Product performance
GET    /api/products/[id]/sales-history   // Sales history
GET    /api/products/recommendations      // Product recommendations
```

### Appendix C: UI/UX Component Specifications

#### 1. Quotation Builder Components
```typescript
// Main Quotation Builder
interface QuotationBuilderProps {
  mode: 'create' | 'edit' | 'duplicate';
  quotationId?: string;
  customerId?: string;
  onSave: (quotation: Quotation) => void;
  onCancel: () => void;
}

// Step Components
interface CustomerStepProps {
  selectedCustomer?: Customer;
  onCustomerSelect: (customer: Customer) => void;
  onNewCustomer: (customer: CustomerInfo) => void;
}

interface ProductStepProps {
  selectedProducts: QuotationItem[];
  onProductAdd: (product: Product, quantity: number) => void;
  onProductRemove: (productId: string) => void;
  onSpecificationChange: (productId: string, specs: Specification[]) => void;
}

interface PricingStepProps {
  items: QuotationItem[];
  onPricingChange: (itemId: string, pricing: ItemPricing) => void;
  onDiscountApply: (discount: DiscountRule) => void;
}

interface ReviewStepProps {
  quotation: Quotation;
  onSend: (emailConfig: EmailConfig) => void;
  onSaveAsDraft: () => void;
  onPreviewPDF: () => void;
}
```

#### 2. Dashboard Components
```typescript
// Analytics Dashboard
interface DashboardProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

interface MetricsCardProps {
  title: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  format: 'currency' | 'percentage' | 'number';
}

interface ChartComponentProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  data: ChartData[];
  xAxis: string;
  yAxis: string;
  title: string;
}

// Customer Management
interface CustomerListProps {
  customers: Customer[];
  onCustomerSelect: (customer: Customer) => void;
  onCustomerEdit: (customerId: string) => void;
  filters: CustomerFilters;
}

interface CustomerDetailProps {
  customer: Customer;
  onEdit: () => void;
  onQuotationCreate: () => void;
  onOrderCreate: () => void;
}
```

### Appendix D: Email Templates

#### 1. Quotation Email Templates
```html
<!-- Professional Quotation Email -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation from {{companyName}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #ecf0f1; padding: 15px; text-align: center; font-size: 12px; }
        .cta-button { background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{companyName}}</h1>
        <p>Industrial Machinery Solutions</p>
    </div>
    
    <div class="content">
        <h2>Dear {{customerName}},</h2>
        
        <p>Thank you for your inquiry. Please find attached our quotation <strong>{{quotationNumber}}</strong> for your requirements.</p>
        
        <h3>Quotation Summary:</h3>
        <ul>
            <li><strong>Total Amount:</strong> ₹{{totalAmount}}</li>
            <li><strong>Valid Until:</strong> {{validityDate}}</li>
            <li><strong>Delivery Time:</strong> {{deliveryTime}}</li>
        </ul>
        
        <p>You can view and respond to this quotation online by clicking the button below:</p>
        
        <p style="text-align: center;">
            <a href="{{quotationUrl}}" class="cta-button">View Quotation Online</a>
        </p>
        
        <p>If you have any questions or need clarification, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        {{salesPersonName}}<br>
        {{companyName}}<br>
        Phone: {{phoneNumber}}<br>
        Email: {{emailAddress}}</p>
    </div>
    
    <div class="footer">
        <p>&copy; {{currentYear}} {{companyName}}. All rights reserved.</p>
        <p>{{companyAddress}}</p>
    </div>
</body>
</html>
```

#### 2. Follow-up Email Templates
```html
<!-- Follow-up Email Template -->
<div class="follow-up-email">
    <h2>Gentle Reminder - Quotation {{quotationNumber}}</h2>
    
    <p>Dear {{customerName}},</p>
    
    <p>We hope this email finds you well. We wanted to follow up on the quotation we sent you on {{sentDate}} for {{productSummary}}.</p>
    
    <p>Our quotation <strong>{{quotationNumber}}</strong> is valid until <strong>{{validityDate}}</strong>. To ensure you don't miss out on the current pricing, we recommend reviewing and approving the quotation at your earliest convenience.</p>
    
    <div class="quotation-summary">
        <h3>Quick Summary:</h3>
        <p><strong>Total Value:</strong> ₹{{totalAmount}}</p>
        <p><strong>Items:</strong> {{itemCount}} products</p>
        <p><strong>Expires in:</strong> {{daysRemaining}} days</p>
    </div>
    
    <p><a href="{{quotationUrl}}" class="cta-button">Review Quotation</a></p>
    
    <p>If you have any questions or would like to discuss the quotation, please feel free to contact us.</p>
    
    <p>Thank you for considering {{companyName}} for your machinery needs.</p>
</div>
```

### Appendix E: Mobile App Specifications

#### 1. Mobile App Features
```typescript
interface MobileAppFeatures {
  // Core Features
  authentication: {
    login: boolean;
    biometricAuth: boolean;
    passwordReset: boolean;
  };
  
  // Quotation Management
  quotations: {
    create: boolean;
    view: boolean;
    edit: boolean;
    send: boolean;
    track: boolean;
  };
  
  // Product Catalog
  products: {
    browse: boolean;
    search: boolean;
    filter: boolean;
    details: boolean;
    favorites: boolean;
  };
  
  // Customer Management
  customers: {
    list: boolean;
    details: boolean;
    add: boolean;
    edit: boolean;
    history: boolean;
  };
  
  // Offline Capabilities
  offline: {
    productCatalog: boolean;
    draftQuotations: boolean;
    customerContacts: boolean;
    syncOnReconnect: boolean;
  };
  
  // Notifications
  notifications: {
    pushNotifications: boolean;
    emailAlerts: boolean;
    quotationUpdates: boolean;
    orderUpdates: boolean;
  };
}
```

#### 2. Mobile UI Components
```typescript
// Mobile-specific Components
interface MobileQuotationBuilder {
  // Step-by-step wizard
  steps: [
    'Customer Selection',
    'Product Selection', 
    'Pricing Configuration',
    'Review & Send'
  ];
  
  // Touch-optimized interactions
  gestures: {
    swipeNavigation: boolean;
    pullToRefresh: boolean;
    longPressActions: boolean;
  };
  
  // Responsive design
  breakpoints: {
    mobile: '< 768px';
    tablet: '768px - 1024px';
    desktop: '> 1024px';
  };
}
```

### Appendix F: Testing Specifications

#### 1. Test Coverage Requirements
```typescript
interface TestingStrategy {
  // Unit Testing (Target: 90% coverage)
  unitTests: {
    components: 'React Testing Library';
    utilities: 'Jest';
    hooks: 'React Hooks Testing Library';
    coverage: '90%';
  };
  
  // Integration Testing
  integrationTests: {
    apiEndpoints: 'Supertest';
    database: 'MongoDB Memory Server';
    authentication: 'NextAuth Testing';
    fileUpload: 'Multer Testing';
  };
  
  // End-to-End Testing
  e2eTests: {
    framework: 'Playwright';
    scenarios: [
      'Complete quotation flow',
      'Customer registration to order',
      'Admin product management',
      'Payment processing'
    ];
  };
  
  // Performance Testing
  performanceTests: {
    loadTesting: 'Artillery.js';
    stressTesting: 'K6';
    metrics: [
      'Response time < 200ms',
      'Throughput > 1000 req/sec',
      'Error rate < 0.1%'
    ];
  };
  
  // Security Testing
  securityTests: {
    vulnerabilityScanning: 'OWASP ZAP';
    dependencyChecking: 'npm audit';
    authenticationTesting: 'Manual testing';
    dataValidation: 'Input fuzzing';
  };
}
```

### Appendix G: Deployment & DevOps

#### 1. CI/CD Pipeline
```yaml
# GitHub Actions Workflow
name: Sanvi Machinery CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:ci
      - name: Run e2e tests
        run: npm run test:e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to Vercel Staging
        uses: vercel/vercel-action@v1
        with:
          environment: preview

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel Production
        uses: vercel/vercel-action@v1
        with:
          environment: production
```

#### 2. Monitoring & Observability
```typescript
interface MonitoringSetup {
  // Application Performance Monitoring
  apm: {
    tool: 'New Relic' | 'DataDog' | 'Sentry';
    metrics: [
      'Response times',
      'Error rates', 
      'Database performance',
      'Memory usage'
    ];
  };
  
  // Business Metrics
  businessMetrics: {
    quotationConversionRate: 'Custom dashboard';
    revenueTracking: 'Analytics integration';
    customerSatisfaction: 'Survey integration';
    systemUptime: '99.9% target';
  };
  
  // Alerting
  alerts: {
    errorRate: 'Threshold > 1%';
    responseTime: 'Average > 500ms';
    downtime: 'Immediate notification';
    businessMetrics: 'Daily/Weekly reports';
  };
}
```

### Appendix H: Security Implementation

#### 1. Security Checklist
```typescript
interface SecurityImplementation {
  // Authentication & Authorization
  auth: {
    multiFactorAuth: boolean;
    passwordPolicy: string;
    sessionManagement: boolean;
    roleBasedAccess: boolean;
  };
  
  // Data Protection
  dataProtection: {
    encryptionAtRest: 'AES-256';
    encryptionInTransit: 'TLS 1.3';
    dataBackup: 'Daily automated';
    dataRetention: 'GDPR compliant';
  };
  
  // Input Validation
  inputValidation: {
    schemaValidation: 'Zod';
    sqlInjectionPrevention: boolean;
    xssProtection: boolean;
    csrfProtection: boolean;
  };
  
  // Infrastructure Security
  infrastructure: {
    firewallRules: 'Configured';
    vpnAccess: 'Admin only';
    regularUpdates: 'Automated';
    securityAudits: 'Quarterly';
  };
}
```

### Final Implementation Checklist

#### Phase 1 Completion Criteria 
- [x] Database schema implemented and tested
- [x] Authentication system fully functional
- [x] Quotation CRUD operations working
- [ ] PDF generation implemented
- [ ] Email system configured
- [x] Customer management operational
- [x] Basic security measures in place
- [ ] Unit tests achieving 90% coverage
- [ ] Staging environment deployed

#### Phase 2 Completion Criteria 
- [ ] Dynamic pricing engine operational
- [ ] Advanced inventory management
- [ ] CRM features implemented
- [ ] Mobile-responsive design completed
- [ ] Payment gateway integrated
- [ ] Analytics dashboard functional
- [ ] Performance benchmarks met
- [ ] Security audit passed

#### Phase 3 Completion Criteria ✅
- [ ] Mobile app published
- [ ] Advanced automation features
- [ ] Comprehensive analytics
- [ ] Multi-location inventory
- [ ] Advanced integrations
- [ ] Production monitoring
- [ ] Documentation completed
- [ ] User training conducted

---

## Project Success Declaration

Upon completion of all phases, Sanvi Machinery will have transformed from a simple product showcase into a comprehensive B2B e-commerce platform that:

1. **Generates Revenue**: Through efficient quotation-to-order conversion
2. **Scales Operations**: Handles 10x more customers with same resources  
3. **Improves Customer Experience**: Professional quotation process
4. **Provides Business Intelligence**: Data-driven decision making
5. **Ensures Competitive Advantage**: Advanced features ahead of competition

**Total Development Investment**: ₹15-25 lakhs
**Expected Annual Revenue Impact**: ₹1.5-3 crores
**Projected ROI**: 300%+ within 2 years
**Market Position**: Leader in digital machinery quotation systems

This comprehensive roadmap provides the complete blueprint for transforming Sanvi Machinery into a market-leading B2B e-commerce platform with quotation generation as the core differentiator.