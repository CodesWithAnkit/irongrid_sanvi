# State Management Implementation

This directory contains the complete state management implementation for the Sanvi Machinery platform, built with React Query and custom hooks for optimal performance and user experience.

## Overview

The state management system provides:
- **React Query integration** with advanced caching strategies
- **Custom hooks** for all API operations with consistent error handling
- **Optimistic updates** for immediate UI feedback
- **Intelligent cache management** with relationship-aware invalidation
- **Comprehensive error handling** with user-friendly messages
- **Loading state management** for better UX

## Architecture

### Core Components

1. **Query Client Configuration** (`../query-client.ts`)
   - Advanced cache configuration with proper stale times
   - Intelligent retry logic with exponential backoff
   - Comprehensive query key factory for consistent cache management

2. **API Client** (`../api.ts`)
   - Enhanced error handling with custom error types
   - Automatic token refresh and authentication
   - Request/response interceptors for consistent behavior

3. **Custom Hooks** (Individual hook files)
   - Domain-specific hooks for each API resource
   - Consistent patterns across all operations
   - Built-in optimistic updates and error handling

## Hook Categories

### API Hooks
- `use-auth.ts` - Authentication and user management
- `use-customers.ts` - Customer CRUD operations and analytics
- `use-products.ts` - Product management and inventory
- `use-quotations.ts` - Quotation lifecycle management
- `use-orders.ts` - Order processing and tracking
- `use-analytics.ts` - Business metrics and reporting

### Utility Hooks
- `use-cache-management.ts` - Advanced cache operations
- `use-optimistic-updates.ts` - Optimistic UI patterns
- `use-error-handler.ts` - Centralized error handling
- `use-loading-states.ts` - Loading state management
- `use-offline.ts` - Offline functionality support

## Usage Examples

### Basic Data Fetching

```typescript
import { useCustomers, useCreateCustomer } from '@/lib/hooks';

function CustomerList() {
  const { data: customers, isLoading, error } = useCustomers({
    page: 1,
    limit: 10,
    isActive: true
  });

  const createCustomerMutation = useCreateCustomer();

  const handleCreate = async (customerData) => {
    try {
      await createCustomerMutation.mutateAsync(customerData);
      // Optimistic updates and cache invalidation handled automatically
    } catch (error) {
      // Error handling with user-friendly messages
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {customers?.data.map(customer => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}
```

### Optimistic Updates

```typescript
import { useOptimisticListUpdates } from '@/lib/hooks';

function useCustomerOperations() {
  const { addToList, updateInList, removeFromList } = useOptimisticListUpdates();
  
  const handleOptimisticCreate = async (newCustomer) => {
    const queryKey = ['customers', 'list', { page: 1, limit: 10 }];
    const { rollback } = await addToList(queryKey, newCustomer, 'start');
    
    try {
      await createCustomerMutation.mutateAsync(newCustomer);
    } catch (error) {
      rollback(); // Automatically rollback on error
      throw error;
    }
  };
}
```

### Cache Management

```typescript
import { useCacheManagement } from '@/lib/hooks';

function useCacheOperations() {
  const { 
    prefetchRelatedData, 
    invalidateRelatedData, 
    warmCache,
    getCacheStats 
  } = useCacheManagement();

  const handleCustomerSelect = async (customerId) => {
    // Prefetch related data for better UX
    await prefetchRelatedData({ customerId });
  };

  const handleDataUpdate = (customerId) => {
    // Invalidate related cache entries
    invalidateRelatedData({ customerId });
  };

  return { handleCustomerSelect, handleDataUpdate };
}
```

### Error Handling

```typescript
import { useErrorHandler, useApiErrorHandler } from '@/lib/hooks';

function useOperationHandling() {
  const { handleError } = useErrorHandler();
  const { handleApiError } = useApiErrorHandler();

  const performOperation = async () => {
    try {
      await someApiCall();
    } catch (error) {
      const errorInfo = handleApiError(error, 'perform operation');
      // User-friendly error message displayed automatically
      console.error('Operation failed:', errorInfo.userMessage);
    }
  };
}
```

## Advanced Features

### Multi-Level Loading States

