import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { useCacheManagement, useAutoCacheManagement } from '../use-cache-management';

// Mock services
jest.mock('../../services/customer.service', () => ({
  customerService: {
    getCustomerAnalytics: jest.fn().mockResolvedValue({ totalOrders: 5 }),
    getCustomerInteractions: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/product.service', () => ({
  productService: {
    getPricingRules: jest.fn().mockResolvedValue([]),
    getCategories: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../services/analytics.service', () => ({
  analyticsService: {
    getDashboardMetrics: jest.fn().mockResolvedValue({ totalQuotations: 10 }),
  },
}));

describe('useCacheManagement', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

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

  describe('prefetchData', () => {
    it('should prefetch data with custom stale time', async () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      const queryKey = ['test'];
      const queryFn = jest.fn().mockResolvedValue({ data: 'test' });

      await act(async () => {
        await result.current.prefetchData(queryKey, queryFn, 10000);
      });

      expect(queryFn).toHaveBeenCalled();
      expect(queryClient.getQueryData(queryKey)).toEqual({ data: 'test' });
    });
  });

  describe('prefetchRelatedData', () => {
    it('should prefetch customer related data', async () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      await act(async () => {
        await result.current.prefetchRelatedData({ customerId: '1' });
      });

      // Verify that customer analytics and interactions were prefetched
      const analyticsData = queryClient.getQueryData(['customers', '1', 'analytics']);
      const interactionsData = queryClient.getQueryData(['customers', '1', 'interactions']);

      expect(analyticsData).toEqual({ totalOrders: 5 });
      expect(interactionsData).toEqual([]);
    });

    it('should prefetch product related data', async () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      await act(async () => {
        await result.current.prefetchRelatedData({ 
          productId: '1', 
          customerId: '2' 
        });
      });

      // Verify that pricing rules were prefetched
      const pricingRulesData = queryClient.getQueryData(['products', '1', 'pricing-rules', '2']);
      expect(pricingRulesData).toEqual([]);
    });
  });

  describe('warmCache', () => {
    it('should warm frequently accessed data', async () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      await act(async () => {
        await result.current.warmCache();
      });

      // Verify that categories and dashboard data were cached
      const categoriesData = queryClient.getQueryData(['products', 'categories']);
      const dashboardData = queryClient.getQueryData(['analytics', 'dashboard', {}]);

      expect(categoriesData).toEqual([]);
      expect(dashboardData).toEqual({ totalQuotations: 10 });
    });
  });

  describe('invalidateRelatedData', () => {
    it('should invalidate customer related data', async () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      // Set up some cached data
      queryClient.setQueryData(['customers', '1'], { name: 'Test Customer' });
      queryClient.setQueryData(['customers', 'list'], { data: [] });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current.invalidateRelatedData({ customerId: '1' });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customers', '1'],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['customers', 'list'],
      });
    });

    it('should invalidate analytics when any data changes', async () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      act(() => {
        result.current.invalidateRelatedData({ quotationId: '1' });
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['analytics'],
      });
    });
  });

  describe('clearStaleCache', () => {
    it('should clear stale cache entries', async () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      // Set up some cached data with old timestamp
      const oldTimestamp = Date.now() - 60 * 60 * 1000; // 1 hour ago
      queryClient.setQueryData(['old-data'], { data: 'old' });
      
      // Mock the query state to have old timestamp
      const query = queryClient.getQueryCache().find({ queryKey: ['old-data'] });
      if (query) {
        (query.state as any).dataUpdatedAt = oldTimestamp;
      }

      const removeSpy = jest.spyOn(queryClient, 'removeQueries');

      act(() => {
        result.current.clearStaleCache(30 * 60 * 1000); // 30 minutes
      });

      expect(removeSpy).toHaveBeenCalledWith({
        queryKey: ['old-data'],
      });
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      // Set up some cached data
      queryClient.setQueryData(['test1'], { data: 'test1' });
      queryClient.setQueryData(['test2'], { data: 'test2' });

      const stats = result.current.getCacheStats();

      expect(stats).toEqual({
        totalQueries: expect.any(Number),
        activeQueries: expect.any(Number),
        staleQueries: expect.any(Number),
        errorQueries: expect.any(Number),
        loadingQueries: expect.any(Number),
        cacheSize: expect.any(Number),
      });

      expect(stats.totalQueries).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('useAutoCacheManagement', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

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
    jest.useFakeTimers();
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  describe('initializeCache', () => {
    it('should initialize cache without errors', async () => {
      const { result } = renderHook(() => useAutoCacheManagement(), { wrapper });

      await act(async () => {
        await result.current.initializeCache();
      });

      // Verify that cache was warmed
      const categoriesData = queryClient.getQueryData(['products', 'categories']);
      const dashboardData = queryClient.getQueryData(['analytics', 'dashboard', {}]);

      expect(categoriesData).toEqual([]);
      expect(dashboardData).toEqual({ totalQuotations: 10 });
    });

    it('should handle cache warming errors gracefully', async () => {
      // Mock a service to throw an error
      const mockError = new Error('Service unavailable');
      jest.doMock('../../services/analytics.service', () => ({
        analyticsService: {
          getDashboardMetrics: jest.fn().mockRejectedValue(mockError),
        },
      }));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const { result } = renderHook(() => useAutoCacheManagement(), { wrapper });

      await act(async () => {
        await result.current.initializeCache();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Cache warming failed:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('startCacheMaintenance', () => {
    it('should set up periodic cache maintenance', () => {
      const { result } = renderHook(() => useAutoCacheManagement(), { wrapper });

      let cleanup: (() => void) | undefined;

      act(() => {
        cleanup = result.current.startCacheMaintenance();
      });

      expect(cleanup).toBeInstanceOf(Function);

      // Test cleanup
      act(() => {
        cleanup?.();
      });

      // Should not throw any errors
    });

    it('should perform background refresh on interval', async () => {
      const { result } = renderHook(() => useAutoCacheManagement(), { wrapper });

      const refetchSpy = jest.spyOn(queryClient, 'refetchQueries');

      let cleanup: (() => void) | undefined;

      act(() => {
        cleanup = result.current.startCacheMaintenance();
      });

      // Fast-forward time to trigger background refresh
      act(() => {
        jest.advanceTimersByTime(5 * 60 * 1000); // 5 minutes
      });

      // Wait for async operations
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(refetchSpy).toHaveBeenCalled();

      act(() => {
        cleanup?.();
      });
    });
  });
});