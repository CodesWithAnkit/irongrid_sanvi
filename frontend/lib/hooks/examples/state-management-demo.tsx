import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useQuotations,
  useDashboardAnalytics,
  useCacheManagement,
  useAutoCacheManagement,
  useOptimisticListUpdates,
  useOptimisticStatusUpdates,
  useErrorHandler,
  useApiErrorHandler,
  useLoadingState,
  useMultipleLoadingStates,
} from '../index';

// Create a query client for the demo with enhanced configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Custom retry logic
        if (error instanceof Error && error.message.includes('404')) {
          return false; // Don't retry 404s
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

// Demo component showcasing comprehensive state management features
function StateManagementDemo() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'customers' | 'quotations' | 'analytics'>('customers');
  
  // Error handling
  const { handleError } = useErrorHandler();
  const { handleApiError } = useApiErrorHandler();
  
  // Loading states
  const { isLoading, setLoading, setError, setData, reset } = useLoadingState();
  const { setLoading: setMultiLoading, isLoading: isMultiLoading, isAnyLoading } = useMultipleLoadingStates();
  
  // Cache management
  const { 
    prefetchRelatedData, 
    getCacheStats, 
    invalidateRelatedData,
    warmCache,
    clearStaleCache,
    backgroundRefresh
  } = useCacheManagement();
  
  const { initializeCache, startCacheMaintenance } = useAutoCacheManagement();
  
  // Optimistic updates
  const { addToList, updateInList, removeFromList } = useOptimisticListUpdates();
  const { updateStatus } = useOptimisticStatusUpdates();

  // Data fetching hooks
  const {
    data: customersData,
    isLoading: isLoadingCustomers,
    error: customersError,
    refetch: refetchCustomers,
  } = useCustomers({ page: 1, limit: 10 });

  const {
    data: quotationsData,
    isLoading: isLoadingQuotations,
    error: quotationsError,
  } = useQuotations({ page: 1, limit: 5 });

  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
  } = useDashboardAnalytics();

  // Mutations
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  // Initialize cache and start maintenance on mount
  useEffect(() => {
    initializeCache();
    const cleanup = startCacheMaintenance();
    return cleanup;
  }, [initializeCache, startCacheMaintenance]);

  // Handle customer creation with comprehensive error handling and optimistic updates
  const handleCreateCustomer = async () => {
    try {
      setMultiLoading('createCustomer', true);
      
      const newCustomer = {
        companyName: `Demo Company ${Date.now()}`,
        contactPerson: 'John Doe',
        email: `demo${Date.now()}@example.com`,
        phone: '+1234567890',
        address: {
          street: '123 Demo St',
          city: 'Demo City',
          state: 'DC',
          postalCode: '12345',
          country: 'US',
        },
        customerType: 'BUSINESS' as const,
        creditLimit: 10000,
        paymentTerms: 'NET_30',
      };

      // Optimistic update
      const queryKey = ['customers', 'list', { page: 1, limit: 10 }];
      const optimisticCustomer = {
        id: `temp-${Date.now()}`,
        ...newCustomer,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { rollback } = await addToList(queryKey, optimisticCustomer, 'start');

      try {
        const result = await createCustomerMutation.mutateAsync(newCustomer);
        setData(result);
        
        // Prefetch related data for the new customer
        await prefetchRelatedData({ customerId: result.id });
        
        // Warm cache with related data
        await warmCache();
        
        reset(); // Clear any previous errors
      } catch (error) {
        rollback();
        throw error;
      }
    } catch (error) {
      const errorInfo = handleApiError(error, 'create customer');
      setError(new Error(errorInfo.userMessage));
    } finally {
      setMultiLoading('createCustomer', false);
    }
  };

  // Handle customer update with optimistic updates
  const handleUpdateCustomer = async (customerId: string) => {
    if (!customerId) return;

    try {
      setMultiLoading('updateCustomer', true);

      const updates = {
        companyName: `Updated Company ${Date.now()}`,
      };

      // Optimistic update in list
      const listQueryKey = ['customers', 'list', { page: 1, limit: 10 }];
      const { rollback: rollbackList } = await updateInList(listQueryKey, customerId, updates);

      // Optimistic update in detail
      const detailQueryKey = ['customers', 'detail', customerId];
      const { rollback: rollbackDetail } = await updateStatus(detailQueryKey, 'UPDATING', updates);

      try {
        await updateCustomerMutation.mutateAsync({
          id: customerId,
          data: updates,
        });
        
        // Invalidate related data
        invalidateRelatedData({ customerId });
      } catch (error) {
        rollbackList();
        rollbackDetail();
        throw error;
      }
    } catch (error) {
      const errorInfo = handleApiError(error, 'update customer');
      setError(new Error(errorInfo.userMessage));
    } finally {
      setMultiLoading('updateCustomer', false);
    }
  };

  // Handle customer deletion with optimistic updates
  const handleDeleteCustomer = async (customerId: string) => {
    if (!customerId) return;

    try {
      setMultiLoading('deleteCustomer', true);

      // Optimistic update
      const queryKey = ['customers', 'list', { page: 1, limit: 10 }];
      const { rollback } = await removeFromList(queryKey, customerId);

      try {
        await deleteCustomerMutation.mutateAsync(customerId);
        
        // Clear selected customer if it was deleted
        if (selectedCustomerId === customerId) {
          setSelectedCustomerId('');
        }
        
        // Invalidate related data
        invalidateRelatedData({ customerId });
      } catch (error) {
        rollback();
        throw error;
      }
    } catch (error) {
      const errorInfo = handleApiError(error, 'delete customer');
      setError(new Error(errorInfo.userMessage));
    } finally {
      setMultiLoading('deleteCustomer', false);
    }
  };

  // Handle cache operations
  const handleWarmCache = async () => {
    try {
      setLoading(true);
      await warmCache();
      setData({ message: 'Cache warmed successfully' });
    } catch (error) {
      const errorInfo = handleError(error, { fallbackMessage: 'Failed to warm cache' });
      setError(new Error(errorInfo.userMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleClearStaleCache = () => {
    try {
      clearStaleCache(5 * 60 * 1000); // Clear cache older than 5 minutes
      setData({ message: 'Stale cache cleared' });
    } catch (error) {
      const errorInfo = handleError(error, { fallbackMessage: 'Failed to clear cache' });
      setError(new Error(errorInfo.userMessage));
    }
  };

  const handleBackgroundRefresh = async () => {
    try {
      setLoading(true);
      await backgroundRefresh();
      setData({ message: 'Background refresh completed' });
    } catch (error) {
      const errorInfo = handleError(error, { fallbackMessage: 'Background refresh failed' });
      setError(new Error(errorInfo.userMessage));
    } finally {
      setLoading(false);
    }
  };

  // Get cache statistics
  const cacheStats = getCacheStats();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Advanced State Management Demo</h1>
      
      {/* Cache Statistics */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Cache Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div className="bg-white p-2 rounded">
            <div className="font-medium">Total Queries</div>
            <div className="text-lg">{cacheStats.totalQueries}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-medium">Active Queries</div>
            <div className="text-lg">{cacheStats.activeQueries}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-medium">Stale Queries</div>
            <div className="text-lg">{cacheStats.staleQueries}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-medium">Error Queries</div>
            <div className="text-lg">{cacheStats.errorQueries}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-medium">Loading Queries</div>
            <div className="text-lg">{cacheStats.loadingQueries}</div>
          </div>
          <div className="bg-white p-2 rounded">
            <div className="font-medium">Cache Size</div>
            <div className="text-lg">{Math.round(cacheStats.cacheSize / 1024)}KB</div>
          </div>
        </div>
      </div>

      {/* Cache Management Actions */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-3">Cache Management</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleWarmCache}
            disabled={isLoading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Warm Cache
          </button>
          <button
            onClick={handleClearStaleCache}
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
          >
            Clear Stale
          </button>
          <button
            onClick={handleBackgroundRefresh}
            disabled={isLoading}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
          >
            Background Refresh
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b mb-6">
        <nav className="flex space-x-8">
          {(['customers', 'quotations', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Global Error Display */}
      {(customersError || quotationsError || analyticsError || isLoading) && (
        <div className="mb-4 space-y-2">
          {customersError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Customers Error: {customersError.message}
            </div>
          )}
          {quotationsError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Quotations Error: {quotationsError.message}
            </div>
          )}
          {analyticsError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Analytics Error: {analyticsError.message}
            </div>
          )}
          {isAnyLoading() && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              Processing operations...
            </div>
          )}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'customers' && (
        <div>
          {/* Customer Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={handleCreateCustomer}
              disabled={isMultiLoading('createCustomer')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isMultiLoading('createCustomer') ? 'Creating...' : 'Create Customer'}
            </button>
            
            <button
              onClick={() => handleUpdateCustomer(selectedCustomerId)}
              disabled={!selectedCustomerId || isMultiLoading('updateCustomer')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isMultiLoading('updateCustomer') ? 'Updating...' : 'Update Selected'}
            </button>
            
            <button
              onClick={() => handleDeleteCustomer(selectedCustomerId)}
              disabled={!selectedCustomerId || isMultiLoading('deleteCustomer')}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {isMultiLoading('deleteCustomer') ? 'Deleting...' : 'Delete Selected'}
            </button>
            
            <button
              onClick={() => refetchCustomers()}
              disabled={isLoadingCustomers}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
            >
              Refresh Data
            </button>
          </div>

          {/* Customers List */}
          <div className="bg-white border rounded-lg">
            <div className="px-4 py-3 border-b">
              <h2 className="text-xl font-semibold">
                Customers ({customersData?.total || 0})
              </h2>
            </div>
            
            {isLoadingCustomers ? (
              <div className="p-4 text-center">Loading customers...</div>
            ) : customersData?.data?.length ? (
              <div className="divide-y">
                {customersData.data.map((customer: any) => (
                  <div
                    key={customer.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${
                      selectedCustomerId === customer.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{customer.companyName}</h3>
                        <p className="text-sm text-gray-600">{customer.contactPerson}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>ID: {customer.id}</div>
                        <div>Credit: ${customer.creditLimit?.toLocaleString()}</div>
                        <div className={`inline-block px-2 py-1 rounded text-xs ${
                          customer.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No customers found. Create one to get started!
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'quotations' && (
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b">
            <h2 className="text-xl font-semibold">
              Recent Quotations ({quotationsData?.total || 0})
            </h2>
          </div>
          
          {isLoadingQuotations ? (
            <div className="p-4 text-center">Loading quotations...</div>
          ) : quotationsData?.data?.length ? (
            <div className="divide-y">
              {quotationsData.data.map((quotation: any) => (
                <div key={quotation.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{quotation.quotationNumber}</h3>
                      <p className="text-sm text-gray-600">
                        Customer: {quotation.customer?.companyName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Total: ${quotation.totalAmount?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <div className={`inline-block px-2 py-1 rounded text-xs ${
                        quotation.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                        quotation.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        quotation.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {quotation.status}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No quotations found.
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white border rounded-lg">
          <div className="px-4 py-3 border-b">
            <h2 className="text-xl font-semibold">Dashboard Analytics</h2>
          </div>
          
          {isLoadingAnalytics ? (
            <div className="p-4 text-center">Loading analytics...</div>
          ) : analyticsData ? (
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">
                    {analyticsData.totalQuotations || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Quotations</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">
                    {analyticsData.totalCustomers || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Customers</div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(analyticsData.totalRevenue || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    {((analyticsData.conversionRate || 0) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Conversion Rate</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No analytics data available.
            </div>
          )}
        </div>
      )}

      {/* Mutation Status */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className={`p-3 rounded ${
          createCustomerMutation.isSuccess ? 'bg-green-100 text-green-800' :
          createCustomerMutation.isError ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          Create Status: {
            createCustomerMutation.isPending ? 'Pending' :
            createCustomerMutation.isSuccess ? 'Success' :
            createCustomerMutation.isError ? 'Error' :
            'Idle'
          }
        </div>
        
        <div className={`p-3 rounded ${
          updateCustomerMutation.isSuccess ? 'bg-green-100 text-green-800' :
          updateCustomerMutation.isError ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          Update Status: {
            updateCustomerMutation.isPending ? 'Pending' :
            updateCustomerMutation.isSuccess ? 'Success' :
            updateCustomerMutation.isError ? 'Error' :
            'Idle'
          }
        </div>
        
        <div className={`p-3 rounded ${
          deleteCustomerMutation.isSuccess ? 'bg-green-100 text-green-800' :
          deleteCustomerMutation.isError ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-600'
        }`}>
          Delete Status: {
            deleteCustomerMutation.isPending ? 'Pending' :
            deleteCustomerMutation.isSuccess ? 'Success' :
            deleteCustomerMutation.isError ? 'Error' :
            'Idle'
          }
        </div>
      </div>
    </div>
  );
}

// Main demo app with providers
export default function StateManagementDemoApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <StateManagementDemo />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}