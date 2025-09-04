export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  category: string;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  description?: string;
  price: number;
  category: string;
  stockQuantity?: number;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  category?: string;
  stockQuantity?: number;
}