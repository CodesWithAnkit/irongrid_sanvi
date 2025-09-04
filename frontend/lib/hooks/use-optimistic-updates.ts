import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-client';

export interface OptimisticUpdateOptions<T> {
  queryKey: readonly unknown[];
  updateFn: (oldData: T) => T;
  rollbackFn?: (oldData: T, newData: T) => T;
}

export function useOptimisticUpdates() {
  const queryClient = useQueryClient();

  const performOptimisticUpdate = useCallback(async <T>(
    options: OptimisticUpdateOptions<T>
  ) => {
    const { queryKey, updateFn, rollbackFn } = options;

    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey });

    // Snapshot previous value
    const previousData = queryClient.getQueryData<T>(queryKey);

    // Optimistically update
    if (previousData) {
      const newData = updateFn(previousData);
      queryClient.setQueryData(queryKey, newData);
    }

    return {
      previousData,
      rollback: () => {
        if (previousData) {
          if (rollbackFn) {
            const currentData = queryClient.getQueryData<T>(queryKey);
            if (currentData) {
              queryClient.setQueryData(queryKey, rollbackFn(previousData, currentData));
            }
          } else {
            queryClient.setQueryData(queryKey, previousData);
          }
        }
      },
    };
  }, [queryClient]);

  return { performOptimisticUpdate };
}

// Specific optimistic update hooks for common operations
export function useOptimisticListUpdates() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  const addToList = useCallback(<T extends { id: string }>(
    queryKey: readonly unknown[],
    newItem: T,
    position: 'start' | 'end' = 'start'
  ) => {
    return performOptimisticUpdate({
      queryKey,
      updateFn: (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        const newList = position === 'start' 
          ? [newItem, ...oldData.data]
          : [...oldData.data, newItem];
          
        return {
          ...oldData,
          data: newList,
          total: (oldData.total || 0) + 1,
        };
      },
    });
  }, [performOptimisticUpdate]);

  const removeFromList = useCallback(<T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string
  ) => {
    return performOptimisticUpdate({
      queryKey,
      updateFn: (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.filter((item: T) => item.id !== itemId),
          total: Math.max((oldData.total || 0) - 1, 0),
        };
      },
    });
  }, [performOptimisticUpdate]);

  const updateInList = useCallback(<T extends { id: string }>(
    queryKey: readonly unknown[],
    itemId: string,
    updates: Partial<T>
  ) => {
    return performOptimisticUpdate({
      queryKey,
      updateFn: (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        return {
          ...oldData,
          data: oldData.data.map((item: T) =>
            item.id === itemId 
              ? { ...item, ...updates, updatedAt: new Date().toISOString() }
              : item
          ),
        };
      },
    });
  }, [performOptimisticUpdate]);

  return {
    addToList,
    removeFromList,
    updateInList,
  };
}

// Hook for optimistic status updates
export function useOptimisticStatusUpdates() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  const updateStatus = useCallback(<T extends { status: string }>(
    queryKey: readonly unknown[],
    newStatus: string,
    additionalUpdates?: Partial<T>
  ) => {
    return performOptimisticUpdate({
      queryKey,
      updateFn: (oldData: T) => ({
        ...oldData,
        status: newStatus,
        ...additionalUpdates,
        updatedAt: new Date().toISOString(),
      } as T),
    });
  }, [performOptimisticUpdate]);

  return { updateStatus };
}

// Hook for optimistic counter updates
export function useOptimisticCounterUpdates() {
  const { performOptimisticUpdate } = useOptimisticUpdates();

  const incrementCounter = useCallback((
    queryKey: readonly unknown[],
    field: string,
    increment: number = 1
  ) => {
    return performOptimisticUpdate({
      queryKey,
      updateFn: (oldData: any) => ({
        ...oldData,
        [field]: (oldData[field] || 0) + increment,
      }),
    });
  }, [performOptimisticUpdate]);

  const decrementCounter = useCallback((
    queryKey: readonly unknown[],
    field: string,
    decrement: number = 1
  ) => {
    return performOptimisticUpdate({
      queryKey,
      updateFn: (oldData: any) => ({
        ...oldData,
        [field]: Math.max((oldData[field] || 0) - decrement, 0),
      }),
    });
  }, [performOptimisticUpdate]);

  return {
    incrementCounter,
    decrementCounter,
  };
}

// Hook for batch optimistic updates
export function useBatchOptimisticUpdates() {
  const queryClient = useQueryClient();

  const performBatchUpdates = useCallback(async (
    updates: Array<{
      queryKey: readonly unknown[];
      updateFn: (oldData: any) => any;
    }>
  ) => {
    const rollbacks: Array<() => void> = [];

    try {
      for (const { queryKey, updateFn } of updates) {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey });

        // Snapshot previous value
        const previousData = queryClient.getQueryData(queryKey);

        // Optimistically update
        if (previousData) {
          const newData = updateFn(previousData);
          queryClient.setQueryData(queryKey, newData);

          // Store rollback function
          rollbacks.push(() => {
            queryClient.setQueryData(queryKey, previousData);
          });
        }
      }

      return {
        rollback: () => {
          rollbacks.forEach(rollback => rollback());
        },
      };
    } catch (error) {
      // Rollback all changes if any update fails
      rollbacks.forEach(rollback => rollback());
      throw error;
    }
  }, [queryClient]);

  return { performBatchUpdates };
}