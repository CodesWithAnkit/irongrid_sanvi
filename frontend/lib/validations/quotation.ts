import { z } from "zod";

export const quotationItemSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  discount: z.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%"),
  total: z.number().min(0, "Total cannot be negative"),
});

export const quotationSchema = z.object({
  // Customer Information
  customerId: z.string().min(1, "Customer is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(1, "Customer phone is required"),
  
  // Quotation Details
  quotationNumber: z.string().min(1, "Quotation number is required"),
  date: z.string().min(1, "Date is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  currency: z.string().min(1, "Currency is required"),
  
  // Items
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
  
  // Pricing
  subtotal: z.number().min(0, "Subtotal cannot be negative"),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%"),
  taxAmount: z.number().min(0, "Tax amount cannot be negative"),
  shippingCost: z.number().min(0, "Shipping cost cannot be negative"),
  totalDiscount: z.number().min(0, "Total discount cannot be negative"),
  grandTotal: z.number().min(0, "Grand total cannot be negative"),
  
  // Terms & Conditions
  paymentTerms: z.string().min(1, "Payment terms are required"),
  deliveryTerms: z.string().min(1, "Delivery terms are required"),
  notes: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  
  // Status
  status: z.enum(["DRAFT", "SENT", "APPROVED", "REJECTED", "EXPIRED"]),
}).refine((data) => {
  const validUntilDate = new Date(data.validUntil);
  const currentDate = new Date(data.date);
  return validUntilDate >= currentDate;
}, {
  message: "Valid until date must be after the quotation date",
  path: ["validUntil"],
});

export type QuotationFormData = z.infer<typeof quotationSchema>;
export type QuotationItemFormData = z.infer<typeof quotationItemSchema>;

// Transform to API format
export const transformQuotationToAPI = (data: QuotationFormData) => ({
  customerId: parseInt(data.customerId),
  validUntil: data.validUntil,
  items: data.items.map(item => ({
    productId: parseInt(item.productId),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discount: item.discount,
  })),
});