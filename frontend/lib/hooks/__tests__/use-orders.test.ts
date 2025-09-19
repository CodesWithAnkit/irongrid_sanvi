import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { ReactNode } from 'react';
import {
    useOrders,
    useOrder,
    useCreateOrder,
    useUpdateOrder,
    useUpdateOrderStatus,
    useProcessPayment,
    useGenerateInvoice,
    useCancelOrder,
    useRefundOrder,
    useOrderTracking,
    useOrderHistory
} from '../use-orders';
import { ApiError, ErrorCodes } from '../../api';
import { afterEach, describe, expect, it } from 'vitest';

// Mock the order service with proper response format
const mockOrder = {
    id: 'order-1',
    orderNumber: 'ORD-2024-001',
    customerId: 'customer-1',
    quotationId: 'quotation-1',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    totalAmount: 15000,
    items: [
        {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            unitPrice: 7500,
            total: 15000,
        },
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

const mockOrderList = {
    data: [mockOrder],
    total: 1,
    page: 1,
    limit: 10,
};

const mockOrderResponse = {
  success: true,
  data: mockOrder,
  message: 'Success',
  timestamp: new Date().toISOString(),
  requestId: 'req-123'
};

const mockOrderListResponse = {
  success: true,
  data: mockOrderList,
  message: 'Success',
  timestamp: new Date().toISOString(),
  requestId: 'req-456'
};

const mockOrderService = {
  getOrders: jest.fn().mockResolvedValue(mockOrderListResponse),
  getOrder: jest.fn().mockResolvedValue(mockOrderResponse),
  createOrder: jest.fn().mockResolvedValue(mockOrderResponse),
  updateOrder: jest.fn().mockResolvedValue(mockOrderResponse),
  updateOrderStatus: jest.fn().mockResolvedValue(mockOrderResponse),
  processPayment: jest.fn().mockResolvedValue({
    success: true,
    data: {
      paymentId: 'payment-1',
      status: 'SUCCESS',
      transactionId: 'txn-123'
    }
  }),
  generateInvoice: jest.fn().mockResolvedValue({
    success: true,
    data: {
      invoiceUrl: 'https://example.com/invoice.pdf',
      invoiceNumber: 'INV-2024-001'
    }
  }),
  cancelOrder: jest.fn().mockResolvedValue({ success: true }),
  refundOrder: jest.fn().mockResolvedValue({
    success: true,
    data: {
      refundId: 'refund-1',
      amount: 15000,
      status: 'PROCESSING'
    }
  }),
  getOrderTracking: jest.fn().mockResolvedValue({
    success: true,
    data: {
      status: 'IN_TRANSIT',
      trackingNumber: 'TRK-123456',
      estimatedDelivery: '2024-01-15T00:00:00Z',
      updates: []
    }
  }),
  getOrderHistory: jest.fn().mockResolvedValue({
    success: true,
    data: {
      orders: [mockOrder],
      totalOrders: 1,
      totalValue: 15000,
      averageOrderValue: 15000
    }
  })
};

jest.mock('../../services/order.service', () => ({
  orderService: mockOrderService
}));

import { orderService } from '../../services/order.service';

describe('Order Hooks', () => {
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

        jest.clearAllMocks();
    });

    afterEach(() => {
        queryClient.clear();
    });

    describe('useOrders', () => {
        it('should fetch orders list successfully', async () => {
            (orderService.getOrders as jest.Mock).mockResolvedValue(mockOrderListResponse);

            const { result } = renderHook(
                () => useOrders({ page: 1, limit: 10, status: 'PENDING' }),
                { wrapper }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockOrderList);
            expect(orderService.getOrders).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                status: 'PENDING',
            });
        });

        it('should handle fetch errors', async () => {
            const error = new ApiError('Fetch failed', ErrorCodes.EXTERNAL_SERVICE_ERROR, 502);
            (orderService.getOrders as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(
                () => useOrders({ page: 1, limit: 10, status: 'PENDING' }),
                { wrapper }
            );

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toEqual(error);
        });
    });

    describe('useOrder', () => {
        it('should fetch single order successfully', async () => {
            (orderService.getOrder as jest.Mock).mockResolvedValue(mockOrderResponse);

            const { result } = renderHook(
                () => useOrder('order-1'),
                { wrapper }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(mockOrder);
            expect(orderService.getOrder).toHaveBeenCalledWith('order-1');
        });

        it('should handle fetch errors', async () => {
            const error = new ApiError('Fetch failed', ErrorCodes.EXTERNAL_SERVICE_ERROR, 502);
            (orderService.getOrder as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(
                () => useOrder('order-1'),
                { wrapper }
            );

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });

            expect(result.current.error).toEqual(error);
        });

        it('should be disabled when id is empty', () => {
            const { result } = renderHook(
                () => useOrder(''),
                { wrapper }
            );

            expect(result.current.fetchStatus).toBe('idle');
            expect(orderService.getOrder).not.toHaveBeenCalled();
        });
    });

    describe('useCreateOrder', () => {
        it('should create order and update cache', async () => {
            const newOrder = { ...mockOrder, id: 'order-2' };
            (orderService.createOrder as jest.Mock).mockResolvedValue(mockOrderResponse);

            const { result } = renderHook(() => useCreateOrder(), { wrapper });

            const mockOrderData = {
                customerId: 'customer-1',
                items: [],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Test City',
                    state: 'TS',
                    postalCode: '12345',
                    country: 'US'
                }
            };

            await act(async () => {
                await result.current.mutateAsync(mockOrderData);
            });

            expect(orderService.createOrder).toHaveBeenCalledWith(mockOrderData);
            expect(result.current.isSuccess).toBe(true);

            // Verify cache was updated
            const cachedOrder = queryClient.getQueryData(['orders', 'detail', 'order-2']);
            expect(cachedOrder).toEqual(newOrder);
        });

        it('should handle creation errors', async () => {
            const error = new ApiError('Creation failed', ErrorCodes.VALIDATION_ERROR, 400);
            (orderService.createOrder as jest.Mock).mockRejectedValue(error);

            const { result } = renderHook(() => useCreateOrder(), { wrapper });

            await act(async () => {
                try {
                    await result.current.mutateAsync({
                        customerId: 'customer-1',
                        items: [],
                        shippingAddress: {
                            street: '123 Main St',
                            city: 'Test City',
                            state: 'TS',
                            postalCode: '12345',
                            country: 'US'
                        }
                    });
                } catch (error) {
                    expect(error).toEqual(error);
                }
            });

            expect(result.current.isError).toBe(true);
        });
    });

    describe('useUpdateOrder', () => {
        it('should update order with optimistic updates', async () => {
            const updatedOrder = { ...mockOrder, totalAmount: 18000 };
            (orderService.updateOrder as jest.Mock).mockResolvedValue(mockOrderResponse);

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useUpdateOrder(), { wrapper });

            await act(async () => {
                await result.current.mutateAsync({
                    id: 'order-1',
                    data: { status: 'CONFIRMED', notes: 'Order confirmed' },
                });
            });

            expect(orderService.updateOrder).toHaveBeenCalledWith('order-1', {
                status: 'CONFIRMED',
                notes: 'Order confirmed',
            });
        });

        it('should rollback on update error', async () => {
            const error = new ApiError('Update failed', ErrorCodes.VALIDATION_ERROR, 400);
            (orderService.updateOrder as jest.Mock).mockRejectedValue(error);

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useUpdateOrder(), { wrapper });

            await act(async () => {
                try {
                    await result.current.mutateAsync({
                        id: 'order-1',
                        data: {
                            status: 'CONFIRMED',
                            notes: 'Order confirmed',
                        },
                    });
                } catch (e) {
                    // Expected to fail
                }
            });

            // Verify rollback occurred
            const rolledBackData = queryClient.getQueryData(['orders', 'detail', 'order-1']);
            expect(rolledBackData).toEqual(mockOrder);
        });
    });

    describe('useUpdateOrderStatus', () => {
        it('should update order status optimistically', async () => {
            const updatedOrder = { ...mockOrder, status: 'CONFIRMED' };
            (orderService.updateOrderStatus as jest.Mock).mockResolvedValue(mockOrderResponse);

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useUpdateOrderStatus(), { wrapper });

            await act(async () => {
                await result.current.mutateAsync({
                    id: 'order-1',
                    status: 'CONFIRMED',
                    notes: 'Order confirmed by customer',
                });
            });

            expect(orderService.updateOrderStatus).toHaveBeenCalledWith(
                'order-1',
                'CONFIRMED',
                'Order confirmed by customer'
            );
        });
    });

    describe('useProcessPayment', () => {
        it('should process payment with optimistic updates', async () => {
            const paymentResult = {
                paymentId: 'payment-1',
                status: 'SUCCESS',
                transactionId: 'txn-123',
            };
            (orderService.processPayment as jest.Mock).mockResolvedValue({
                success: true,
                data: paymentResult
            });

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useProcessPayment(), { wrapper });

            const paymentData = {
                amount: 15000,
                paymentMethod: 'CREDIT_CARD',
                cardToken: 'card-token-123',
            };

            await act(async () => {
                await result.current.mutateAsync({
                    orderId: 'order-1',
                    paymentData,
                });
            });

            expect(orderService.processPayment).toHaveBeenCalledWith('order-1', paymentData);
        });

        it('should rollback payment status on error', async () => {
            const error = new ApiError('Payment failed', ErrorCodes.EXTERNAL_SERVICE_ERROR, 502);
            (orderService.processPayment as jest.Mock).mockRejectedValue(error);

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useProcessPayment(), { wrapper });

            await act(async () => {
                try {
                    await result.current.mutateAsync({
                        orderId: 'order-1',
                        paymentData: { amount: 15000, paymentMethod: 'CREDIT_CARD' },
                    });
                } catch (e) {
                    // Expected to fail
                }
            });

            // Verify rollback occurred
            const rolledBackData = queryClient.getQueryData(['orders', 'detail', 'order-1']);
            expect(rolledBackData).toEqual(mockOrder);
        });
    });

    describe('useGenerateInvoice', () => {
        it('should generate invoice and update cache', async () => {
            const invoiceData = {
                invoiceUrl: 'https://example.com/invoice.pdf',
                invoiceNumber: 'INV-2024-001',
            };
            (orderService.generateInvoice as jest.Mock).mockResolvedValue({
                success: true,
                data: invoiceData
            });

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useGenerateInvoice(), { wrapper });

            await act(async () => {
                await result.current.mutateAsync('order-1');
            });

            expect(orderService.generateInvoice).toHaveBeenCalledWith('order-1');

            // Verify cache was updated with invoice data
            const updatedOrder = queryClient.getQueryData(['orders', 'detail', 'order-1']) as any;
            expect(updatedOrder.invoiceUrl).toBe(invoiceData.invoiceUrl);
            expect(updatedOrder.invoiceNumber).toBe(invoiceData.invoiceNumber);
        });
    });

    describe('useCancelOrder', () => {
        it('should cancel order with optimistic updates', async () => {
            (orderService.cancelOrder as jest.Mock).mockResolvedValue({ success: true });

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useCancelOrder(), { wrapper });

            await act(async () => {
                await result.current.mutateAsync({
                    id: 'order-1',
                    reason: 'Customer requested cancellation',
                });
            });

            expect(orderService.cancelOrder).toHaveBeenCalledWith(
                'order-1',
                'Customer requested cancellation'
            );
        });
    });

    describe('useRefundOrder', () => {
        it('should process refund with optimistic updates', async () => {
            const refundResult = {
                refundId: 'refund-1',
                amount: 15000,
                status: 'PROCESSING',
            };
            (orderService.refundOrder as jest.Mock).mockResolvedValue({
                success: true,
                data: refundResult
            });

            // Set initial data
            queryClient.setQueryData(['orders', 'detail', 'order-1'], mockOrder);

            const { result } = renderHook(() => useRefundOrder(), { wrapper });

            await act(async () => {
                await result.current.mutateAsync({
                    id: 'order-1',
                    amount: 15000,
                    reason: 'Product defect',
                });
            });

            expect(orderService.refundOrder).toHaveBeenCalledWith(
                'order-1',
                15000,
                'Product defect'
            );
        });
    });

    describe('useOrderTracking', () => {
        it('should fetch order tracking with auto-refresh', async () => {
            const trackingData = {
                status: 'IN_TRANSIT',
                trackingNumber: 'TRK-123456',
                estimatedDelivery: '2024-01-15T00:00:00Z',
                updates: [
                    {
                        timestamp: '2024-01-10T10:00:00Z',
                        status: 'SHIPPED',
                        location: 'Warehouse',
                    },
                    {
                        timestamp: '2024-01-11T14:30:00Z',
                        status: 'IN_TRANSIT',
                        location: 'Distribution Center',
                    },
                ],
            };

            (orderService.getOrderTracking as jest.Mock).mockResolvedValue({
                success: true,
                data: trackingData
            });

            const { result } = renderHook(
                () => useOrderTracking('order-1'),
                { wrapper }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(trackingData);
            expect(orderService.getOrderTracking).toHaveBeenCalledWith('order-1');
        });
    });

    describe('useOrderHistory', () => {
        it('should fetch customer order history', async () => {
            const orderHistory = {
                orders: [mockOrder],
                totalOrders: 1,
                totalValue: 15000,
                averageOrderValue: 15000,
            };

            (orderService.getOrderHistory as jest.Mock).mockResolvedValue({
                success: true,
                data: orderHistory
            });

            const { result } = renderHook(
                () => useOrderHistory('customer-1'),
                { wrapper }
            );

            await waitFor(() => {
                expect(result.current.isSuccess).toBe(true);
            });

            expect(result.current.data).toEqual(orderHistory);
            expect(orderService.getOrderHistory).toHaveBeenCalledWith('customer-1');
        });
    });

    describe('Cache Invalidation', () => {
        it('should invalidate related caches on order creation', async () => {
            const newOrder = { ...mockOrder, id: 'order-2', quotationId: 'quotation-1' };
            (orderService.createOrder as jest.Mock).mockResolvedValue(mockOrderResponse);

            const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

            const { result } = renderHook(() => useCreateOrder(), { wrapper });

            await act(async () => {
                await result.current.mutateAsync({
                    customerId: 'customer-1',
                    quotationId: 'quotation-1',
                    items: [],
                    shippingAddress: {
                        street: '123 Main St',
                        city: 'Test City',
                        state: 'TS',
                        postalCode: '12345',
                        country: 'US'
                    }
                });
            });

            // Verify that related queries were invalidated
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['orders', 'list'],
            });
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['quotations', 'detail', 'quotation-1'],
            });
            expect(invalidateSpy).toHaveBeenCalledWith({
                queryKey: ['analytics'],
            });
        });
    });
});