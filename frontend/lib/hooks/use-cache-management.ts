import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, invalidateQueries } from '../query-client';

export function useCacheManagement() {
  const queryClient = useQueryClient();

  // Prefetch data for better UX
  const prefetchData = useCallback(async (
    queryKey: readonly unknown[],
    queryFn: () => Promise<any>,
    staleTime?: number
  ) => {
    await queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: staleTime || 5 * 60 * 1000, // 5 minutes default
    });
  }, [queryClient]);

  // Prefetch related data based on current context
  const prefetchRelatedData = useCallback(async (context: {
    customerId?: string;
    productId?: string;
    quotationId?: string;
  }) => {
    const prefetchPromises: Promise<void>[] = [];

    if (context.customerId) {
      // Prefetch customer analytics and interactions
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.customers.analytics(context.customerId),
          queryFn: () => import('../services/customer.service').then(
            service => service.customerService.getCustomerAnalytics(context.customerId!)
          ),
          staleTime: 5 * 60 * 1000,
        })
      );

      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.customers.interactions(context.customerId),
          queryFn: () => import('../services/customer.service').then(
            service => service.customerService.getCustomerInteractions(context.customerId!)
          ),
          staleTime: 2 * 60 * 1000,
        })
      );
    }

    if (context.productId) {
      // Prefetch product pricing rules
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: queryKeys.products.pricingRules(context.productId, context.customerId),
          queryFn: () => import('../services/product.service').then(
            service => service.productService.getPricingRules(context.productId!, context.customerId)
          ),
          staleTime: 5 * 60 * 1000,
        })
      );
    }

    await Promise.all(prefetchPromises);
  }, [queryClient]);

  // Cache warming for frequently accessed data
  const warmCache = useCallback(async () => {
    const warmingPromises: Promise<void>[] = [];

    // Warm product categories cache
    warmingPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.products.categories,
        queryFn: () => import('../services/product.service').then(
          service => service.productService.getCategories()
        ),
        staleTime: 30 * 60 * 1000, // 30 minutes
      })
    );

    // Warm dashboard analytics
    warmingPromises.push(
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.dashboard({}),
        queryFn: () => import('../services/analytics.service').then(
          service => service.analyticsService.getDashboardMetrics({})
        ),
        staleTime: 2 * 60 * 1000,
      })
    );

    await Promise.all(warmingPromises);
  }, [queryClient]);

  // Smart cache invalidation based on relationships
  const invalidateRelatedData = useCallback((context: {
    customerId?: string;
    productId?: string;
    quotationId?: string;
    orderId?: string;
  }) => {
    if (context.customerId) {
      invalidateQueries.customers.detail(context.customerId);
      invalidateQueries.customers.list();
      
      // Invalidate quotations for this customer
      queryClient.invalidateQueries({
        queryKey: queryKeys.quotations.lists(),
        predicate: (query) => {
          const filters = query.queryKey[2] as any;
          return filters?.customerId === context.customerId;
        },
      });
    }

    if (context.productId) {
      invalidateQueries.products.detail(context.productId);
      invalidateQueries.products.list();
    }

    if (context.quotationId) {
      invalidateQueries.quotations.detail(context.quotationId);
      invalidateQueries.quotations.list();
      invalidateQueries.quotations.analytics();
    }

    if (context.orderId) {
      invalidateQueries.orders.detail(context.orderId);
      invalidateQueries.orders.list();
    }

    // Always invalidate analytics when data changes
    invalidateQueries.analytics.all();
  }, [queryClient]);

  // Selective cache clearing for memory management
  const clearStaleCache = useCallback((maxAge: number = 30 * 60 * 1000) => {
    const now = Date.now();
    
    queryClient.getQueryCache().getAll().forEach((query) => {
      const lastUpdated = query.state.dataUpdatedAt;
      if (lastUpdated && (now - lastUpdated) > maxAge) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }, [queryClient]);

  // Background refresh for critical data
  const backgroundRefresh = useCallback(async () => {
    const refreshPromises: Promise<void>[] = [];

    // Refresh dashboard data in background
    refreshPromises.push(
      queryClient.refetchQueries({
        queryKey: queryKeys.analytics.dashboard({}),
        type: 'active',
      })
    );

    // Refresh active quotations
    refreshPromises.push(
      queryClient.refetchQueries({
        queryKey: queryKeys.quotations.lists(),
        predicate: (query) => {
          const filters = query.queryKey[2] as any;
          return filters?.status === 'SENT' || filters?.status === 'DRAFT';
        },
      })
    );

    await Promise.all(refreshPromises);
  }, [queryClient]);

  // Cache statistics for debugging
  const getCacheStats = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.getObserversCount() > 0).length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      cacheSize: queries.reduce((size, query) => {
        return size + JSON.stringify(query.state.data).length;
      }, 0),
    };

    return stats;
  }, [queryClient]);

  return {
    prefetchData,
    prefetchRelatedData,
    warmCache,
    invalidateRelatedData,
    clearStaleCache,
    backgroundRefresh,
    getCacheStats,
  };
}

// Hook for automatic cache management
export function useAutoCacheManagement() {
  const { warmCache, clearStaleCache, backgroundRefresh } = useCacheManagement();

  // Auto-warm cache on app start
  const initializeCache = useCallback(async () => {
    try {
      await warmCache();
    } catch (error) {
      console.warn('Cache warming failed:', error);
    }
  }, [warmCache]);

  // Periodic cache maintenance
  const startCacheMaintenance = useCallback(() => {
    // Clear stale cache every 30 minutes
    const staleCleanupInterval = setInterval(() => {
      clearStaleCache(30 * 60 * 1000); // 30 minutes
    }, 30 * 60 * 1000);

    // Background refresh every 5 minutes
    const refreshInterval = setInterval(() => {
      backgroundRefresh().catch(error => {
        console.warn('Background refresh failed:', error);
      });
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(staleCleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [clearStaleCache, backgroundRefresh]);

  return {
    initializeCache,
    startCacheMaintenance,
  };
}