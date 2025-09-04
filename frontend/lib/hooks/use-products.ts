import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { queryKeys, invalidateQueries } from '../query-client';
import { ApiError } from '../api';
import type { 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductFilters,
  SearchFilters,
  PaginationParams 
} from '../services/product.service';

export function useProducts(params: PaginationParams & ProductFilters = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () => productService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => productService.getProduct(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProductSearch(query: string, filters: SearchFilters = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.search(query, filters),
    queryFn: () => productService.searchProducts(query, filters),
    enabled: enabled && query.length > 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: queryKeys.products.categories,
    queryFn: productService.getCategories,
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
}

export function useProductPricingRules(productId: string, customerId?: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.products.pricingRules(productId, customerId),
    queryFn: () => productService.getPricingRules(productId, customerId),
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.createProduct,
    onSuccess: (newProduct) => {
      // Invalidate products list
      invalidateQueries.products.list();
      
      // Add to cache
      queryClient.setQueryData(
        queryKeys.products.detail(newProduct.id),
        newProduct
      );
    },
    onError: (error: ApiError) => {
      console.error('Create product failed:', error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      productService.updateProduct(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(id));

      // Optimistically update
      if (previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), {
          ...previousProduct,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousProduct };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), context.previousProduct);
      }
      console.error('Update product failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      // Refetch to ensure consistency
      invalidateQueries.products.detail(id);
      invalidateQueries.products.list();
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.deleteProduct,
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) });

      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.products.detail(id) });

      // Update lists optimistically
      queryClient.setQueriesData(
        { queryKey: queryKeys.products.lists() },
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((product: any) => product.id !== id),
          };
        }
      );
    },
    onError: (error: ApiError, id) => {
      console.error('Delete product failed:', error.message);
      // Refetch to restore data
      invalidateQueries.products.list();
    },
    onSettled: () => {
      invalidateQueries.products.list();
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.createCategory,
    onSuccess: () => {
      // Invalidate categories
      invalidateQueries.products.categories();
    },
    onError: (error: ApiError) => {
      console.error('Create category failed:', error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { 
      id: string; 
      data: { name?: string; description?: string; isActive?: boolean } 
    }) => productService.updateCategory(id, data),
    onSuccess: () => {
      // Invalidate categories
      invalidateQueries.products.categories();
    },
    onError: (error: ApiError) => {
      console.error('Update category failed:', error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.deleteCategory,
    onSuccess: () => {
      // Invalidate categories
      invalidateQueries.products.categories();
    },
    onError: (error: ApiError) => {
      console.error('Delete category failed:', error.message);
    },
  });
}

export function useUpdateInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      productService.updateInventory(id, quantity),
    onMutate: async ({ id, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(id) });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(id));

      // Optimistically update inventory
      if (previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), {
          ...previousProduct,
          inventoryCount: quantity,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousProduct };
    },
    onError: (error: ApiError, { id }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(id), context.previousProduct);
      }
      console.error('Update inventory failed:', error.message);
    },
    onSettled: (data, error, { id }) => {
      invalidateQueries.products.detail(id);
      invalidateQueries.products.list();
    },
  });
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, files }: { productId: string; files: File[] }) =>
      productService.uploadProductImages(productId, files),
    onSuccess: (imageUrls, { productId }) => {
      // Update product cache with new images
      queryClient.setQueryData(
        queryKeys.products.detail(productId),
        (oldData: any) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            images: [...(oldData.images || []), ...imageUrls],
            updatedAt: new Date().toISOString(),
          };
        }
      );
    },
    onError: (error: ApiError) => {
      console.error('Upload product images failed:', error.message);
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, imageUrl }: { productId: string; imageUrl: string }) =>
      productService.deleteProductImage(productId, imageUrl),
    onMutate: async ({ productId, imageUrl }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products.detail(productId) });

      // Snapshot previous value
      const previousProduct = queryClient.getQueryData(queryKeys.products.detail(productId));

      // Optimistically remove image
      if (previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(productId), {
          ...previousProduct,
          images: (previousProduct as any).images?.filter((img: string) => img !== imageUrl) || [],
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousProduct };
    },
    onError: (error: ApiError, { productId }, context) => {
      // Rollback on error
      if (context?.previousProduct) {
        queryClient.setQueryData(queryKeys.products.detail(productId), context.previousProduct);
      }
      console.error('Delete product image failed:', error.message);
    },
    onSettled: (data, error, { productId }) => {
      invalidateQueries.products.detail(productId);
    },
  });
}