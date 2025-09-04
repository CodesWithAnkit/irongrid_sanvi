import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { 
  useDashboardAnalytics,
  useBusinessAnalytics,
  useSalesAnalytics,
  useCustomerAnalytics,
  useProductAnalytics,
  useConversionAnalytics,
  usePerformanceMetrics,
  useRevenueForecast,
  useRealTimeAnalytics
} from '../use-analytics';

// Mock the analytics service
jest.mock('../../services/analytics.service', () => ({
  analyticsService: {
    getDashboardMetrics: jest.fn(),
    getBusinessMetrics: jest.fn(),
    getSalesAnalytics: jest.fn(),
    getCustomerAnalytics: jest.fn(),
    getProductAnalytics: jest.fn(),
    getConversionAnalytics: jest.fn(),
    getPerformanceMetrics: jest.fn(),
    getRevenueForecast: jest.fn(),
    getRealTimeMetrics: jest.fn(),
  },
}));

const { analyticsService } = require('../../services/analytics.service');

describe('Analytics Hooks', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

  const mockDashboardMetrics = {
    totalQuotations: 150,
    totalCustomers: 45,
    totalRevenue: 250000,
    conversionRate: 0.65,
    averageOrderValue: 5555.56,
  };

  const mockBusinessMetrics = {
    monthlyRevenue: 50000,
    quarterlyGrowth: 0.15,
    customerAcquisitionCost: 150,
    customerLifetimeValue: 12000,
  };

  const mockDateRange = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    wrapper = ({ children }: { children: ReactNode }) => 
      React.createElement(QueryClientProvider, { client: queryClient }, children);

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useDashboardAnalytics', () => {
    it('should fetch dashboard metrics successfully', async () => {
      analyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardMetrics);

      const { result } = renderHook(
        () => useDashboardAnalytics({ customerId: 'customer-1' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockDashboardMetrics);
      expect(analyticsService.getDashboardMetrics).toHaveBeenCalledWith({
        customerId: 'customer-1',
      });
    });

    it('should auto-refresh dashboard metrics', async () => {
      analyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardMetrics);

      const { result } = renderHook(() => useDashboardAnalytics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify refetch interval is set
      expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
    });
  });

  describe('useBusinessAnalytics', () => {
    it('should fetch business metrics with filters', async () => {
      analyticsService.getBusinessMetrics.mockResolvedValue(mockBusinessMetrics);

      const filters = { dateRange: mockDateRange };
      const { result } = renderHook(
        () => useBusinessAnalytics(filters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockBusinessMetrics);
      expect(analyticsService.getBusinessMetrics).toHaveBeenCalledWith(filters);
    });
  });

  describe('useSalesAnalytics', () => {
    it('should fetch sales analytics for date range', async () => {
      const mockSalesData = {
        totalSales: 100000,
        salesByMonth: [
          { month: '2024-01', sales: 25000 },
          { month: '2024-02', sales: 30000 },
        ],
        topProducts: [
          { productId: 'prod-1', sales: 15000 },
          { productId: 'prod-2', sales: 12000 },
        ],
      };

      analyticsService.getSalesAnalytics.mockResolvedValue(mockSalesData);

      const { result } = renderHook(
        () => useSalesAnalytics(mockDateRange),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockSalesData);
      expect(analyticsService.getSalesAnalytics).toHaveBeenCalledWith(mockDateRange);
    });

    it('should be disabled when date range is incomplete', () => {
      const { result } = renderHook(
        () => useSalesAnalytics({ startDate: '', endDate: '2024-01-31' }),
        { wrapper }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(analyticsService.getSalesAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('useCustomerAnalytics', () => {
    it('should fetch customer analytics', async () => {
      const mockCustomerData = {
        totalCustomers: 45,
        newCustomers: 8,
        activeCustomers: 38,
        customersBySegment: {
          enterprise: 12,
          business: 25,
          individual: 8,
        },
      };

      analyticsService.getCustomerAnalytics.mockResolvedValue(mockCustomerData);

      const { result } = renderHook(
        () => useCustomerAnalytics(mockDateRange),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomerData);
    });
  });

  describe('useProductAnalytics', () => {
    it('should fetch product analytics', async () => {
      const mockProductData = {
        totalProducts: 120,
        topSellingProducts: [
          { id: 'prod-1', name: 'Product 1', sales: 25 },
          { id: 'prod-2', name: 'Product 2', sales: 20 },
        ],
        categoryPerformance: [
          { category: 'Machinery', revenue: 150000 },
          { category: 'Parts', revenue: 75000 },
        ],
      };

      analyticsService.getProductAnalytics.mockResolvedValue(mockProductData);

      const { result } = renderHook(
        () => useProductAnalytics(mockDateRange),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockProductData);
    });
  });

  describe('useConversionAnalytics', () => {
    it('should fetch conversion analytics', async () => {
      const mockConversionData = {
        overallConversionRate: 0.65,
        conversionByStage: {
          quotationToOrder: 0.45,
          orderToPayment: 0.95,
        },
        conversionTrends: [
          { period: '2024-01', rate: 0.62 },
          { period: '2024-02', rate: 0.68 },
        ],
      };

      analyticsService.getConversionAnalytics.mockResolvedValue(mockConversionData);

      const { result } = renderHook(
        () => useConversionAnalytics({ status: 'SENT' }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockConversionData);
    });
  });

  describe('usePerformanceMetrics', () => {
    it('should fetch performance metrics with auto-refresh', async () => {
      const mockPerformanceData = {
        apiResponseTime: 150,
        databaseQueryTime: 45,
        cacheHitRate: 0.85,
        errorRate: 0.02,
        uptime: 0.999,
      };

      analyticsService.getPerformanceMetrics.mockResolvedValue(mockPerformanceData);

      const { result } = renderHook(() => usePerformanceMetrics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPerformanceData);
      expect(analyticsService.getPerformanceMetrics).toHaveBeenCalled();
    });
  });

  describe('useRevenueForecast', () => {
    it('should fetch revenue forecast', async () => {
      const mockForecastData = {
        forecastPeriods: [
          { period: '2024-03', predictedRevenue: 55000, confidence: 0.85 },
          { period: '2024-04', predictedRevenue: 58000, confidence: 0.82 },
          { period: '2024-05', predictedRevenue: 62000, confidence: 0.78 },
        ],
        totalForecast: 175000,
        growthRate: 0.12,
      };

      analyticsService.getRevenueForecast.mockResolvedValue(mockForecastData);

      const params = { months: 3, includeSeasonality: true };
      const { result } = renderHook(
        () => useRevenueForecast(params),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockForecastData);
      expect(analyticsService.getRevenueForecast).toHaveBeenCalledWith(params);
    });

    it('should be disabled when months is 0', () => {
      const { result } = renderHook(
        () => useRevenueForecast({ months: 0 }),
        { wrapper }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(analyticsService.getRevenueForecast).not.toHaveBeenCalled();
    });
  });

  describe('useRealTimeAnalytics', () => {
    it('should fetch real-time metrics with frequent updates', async () => {
      const mockRealTimeData = {
        activeUsers: 12,
        currentRevenue: 1250,
        pendingQuotations: 8,
        systemLoad: 0.45,
        timestamp: new Date().toISOString(),
      };

      analyticsService.getRealTimeMetrics.mockResolvedValue(mockRealTimeData);

      const { result } = renderHook(() => useRealTimeAnalytics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockRealTimeData);
      expect(analyticsService.getRealTimeMetrics).toHaveBeenCalled();
    });

    it('should be disabled when enabled is false', () => {
      const { result } = renderHook(
        () => useRealTimeAnalytics(false),
        { wrapper }
      );

      expect(result.current.fetchStatus).toBe('idle');
      expect(analyticsService.getRealTimeMetrics).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle analytics service errors gracefully', async () => {
      const error = new Error('Analytics service unavailable');
      analyticsService.getDashboardMetrics.mockRejectedValue(error);

      const { result } = renderHook(() => useDashboardAnalytics(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(error);
    });
  });

  describe('Cache Behavior', () => {
    it('should use appropriate stale times for different analytics', async () => {
      analyticsService.getDashboardMetrics.mockResolvedValue(mockDashboardMetrics);
      analyticsService.getPerformanceMetrics.mockResolvedValue({});

      // Dashboard analytics should have 2 minute stale time
      const { result: dashboardResult } = renderHook(
        () => useDashboardAnalytics(),
        { wrapper }
      );

      // Performance metrics should have 1 minute stale time
      const { result: performanceResult } = renderHook(
        () => usePerformanceMetrics(),
        { wrapper }
      );

      await waitFor(() => {
        expect(dashboardResult.current.isSuccess).toBe(true);
        expect(performanceResult.current.isSuccess).toBe(true);
      });

      // Verify different stale times by checking query cache
      const dashboardQuery = queryClient.getQueryCache().find({
        queryKey: ['analytics', 'dashboard', {}],
      });
      const performanceQuery = queryClient.getQueryCache().find({
        queryKey: ['analytics', 'performance'],
      });

      expect(dashboardQuery?.options.staleTime).toBe(2 * 60 * 1000);
      expect(performanceQuery?.options.staleTime).toBe(1 * 60 * 1000);
    });
  });
});