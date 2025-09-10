import { api } from "../../lib/api";
import type { 
  Quotation, 
  CreateQuotationRequest, 
  UpdateQuotationRequest, 
  EmailQuotationRequest 
} from "./types";

export async function getQuotations(skip = 0, take = 20): Promise<Quotation[]> {
  const res = await api.get<Quotation[]>(`/quotations?skip=${skip}&take=${take}`);
  return res.data;
}

export async function getQuotation(id: string): Promise<Quotation | null> {
  const res = await api.get<Quotation | null>(`/quotations/${id}`);
  return res.data;
}

export async function createQuotation(data: CreateQuotationRequest): Promise<Quotation> {
  const res = await api.post<Quotation>("/quotations", data);
  return res.data;
}

export async function updateQuotation(id: string, data: UpdateQuotationRequest): Promise<Quotation> {
  const res = await api.patch<Quotation>(`/quotations/${id}`, data);
  return res.data;
}

export async function deleteQuotation(id: string): Promise<Quotation> {
  const res = await api.delete<Quotation>(`/quotations/${id}`);
  return res.data;
}

export async function emailQuotation(id: string, data: EmailQuotationRequest): Promise<{ status: string; messageId?: string; reason?: string }> {
  const res = await api.post(`/quotations/${id}/email`, data);
  return res.data;
}

export async function generateQuotationPdf(id: string, format = "html"): Promise<{ id: string; downloadUrl: string; status?: string; reason?: string }> {
  const res = await api.post(`/quotations/${id}/pdf?format=${format}`);
  return res.data;
}