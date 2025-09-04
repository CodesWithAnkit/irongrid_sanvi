import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
  data: any;
}

export function useLoadingState<T = any>(initialData?: T) {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: initialData || null,
  });

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data, error: null, isLoading: false }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: initialData || null,
    });
  }, [initialData]);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearLoading = useCallback((key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  }, []);

  const clearAllLoading = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    clearAllLoading,
    loadingStates,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>() {
  const [optimisticData, setOptimisticData] = useState<T | null>(null);
  const [isOptimistic, setIsOptimistic] = useState(false);

  const startOptimisticUpdate = useCallback((data: T) => {
    setOptimisticData(data);
    setIsOptimistic(true);
  }, []);

  const confirmOptimisticUpdate = useCallback(() => {
    setIsOptimistic(false);
    setOptimisticData(null);
  }, []);

  const revertOptimisticUpdate = useCallback(() => {
    setIsOptimistic(false);
    setOptimisticData(null);
  }, []);

  return {
    optimisticData,
    isOptimistic,
    startOptimisticUpdate,
    confirmOptimisticUpdate,
    revertOptimisticUpdate,
  };
}

// Hook for debounced loading states (useful for search)
export function useDebouncedLoading(delay: number = 300) {
  const [isLoading, setIsLoading] = useState(false);
  const [debouncedLoading, setDebouncedLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    
    if (loading) {
      // Show loading immediately when starting
      setDebouncedLoading(true);
    } else {
      // Delay hiding loading to prevent flicker
      setTimeout(() => {
        setDebouncedLoading(false);
      }, delay);
    }
  }, [delay]);

  return {
    isLoading,
    debouncedLoading,
    setLoading,
  };
}