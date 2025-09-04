import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/order.service';
import { queryKeys, invalidateQueries } from '../query-client';
import { ApiError } from '../api';
import type {
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderFilters,
  PaymentRequest,
  PaginationParams
} from '../services/order.service';

export function useOrders(params: PaginationParams & OrderFilters = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => orderService.getOrders(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useOrder(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderService.getOrder(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (newOrder) => {
      // Invalidate orders list
      invalidateQueries.orders.list();

      // Add to cache
      queryClient.setQueryData(
        queryKeys.orders.detail(newOrder.id),
        newOrder
      );

      // Invalidate related quotation if converted from quotation
      if (newOrder.quotationId) {
        invalidateQueries.quotations.detail(newOrder.quotationId);
        invalidateQueries.quotations.list();
      }

      // Invalidate analytics
      invalidateQueries.analytics.all();
    },
    onError: (error: ApiError) => {
      console.error('Create order failed:', error.message);
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderRequest }) =>
      orderService.updateOrder(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(id) });

      // Snapshot previous value
      const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(id));

      // Optimistically update
      if (previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), {
          ...previousOrder,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), context.previousOrder);
      }
      console.error('Update order failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      invalidateQueries.orders.detail(id);
      invalidateQueries.orders.list();
      invalidateQueries.analytics.all();
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { 
      id: string; 
      status: string; 
      notes?: string 
    }) => orderService.updateOrderStatus(id, status, notes),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.orders.detail(id) });

      // Snapshot previous value
      const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(id));

      // Optimistically update status
      if (previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), {
          ...previousOrder,
          status,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), context.previousOrder);
      }
      console.error('Update order status failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      invalidateQueries.orders.detail(id);
      invalidateQueries.orders.list();
      invalidateQueries.analytics.all();
    },
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, paymentData }: { 
      orderId: string; 
      paymentData: PaymentRequest 
    }) => orderService.processPayment(orderId, paymentData),
    onMutate: async ({ orderId }) => {
      // Optimistically update payment status
      const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(orderId));

      if (previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(orderId), {
          ...previousOrder,
          paymentStatus: 'PROCESSING',
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error: ApiError, { orderId }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(orderId), context.previousOrder);
      }
      console.error('Process payment failed:', error.message);
    },
    onSettled: (data, error, { orderId }) => {
      invalidateQueries.orders.detail(orderId);
      invalidateQueries.orders.list();
      invalidateQueries.analytics.all();
    },
  });
}

export function useGenerateInvoice() {
  return useMutation({
    mutationFn: orderService.generateInvoice,
    onSuccess: (invoiceData, orderId) => {
      // Update order cache with invoice information
      const queryClient = useQueryClient();
      queryClient.setQueryData(
        queryKeys.orders.detail(orderId),
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            invoiceUrl: invoiceData.invoiceUrl,
            invoiceNumber: invoiceData.invoiceNumber,
            invoiceGeneratedAt: new Date().toISOString(),
          };
        }
      );
    },
    onError: (error: ApiError) => {
      console.error('Generate invoice failed:', error.message);
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      orderService.cancelOrder(id, reason),
    onMutate: async ({ id }) => {
      // Optimistically update status
      const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(id));

      if (previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), {
          ...previousOrder,
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), context.previousOrder);
      }
      console.error('Cancel order failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      invalidateQueries.orders.detail(id);
      invalidateQueries.orders.list();
      invalidateQueries.analytics.all();
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, amount, reason }: { 
      id: string; 
      amount?: number; 
      reason: string 
    }) => orderService.refundOrder(id, amount, reason),
    onMutate: async ({ id }) => {
      // Optimistically update refund status
      const previousOrder = queryClient.getQueryData(queryKeys.orders.detail(id));

      if (previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), {
          ...previousOrder,
          refundStatus: 'PROCESSING',
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousOrder };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(queryKeys.orders.detail(id), context.previousOrder);
      }
      console.error('Refund order failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      invalidateQueries.orders.detail(id);
      invalidateQueries.orders.list();
      invalidateQueries.analytics.all();
    },
  });
}

export function useOrderTracking(orderId: string, enabled = true) {
  return useQuery({
    queryKey: ['orders', orderId, 'tracking'],
    queryFn: () => orderService.getOrderTracking(orderId),
    enabled: enabled && !!orderId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2 minutes for active tracking
  });
}

export function useOrderHistory(customerId: string, enabled = true) {
  return useQuery({
    queryKey: ['orders', 'history', customerId],
    queryFn: () => orderService.getOrderHistory(customerId),
    enabled: enabled && !!customerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}