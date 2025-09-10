export interface QuotationItem {
  id?: string;
  quotationId?: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  discount: string | number;
  total: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  items?: QuotationItem[];
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    address: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface CreateQuotationRequest {
  customerId: string;
  validUntil: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
}

export interface UpdateQuotationRequest {
  status?: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
  validUntil?: string;
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
    id?: string;
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
    productId: string;
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
    status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
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