```typescript
import { useMultipleLoadingStates } from '@/lib/hooks';

function ComplexOperations() {
  const { setLoading, isLoading, isAnyLoading } = useMultipleLoadingStates();

  const handleMultipleOperations = async () => {
    setLoading('operation1', true);
    setLoading('operation2', true);

    try {
      await Promise.all([
        performOperation1(),
        performOperation2()
      ]);
    } finally {
      setLoading('operation1', false);
      setLoading('operation2', false);
    }
  };

  return (
    <div>
      {isLoading('operation1') && <Spinner label="Processing operation 1..." />}
      {isLoading('operation2') && <Spinner label="Processing operation 2..." />}
      {isAnyLoading() && <GlobalLoadingIndicator />}
    </div>
  );
}
```

### Batch Optimistic Updates

```typescript
import { useBatchOptimisticUpdates } from '@/lib/hooks';

function useBatchOperations() {
  const { performBatchUpdates } = useBatchOptimisticUpdates();

  const handleBatchUpdate = async () => {
    const { rollback } = await performBatchUpdates([
      {
        queryKey: ['customers', '1'],
        updateFn: (data) => ({ ...data, status: 'updated' })
      },
      {
        queryKey: ['analytics', 'dashboard'],
        updateFn: (data) => ({ ...data, totalCustomers: data.totalCustomers + 1 })
      }
    ]);

    try {
      await performBatchApiUpdate();
    } catch (error) {
      rollback(); // Rollback all changes
      throw error;
    }
  };
}
```

## Testing

The hooks are thoroughly tested with unit tests covering:
- Basic functionality and data fetching
- Optimistic updates and rollback scenarios
- Error handling and recovery
- Cache management operations
- Loading state management

### Running Tests

```bash
# Run all hook tests
npm test lib/hooks/__tests__

# Run specific test file
npm test lib/hooks/__tests__/use-customers.test.ts

# Run with coverage
npm test -- --coverage lib/hooks
```

### Test Examples

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCustomers, useCreateCustomer } from '../use-customers';

describe('Customer Hooks', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }) => ReactElement;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  });

  it('should fetch customers successfully', async () => {
    const { result } = renderHook(() => useCustomers(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    
    expect(result.current.data).toBeDefined();
  });
});
```

## Performance Considerations

### Cache Optimization
- **Stale-while-revalidate** strategy for better perceived performance
- **Intelligent prefetching** based on user navigation patterns
- **Background refresh** for critical data
- **Memory management** with automatic stale cache cleanup

### Network Optimization
- **Request deduplication** to prevent duplicate API calls
- **Retry logic** with exponential backoff for failed requests
- **Optimistic updates** to reduce perceived latency
- **Batch operations** to minimize network requests

### Memory Management
- **Garbage collection** for unused cache entries
- **Cache size monitoring** with automatic cleanup
- **Query cancellation** for unmounted components
- **Selective invalidation** to minimize unnecessary refetches

## Best Practices

### Hook Usage
1. **Use specific hooks** for each domain (customers, products, etc.)
2. **Implement optimistic updates** for better UX
3. **Handle errors gracefully** with user-friendly messages
4. **Prefetch related data** when possible
5. **Monitor cache performance** in development

### Error Handling
1. **Use consistent error patterns** across all hooks
2. **Provide fallback messages** for unknown errors
3. **Log errors appropriately** for debugging
4. **Show user-friendly messages** in the UI
5. **Implement retry mechanisms** where appropriate

### Performance
1. **Use appropriate stale times** for different data types
2. **Implement background refresh** for critical data
3. **Prefetch predictable user actions**
4. **Clean up stale cache entries** regularly
5. **Monitor cache hit rates** and optimize accordingly

## Demo Application

A comprehensive demo application is available at `examples/state-management-demo.tsx` that showcases:
- All hook patterns and usage examples
- Real-time cache statistics
- Interactive CRUD operations
- Error handling demonstrations
- Performance monitoring tools

To run the demo:

```bash
# Start the development server
npm run dev

# Navigate to the demo component in your application
```

## API Reference

For detailed API documentation of each hook, refer to the individual hook files. Each hook includes:
- TypeScript interfaces for all parameters and return types
- JSDoc comments explaining usage and behavior
- Examples of common usage patterns
- Error handling specifications

## Contributing

When adding new hooks:
1. Follow the established patterns and naming conventions
2. Include comprehensive TypeScript types
3. Implement optimistic updates where appropriate
4. Add thorough unit tests
5. Update this README with usage examples
6. Consider cache invalidation relationships

## Migration Guide

If migrating from other state management solutions:
1. Replace direct API calls with appropriate hooks
2. Remove manual loading state management
3. Replace manual error handling with hook-based patterns
4. Update cache invalidation logic to use relationship-aware patterns
5. Test thoroughly with the new optimistic update patterns