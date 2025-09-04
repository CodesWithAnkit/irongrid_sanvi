'use client';

import React, { useState } from 'react';
import { 
  useCustomers, 
  useCreateCustomer, 
  useUpdateCustomer,
  useDeleteCustomer,
  useCustomerSearch,
  useQuotations,
  useCreateQuotation,
  useSendQuotation,
  useProducts,
  useProductSearch,
  useAuth,
  useErrorHandler,
  useLoadingState,
  useOfflineIndicator,
} from '@/lib/hooks';
import { Skeleton, TableSkeleton, CardSkeleton } from '@/components/ui/skeleton';
import type { CreateCustomerRequest, CreateQuotationRequest } from '@/lib/services';

export function ApiIntegrationExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Auth state
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Error handling
  const { handleError } = useErrorHandler();
  
  // Loading states
  const loadingState = useLoadingState();
  
  // Offline indicator
  const { isOnline, queueSize, showIndicator, message } = useOfflineIndicator();
  
  // Data fetching hooks
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    error: customersError 
  } = useCustomers({ page: 1, limit: 10 });
  
  const { 
    data: quotationsData, 
    isLoading: quotationsLoading 
  } = useQuotations({ page: 1, limit: 5 });
  
  const { 
    data: productsData, 
    isLoading: productsLoading 
  } = useProducts({ page: 1, limit: 8 });
  
  // Search hooks
  const { 
    data: searchResults, 
    isLoading: searchLoading 
  } = useCustomerSearch(searchQuery, searchQuery.length > 2);
  
  const { 
    data: productSearchResults 
  } = useProductSearch(searchQuery, {}, searchQuery.length > 2);
  
  // Mutation hooks
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();
  const createQuotationMutation = useCreateQuotation();
  const sendQuotationMutation = useSendQuotation();
  
  // Handle errors
  React.useEffect(() => {
    if (customersError) {
      handleError(customersError, { 
        fallbackMessage: 'Failed to load customers' 
      });
    }
  }, [customersError, handleError]);
  
  // Example handlers
  const handleCreateCustomer = async () => {
    try {
      loadingState.setLoading(true);
      
      const newCustomer: CreateCustomerRequest = {
        companyName: 'Example Corp',
        contactPerson: 'John Doe',
        email: 'john@example.com',
        phone: '+91 98765 43210',
        address: {
          street: '123 Business St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        customerType: 'MANUFACTURER',
        creditLimit: 100000,
        paymentTerms: 'NET_30',
      };
      
      const result = await createCustomerMutation.mutateAsync(newCustomer);
      loadingState.setData(result);
      console.log('Customer created:', result);
    } catch (error) {
      const errorInfo = handleError(error, { 
        fallbackMessage: 'Failed to create customer' 
      });
      loadingState.setError(new Error(errorInfo.message));
    }
  };
  
  const handleUpdateCustomer = async (customerId: string) => {
    try {
      await updateCustomerMutation.mutateAsync({
        id: customerId,
        data: {
          creditLimit: 150000,
          notes: 'Updated credit limit',
        },
      });
      console.log('Customer updated');
    } catch (error) {
      handleError(error, { fallbackMessage: 'Failed to update customer' });
    }
  };
  
  const handleDeleteCustomer = async (customerId: string) => {
    try {
      await deleteCustomerMutation.mutateAsync(customerId);
      console.log('Customer deleted');
    } catch (error) {
      handleError(error, { fallbackMessage: 'Failed to delete customer' });
    }
  };
  
  const handleCreateQuotation = async () => {
    if (!selectedCustomerId) return;
    
    try {
      const newQuotation: CreateQuotationRequest = {
        customerId: selectedCustomerId,
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            unitPrice: 50000,
            discountPercentage: 5,
          },
        ],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        termsConditions: 'Standard terms and conditions apply.',
        notes: 'Created from API integration example',
      };
      
      const result = await createQuotationMutation.mutateAsync(newQuotation);
      console.log('Quotation created:', result);
    } catch (error) {
      handleError(error, { fallbackMessage: 'Failed to create quotation' });
    }
  };
  
  const handleSendQuotation = async (quotationId: string) => {
    try {
      await sendQuotationMutation.mutateAsync({
        id: quotationId,
        data: {
          subject: 'Your Quotation from Sanvi Machinery',
          message: 'Please find your quotation attached.',
        },
      });
      console.log('Quotation sent');
    } catch (error) {
      handleError(error, { fallbackMessage: 'Failed to send quotation' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Login Required</h2>
        <p className="mb-4">Please log in to view the API integration example.</p>
        <button
          onClick={() => login({ email: 'demo@example.com', password: 'password' })}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Demo Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Integration Example</h1>
        <div className="flex items-center space-x-4">
          {showIndicator && (
            <div className={`px-3 py-1 rounded text-sm ${
              isOnline ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
          <span className="text-sm text-gray-600">
            Welcome, {user?.firstName} {user?.lastName}
          </span>
          <button
            onClick={() => logout()}
            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Search</h2>
        <input
          type="text"
          placeholder="Search customers or products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
        
        {searchLoading && <div className="mt-2">Searching...</div>}
        
        {searchResults && searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Customer Results:</h3>
            <div className="space-y-2">
              {searchResults.map((customer) => (
                <div key={customer.id} className="p-2 border rounded">
                  <div className="font-medium">{customer.companyName}</div>
                  <div className="text-sm text-gray-600">{customer.email}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {productSearchResults && productSearchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Product Results:</h3>
            <div className="space-y-2">
              {productSearchResults.map((product) => (
                <div key={product.id} className="p-2 border rounded">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-600">{product.sku}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Customers Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Customers</h2>
          <button
            onClick={handleCreateCustomer}
            disabled={createCustomerMutation.isPending || loadingState.isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {createCustomerMutation.isPending || loadingState.isLoading ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
        
        {customersLoading ? (
          <TableSkeleton rows={5} columns={4} />
        ) : customersData?.data ? (
          <div className="space-y-2">
            {customersData.data.map((customer) => (
              <div key={customer.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{customer.companyName}</div>
                  <div className="text-sm text-gray-600">{customer.contactPerson} - {customer.email}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedCustomerId(customer.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedCustomerId === customer.id 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Select
                  </button>
                  <button
                    onClick={() => handleUpdateCustomer(customer.id)}
                    disabled={updateCustomerMutation.isPending}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer.id)}
                    disabled={deleteCustomerMutation.isPending}
                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No customers found</div>
        )}
      </div>

      {/* Quotations Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Quotations</h2>
          <button
            onClick={handleCreateQuotation}
            disabled={!selectedCustomerId || createQuotationMutation.isPending}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {createQuotationMutation.isPending ? 'Creating...' : 'Create Quotation'}
          </button>
        </div>
        
        {!selectedCustomerId && (
          <div className="text-sm text-gray-600 mb-4">
            Select a customer to create quotations
          </div>
        )}
        
        {quotationsLoading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : quotationsData?.data ? (
          <div className="space-y-2">
            {quotationsData.data.map((quotation) => (
              <div key={quotation.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <div className="font-medium">{quotation.quotationNumber}</div>
                  <div className="text-sm text-gray-600">
                    {quotation.customer.companyName} - ₹{quotation.totalAmount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Status: {quotation.status}</div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSendQuotation(quotation.id)}
                    disabled={sendQuotationMutation.isPending || quotation.status === 'SENT'}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {quotation.status === 'SENT' ? 'Sent' : 'Send'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>No quotations found</div>
        )}
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        
        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : productsData?.data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {productsData.data.map((product) => (
              <div key={product.id} className="border rounded-lg p-4">
                <div className="font-medium">{product.name}</div>
                <div className="text-sm text-gray-600">{product.sku}</div>
                <div className="text-lg font-semibold mt-2">
                  ₹{product.basePrice.toLocaleString()}
                </div>
                {product.inventoryCount !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    Stock: {product.inventoryCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div>No products found</div>
        )}
      </div>

      {/* Loading State Example */}
      {loadingState.isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800">Processing your request...</div>
        </div>
      )}

      {loadingState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">Error: {loadingState.error.message}</div>
        </div>
      )}

      {loadingState.data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800">Success! Data updated.</div>
        </div>
      )}
    </div>
  );
}