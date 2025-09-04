// API Hooks
export * from './use-auth';
export * from './use-customers';
export * from './use-quotations';
export * from './use-products';
export * from './use-orders';
export * from './use-analytics';

// Utility Hooks
export * from './use-error-handler';
export * from './use-loading-states';
export * from './use-offline';
export * from './use-optimistic-updates';
export * from './use-cache-management';

// Re-export query client utilities
export { queryClient, queryKeys, invalidateQueries } from '../query-client';

// Re-export services for type imports
export * from '../services/auth.service';
export * from '../services/customer.service';
export * from '../services/quotation.service';
export * from '../services/product.service';
export * from '../services/order.service';
export * from '../services/analytics.service';