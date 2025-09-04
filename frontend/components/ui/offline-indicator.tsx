'use client';

import React from 'react';
import { useOfflineIndicator } from '@/lib/hooks/use-offline';

export function OfflineIndicator() {
  const { isOnline, queueSize, showIndicator, message } = useOfflineIndicator();

  if (!showIndicator) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div
        className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
          isOnline
            ? 'bg-blue-500 text-white'
            : 'bg-red-500 text-white'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-300' : 'bg-red-300'
            }`}
          />
          <span>{message}</span>
          {queueSize > 0 && (
            <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
              {queueSize}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function OfflineQueueManager() {
  const { queue, isProcessing, clearQueue, processQueue } = useOfflineQueue();
  const { isOnline } = useOnlineStatus();

  if (queue.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-lg border p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">Offline Queue</h3>
        <button
          onClick={clearQueue}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {queue.map((action) => (
          <div
            key={action.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
          >
            <div>
              <div className="font-medium">
                {action.type} {action.resource}
              </div>
              <div className="text-gray-500 text-xs">
                {new Date(action.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {action.retryCount > 0 && `Retry ${action.retryCount}`}
            </div>
          </div>
        ))}
      </div>
      
      {isOnline && (
        <div className="mt-3 pt-3 border-t">
          <button
            onClick={processQueue}
            disabled={isProcessing}
            className="w-full bg-blue-500 text-white py-2 px-3 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isProcessing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}
    </div>
  );
}

// Import the hooks at the top level to avoid circular dependencies
import { useOfflineQueue, useOnlineStatus } from '@/lib/hooks/use-offline';