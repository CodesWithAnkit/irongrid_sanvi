import { apiClient } from '../api';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  status?: string;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface CreateOrderRequest {
  customerId: string;
  quotationId?: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
}

export interface UpdateOrderRequest {
  status?: string;
  shippingAddress?: Address;
  billingAddress?: Address;
  notes?: string;
}

export interface PaymentRequest {
  amount: number;
  paymentMethod: string;
  cardToken?: string;
  bankDetails?: any;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  customSpecifications?: Record<string, any>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  quotationId?: string;
  status: string;
  paymentStatus: string;
  refundStatus?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  invoiceUrl?: string;
  invoiceNumber?: string;
  invoiceGeneratedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTracking {
  status: string;
  trackingNumber: string;
  estimatedDelivery: string;
  updates: Array<{
    timestamp: string;
    status: string;
    location: string;
  }>;
}

export interface OrderHistory {
  orders: Order[];
  totalOrders: number;
  totalValue: number;
  averageOrderValue: number;
}

export interface InvoiceData {
  invoiceUrl: string;
  invoiceNumber: string;
}

export interface PaymentResult {
  paymentId: string;
  status: string;
  transactionId: string;
}

export interface RefundResult {
  refundId: string;
  amount: number;
  status: string;
}

class OrderService {
  async getOrders(params: PaginationParams & OrderFilters = {}) {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${id}`);
    return response.data;
  }

  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<Order>('/orders', data);
    return response.data;
  }

  async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    const response = await apiClient.put<Order>(`/orders/${id}`, data);
    return response.data;
  }

  async updateOrderStatus(id: string, status: string, notes?: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/orders/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  }

  async processPayment(orderId: string, paymentData: PaymentRequest): Promise<PaymentResult> {
    const response = await apiClient.post<PaymentResult>(`/orders/${orderId}/payment`, paymentData);
    return response.data;
  }

  async generateInvoice(orderId: string): Promise<InvoiceData> {
    const response = await apiClient.post<InvoiceData>(`/orders/${orderId}/invoice`);
    return response.data;
  }

  async cancelOrder(id: string, reason: string): Promise<void> {
    await apiClient.post(`/orders/${id}/cancel`, { reason });
  }

  async refundOrder(id: string, amount?: number, reason?: string): Promise<RefundResult> {
    const response = await apiClient.post<RefundResult>(`/orders/${id}/refund`, {
      amount,
      reason,
    });
    return response.data;
  }

  async getOrderTracking(orderId: string): Promise<OrderTracking> {
    const response = await apiClient.get<OrderTracking>(`/orders/${orderId}/tracking`);
    return response.data;
  }

  async getOrderHistory(customerId: string): Promise<OrderHistory> {
    const response = await apiClient.get<OrderHistory>(`/orders/history/${customerId}`);
    return response.data;
  }
}

export const orderService = new OrderService();