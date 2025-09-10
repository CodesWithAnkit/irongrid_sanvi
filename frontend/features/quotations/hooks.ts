"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  getQuotations, 
  getQuotation, 
  createQuotation, 
  updateQuotation, 
  deleteQuotation,
  emailQuotation,
  generateQuotationPdf
} from "./api";
import type { CreateQuotationRequest, UpdateQuotationRequest, EmailQuotationRequest } from "./types";

export function useQuotations(skip = 0, take = 20) {
  return useQuery({
    queryKey: ["quotations", skip, take],
    queryFn: () => getQuotations(skip, take),
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: ["quotations", id],
    queryFn: () => getQuotation(id),
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuotationRequest) => createQuotation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateQuotationRequest }) => 
      updateQuotation(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotations", id] });
    },
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
  });
}

export function useEmailQuotation() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmailQuotationRequest }) => 
      emailQuotation(id, data),
  });
}

export function useGenerateQuotationPdf() {
  return useMutation({
    mutationFn: ({ id, format = "pdf" }: { id: string; format?: string }) => 
      generateQuotationPdf(id, format),
  });
}