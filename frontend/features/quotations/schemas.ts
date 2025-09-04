import { z } from "zod";

export const quotationItemSchema = z.object({
  productId: z.number().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  discount: z.number().min(0, "Discount must be positive").default(0),
});

export const createQuotationSchema = z.object({
  customerId: z.number().min(1, "Customer is required"),
  validUntil: z.string().min(1, "Valid until date is required"),
  items: z.array(quotationItemSchema).min(1, "At least one item is required"),
});

export const updateQuotationSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED"]).optional(),
  validUntil: z.string().optional(),
});

export const emailQuotationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Enhanced schemas for multi-step wizard
export const customerSelectionSchema = z.object({
  customer: z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Customer name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    company: z.string().min(1, "Company name is required"),
    address: z.string().min(1, "Address is required"),
    isNewCustomer: z.boolean().optional(),
  }),
});

export const productConfigurationSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    productId: z.number().min(1, "Product is required"),
    productName: z.string().min(1, "Product name is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
    unitPrice: z.number().min(0, "Unit price must be positive"),
    discount: z.number().min(0, "Discount must be positive").max(100, "Discount cannot exceed 100%").default(0),
    customSpecifications: z.string().optional(),
    total: z.number().min(0, "Total must be positive"),
  })).min(1, "At least one item is required"),
});

export const pricingTermsSchema = z.object({
  pricing: z.object({
    subtotal: z.number().min(0, "Subtotal must be positive"),
    taxRate: z.number().min(0, "Tax rate must be positive").max(100, "Tax rate cannot exceed 100%"),
    taxAmount: z.number().min(0, "Tax amount must be positive"),
    shippingCost: z.number().min(0, "Shipping cost must be positive"),
    totalDiscount: z.number().min(0, "Total discount must be positive"),
    grandTotal: z.number().min(0, "Grand total must be positive"),
  }),
  terms: z.object({
    paymentTerms: z.string().min(1, "Payment terms are required"),
    deliveryTerms: z.string().min(1, "Delivery terms are required"),
    validUntil: z.string().min(1, "Valid until date is required"),
    notes: z.string().optional(),
    termsTemplate: z.string().optional(),
  }),
});

export const reviewSendSchema = z.object({
  review: z.object({
    quotationNumber: z.string().min(1, "Quotation number is required"),
    status: z.enum(["DRAFT", "SENT"]),
    emailOptions: z.object({
      recipientEmail: z.string().email("Invalid email address"),
      subject: z.string().min(1, "Email subject is required"),
      message: z.string().min(1, "Email message is required"),
      template: z.string().min(1, "Email template is required"),
    }).optional(),
  }),
});

export const quotationBuilderSchema = customerSelectionSchema
  .merge(productConfigurationSchema)
  .merge(pricingTermsSchema)
  .merge(reviewSendSchema);

export type CreateQuotationFormData = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationFormData = z.infer<typeof updateQuotationSchema>;
export type EmailQuotationFormData = z.infer<typeof emailQuotationSchema>;
export type QuotationItemFormData = z.infer<typeof quotationItemSchema>;

// Enhanced form data types
export type CustomerSelectionFormData = z.infer<typeof customerSelectionSchema>;
export type ProductConfigurationFormData = z.infer<typeof productConfigurationSchema>;
export type PricingTermsFormData = z.infer<typeof pricingTermsSchema>;
export type ReviewSendFormData = z.infer<typeof reviewSendSchema>;
export type QuotationBuilderFormData = z.infer<typeof quotationBuilderSchema>;