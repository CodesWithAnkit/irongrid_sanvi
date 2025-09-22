export interface QuotationItem {
  id?: string;
  quotationId?: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  discountPercentage: string;
  discountAmount: string;
  lineTotal: string;
  customSpecifications: Record<string, any> | null;
  deliveryTimeline: string | null;
  product?: {
    id: string;
    sku: string;
    name: string;
    description: string;
  };
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  validUntil: string;
  termsConditions: string | null;
  notes: string | null;
  pdfUrl: string | null;
  emailSentAt: string | null;
  customerViewedAt: string | null;
  customerRespondedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  items?: QuotationItem[];
  customer?: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface QuotationResponse {
  data: Quotation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

export interface PaginatedQuotationResponse {
  data: Quotation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateQuotationRequest {
  customerId: string;
  validUntil: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
    customSpecifications?: Record<string, any>;
    deliveryTimeline?: string;
  }>;
  termsConditions?: string;
  notes?: string;
}

export interface UpdateQuotationRequest {
  status?: "DRAFT" | "SENT" | "REJECTED" | "APPROVED" | "EXPIRED";
  validUntil?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discountPercentage?: number;
    customSpecifications?: Record<string, any>;
    deliveryTimeline?: string;
  }>;
  termsConditions?: string;
  notes?: string;
}

export interface EmailQuotationRequest {
  email: string;
}

// Enhanced types for multi-step wizard
export interface QuotationWizardStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface QuotationBuilderData {
  // Customer Selection Step
  customer: {
    id?: number;
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    isNewCustomer?: boolean;
  };
  
  // Product Configuration Step
  items: Array<{
    id: string;
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    customSpecifications?: string;
    total: number;
  }>;
  
  // Pricing and Terms Step
  pricing: {
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    shippingCost: number;
    totalDiscount: number;
    grandTotal: number;
  };
  
  terms: {
    paymentTerms: string;
    deliveryTerms: string;
    validUntil: string;
    notes?: string;
    termsTemplate?: string;
  };
  
  // Review and Send Step
  review: {
    quotationNumber: string;
    status: "DRAFT" | "SENT";
    emailOptions?: {
      recipientEmail: string;
      subject: string;
      message: string;
      template: string;
    };
  };
}

export interface ProductSpecification {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
  value?: string | number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
}

export interface TermsTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}