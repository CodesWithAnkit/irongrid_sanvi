import { api } from "@/lib/api";
import type { Product, CreateProductRequest, UpdateProductRequest } from "./types";

export async function getProducts(skip = 0, take = 20): Promise<Product[]> {
  const res = await api.get<Product[]>(`/products?skip=${skip}&take=${take}`);
  return res.data;
}

export async function getProduct(id: number): Promise<Product> {
  const res = await api.get<Product>(`/products/${id}`);
  return res.data;
}

export async function createProduct(data: CreateProductRequest): Promise<Product> {
  const res = await api.post<Product>("/products", data);
  return res.data;
}

export async function updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
  const res = await api.patch<Product>(`/products/${id}`, data);
  return res.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}