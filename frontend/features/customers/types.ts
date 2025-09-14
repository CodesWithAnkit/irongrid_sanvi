export interface Customer {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: string;
  city?: string;
  state?: string;
  country: string;
  postalCode?: string;
  customerType: string;
  creditLimit: string;
  paymentTerms: string;
  taxId?: string;
  gstNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  quotations: any[];
  orders: any[];
  interactions: any[];
  totalQuotations: number;
  totalOrders: number;
}

export interface PaginatedCustomersResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCustomerRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType?: string;
  creditLimit?: string;
  paymentTerms?: string;
  taxId?: string;
  gstNumber?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  customerType?: string;
  creditLimit?: string;
  paymentTerms?: string;
  taxId?: string;
  gstNumber?: string;
  notes?: string;
  isActive?: boolean;
}