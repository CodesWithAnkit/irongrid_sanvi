import { z } from "zod";
import {
  emailSchema,
  phoneSchema,
  passwordSchema,
  positiveNumberSchema,
  requiredStringSchema,
  currencySchema,
  percentageSchema,
  futureDateSchema,
  nonEmptyArraySchema,
  createMinLengthMessage,
  createMaxLengthMessage,
} from "./common";

// User registration/profile schema
export const userProfileSchema = z.object({
  firstName: requiredStringSchema.max(50, createMaxLengthMessage(50)),
  lastName: requiredStringSchema.max(50, createMaxLengthMessage(50)),
  email: emailSchema,
  phone: phoneSchema.optional(),
  role: z.enum(["admin", "sales", "manager"], {
    errorMap: () => ({ message: "Please select a valid role" })
  }),
  department: z.string().optional(),
  isActive: z.boolean(),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Address schema
export const addressSchema = z.object({
  street: requiredStringSchema.max(100, createMaxLengthMessage(100)),
  city: requiredStringSchema.max(50, createMaxLengthMessage(50)),
  state: requiredStringSchema.max(50, createMaxLengthMessage(50)),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code"),
  country: requiredStringSchema,
});

// Enhanced customer schema
export const enhancedCustomerSchema = z.object({
  // Basic Information
  companyName: requiredStringSchema
    .min(2, createMinLengthMessage(2))
    .max(100, createMaxLengthMessage(100)),
  contactPerson: requiredStringSchema
    .min(2, createMinLengthMessage(2))
    .max(50, createMaxLengthMessage(50)),
  email: emailSchema,
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  
  // Address
  address: addressSchema,
  
  // Business Details
  customerType: z.enum(["wholesale", "distributor", "retail", "manufacturer"], {
    errorMap: () => ({ message: "Please select a customer type" })
  }),
  businessCategory: z.string().optional(),
  taxId: z.string()
    .regex(/^[A-Z0-9]{10,15}$/, "Please enter a valid tax ID")
    .optional(),
  gstNumber: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Please enter a valid GST number")
    .optional(),
  
  // Credit & Terms
  creditLimit: currencySchema,
  paymentTerms: z.enum(["net_15", "net_30", "net_45", "net_60", "cod", "advance"], {
    errorMap: () => ({ message: "Please select payment terms" })
  }),
  creditRating: z.enum(["excellent", "good", "fair", "poor"]).optional(),
  
  // Preferences
  preferredCommunication: z.enum(["email", "phone", "both"], {
    errorMap: () => ({ message: "Please select communication preference" })
  }),
  newsletter: z.boolean(),
  specialInstructions: z.string().max(500, createMaxLengthMessage(500)).optional(),
  
  // Metadata
  tags: z.array(z.string()).optional(),
  isActive: z.boolean(),
});

// Enhanced product schema
export const enhancedProductSchema = z.object({
  // Basic Information
  name: requiredStringSchema
    .min(2, createMinLengthMessage(2))
    .max(100, createMaxLengthMessage(100)),
  sku: requiredStringSchema
    .min(3, createMinLengthMessage(3))
    .max(50, createMaxLengthMessage(50))
    .regex(/^[A-Z0-9\-_]+$/, "SKU can only contain uppercase letters, numbers, hyphens, and underscores"),
  category: requiredStringSchema,
  subcategory: z.string().optional(),
  description: z.string().max(1000, createMaxLengthMessage(1000)).optional(),
  shortDescription: z.string().max(200, createMaxLengthMessage(200)).optional(),
  
  // Specifications
  specifications: z.record(z.string(), z.string()).optional(),
  dimensions: z.object({
    length: positiveNumberSchema.optional(),
    width: positiveNumberSchema.optional(),
    height: positiveNumberSchema.optional(),
    unit: z.enum(["mm", "cm", "m", "in", "ft"]).optional(),
  }).optional(),
  weight: z.object({
    value: positiveNumberSchema.optional(),
    unit: z.enum(["g", "kg", "lb", "oz"]).optional(),
  }).optional(),
  material: z.string().max(100, createMaxLengthMessage(100)).optional(),
  color: z.string().max(50, createMaxLengthMessage(50)).optional(),
  
  // Pricing
  costPrice: currencySchema,
  sellingPrice: currencySchema,
  wholesalePrice: currencySchema.optional(),
  distributorPrice: currencySchema.optional(),
  retailPrice: currencySchema.optional(),
  margin: percentageSchema.optional(),
  
  // Inventory
  stockQuantity: z.number().int().min(0, "Stock quantity cannot be negative"),
  minStockLevel: z.number().int().min(0, "Minimum stock level cannot be negative"),
  maxStockLevel: z.number().int().min(0, "Maximum stock level cannot be negative"),
  unit: z.enum(["piece", "kg", "meter", "liter", "box", "set"], {
    errorMap: () => ({ message: "Please select a unit" })
  }),
  reorderPoint: z.number().int().min(0, "Reorder point cannot be negative").optional(),
  
  // Status & Availability
  status: z.enum(["active", "inactive", "discontinued"], {
    errorMap: () => ({ message: "Please select a status" })
  }),
  availability: z.enum(["in_stock", "out_of_stock", "pre_order", "backorder"], {
    errorMap: () => ({ message: "Please select availability status" })
  }),
  featured: z.boolean(),
  
  // Additional Info
  manufacturer: z.string().max(100, createMaxLengthMessage(100)).optional(),
  brand: z.string().max(50, createMaxLengthMessage(50)).optional(),
  model: z.string().max(50, createMaxLengthMessage(50)).optional(),
  warranty: z.string().max(200, createMaxLengthMessage(200)).optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url("Please enter valid image URLs")).optional(),
  
  // SEO
  metaTitle: z.string().max(60, createMaxLengthMessage(60)).optional(),
  metaDescription: z.string().max(160, createMaxLengthMessage(160)).optional(),
}).refine((data) => data.maxStockLevel >= data.minStockLevel, {
  message: "Maximum stock level must be greater than or equal to minimum stock level",
  path: ["maxStockLevel"],
}).refine((data) => data.sellingPrice >= data.costPrice, {
  message: "Selling price must be greater than or equal to cost price",
  path: ["sellingPrice"],
});

// Quotation item schema with enhanced validation
export const enhancedQuotationItemSchema = z.object({
  id: z.string(),
  productId: requiredStringSchema,
  productName: requiredStringSchema,
  productSku: requiredStringSchema,
  quantity: z.number().min(1, "Quantity must be at least 1").max(10000, "Quantity cannot exceed 10,000"),
  unitPrice: currencySchema,
  discount: percentageSchema,
  discountAmount: currencySchema.optional(),
  taxRate: percentageSchema.optional(),
  taxAmount: currencySchema.optional(),
  lineTotal: currencySchema,
  customSpecifications: z.string().max(500, createMaxLengthMessage(500)).optional(),
  deliveryDate: futureDateSchema.optional(),
  notes: z.string().max(200, createMaxLengthMessage(200)).optional(),
});

// Enhanced quotation schema
export const enhancedQuotationSchema = z.object({
  // Customer Information
  customerId: requiredStringSchema,
  customerName: requiredStringSchema,
  customerEmail: emailSchema,
  customerPhone: phoneSchema,
  billingAddress: addressSchema,
  shippingAddress: addressSchema.optional(),
  sameAsbilling: z.boolean().optional(),
  
  // Quotation Details
  quotationNumber: requiredStringSchema,
  referenceNumber: z.string().max(50, createMaxLengthMessage(50)).optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), "Please enter a valid date"),
  validUntil: futureDateSchema,
  currency: z.enum(["USD", "EUR", "INR", "GBP"], {
    errorMap: () => ({ message: "Please select a currency" })
  }),
  exchangeRate: z.number().min(0.01, "Exchange rate must be positive").optional(),
  
  // Items
  items: nonEmptyArraySchema(enhancedQuotationItemSchema, "At least one item is required"),
  
  // Pricing
  subtotal: currencySchema,
  totalDiscount: currencySchema,
  taxRate: percentageSchema,
  taxAmount: currencySchema,
  shippingCost: currencySchema,
  handlingFee: currencySchema.optional(),
  grandTotal: currencySchema,
  
  // Terms & Conditions
  paymentTerms: z.enum(["net_15", "net_30", "net_45", "net_60", "cod", "advance"], {
    errorMap: () => ({ message: "Please select payment terms" })
  }),
  deliveryTerms: requiredStringSchema.max(200, createMaxLengthMessage(200)),
  warranty: z.string().max(200, createMaxLengthMessage(200)).optional(),
  notes: z.string().max(1000, createMaxLengthMessage(1000)).optional(),
  internalNotes: z.string().max(500, createMaxLengthMessage(500)).optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  
  // Status and Workflow
  status: z.enum(["DRAFT", "SENT", "VIEWED", "APPROVED", "REJECTED", "EXPIRED", "CONVERTED"], {
    errorMap: () => ({ message: "Please select a valid status" })
  }),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignedTo: z.string().optional(),
  
  // Metadata
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string().url("Please enter valid attachment URLs")).optional(),
}).refine((data) => {
  const validUntilDate = new Date(data.validUntil);
  const currentDate = new Date(data.date);
  return validUntilDate >= currentDate;
}, {
  message: "Valid until date must be after the quotation date",
  path: ["validUntil"],
}).refine((data) => {
  // Validate that subtotal matches sum of line totals
  const calculatedSubtotal = data.items.reduce((sum, item) => sum + item.lineTotal, 0);
  return Math.abs(calculatedSubtotal - data.subtotal) < 0.01; // Allow for small rounding differences
}, {
  message: "Subtotal must match the sum of line totals",
  path: ["subtotal"],
});

// Form submission states
export const formSubmissionSchema = z.object({
  isSubmitting: z.boolean(),
  isValid: z.boolean(),
  errors: z.record(z.string(), z.string()).optional(),
  touchedFields: z.record(z.string(), z.boolean()).optional(),
  isDirty: z.boolean(),
});

// Export types
export type UserProfileFormData = z.infer<typeof userProfileSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type AddressFormData = z.infer<typeof addressSchema>;
export type EnhancedCustomerFormData = z.infer<typeof enhancedCustomerSchema>;
export type EnhancedProductFormData = z.infer<typeof enhancedProductSchema>;
export type EnhancedQuotationItemFormData = z.infer<typeof enhancedQuotationItemSchema>;
export type EnhancedQuotationFormData = z.infer<typeof enhancedQuotationSchema>;
export type FormSubmissionState = z.infer<typeof formSubmissionSchema>;