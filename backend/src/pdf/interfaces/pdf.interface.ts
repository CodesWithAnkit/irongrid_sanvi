export interface PdfGenerationOptions {
  template: string;
  data: any;
  filename?: string;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

export interface PdfTemplate {
  id: string;
  name: string;
  htmlContent: string;
  cssContent?: string;
  variables: TemplateVariable[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  description?: string;
  required: boolean;
  defaultValue?: any;
}

export interface QuotationPdfData {
  quotation: {
    quotationNumber: string;
    date: string;
    validUntil: string;
    status: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    termsConditions: string;
    notes?: string;
  };
  customer: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  company: {
    name: string;
    logo?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    phone: string;
    email: string;
    website?: string;
    taxId?: string;
  };
  items: Array<{
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    lineTotal: number;
    specifications?: string;
  }>;
}

export interface PdfStorageResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}