import { z } from "zod";

export const QuotationItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

export const QuotationSchema = z.object({
  company: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    GSTIN: z.string().optional(),
    contact: z.string().optional(),
  }),
  customer: z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    contacts: z.array(z.string()).default([]),
  }),
  metadata: z.object({
    quoteNumber: z.string().min(1),
    date: z.string().min(1), // ISO date
  }),
  items: z.array(QuotationItemSchema).min(1),
  tax: z.object({
    sgstRate: z.number().nonnegative(),
    cgstRate: z.number().nonnegative(),
    sgstAmount: z.number().nonnegative(),
    cgstAmount: z.number().nonnegative(),
  }),
  totals: z.object({
    subtotal: z.number().nonnegative(),
    taxTotal: z.number().nonnegative(),
    grandTotal: z.number().nonnegative(),
    amountInWords: z.string().min(1),
  }),
  bankDetails: z.object({
    bankName: z.string().min(1),
    accountNumber: z.string().min(1),
    ifsc: z.string().min(1),
  }),
});

export type QuotationPayload = z.infer<typeof QuotationSchema>;
