import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import { 
  useOptimisticListUpdates,
  useOptimisticStatusUpdates,
  useOptimisticCounterUpdates,
  useBatchOptimisticUpdates,
  useCacheManagement,
  useErrorHandler,
  useLoadingState,
  useMultipleLoadingStates
} from '../index';

describe('State Management Hooks', () => {
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

  describe('useOptimisticListUpdates', () => {
    it('should add item to list optimistically', async () => {
      const { result } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      const queryKey = ['test-list'];
      const initialData = { data: [{ id: '1', name: 'Item 1' }], total: 1 };
      queryClient.setQueryData(queryKey, initialData);

      const newItem = { id: '2', name: 'Item 2' };

      await act(async () => {
        await result.current.addToList(queryKey, newItem, 'start');
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.data).toHaveLength(2);
      expect(updatedData.data[0]).toEqual(newItem);
      expect(updatedData.total).toBe(2);
    });

    it('should remove item from list optimistically', async () => {
      const { result } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      const queryKey = ['test-list'];
      const initialData = { 
        data: [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' }
        ], 
        total: 2 
      };
      queryClient.setQueryData(queryKey, initialData);

      await act(async () => {
        await result.current.removeFromList(queryKey, '1');
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.data).toHaveLength(1);
      expect(updatedData.data[0].id).toBe('2');
      expect(updatedData.total).toBe(1);
    });

    it('should update item in list optimistically', async () => {
      const { result } = renderHook(() => useOptimisticListUpdates(), { wrapper });

      const queryKey = ['test-list'];
      const initialData = { 
        data: [{ id: '1', name: 'Item 1', status: 'active' }], 
        total: 1 
      };
      queryClient.setQueryData(queryKey, initialData);

      await act(async () => {
        await result.current.updateInList(queryKey, '1', { name: 'Updated Item' });
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.data[0].name).toBe('Updated Item');
      expect(updatedData.data[0].updatedAt).toBeDefined();
    });
  });

  describe('useOptimisticStatusUpdates', () => {
    it('should update status optimistically', async () => {
      const { result } = renderHook(() => useOptimisticStatusUpdates(), { wrapper });

      const queryKey = ['test-item'];
      const initialData = { id: '1', status: 'pending', name: 'Test Item' };
      queryClient.setQueryData(queryKey, initialData);

      await act(async () => {
        await result.current.updateStatus(queryKey, 'completed', { priority: 'high' });
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.status).toBe('completed');
      expect(updatedData.priority).toBe('high');
      expect(updatedData.updatedAt).toBeDefined();
    });
  });

  describe('useOptimisticCounterUpdates', () => {
    it('should increment counter optimistically', async () => {
      const { result } = renderHook(() => useOptimisticCounterUpdates(), { wrapper });

      const queryKey = ['test-counter'];
      const initialData = { count: 5, total: 10 };
      queryClient.setQueryData(queryKey, initialData);

      await act(async () => {
        await result.current.incrementCounter(queryKey, 'count', 3);
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.count).toBe(8);
      expect(updatedData.total).toBe(10); // Should remain unchanged
    });

    it('should decrement counter optimistically', async () => {
      const { result } = renderHook(() => useOptimisticCounterUpdates(), { wrapper });

      const queryKey = ['test-counter'];
      const initialData = { count: 5 };
      queryClient.setQueryData(queryKey, initialData);

      await act(async () => {
        await result.current.decrementCounter(queryKey, 'count', 2);
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.count).toBe(3);
    });

    it('should not decrement below zero', async () => {
      const { result } = renderHook(() => useOptimisticCounterUpdates(), { wrapper });

      const queryKey = ['test-counter'];
      const initialData = { count: 2 };
      queryClient.setQueryData(queryKey, initialData);

      await act(async () => {
        await result.current.decrementCounter(queryKey, 'count', 5);
      });

      const updatedData = queryClient.getQueryData(queryKey) as any;
      expect(updatedData.count).toBe(0);
    });
  });

  describe('useBatchOptimisticUpdates', () => {
    it('should perform batch updates', async () => {
      const { result } = renderHook(() => useBatchOptimisticUpdates(), { wrapper });

      const queryKey1 = ['test-item-1'];
      const queryKey2 = ['test-item-2'];
      
      queryClient.setQueryData(queryKey1, { id: '1', count: 5 });
      queryClient.setQueryData(queryKey2, { id: '2', count: 10 });

      await act(async () => {
        await result.current.performBatchUpdates([
          {
            queryKey: queryKey1,
            updateFn: (oldData: any) => ({ ...oldData, count: oldData.count + 1 }),
          },
          {
            queryKey: queryKey2,
            updateFn: (oldData: any) => ({ ...oldData, count: oldData.count - 2 }),
          },
        ]);
      });

      const data1 = queryClient.getQueryData(queryKey1) as any;
      const data2 = queryClient.getQueryData(queryKey2) as any;

      expect(data1.count).toBe(6);
      expect(data2.count).toBe(8);
    });
  });

  describe('useCacheManagement', () => {
    it('should provide cache statistics', () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      // Add some test data to cache
      queryClient.setQueryData(['test-1'], { data: 'test1' });
      queryClient.setQueryData(['test-2'], { data: 'test2' });

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
      expect(stats.cacheSize).toBeGreaterThan(0);
    });

    it('should clear stale cache entries', () => {
      const { result } = renderHook(() => useCacheManagement(), { wrapper });

      // Add test data
      queryClient.setQueryData(['test-stale'], { data: 'stale' });
      
      const initialStats = result.current.getCacheStats();
      expect(initialStats.totalQueries).toBeGreaterThan(0);

      act(() => {
        result.current.clearStaleCache(0); // Clear everything (0ms max age)
      });

      const finalStats = result.current.getCacheStats();
      expect(finalStats.totalQueries).toBeLessThan(initialStats.totalQueries);
    });
  });

  describe('useErrorHandler', () => {
    it('should handle errors with user-friendly messages', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      const error = new Error('Network connection failed');
      const handledError = result.current.handleError(error, {
        fallbackMessage: 'Something went wrong',
      });

      expect(handledError).toEqual({
        message: 'Network connection failed',
        code: 'INTERNAL_SERVER_ERROR',
        userMessage: expect.any(String),
      });
    });

    it('should use fallback message for unknown errors', () => {
      const { result } = renderHook(() => useErrorHandler(), { wrapper });

      const handledError = result.current.handleError(null, {
        fallbackMessage: 'Custom fallback message',
      });

      expect(handledError.userMessage).toContain('Custom fallback message');
    });
  });

  describe('useLoadingState', () => {
    it('should manage loading state', () => {
      const { result } = renderHook(() => useLoadingState(), { wrapper });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setData({ message: 'Success' });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ message: 'Success' });
      expect(result.current.error).toBe(null);

      act(() => {
        result.current.setError(new Error('Test error'));
      });

      expect(result.current.error?.message).toBe('Test error');
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.data).toBe(null);
    });
  });

  describe('useMultipleLoadingStates', () => {
    it('should manage multiple loading states', () => {
      const { result } = renderHook(() => useMultipleLoadingStates(), { wrapper });

      expect(result.current.isAnyLoading()).toBe(false);

      act(() => {
        result.current.setLoading('operation1', true);
      });

      expect(result.current.isLoading('operation1')).toBe(true);
      expect(result.current.isAnyLoading()).toBe(true);

      act(() => {
        result.current.setLoading('operation2', true);
      });

      expect(result.current.isLoading('operation2')).toBe(true);
      expect(result.current.isAnyLoading()).toBe(true);

      act(() => {
        result.current.setLoading('operation1', false);
      });

      expect(result.current.isLoading('operation1')).toBe(false);
      expect(result.current.isAnyLoading()).toBe(true); // operation2 still loading

      act(() => {
        result.current.clearAllLoading();
      });

      expect(result.current.isAnyLoading()).toBe(false);
    });
  });
});