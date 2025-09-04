import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotationService } from '../services/quotation.service';
import { queryKeys, invalidateQueries } from '../query-client';
import { ApiError } from '../api';
import type {
    CreateQuotationRequest,
    UpdateQuotationRequest,
    QuotationFilters,
    SendQuotationRequest
} from '../services/quotation.service';
import { PaginationParams } from '../types/api';

export function useQuotations(params: PaginationParams & QuotationFilters = {}) {
    return useQuery({
        queryKey: queryKeys.quotations.list(params),
        queryFn: () => quotationService.getQuotations(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

export function useQuotation(id: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.quotations.detail(id),
        queryFn: () => quotationService.getQuotation(id),
        enabled: enabled && !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function useQuotationAnalytics(filters: QuotationFilters = {}) {
    return useQuery({
        queryKey: queryKeys.quotations.analytics(filters),
        queryFn: () => quotationService.getQuotationAnalytics(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

export function usePublicQuotation(token: string, enabled = true) {
    return useQuery({
        queryKey: queryKeys.quotations.public(token),
        queryFn: () => quotationService.getPublicQuotation(token),
        enabled: enabled && !!token,
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Don't retry public quotations
    });
}

export function useCreateQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: quotationService.createQuotation,
        onSuccess: (newQuotation) => {
            // Invalidate quotations list
            invalidateQueries.quotations.list();

            // Add to cache
            queryClient.setQueryData(
                queryKeys.quotations.detail(newQuotation.id),
                newQuotation
            );

            // Invalidate analytics
            invalidateQueries.quotations.analytics();
        },
        onError: (error: ApiError) => {
            console.error('Create quotation failed:', error.message);
        },
    });
}

export function useUpdateQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateQuotationRequest }) =>
            quotationService.updateQuotation(id, data),
        onMutate: async ({ id, data }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.quotations.detail(id) });

            // Snapshot previous value
            const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(id));

            // Optimistically update
            if (previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), {
                    ...previousQuotation,
                    ...data,
                    updatedAt: new Date().toISOString(),
                });
            }

            return { previousQuotation };
        },
        onError: (error: ApiError, { id }, context) => {
            // Rollback on error
            if (context?.previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), context.previousQuotation);
            }
            console.error('Update quotation failed:', error.message);
        },
        onSettled: (data, error, { id }) => {
            // Refetch to ensure consistency
            invalidateQueries.quotations.detail(id);
            invalidateQueries.quotations.list();
            invalidateQueries.quotations.analytics();
        },
    });
}

export function useDeleteQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: quotationService.deleteQuotation,
        onMutate: async (id) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.quotations.detail(id) });

            // Remove from cache
            queryClient.removeQueries({ queryKey: queryKeys.quotations.detail(id) });

            // Update lists optimistically
            queryClient.setQueriesData(
                { queryKey: queryKeys.quotations.lists() },
                (oldData: any) => {
                    if (!oldData) return oldData;
                    return {
                        ...oldData,
                        data: oldData.data.filter((quotation: any) => quotation.id !== id),
                    };
                }
            );
        },
        onError: (error: ApiError, id) => {
            console.error('Delete quotation failed:', error.message);
            // Refetch to restore data
            invalidateQueries.quotations.list();
        },
        onSettled: () => {
            invalidateQueries.quotations.list();
            invalidateQueries.quotations.analytics();
        },
    });
}

export function useDuplicateQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: quotationService.duplicateQuotation,
        onSuccess: (newQuotation) => {
            // Invalidate quotations list
            invalidateQueries.quotations.list();

            // Add to cache
            queryClient.setQueryData(
                queryKeys.quotations.detail(newQuotation.id),
                newQuotation
            );
        },
        onError: (error: ApiError) => {
            console.error('Duplicate quotation failed:', error.message);
        },
    });
}

export function useSendQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: SendQuotationRequest }) =>
            quotationService.sendQuotation(id, data),
        onMutate: async ({ id }) => {
            // Optimistically update email sent status
            const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(id));

            if (previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), {
                    ...previousQuotation,
                    emailSentAt: new Date().toISOString(),
                    status: 'SENT',
                });
            }

            return { previousQuotation };
        },
        onError: (error: ApiError, { id }, context) => {
            // Rollback on error
            if (context?.previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), context.previousQuotation);
            }
            console.error('Send quotation failed:', error.message);
        },
        onSettled: (data, error, { id }) => {
            // Refetch to ensure consistency
            invalidateQueries.quotations.detail(id);
            invalidateQueries.quotations.list();
        },
    });
}

export function useApproveQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
            quotationService.approveQuotation(id, notes),
        onMutate: async ({ id }) => {
            // Optimistically update status
            const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(id));

            if (previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), {
                    ...previousQuotation,
                    status: 'APPROVED',
                    customerRespondedAt: new Date().toISOString(),
                });
            }

            return { previousQuotation };
        },
        onError: (error: ApiError, { id }, context) => {
            // Rollback on error
            if (context?.previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), context.previousQuotation);
            }
            console.error('Approve quotation failed:', error.message);
        },
        onSettled: (data, error, { id }) => {
            invalidateQueries.quotations.detail(id);
            invalidateQueries.quotations.list();
            invalidateQueries.quotations.analytics();
        },
    });
}

export function useRejectQuotation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            quotationService.rejectQuotation(id, reason),
        onMutate: async ({ id }) => {
            // Optimistically update status
            const previousQuotation = queryClient.getQueryData(queryKeys.quotations.detail(id));

            if (previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), {
                    ...previousQuotation,
                    status: 'REJECTED',
                    customerRespondedAt: new Date().toISOString(),
                });
            }

            return { previousQuotation };
        },
        onError: (error: ApiError, { id }, context) => {
            // Rollback on error
            if (context?.previousQuotation) {
                queryClient.setQueryData(queryKeys.quotations.detail(id), context.previousQuotation);
            }
            console.error('Reject quotation failed:', error.message);
        },
        onSettled: (data, error, { id }) => {
            invalidateQueries.quotations.detail(id);
            invalidateQueries.quotations.list();
            invalidateQueries.quotations.analytics();
        },
    });
}

export function useConvertToOrder() {
    return useMutation({
        mutationFn: quotationService.convertToOrder,
        onSuccess: (data, quotationId) => {
            // Invalidate quotations and orders
            invalidateQueries.quotations.detail(quotationId);
            invalidateQueries.quotations.list();
            invalidateQueries.quotations.analytics();
            // Note: Would also invalidate orders if we had those hooks
        },
        onError: (error: ApiError) => {
            console.error('Convert to order failed:', error.message);
        },
    });
}

export function useRespondToQuotation() {
    return useMutation({
        mutationFn: ({ token, response, notes }: {
            token: string;
            response: 'APPROVED' | 'REJECTED';
            notes?: string
        }) => quotationService.respondToQuotation(token, response, notes),
        onError: (error: ApiError) => {
            console.error('Respond to quotation failed:', error.message);
        },
    });
}