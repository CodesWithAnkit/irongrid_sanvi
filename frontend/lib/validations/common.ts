import { z } from "zod";

// Common validation patterns
export const emailSchema = z.string().email("Please enter a valid email address");

export const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number cannot exceed 15 digits")
  .regex(/^[\+]?[0-9\s\-\(\)]+$/, "Please enter a valid phone number");

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number");

export const urlSchema = z.string().url("Please enter a valid URL");

export const positiveNumberSchema = z.number().min(0, "Value must be positive");

export const requiredStringSchema = z.string().min(1, "This field is required");

export const optionalStringSchema = z.string().optional();

// Date validation helpers
export const dateStringSchema = z.string().refine((date) => {
  return !isNaN(Date.parse(date));
}, "Please enter a valid date");

export const futureDateSchema = z.string().refine((date) => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
}, "Date must be today or in the future");

export const pastDateSchema = z.string().refine((date) => {
  const inputDate = new Date(date);
  const today = new Date();
  return inputDate <= today;
}, "Date cannot be in the future");

// File validation
export const fileSchema = z.object({
  name: z.string(),
  size: z.number(),
  type: z.string(),
}).refine((file) => {
  // Max file size: 10MB
  return file.size <= 10 * 1024 * 1024;
}, "File size must be less than 10MB");

export const imageFileSchema = fileSchema.refine((file) => {
  return file.type.startsWith('image/');
}, "File must be an image");

// Currency validation
export const currencySchema = z.number()
  .min(0, "Amount must be positive")
  .refine((val) => {
    // Check if it has at most 2 decimal places
    return Number.isInteger(val * 100);
  }, "Amount can have at most 2 decimal places");

// Percentage validation
export const percentageSchema = z.number()
  .min(0, "Percentage cannot be negative")
  .max(100, "Percentage cannot exceed 100%");

// Custom validation helpers
export const createMinLengthMessage = (min: number) => `Must be at least ${min} characters`;
export const createMaxLengthMessage = (max: number) => `Cannot exceed ${max} characters`;
export const createMinValueMessage = (min: number) => `Must be at least ${min}`;
export const createMaxValueMessage = (max: number) => `Cannot exceed ${max}`;

// Conditional validation helper
export const conditionalSchema = <T>(
  condition: (data: any) => boolean,
  schema: z.ZodSchema<T>,
  fallback: z.ZodSchema<T> = z.any()
) => {
  return z.any().superRefine((data, ctx) => {
    if (condition(data)) {
      const result = schema.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          ctx.addIssue(issue);
        });
      }
    } else {
      const result = fallback.safeParse(data);
      if (!result.success) {
        result.error.issues.forEach(issue => {
          ctx.addIssue(issue);
        });
      }
    }
  });
};

// Array validation helpers
export const nonEmptyArraySchema = <T>(itemSchema: z.ZodSchema<T>, message = "At least one item is required") =>
  z.array(itemSchema).min(1, message);

export const uniqueArraySchema = <T>(itemSchema: z.ZodSchema<T>, keyExtractor: (item: T) => any, message = "Duplicate items are not allowed") =>
  z.array(itemSchema).refine((items) => {
    const keys = items.map(keyExtractor);
    return new Set(keys).size === keys.length;
  }, message);