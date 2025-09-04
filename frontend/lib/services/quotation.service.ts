import { apiClient } from '../api';
import type { 
  Quotation, 
  PaginatedResponse, 
  PaginationParams, 
  FilterParams,
  QuotationStatus 
} from '../types/api';

export interface CreateQuotationRequest {
  customerId: string;
  items: CreateQuotationItemRequest[];
  validUntil: string;
  termsConditions: string;
  notes?: string;
}

export interface CreateQuotationItemRequest {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercentage?: number;
  customSpecifications?: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
  deliveryTimeline?: string;
}

export interface UpdateQuotationRequest {
  customerId?: string;
  items?: CreateQuotationItemRequest[];
  validUntil?: string;
  termsConditions?: string;
  notes?: string;
  status?: QuotationStatus;
}

export interface QuotationFilters extends FilterParams {
  status?: QuotationStatus;
  customerId?: string;
  createdBy?: string;
  validFrom?: string;
  validTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface SendQuotationRequest {
  recipientEmail?: string;
  subject?: string;
  message?: string;
  templateId?: string;
}

export interface QuotationAnalytics {
  totalQuotations: number;
  conversionRate: number;
  averageValue: number;
  statusBreakdown: Record<QuotationStatus, number>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    value: number;
    conversionRate: number;
  }>;
}

export const quotationService = {
  async getQuotations(
    params: PaginationParams & QuotationFilters = {}
  ): Promise<PaginatedResponse<Quotation>> {
    const response = await apiClient.get<PaginatedResponse<Quotation>>('/quotations', {
      params
    });
    return response.data;
  },

  async getQuotation(id: string): Promise<Quotation> {
    const response = await apiClient.get<Quotation>(`/quotations/${id}`);
    return response.data;
  },

  async createQuotation(data: CreateQuotationRequest): Promise<Quotation> {
    const response = await apiClient.post<Quotation>('/quotations', data);
    return response.data;
  },

  async updateQuotation(id: string, data: UpdateQuotationRequest): Promise<Quotation> {
    const response = await apiClient.put<Quotation>(`/quotations/${id}`, data);
    return response.data;
  },

  async deleteQuotation(id: string): Promise<void> {
    await apiClient.delete(`/quotations/${id}`);
  },

  async duplicateQuotation(id: string): Promise<Quotation> {
    const response = await apiClient.post<Quotation>(`/quotations/${id}/duplicate`);
    return response.data;
  },

  async sendQuotation(id: string, data: SendQuotationRequest = {}): Promise<void> {
    await apiClient.post(`/quotations/${id}/send`, data);
  },

  async generatePDF(id: string): Promise<string> {
    const response = await apiClient.get<{ pdfUrl: string }>(`/quotations/${id}/pdf`);
    return response.data.pdfUrl;
  },

  async approveQuotation(id: string, notes?: string): Promise<Quotation> {
    const response = await apiClient.post<Quotation>(`/quotations/${id}/approve`, { notes });
    return response.data;
  },

  async rejectQuotation(id: string, reason: string): Promise<Quotation> {
    const response = await apiClient.post<Quotation>(`/quotations/${id}/reject`, { reason });
    return response.data;
  },

  async convertToOrder(id: string): Promise<{ orderId: string }> {
    const response = await apiClient.post<{ orderId: string }>(`/quotations/${id}/convert`);
    return response.data;
  },

  async getQuotationAnalytics(filters: QuotationFilters = {}): Promise<QuotationAnalytics> {
    const response = await apiClient.get<QuotationAnalytics>('/quotations/analytics', {
      params: filters
    });
    return response.data;
  },

  async getPublicQuotation(token: string): Promise<Quotation> {
    const response = await apiClient.get<Quotation>(`/quotations/public/${token}`);
    return response.data;
  },

  async respondToQuotation(
    token: string, 
    response: 'APPROVED' | 'REJECTED', 
    notes?: string
  ): Promise<void> {
    await apiClient.post(`/quotations/public/${token}/respond`, {
      response,
      notes
    });
  },
};