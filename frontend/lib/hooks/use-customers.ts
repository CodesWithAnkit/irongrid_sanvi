import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customer.service';
import { queryKeys, invalidateQueries } from '../query-client';
import { ApiError } from '../api';
import type { 
  CreateCustomerRequest, 
  UpdateCustomerRequest, 
  CustomerFilters,
  PaginationParams 
} from '../services/customer.service';

export function useCustomers(params: PaginationParams & CustomerFilters = {}) {
  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => customerService.getCustomers(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCustomer(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => customerService.getCustomer(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.customers.search(query),
    queryFn: () => customerService.searchCustomers(query),
    enabled: enabled && query.length > 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCustomerAnalytics(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.customers.analytics(id),
    queryFn: () => customerService.getCustomerAnalytics(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCustomerInteractions(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.customers.interactions(id),
    queryFn: () => customerService.getCustomerInteractions(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: (newCustomer) => {
      // Invalidate customers list
      invalidateQueries.customers.list();
      
      // Optimistically add to cache
      queryClient.setQueryData(
        queryKeys.customers.detail(newCustomer.id),
        newCustomer
      );
    },
    onError: (error: ApiError) => {
      console.error('Create customer failed:', error.message);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerRequest }) =>
      customerService.updateCustomer(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.detail(id) });

      // Snapshot previous value
      const previousCustomer = queryClient.getQueryData(queryKeys.customers.detail(id));

      // Optimistically update
      if (previousCustomer) {
        queryClient.setQueryData(queryKeys.customers.detail(id), {
          ...previousCustomer,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousCustomer };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousCustomer) {
        queryClient.setQueryData(queryKeys.customers.detail(id), context.previousCustomer);
      }
      console.error('Update customer failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      invalidateQueries.customers.detail(id);
      invalidateQueries.customers.list();
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: customerService.deleteCustomer,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.detail(id) });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) });

      // Update lists optimistically
      queryClient.setQueriesData(
        { queryKey: queryKeys.customers.lists() },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((customer: any) => customer.id !== id),
          };
        }
      );
    },
    onError: (error: ApiError, id) => {
      console.error('Delete customer failed:', error.message);
      // Refetch to restore data
      invalidateQueries.customers.list();
    },
    onSettled: () => {
      invalidateQueries.customers.list();
    },
  });
}

export function useAddCustomerInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, interaction }: { 
      id: string; 
      interaction: Parameters<typeof customerService.addCustomerInteraction>[1] 
    }) => customerService.addCustomerInteraction(id, interaction),
    onSuccess: (newInteraction, { id }) => {
      // Update interactions cache
      queryClient.setQueryData(
        queryKeys.customers.interactions(id),
        (oldData: any) => {
          if (!oldData) return [newInteraction];
          return [newInteraction, ...oldData];
        }
      );
    },
    onError: (error: ApiError) => {
      console.error('Add customer interaction failed:', error.message);
    },
  });
}

export function useUpdateCreditLimit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, creditLimit }: { id: string; creditLimit: number }) =>
      customerService.updateCreditLimit(id, creditLimit),
    onMutate: async ({ id, creditLimit }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.customers.detail(id) });

      // Snapshot previous value
      const previousCustomer = queryClient.getQueryData(queryKeys.customers.detail(id));

      // Optimistically update
      if (previousCustomer) {
        queryClient.setQueryData(queryKeys.customers.detail(id), {
          ...previousCustomer,
          creditLimit,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousCustomer };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousCustomer) {
        queryClient.setQueryData(queryKeys.customers.detail(id), context.previousCustomer);
      }
      console.error('Update credit limit failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      invalidateQueries.customers.detail(id);
      invalidateQueries.customers.list();
    },
  });
}

export function useImportCustomers() {
  return useMutation({
    mutationFn: customerService.importCustomers,
    onSuccess: () => {
      // Invalidate all customer queries after import
      invalidateQueries.customers.all();
    },
    onError: (error: ApiError) => {
      console.error('Import customers failed:', error.message);
    },
  });
}