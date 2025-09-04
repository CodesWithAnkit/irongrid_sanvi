import { api } from '../api';

export interface DateRangeType {
  LAST_7_DAYS: 'last_7_days';
  LAST_30_DAYS: 'last_30_days';
  LAST_90_DAYS: 'last_90_days';
  LAST_YEAR: 'last_year';
  CUSTOM: 'custom';
}

export interface AnalyticsQuery {
  dateRange?: keyof DateRangeType;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  productId?: string;
}

export interface BusinessMetrics {
  quotationMetrics: {
    totalQuotations: number;
    conversionRate: number;
    averageValue: number;
    responseTime: number;
    statusBreakdown: Record<string, number>;
  };
  customerMetrics: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    customerLifetimeValue: number;
    topCustomers: Array<{
      id: string;
      name: string;
      totalValue: number;
      quotationCount: number;
    }>;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyGrowth: number;
    forecastedRevenue: number;
    revenueByMonth: Array<{
      month: string;
      revenue: number;
      quotations: number;
    }>;
    topProducts: Array<{
      id: string;
      name: string;
      revenue: number;
      quantity: number;
    }>;
  };
  performanceMetrics: {
    averageQuotationTime: number;
    emailDeliveryRate: number;
    systemUptime: number;
    apiResponseTime: number;
  };
}

export interface SalesPerformanceMetrics {
  totalSales: number;
  salesGrowth: number;
  averageDealSize: number;
  salesByUser: Array<{
    userId: string;
    userName: string;
    totalSales: number;
    quotationCount: number;
    conversionRate: number;
  }>;
  salesByPeriod: Array<{
    period: string;
    sales: number;
    quotations: number;
    conversions: number;
  }>;
}

export interface CustomerLifetimeValueMetrics {
  averageClv: number;
  clvGrowth: number;
  customerSegments: Array<{
    segment: string;
    averageClv: number;
    customerCount: number;
    totalValue: number;
  }>;
  clvDistribution: Array<{
    range: string;
    customerCount: number;
    percentage: number;
  }>;
  topValueCustomers: Array<{
    customerId: string;
    customerName: string;
    clv: number;
    totalOrders: number;
    lastOrderDate: Date;
  }>;
}

export interface ProductPerformanceMetrics {
  totalProducts: number;
  topPerformingProducts: Array<{
    productId: string;
    productName: string;
    revenue: number;
    quantitySold: number;
    profitMargin: number;
    quotationCount: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    revenue: number;
    productCount: number;
    averagePrice: number;
  }>;
  inventoryInsights: Array<{
    productId: string;
    productName: string;
    currentStock: number;
    reorderLevel: number;
    turnoverRate: number;
  }>;
}

export interface RevenueForecasting {
  forecastedRevenue: Array<{
    period: string;
    predictedRevenue: number;
    confidence: number;
    actualRevenue?: number;
  }>;
  trendAnalysis: {
    trend: 'increasing' | 'decreasing' | 'stable';
    growthRate: number;
    seasonality: boolean;
    factors: string[];
  };
  scenarios: {
    optimistic: number;
    realistic: number;
    pessimistic: number;
  };
}

export const analyticsService = {
  async getDashboardMetrics(query: AnalyticsQuery = {}): Promise<BusinessMetrics> {
    const response = await api.get('/analytics/dashboard', { params: query });
    return response.data.data;
  },

  async getSalesPerformance(query: AnalyticsQuery = {}): Promise<SalesPerformanceMetrics> {
    const response = await api.get('/analytics/sales-performance', { params: query });
    return response.data.data;
  },

  async getCustomerLifetimeValue(query: AnalyticsQuery = {}): Promise<CustomerLifetimeValueMetrics> {
    const response = await api.get('/analytics/customer-lifetime-value', { params: query });
    return response.data.data;
  },

  async getProductPerformance(query: AnalyticsQuery = {}): Promise<ProductPerformanceMetrics> {
    const response = await api.get('/analytics/product-performance', { params: query });
    return response.data.data;
  },

  async getRevenueForecasting(query: AnalyticsQuery = {}): Promise<RevenueForecasting> {
    const response = await api.get('/analytics/revenue-forecasting', { params: query });
    return response.data.data;
  },
};