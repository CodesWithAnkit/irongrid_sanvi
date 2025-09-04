import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineAction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  // Load queue from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedQueue = localStorage.getItem('offline-queue');
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
        localStorage.removeItem('offline-queue');
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (queue.length > 0) {
      localStorage.setItem('offline-queue', JSON.stringify(queue));
    } else {
      localStorage.removeItem('offline-queue');
    }
  }, [queue]);

  // Process queue when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isProcessing) {
      processQueue();
    }
  }, [isOnline, queue.length, isProcessing]);

  const addToQueue = useCallback((action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    setQueue(prev => [...prev, newAction]);
    
    // Show user feedback
    console.log('Action queued for when online:', action.type, action.resource);
    
    return newAction.id;
  }, []);

  const removeFromQueue = useCallback((actionId: string) => {
    setQueue(prev => prev.filter(action => action.id !== actionId));
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing || queue.length === 0) return;

    setIsProcessing(true);
    
    try {
      for (const action of queue) {
        try {
          await processAction(action);
          removeFromQueue(action.id);
          
          // Invalidate relevant queries after successful sync
          queryClient.invalidateQueries({ 
            queryKey: [action.resource.toLowerCase()] 
          });
          
        } catch (error) {
          console.error('Failed to process offline action:', error);
          
          // Increment retry count
          setQueue(prev => prev.map(a => 
            a.id === action.id 
              ? { ...a, retryCount: a.retryCount + 1 }
              : a
          ));
          
          // Remove action if it has failed too many times
          if (action.retryCount >= 3) {
            console.error('Removing action after 3 failed attempts:', action);
            removeFromQueue(action.id);
          }
        }
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, queue, queryClient, removeFromQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('offline-queue');
    }
  }, []);

  return {
    queue,
    isProcessing,
    addToQueue,
    removeFromQueue,
    processQueue,
    clearQueue,
    queueSize: queue.length,
  };
}

// Helper function to process individual actions
async function processAction(action: OfflineAction): Promise<void> {
  // This would need to be implemented based on your API structure
  // For now, we'll just simulate the API call
  
  const { type, resource, data } = action;
  
  // Import API services dynamically to avoid circular dependencies
  const { apiClient } = await import('../api');
  
  switch (type) {
    case 'CREATE':
      await apiClient.post(`/${resource}`, data);
      break;
    case 'UPDATE':
      await apiClient.put(`/${resource}/${data.id}`, data);
      break;
    case 'DELETE':
      await apiClient.delete(`/${resource}/${data.id}`);
      break;
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}

// Hook for offline-aware mutations
export function useOfflineMutation<T = any>() {
  const { addToQueue } = useOfflineQueue();
  const isOnline = useOnlineStatus();

  const mutateOffline = useCallback((
    type: OfflineAction['type'],
    resource: string,
    data: T
  ) => {
    if (isOnline) {
      // If online, perform the mutation immediately
      return Promise.resolve();
    } else {
      // If offline, add to queue
      const actionId = addToQueue({ type, resource, data });
      return Promise.resolve(actionId);
    }
  }, [isOnline, addToQueue]);

  return {
    mutateOffline,
    isOnline,
  };
}

// Component to show offline status
export function useOfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { queueSize } = useOfflineQueue();

  return {
    isOnline,
    queueSize,
    showIndicator: !isOnline || queueSize > 0,
    message: !isOnline 
      ? 'You are offline. Changes will be synced when connection is restored.'
      : queueSize > 0 
        ? `Syncing ${queueSize} pending changes...`
        : null,
  };
}