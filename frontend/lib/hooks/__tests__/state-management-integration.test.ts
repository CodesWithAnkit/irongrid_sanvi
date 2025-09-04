import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { 
  useCustomers, 
  useCreateCustomer, 
  useUpdateCustomer, 
  useDeleteCustomer 
} from '../use-customers';
import { useCacheManagement } from '../use-cache-management';
import { useOptimisticListUpdates } from '../use-optimistic-updates';
import { ApiError, ErrorCodes } from '../../api';

// Mock the API client
jest.mock('../../api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  ApiError: class MockApiError extends Error {
    constructor(message: string, public code: string, public statusCode: number) {
      super(message);
      this.name = 'ApiError';
    }
  },
  ErrorCodes: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NETWORK_ERROR: 'NETWORK_ERROR',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  },
}));

// Mock services
jest.mock('../../services/customer.service', () => ({
  customerService: {
    getCustomers: jest.fn(),
    createCustomer: jest.fn(),
    updateCustomer: jest.fn(),
    deleteCustomer: jest.fn(),
  },
}));

const { apiClient } = require('../../api');
const { customerService } = require('../../services/customer.service');

describe('State Management Integration', () => {
  let queryClient: QueryClient;
  let wrapper: ({ children }: { children: ReactNode }) => React.ReactElement;

  const mockCustomer = {
    id: '1',
    companyName: 'Test Company',
    contactPerson: 'John Doe',
    email: 'john@test.com',
    phone: '+1234567890',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockCustomerList = {
    data: [mockCustomer],
    total: 1,
    page: 1,
    limit: 10,
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

  describe('CRUD Operations with Optimistic Updates', () => {
    it('should handle complete customer CRUD flow with optimistic updates', async () => {
      // Mock API responses
      customerService.getCustomers.mockResolvedValue(mockCustomerList);
      customerService.createCustomer.mockResolvedValue({
        ...mockCustomer,
        id: '2',
        companyName: 'New Company',
      });
      customerService.updateCustomer.mockResolvedValue({
        ...mockCustomer,
        companyName: 'Updated Company',
      });
      customerService.deleteCustomer.mockResolvedValue(undefined);

      // 1. Fetch initial customers list
      const { result: customersResult } = renderHook(
        () => useCustomers({ page: 1, limit: 10 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(customersResult.current.isSuccess).toBe(true);
      });

      expect(customersResult.current.data).toEqual(mockCustomerList);

      // 2. Create new customer with optimistic update
      const { result: createResult } = renderHook(() => useCreateCustomer(), { wrapper });

      const newCustomerData = {
        companyName: 'New Company',
        contactPerson: 'Jane Doe',
        email: 'jane@test.com',
        phone: '+1234567891',
        address: {
          street: '123 Main St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'US',
        },
        customerType: 'BUSINESS' as const,
        creditLimit: 10000,
        paymentTerms: 'NET_30',
      };

      await act(async () => {
        await createResult.current.mutateAsync(newCustomerData);
      });

      expect(customerService.createCustomer).toHaveBeenCalledWith(newCustomerData);

      // 3. Update customer with optimistic update
      const { result: updateResult } = renderHook(() => useUpdateCustomer(), { wrapper });

      await act(async () => {
        await updateResult.current.mutateAsync({
          id: '1',
          data: { companyName: 'Updated Company' },
        });
      });

      expect(customerService.updateCustomer).toHaveBeenCalledWith('1', {
        companyName: 'Updated Company',
      });

      // 4. Delete customer with optimistic update
      const { result: deleteResult } = renderHook(() => useDeleteCustomer(), { wrapper });

      await act(async () => {
        await deleteResult.current.mutateAsync('1');
      });

      expect(customerService.deleteCustomer).toHaveBeenCalledWith('1');
    });

    it('should handle optimistic update rollback on error', async () => {
      // Set up initial data
      queryClient.setQueryData(['customers', '1'], mockCustomer);

      // Mock update to fail
      const updateError = new ApiError('Update failed', ErrorCodes.VALIDATION_ERROR, 400);
      customerService.updateCustomer.mockRejectedValue(updateError);

      const { result: updateResult } = renderHook(() => useUpdateCustomer(), { wrapper });

      // Verify initial data
      expect(queryClient.getQueryData(['customers', '1'])).toEqual(mockCustomer);

      // Attempt update (should fail and rollback)
      await act(async () => {
        try {
          await updateResult.current.mutateAsync({
            id: '1',
            data: { companyName: 'Failed Update' },
          });
        } catch (error) {
          // Expected to fail
        }
      });

      // Verify rollback occurred
      const rolledBackData = queryClient.getQueryData(['customers', '1']);
      expect(rolledBackData).toEqual(mockCustomer);
    });
  });

  describe('Cache Management Integration', () => {
    it('should prefetch related data and manage cache effectively', async () => {
      const { result: cacheResult } = renderHook(() => useCacheManagement(), { wrapper });

      // Mock prefetch data
      const mockAnalytics = { totalOrders: 5, totalValue: 10000 };
      const mockInteractions = [
        { id: '1', type: 'EMAIL', date: '2024-01-01', notes: 'Initial contact' },
      ];

      // Mock the dynamic imports
      jest.doMock('../../services/customer.service', () => ({
        customerService: {
          getCustomerAnalytics: jest.fn().mockResolvedValue(mockAnalytics),
          getCustomerInteractions: jest.fn().mockResolvedValue(mockInteractions),
        },
      }));

      // Prefetch related data
      await act(async () => {
        await cacheResult.current.prefetchRelatedData({ customerId: '1' });
      });

      // Verify data was cached
      const analyticsData = queryClient.getQueryData(['customers', '1', 'analytics']);
      const interactionsData = queryClient.getQueryData(['customers', '1', 'interactions']);

      expect(analyticsData).toEqual(mockAnalytics);
      expect(interactionsData).toEqual(mockInteractions);

      // Test cache invalidation
      act(() => {
        cacheResult.current.invalidateRelatedData({ customerId: '1' });
      });

      // Verify invalidation was called
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should provide accurate cache statistics', () => {
      const { result: cacheResult } = renderHook(() => useCacheManagement(), { wrapper });

      // Set up some cached data
      queryClient.setQueryData(['customers', '1'], mockCustomer);
      queryClient.setQueryData(['customers', '2'], { ...mockCustomer, id: '2' });
      queryClient.setQueryData(['products', 'categories'], []);

      const stats = cacheResult.current.getCacheStats();

      expect(stats).toEqual({
        totalQueries: expect.any(Number),
        activeQueries: expect.any(Number),
        staleQueries: expect.any(Number),
        errorQueries: expect.any(Number),
        loadingQueries: expect.any(Number),
        cacheSize: expect.any(Number),
      });

      expect(stats.totalQueries).toBeGreaterThanOrEqual(3);
      expect(stats.cacheSize).toBeGreaterThan(0);
    });
  });

  describe('Optimistic List Updates Integration', () => {
    it('should handle list operations with proper cache updates', async () => {
      const { result: listUpdatesResult } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      // Set up initial list
      const queryKey = ['customers', 'list'];
      queryClient.setQueryData(queryKey, mockCustomerList);

      // Add item to list
      const newCustomer = {
        id: '2',
        companyName: 'New Company',
        contactPerson: 'Jane Doe',
        email: 'jane@test.com',
        phone: '+1234567891',
        isActive: true,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      await act(async () => {
        await listUpdatesResult.current.addToList(queryKey, newCustomer, 'start');
      });

      const updatedList = queryClient.getQueryData(queryKey) as any;
      expect(updatedList.data).toHaveLength(2);
      expect(updatedList.data[0]).toEqual(newCustomer);
      expect(updatedList.total).toBe(2);

      // Update item in list
      await act(async () => {
        await listUpdatesResult.current.updateInList(queryKey, '1', {
          companyName: 'Updated Company',
        });
      });

      const listWithUpdate = queryClient.getQueryData(queryKey) as any;
      expect(listWithUpdate.data[1].companyName).toBe('Updated Company');

      // Remove item from list
      await act(async () => {
        await listUpdatesResult.current.removeFromList(queryKey, '2');
      });

      const listAfterRemoval = queryClient.getQueryData(queryKey) as any;
      expect(listAfterRemoval.data).toHaveLength(1);
      expect(listAfterRemoval.total).toBe(1);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors with proper retry logic', async () => {
      const networkError = new ApiError('Network error', ErrorCodes.NETWORK_ERROR, 0);
      
      // Mock service to fail first time, succeed second time
      let callCount = 0;
      customerService.getCustomers.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(networkError);
        }
        return Promise.resolve(mockCustomerList);
      });

      const { result } = renderHook(
        () => useCustomers({ page: 1, limit: 10 }),
        { wrapper }
      );

      // Should initially fail
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);

      // Retry should succeed
      await act(async () => {
        await result.current.refetch();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCustomerList);
      expect(callCount).toBe(2);
    });

    it('should handle validation errors without retry', async () => {
      const validationError = new ApiError(
        'Validation failed',
        ErrorCodes.VALIDATION_ERROR,
        400,
        { field: 'email' }
      );

      customerService.createCustomer.mockRejectedValue(validationError);

      const { result } = renderHook(() => useCreateCustomer(), { wrapper });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            companyName: 'Test Company',
            contactPerson: 'John Doe',
            email: 'invalid-email',
            phone: '+1234567890',
            address: {
              street: '123 Main St',
              city: 'Test City',
              state: 'TS',
              postalCode: '12345',
              country: 'US',
            },
            customerType: 'BUSINESS' as const,
            creditLimit: 10000,
            paymentTerms: 'NET_30',
          });
        } catch (error) {
          expect(error).toEqual(validationError);
        }
      });

      expect(result.current.isError).toBe(true);
      expect(result.current.error).toEqual(validationError);
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large datasets efficiently', async () => {
      // Create a large dataset
      const largeDataset = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          ...mockCustomer,
          id: `customer-${i}`,
          companyName: `Company ${i}`,
        })),
        total: 1000,
        page: 1,
        limit: 1000,
      };

      customerService.getCustomers.mockResolvedValue(largeDataset);

      const { result } = renderHook(
        () => useCustomers({ page: 1, limit: 1000 }),
        { wrapper }
      );

      const startTime = performance.now();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result.current.data).toEqual(largeDataset);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should clean up stale cache entries', async () => {
      const { result: cacheResult } = renderHook(() => useCacheManagement(), { wrapper });

      // Add multiple cache entries
      for (let i = 0; i < 10; i++) {
        queryClient.setQueryData([`test-${i}`], { data: `test-${i}` });
      }

      const initialStats = cacheResult.current.getCacheStats();
      expect(initialStats.totalQueries).toBeGreaterThanOrEqual(10);

      // Clear stale cache (everything should be considered stale with 0ms max age)
      act(() => {
        cacheResult.current.clearStaleCache(0);
      });

      const finalStats = cacheResult.current.getCacheStats();
      expect(finalStats.totalQueries).toBeLessThan(initialStats.totalQueries);
    });
  });
});