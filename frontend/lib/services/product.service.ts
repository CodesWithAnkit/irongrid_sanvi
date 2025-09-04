import { apiClient } from '../api';
import type { 
  Product, 
  Category,
  PaginatedResponse, 
  PaginationParams, 
  FilterParams,
  ProductSpecification 
} from '../types/api';

export interface CreateProductRequest {
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  basePrice: number;
  currency: string;
  specifications: ProductSpecification[];
  images?: string[];
  inventoryCount?: number;
}

export interface UpdateProductRequest {
  sku?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  basePrice?: number;
  currency?: string;
  specifications?: ProductSpecification[];
  images?: string[];
  inventoryCount?: number;
  isActive?: boolean;
}

export interface ProductFilters extends FilterParams {
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  isActive?: boolean;
}

export interface SearchFilters {
  categories?: string[];
  priceRange?: [number, number];
  specifications?: Record<string, string>;
  inStock?: boolean;
}

export interface PricingRule {
  id: string;
  productId: string;
  customerId?: string;
  customerType?: string;
  minQuantity: number;
  maxQuantity?: number;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
}

export const productService = {
  async getProducts(
    params: PaginationParams & ProductFilters = {}
  ): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<PaginatedResponse<Product>>('/products', {
      params
    });
    return response.data;
  },

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data);
    return response.data;
  },

  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },

  async searchProducts(query: string, filters: SearchFilters = {}): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>('/products/categories');
    return response.data;
  },

  async createCategory(data: { name: string; description: string; parentId?: string }): Promise<Category> {
    const response = await apiClient.post<Category>('/products/categories', data);
    return response.data;
  },

  async updateCategory(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<Category> {
    const response = await apiClient.put<Category>(`/products/categories/${id}`, data);
    return response.data;
  },

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/products/categories/${id}`);
  },

  async updateInventory(id: string, quantity: number): Promise<Product> {
    const response = await apiClient.put<Product>(`/products/${id}/inventory`, {
      quantity
    });
    return response.data;
  },

  async getPricingRules(productId: string, customerId?: string): Promise<PricingRule[]> {
    const response = await apiClient.get<PricingRule[]>(`/products/${productId}/pricing-rules`, {
      params: customerId ? { customerId } : {}
    });
    return response.data;
  },

  async uploadProductImages(productId: string, files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await apiClient.post<{ imageUrls: string[] }>(
      `/products/${productId}/images`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.imageUrls;
  },

  async deleteProductImage(productId: string, imageUrl: string): Promise<void> {
    await apiClient.delete(`/products/${productId}/images`, {
      data: { imageUrl }
    });
  },
};