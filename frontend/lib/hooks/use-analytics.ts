import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import { queryKeys } from '../query-client';

export interface AnalyticsFilters {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  customerId?: string;
  productId?: string;
  status?: string;
}

export function useDashboardAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.dashboard(filters),
    queryFn: () => analyticsService.getDashboardMetrics(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
}

export function useBusinessAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.business(filters),
    queryFn: () => analyticsService.getBusinessMetrics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSalesAnalytics(dateRange: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: queryKeys.analytics.sales(dateRange),
    queryFn: () => analyticsService.getSalesAnalytics(dateRange),
    enabled: !!dateRange.startDate && !!dateRange.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerAnalytics(dateRange: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: queryKeys.analytics.customers(dateRange),
    queryFn: () => analyticsService.getCustomerAnalytics(dateRange),
    enabled: !!dateRange.startDate && !!dateRange.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProductAnalytics(dateRange: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: queryKeys.analytics.products(dateRange),
    queryFn: () => analyticsService.getProductAnalytics(dateRange),
    enabled: !!dateRange.startDate && !!dateRange.endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useConversionAnalytics(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: queryKeys.analytics.conversion(filters),
    queryFn: () => analyticsService.getConversionAnalytics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: queryKeys.analytics.performance(),
    queryFn: () => analyticsService.getPerformanceMetrics(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes
  });
}

export function useRevenueForecast(params: { 
  months: number; 
  includeSeasonality?: boolean;
  customerId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.analytics.forecast(params),
    queryFn: () => analyticsService.getRevenueForecast(params),
    enabled: params.months > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Real-time analytics hook with WebSocket support
export function useRealTimeAnalytics(enabled = true) {
  return useQuery({
    queryKey: ['analytics', 'realtime'],
    queryFn: () => analyticsService.getRealTimeMetrics(),
    enabled,
    staleTime: 0, // Always fresh
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    refetchIntervalInBackground: true,
  });
}