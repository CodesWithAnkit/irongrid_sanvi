import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { 
  useOptimisticUpdates, 
  useOptimisticListUpdates,
  useOptimisticStatusUpdates,
  useOptimisticCounterUpdates,
  useBatchOptimisticUpdates
} from '../use-optimistic-updates';

// Mock data
const mockCustomer = {
  id: '1',
  name: 'Test Customer',
  email: 'test@example.com',
  status: 'ACTIVE',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockCustomerList = {
  data: [mockCustomer],
  total: 1,
  page: 1,
  limit: 10,
};

describe('useOptimisticUpdates', () => {
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
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useOptimisticUpdates', () => {
    it('should perform optimistic update', async () => {
      const queryKey = ['customers', '1'];
      queryClient.setQueryData(queryKey, mockCustomer);

      const { result } = renderHook(() => useOptimisticUpdates(), { wrapper });

      let rollback: (() => void) | undefined;

      await act(async () => {
        const updateResult = await result.current.performOptimisticUpdate({
          queryKey,
          updateFn: (oldData: any) => ({
            ...oldData,
            name: 'Updated Customer',
          }),
        });
        rollback = updateResult.rollback;
      });

      const updatedData = queryClient.getQueryData(queryKey);
      expect(updatedData).toEqual({
        ...mockCustomer,
        name: 'Updated Customer',
      });

      // Test rollback
      act(() => {
        rollback?.();
      });

      const rolledBackData = queryClient.getQueryData(queryKey);
      expect(rolledBackData).toEqual(mockCustomer);
    });

    it('should handle missing data gracefully', async () => {
      const queryKey = ['customers', 'nonexistent'];
      const { result } = renderHook(() => useOptimisticUpdates(), { wrapper });

      await act(async () => {
        await result.current.performOptimisticUpdate({
          queryKey,
          updateFn: (oldData: any) => oldData,
        });
      });

      const data = queryClient.getQueryData(queryKey);
      expect(data).toBeUndefined();
    });
  });

  describe('useOptimisticListUpdates', () => {
    it('should add item to list at start', async () => {
      const queryKey = ['customers'];
      queryClient.setQueryData(queryKey, mockCustomerList);

      const { result } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      const newCustomer = {
        id: '2',
        name: 'New Customer',
        email: 'new@example.com',
        status: 'ACTIVE',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      await act(async () => {
        await result.current.addToList(queryKey, newCustomer, 'start');
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.data).toHaveLength(2);
      expect(updatedData.data[0]).toEqual(newCustomer);
      expect(updatedData.total).toBe(2);
    });

    it('should add item to list at end', async () => {
      const queryKey = ['customers'];
      queryClient.setQueryData(queryKey, mockCustomerList);

      const { result } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      const newCustomer = {
        id: '2',
        name: 'New Customer',
        email: 'new@example.com',
        status: 'ACTIVE',
        updatedAt: '2024-01-02T00:00:00Z',
      };

      await act(async () => {
        await result.current.addToList(queryKey, newCustomer, 'end');
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.data).toHaveLength(2);
      expect(updatedData.data[1]).toEqual(newCustomer);
      expect(updatedData.total).toBe(2);
    });

    it('should remove item from list', async () => {
      const queryKey = ['customers'];
      queryClient.setQueryData(queryKey, mockCustomerList);

      const { result } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      await act(async () => {
        await result.current.removeFromList(queryKey, '1');
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.data).toHaveLength(0);
      expect(updatedData.total).toBe(0);
    });

    it('should update item in list', async () => {
      const queryKey = ['customers'];
      queryClient.setQueryData(queryKey, mockCustomerList);

      const { result } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      await act(async () => {
        await result.current.updateInList(queryKey, '1', { name: 'Updated Customer' });
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.data[0].name).toBe('Updated Customer');
      expect(updatedData.data[0].updatedAt).not.toBe(mockCustomer.updatedAt);
    });
  });

  describe('useOptimisticStatusUpdates', () => {
    it('should update status', async () => {
      const queryKey = ['customers', '1'];
      queryClient.setQueryData(queryKey, mockCustomer);

      const { result } = renderHook(() => useOptimisticStatusUpdates(), { wrapper });

      await act(async () => {
        await result.current.updateStatus(queryKey, 'INACTIVE', { name: 'Updated Name' });
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.status).toBe('INACTIVE');
      expect(updatedData.name).toBe('Updated Name');
      expect(updatedData.updatedAt).not.toBe(mockCustomer.updatedAt);
    });
  });

  describe('useOptimisticCounterUpdates', () => {
    it('should increment counter', async () => {
      const queryKey = ['analytics'];
      const mockAnalytics = { totalCustomers: 10, totalOrders: 5 };
      queryClient.setQueryData(queryKey, mockAnalytics);

      const { result } = renderHook(() => useOptimisticCounterUpdates(), { wrapper });

      await act(async () => {
        await result.current.incrementCounter(queryKey, 'totalCustomers', 2);
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.totalCustomers).toBe(12);
      expect(updatedData.totalOrders).toBe(5);
    });

    it('should decrement counter', async () => {
      const queryKey = ['analytics'];
      const mockAnalytics = { totalCustomers: 10, totalOrders: 5 };
      queryClient.setQueryData(queryKey, mockAnalytics);

      const { result } = renderHook(() => useOptimisticCounterUpdates(), { wrapper });

      await act(async () => {
        await result.current.decrementCounter(queryKey, 'totalCustomers', 3);
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.totalCustomers).toBe(7);
    });

    it('should not decrement below zero', async () => {
      const queryKey = ['analytics'];
      const mockAnalytics = { totalCustomers: 2 };
      queryClient.setQueryData(queryKey, mockAnalytics);

      const { result } = renderHook(() => useOptimisticCounterUpdates(), { wrapper });

      await act(async () => {
        await result.current.decrementCounter(queryKey, 'totalCustomers', 5);
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.totalCustomers).toBe(0);
    });
  });

  describe('useBatchOptimisticUpdates', () => {
    it('should perform batch updates', async () => {
      const customerKey = ['customers', '1'];
      const analyticsKey = ['analytics'];
      
      queryClient.setQueryData(customerKey, mockCustomer);
      queryClient.setQueryData(analyticsKey, { totalCustomers: 10 });

      const { result } = renderHook(() => useBatchOptimisticUpdates(), { wrapper });

      await act(async () => {
        await result.current.performBatchUpdates([
          {
            queryKey: customerKey,
            updateFn: (oldData: any) => ({ ...oldData, name: 'Batch Updated' }),
          },
          {
            queryKey: analyticsKey,
            updateFn: (oldData: any) => ({ ...oldData, totalCustomers: 11 }),
          },
        ]);
      });

      const customerData = queryClient.getQueryData(customerKey) as any;
      const analyticsData = queryClient.getQueryData(analyticsKey) as any;

      expect(customerData.name).toBe('Batch Updated');
      expect(analyticsData.totalCustomers).toBe(11);
    });

    it('should rollback all updates on error', async () => {
      const customerKey = ['customers', '1'];
      const analyticsKey = ['analytics'];
      
      queryClient.setQueryData(customerKey, mockCustomer);
      queryClient.setQueryData(analyticsKey, { totalCustomers: 10 });

      const { result } = renderHook(() => useBatchOptimisticUpdates(), { wrapper });

      let rollback: (() => void) | undefined;

      await act(async () => {
        const batchResult = await result.current.performBatchUpdates([
          {
            queryKey: customerKey,
            updateFn: (oldData: any) => ({ ...oldData, name: 'Batch Updated' }),
          },
          {
            queryKey: analyticsKey,
            updateFn: (oldData: any) => ({ ...oldData, totalCustomers: 11 }),
          },
        ]);
        rollback = batchResult.rollback;
      });

      // Verify updates were applied
      expect((queryClient.getQueryData(customerKey) as any).name).toBe('Batch Updated');
      expect((queryClient.getQueryData(analyticsKey) as any).totalCustomers).toBe(11);

      // Test rollback
      act(() => {
        rollback?.();
      });

      const customerData = queryClient.getQueryData(customerKey) as any;
      const analyticsData = queryClient.getQueryData(analyticsKey) as any;

      expect(customerData.name).toBe(mockCustomer.name);
      expect(analyticsData.totalCustomers).toBe(10);
    });
  });
});