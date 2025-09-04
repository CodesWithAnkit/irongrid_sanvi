import { z } from "zod";

export const productSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Product name is required").max(100, "Product name too long"),
  sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  description: z.string().optional(),
  
  // Specifications
  specifications: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.number().min(0, "Weight cannot be negative"),
  material: z.string().optional(),
  
  // Pricing
  costPrice: z.number().min(0, "Cost price cannot be negative"),
  sellingPrice: z.number().min(0.01, "Selling price must be greater than 0"),
  wholesalePrice: z.number().min(0, "Wholesale price cannot be negative"),
  distributorPrice: z.number().min(0, "Distributor price cannot be negative"),
  
  // Inventory
  stockQuantity: z.number().min(0, "Stock quantity cannot be negative"),
  minStockLevel: z.number().min(0, "Minimum stock level cannot be negative"),
  maxStockLevel: z.number().min(0, "Maximum stock level cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  
  // Status & Availability
  status: z.enum(["active", "inactive", "discontinued"]),
  availability: z.enum(["in_stock", "out_of_stock", "pre_order"]),
  featured: z.boolean(),
  
  // Additional Info
  manufacturer: z.string().optional(),
  warranty: z.string().optional(),
  tags: z.string().optional(),
}).refine((data) => data.maxStockLevel >= data.minStockLevel, {
  message: "Maximum stock level must be greater than or equal to minimum stock level",
  path: ["maxStockLevel"],
});

export type ProductFormData = z.infer<typeof productSchema>;

// Transform to API format
export const transformProductToAPI = (data: ProductFormData) => ({
  name: data.name,
  sku: data.sku,
  description: data.description || "",
  price: data.sellingPrice,
  category: data.category,
  stockQuantity: data.stockQuantity,
});