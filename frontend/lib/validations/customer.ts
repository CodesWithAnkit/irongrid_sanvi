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
  customerType: z.enum(["wholesale", "distributor", "retail"]),
  businessCategory: z.string().optional(),
  taxId: z.string().optional(),
  
  // Credit & Terms
  creditLimit: z.number().min(0, "Credit limit cannot be negative"),
  paymentTerms: z.string().min(1, "Payment terms are required"),
  
  // Preferences
  preferredCommunication: z.enum(["email", "phone", "both"]),
  newsletter: z.boolean(),
  specialInstructions: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerSchema>;

// Transform to API format
export const transformCustomerToAPI = (data: CustomerFormData) => ({
  name: data.contactPerson,
  email: data.email,
  phone: data.phone,
  company: data.companyName,
  address: [data.address, data.city, data.state, data.zipCode, data.country]
    .filter(Boolean)
    .join(", "),
});