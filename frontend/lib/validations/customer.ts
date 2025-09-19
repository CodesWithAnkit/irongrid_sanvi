import { z } from "zod";

export const customerSchema = z.object({
  // Basic Information
  companyName: z.string().min(1, "Company name is required").max(100, "Company name too long"),
  contactPerson: z.string().min(1, "Contact person is required").max(50, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number too long"),
  
  // Address
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  
  // Business Details
  customerType: z.enum(["INDIVIDUAL", "SMALL_BUSINESS", "ENTERPRISE", "GOVERNMENT"]),
  businessCategory: z.string().optional(),
  taxId: z.string().optional(),
  
  // Credit & Terms
  creditLimit: z.number().min(0, "Credit limit cannot be negative"),
  paymentTerms: z.enum(["NET_15", "NET_30", "NET_45", "NET_60", "IMMEDIATE", "ADVANCE"]),
  
  // Preferences
  preferredCommunication: z.enum(["email", "phone", "both"]),
  newsletter: z.boolean(),
  specialInstructions: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// Transform to API format
export const transformCustomerToAPI = (data: CustomerFormData) => ({
  companyName: data.companyName,
  contactPerson: data.contactPerson,
  email: data.email,
  phone: data.phone,
  address: data.address,
  city: data.city,
  state: data.state,
  country: data.country,
  postalCode: data.zipCode,
  customerType: data.customerType,
  creditLimit: data.creditLimit.toString(),
  paymentTerms: data.paymentTerms,
  taxId: data.taxId,
  notes: data.specialInstructions,
});