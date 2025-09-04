import { apiClient } from '../api';

export interface AnalyticsFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  customerId?: string;
  productId?: string;
  status?: string;
}

export interface DashboardMetrics {
  totalQuotations: number;
  totalCustomers: number;
  totalRevenue: number;
  conversionRate: number;
  averageOrderValue: number;
}

export interface BusinessMetrics {
  monthlyRevenue: number;
  quarterlyGrowth: number;
  customerAcquisitionCost: number;
  customerLifetimeValue: number;
}

export interface SalesAnalytics {
  totalSales: number;
  salesByMonth: Array<{
    month: string;
    sales: number;
  }>;
  topProducts: Array<{
    productId: string;
    sales: number;
  }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customersBySegment: Record<string, number>;
}

export interface ProductAnalytics {
  totalProducts: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    sales: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    revenue: number;
  }>;
}

export interface ConversionAnalytics {
  overallConversionRate: number;
  conversionByStage: Record<string, number>;
  conversionTrends: Array<{
    period: string;
    rate: number;
  }>;
}

export interface PerformanceMetrics {
  apiResponseTime: number;
  databaseQueryTime: number;
  cacheHitRate: number;
  errorRate: number;
  uptime: number;
}

export interface RevenueForecast {
  forecastPeriods: Array<{
    period: string;
    predictedRevenue: number;
    confidence: number;
  }>;
  totalForecast: number;
  growthRate: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentRevenue: number;
  pendingQuotations: number;
  systemLoad: number;
  timestamp: string;
}

class AnalyticsService {
  async getDashboardMetrics(filters: AnalyticsFilters = {}): Promise<DashboardMetrics> {
    const response = await apiClient.get<DashboardMetrics>('/analytics/dashboard', {
      params: filters,
    });
    return response.data;
  }

  async getBusinessMetrics(filters: AnalyticsFilters = {}): Promise<BusinessMetrics> {
    const response = await apiClient.get<BusinessMetrics>('/analytics/business', {
      params: filters,
    });
    return response.data;
  }

  async getSalesAnalytics(dateRange: { startDate: string; endDate: string }): Promise<SalesAnalytics> {
    const response = await apiClient.get<SalesAnalytics>('/analytics/sales', {
      params: dateRange,
    });
    return response.data;
  }

  async getCustomerAnalytics(dateRange: { startDate: string; endDate: string }): Promise<CustomerAnalytics> {
    const response = await apiClient.get<CustomerAnalytics>('/analytics/customers', {
      params: dateRange,
    });
    return response.data;
  }

  async getProductAnalytics(dateRange: { startDate: string; endDate: string }): Promise<ProductAnalytics> {
    const response = await apiClient.get<ProductAnalytics>('/analytics/products', {
      params: dateRange,
    });
    return response.data;
  }

  async getConversionAnalytics(filters: AnalyticsFilters = {}): Promise<ConversionAnalytics> {
    const response = await apiClient.get<ConversionAnalytics>('/analytics/conversion', {
      params: filters,
    });
    return response.data;
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const response = await apiClient.get<PerformanceMetrics>('/analytics/performance');
    return response.data;
  }

  async getRevenueForecast(params: { 
    months: number; 
    includeSeasonality?: boolean;
    customerId?: string;
  }): Promise<RevenueForecast> {
    const response = await apiClient.get<RevenueForecast>('/analytics/forecast', {
      params,
    });
    return response.data;
  }

  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    const response = await apiClient.get<RealTimeMetrics>('/analytics/realtime');
    return response.data;
  }
}

export const analyticsService = new AnalyticsService();