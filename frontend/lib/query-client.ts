import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { ApiError } from './api';

// Default query options
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes
    staleTime: 5 * 60 * 1000,
    // Cache time: 10 minutes
    gcTime: 10 * 60 * 1000,
    // Retry failed requests 3 times with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (except 408, 429)
      if (error instanceof ApiError) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          return error.statusCode === 408 || error.statusCode === 429;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Refetch on window focus for important data
    refetchOnWindowFocus: true,
    // Refetch on reconnect
    refetchOnReconnect: true,
  },
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        return failureCount < 1;
      }
      return false;
    },
  },
};

// Create query client
export const queryClient = new QueryClient({
  defaultOptions,
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Auth
  auth: {
    currentUser: ['auth', 'currentUser'] as const,
  },
  
  // Customers
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.customers.details(), id] as const,
    analytics: (id: string) => [...queryKeys.customers.detail(id), 'analytics'] as const,
    interactions: (id: string) => [...queryKeys.customers.detail(id), 'interactions'] as const,
    search: (query: string) => [...queryKeys.customers.all, 'search', query] as const,
  },

  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
    categories: ['products', 'categories'] as const,
    search: (query: string, filters: Record<string, any>) => 
      [...queryKeys.products.all, 'search', query, filters] as const,
    pricingRules: (productId: string, customerId?: string) => 
      [...queryKeys.products.detail(productId), 'pricing-rules', customerId] as const,
  },

  // Quotations
  quotations: {
    all: ['quotations'] as const,
    lists: () => [...queryKeys.quotations.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.quotations.lists(), filters] as const,
    details: () => [...queryKeys.quotations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quotations.details(), id] as const,
    analytics: (filters: Record<string, any>) => 
      [...queryKeys.quotations.all, 'analytics', filters] as const,
    public: (token: string) => [...queryKeys.quotations.all, 'public', token] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: (filters: Record<string, any>) => 
      [...queryKeys.analytics.all, 'dashboard', filters] as const,
    business: (filters: Record<string, any>) => 
      [...queryKeys.analytics.all, 'business', filters] as const,
    sales: (dateRange: Record<string, any>) =>
      [...queryKeys.analytics.all, 'sales', dateRange] as const,
    customers: (dateRange: Record<string, any>) =>
      [...queryKeys.analytics.all, 'customers', dateRange] as const,
    products: (dateRange: Record<string, any>) =>
      [...queryKeys.analytics.all, 'products', dateRange] as const,
    conversion: (filters: Record<string, any>) =>
      [...queryKeys.analytics.all, 'conversion', filters] as const,
    performance: () => [...queryKeys.analytics.all, 'performance'] as const,
    forecast: (params: Record<string, any>) =>
      [...queryKeys.analytics.all, 'forecast', params] as const,
  },
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  customers: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.all }),
    list: () => queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.customers.detail(id) }),
  },
  
  products: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    list: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) }),
    categories: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.categories }),
  },
  
  quotations: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotations.all }),
    list: () => queryClient.invalidateQueries({ queryKey: queryKeys.quotations.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.quotations.detail(id) }),
    analytics: () => queryClient.invalidateQueries({ 
      queryKey: [...queryKeys.quotations.all, 'analytics'] 
    }),
  },
  
  orders: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
    list: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) }),
  },
  
  analytics: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  },
};