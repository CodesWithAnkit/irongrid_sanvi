import { api } from "../../lib/api";
import type { Customer, CreateCustomerRequest, UpdateCustomerRequest } from "./types";

export async function getCustomers(skip = 0, take = 20): Promise<Customer[]> {
  const res = await api.get<Customer[]>(`/customers?skip=${skip}&take=${take}`);
  return res.data;
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const res = await api.get<Customer | null>(`/customers/${id}`);
  return res.data;
}

export async function createCustomer(data: CreateCustomerRequest): Promise<Customer> {
  const res = await api.post<Customer>("/customers", data);
  return res.data;
}

export async function updateCustomer(id: number, data: UpdateCustomerRequest): Promise<Customer> {
  const res = await api.patch<Customer>(`/customers/${id}`, data);
  return res.data;
}

export async function deleteCustomer(id: number): Promise<Customer> {
  const res = await api.delete<Customer>(`/customers/${id}`);
  return res.data;
}