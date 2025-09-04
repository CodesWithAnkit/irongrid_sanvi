export interface QuotationItem {
  id?: number;
  quotationId?: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  discount: string | number;
  total: string;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  customerId: number;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: number;
  items?: QuotationItem[];
  customer?: {
    id: number;
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
  customerId: number;
  validUntil: string;
  items: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
}

export interface UpdateQuotationRequest {
  status?: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED";
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