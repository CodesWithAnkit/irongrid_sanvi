import { PaginatedResponse } from '../types/api';
import { apiClient } from '../api';
import type { 
  Customer, 
  PaginationParams, 
  FilterParams,
  CustomerType,
  Address 
} from '../types/api';

export interface CreateCustomerRequest {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  customerType: CustomerType;
  creditLimit: number;
  paymentTerms: string;
  taxId?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: Address;
  customerType?: CustomerType;
  creditLimit?: number;
  paymentTerms?: string;
  taxId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CustomerFilters extends FilterParams {
  customerType?: CustomerType;
  isActive?: boolean;
  creditLimitMin?: number;
  creditLimitMax?: number;
  city?: string;
  state?: string;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'NOTE';
  subject: string;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface CustomerAnalytics {
  totalRevenue: number;
  orderCount: number;
  quotationCount: number;
  averageOrderValue: number;
  lastOrderDate?: string;
  lifetimeValue: number;
  paymentHistory: Array<{
    date: string;
    amount: number;
    status: string;
  }>;
}

export interface ImportResult {
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export const customerService = {
  async getCustomers(
    params: PaginationParams & CustomerFilters = {}
  ): Promise<PaginatedResponse<Customer>> {
    const response = await apiClient.get<PaginatedResponse<Customer>>('/customers', {
      params
    });
    return response;
  },

  async getCustomer(id: string): Promise<Customer> {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response;
  },

  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post<Customer>('/customers', data);
    return response;
  },

  async updateCustomer(id: string, data: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response;
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },

  async searchCustomers(query: string): Promise<Customer[]> {
    const response = await apiClient.get<Customer[]>('/customers/search', {
      params: { q: query }
    });
    return response;
  },

  async getCustomerAnalytics(id: string): Promise<CustomerAnalytics> {
    const response = await apiClient.get<CustomerAnalytics>(`/customers/${id}/analytics`);
    return response;
  },

  async getCustomerInteractions(id: string): Promise<CustomerInteraction[]> {
    const response = await apiClient.get<CustomerInteraction[]>(`/customers/${id}/interactions`);
    return response;
  },

  async addCustomerInteraction(
    id: string, 
    interaction: Omit<CustomerInteraction, 'id' | 'customerId' | 'createdBy' | 'createdAt'>
  ): Promise<CustomerInteraction> {
    const response = await apiClient.post<CustomerInteraction>(
      `/customers/${id}/interactions`, 
      interaction
    );
    return response;
  },

  async updateCreditLimit(id: string, creditLimit: number): Promise<Customer> {
    const response = await apiClient.put<Customer>(`/customers/${id}/credit-limit`, {
      creditLimit
    });
    return response;
  },

  async importCustomers(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImportResult>('/customers/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  async exportCustomers(filters: CustomerFilters = {}): Promise<Blob> {
    return await apiClient.get('/customers/export', {
      params: filters,
      responseType: 'blob',
    });
  },
};