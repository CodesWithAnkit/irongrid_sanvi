import * as Joi from 'joi';
import { QuotationStatus, OrderStatus, CustomerType, PaymentTerms, Currency } from '@prisma/client';

// Common validation patterns
export const ValidationPatterns = {
  email: Joi.string().email().lowercase().trim(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).min(10).max(20),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  cuid: Joi.string().pattern(/^c[a-z0-9]{24}$/),
  uuid: Joi.string().uuid(),
  url: Joi.string().uri(),
  positiveNumber: Joi.number().positive(),
  nonNegativeNumber: Joi.number().min(0),
  currency: Joi.number().precision(2).positive(),
  percentage: Joi.number().min(0).max(100),
  date: Joi.date().iso(),
  futureDate: Joi.date().greater('now'),
  pastDate: Joi.date().less('now'),
};

// Pagination schema
export const PaginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Search schema
export const SearchSchema = Joi.object({
  search: Joi.string().trim().min(1).max(100).optional(),
});

// Date range schema
export const DateRangeSchema = Joi.object({
  createdAfter: ValidationPatterns.date.optional(),
  createdBefore: ValidationPatterns.date.optional(),
}).custom((value, helpers) => {
  if (value.createdAfter && value.createdBefore && value.createdAfter >= value.createdBefore) {
    return helpers.error('date.range', { message: 'createdAfter must be before createdBefore' });
  }
  return value;
});

// Authentication schemas
export const LoginSchema = Joi.object({
  email: ValidationPatterns.email.required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().default(false),
});

export const RegisterSchema = Joi.object({
  email: ValidationPatterns.email.required(),
  password: ValidationPatterns.password.required(),
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match',
  }),
});

export const ForgotPasswordSchema = Joi.object({
  email: ValidationPatterns.email.required(),
});

export const ResetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: ValidationPatterns.password.required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

// User schemas
export const CreateUserSchema = Joi.object({
  email: ValidationPatterns.email.required(),
  password: ValidationPatterns.password.required(),
  firstName: Joi.string().trim().min(1).max(50).required(),
  lastName: Joi.string().trim().min(1).max(50).required(),
  roleIds: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
});

export const UpdateUserSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(50).optional(),
  lastName: Joi.string().trim().min(1).max(50).optional(),
  isActive: Joi.boolean().optional(),
  roleIds: Joi.array().items(Joi.number().integer().positive()).min(1).optional(),
});

// Customer schemas
export const CreateCustomerSchema = Joi.object({
  companyName: Joi.string().trim().min(1).max(200).required(),
  contactPerson: Joi.string().trim().min(1).max(100).required(),
  email: ValidationPatterns.email.required(),
  phone: ValidationPatterns.phone.optional(),
  alternatePhone: ValidationPatterns.phone.optional(),
  address: Joi.string().trim().max(500).optional(),
  city: Joi.string().trim().max(100).optional(),
  state: Joi.string().trim().max(100).optional(),
  country: Joi.string().trim().max(100).default('India'),
  postalCode: Joi.string().trim().max(20).optional(),
  customerType: Joi.string().valid(...Object.values(CustomerType)).default(CustomerType.SMALL_BUSINESS),
  creditLimit: ValidationPatterns.currency.default(0),
  paymentTerms: Joi.string().valid(...Object.values(PaymentTerms)).default(PaymentTerms.NET_30),
  taxId: Joi.string().trim().max(50).optional(),
  gstNumber: Joi.string().trim().max(20).optional(),
  notes: Joi.string().trim().max(1000).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.fork(
  ['companyName', 'contactPerson', 'email'],
  (schema) => schema.optional()
);

export const CustomerFiltersSchema = Joi.object({
  customerType: Joi.string().valid(...Object.values(CustomerType)).optional(),
  isActive: Joi.boolean().optional(),
  city: Joi.string().trim().optional(),
  state: Joi.string().trim().optional(),
  minCreditLimit: ValidationPatterns.currency.optional(),
  maxCreditLimit: ValidationPatterns.currency.optional(),
}).concat(PaginationSchema).concat(SearchSchema).concat(DateRangeSchema);

// Product schemas
export const CreateProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().min(1).max(50).required(),
  name: Joi.string().trim().min(1).max(200).required(),
  description: Joi.string().trim().max(2000).optional(),
  categoryId: ValidationPatterns.cuid.optional(),
  basePrice: ValidationPatterns.currency.required(),
  currency: Joi.string().valid(...Object.values(Currency)).default(Currency.INR),
  specifications: Joi.object().optional(),
  images: Joi.array().items(ValidationPatterns.url).max(10).optional(),
  inventoryCount: Joi.number().integer().min(0).optional(),
  minOrderQty: Joi.number().integer().min(1).default(1),
});

export const UpdateProductSchema = CreateProductSchema.fork(
  ['sku', 'name', 'basePrice'],
  (schema) => schema.optional()
);

export const ProductFiltersSchema = Joi.object({
  categoryId: ValidationPatterns.cuid.optional(),
  isActive: Joi.boolean().optional(),
  minPrice: ValidationPatterns.currency.optional(),
  maxPrice: ValidationPatterns.currency.optional(),
  inStock: Joi.boolean().optional(),
}).concat(PaginationSchema).concat(SearchSchema).concat(DateRangeSchema);

// Quotation schemas
export const QuotationItemSchema = Joi.object({
  productId: ValidationPatterns.cuid.required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: ValidationPatterns.currency.required(),
  discount: ValidationPatterns.currency.default(0),
  customSpecifications: Joi.object().optional(),
  deliveryTimeline: Joi.string().trim().max(100).optional(),
});

export const CreateQuotationSchema = Joi.object({
  customerId: ValidationPatterns.cuid.required(),
  items: Joi.array().items(QuotationItemSchema).min(1).required(),
  validUntil: ValidationPatterns.futureDate.optional(),
  termsConditions: Joi.string().trim().max(2000).optional(),
  notes: Joi.string().trim().max(1000).optional(),
});

export const UpdateQuotationSchema = Joi.object({
  status: Joi.string().valid(...Object.values(QuotationStatus)).optional(),
  validUntil: ValidationPatterns.futureDate.optional(),
  termsConditions: Joi.string().trim().max(2000).optional(),
  notes: Joi.string().trim().max(1000).optional(),
});

export const QuotationFiltersSchema = Joi.object({
  status: Joi.string().valid(...Object.values(QuotationStatus)).optional(),
  customerId: ValidationPatterns.cuid.optional(),
  quotationNumber: Joi.string().trim().optional(),
  customerName: Joi.string().trim().optional(),
  minAmount: ValidationPatterns.currency.optional(),
  maxAmount: ValidationPatterns.currency.optional(),
  validAfter: ValidationPatterns.date.optional(),
  validBefore: ValidationPatterns.date.optional(),
}).concat(PaginationSchema).concat(SearchSchema).concat(DateRangeSchema);

export const DuplicateQuotationSchema = Joi.object({
  customerId: ValidationPatterns.cuid.optional(),
  resetStatus: Joi.boolean().default(true),
  notes: Joi.string().trim().max(1000).optional(),
});

export const SendQuotationEmailSchema = Joi.object({
  recipientEmail: ValidationPatterns.email.optional(),
  subject: Joi.string().trim().min(1).max(200).optional(),
  message: Joi.string().trim().max(2000).optional(),
  templateId: ValidationPatterns.cuid.optional(),
});

// Order schemas
export const CreateOrderSchema = Joi.object({
  quotationId: ValidationPatterns.cuid.optional(),
  customerId: ValidationPatterns.cuid.required(),
  items: Joi.array().items(
    Joi.object({
      productId: ValidationPatterns.cuid.required(),
      quantity: Joi.number().integer().min(1).required(),
      unitPrice: ValidationPatterns.currency.required(),
      discountAmount: ValidationPatterns.currency.default(0),
    })
  ).min(1).required(),
  shippingAddress: Joi.string().trim().max(500).optional(),
  expectedDelivery: ValidationPatterns.futureDate.optional(),
});

export const UpdateOrderSchema = Joi.object({
  status: Joi.string().valid(...Object.values(OrderStatus)).optional(),
  paymentStatus: Joi.string().optional(),
  paymentId: Joi.string().optional(),
  shippingAddress: Joi.string().trim().max(500).optional(),
  expectedDelivery: ValidationPatterns.date.optional(),
});

export const OrderFiltersSchema = Joi.object({
  status: Joi.string().valid(...Object.values(OrderStatus)).optional(),
  customerId: ValidationPatterns.cuid.optional(),
  orderNumber: Joi.string().trim().optional(),
  paymentStatus: Joi.string().optional(),
}).concat(PaginationSchema).concat(SearchSchema).concat(DateRangeSchema);

// Email schemas
export const CreateEmailTemplateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  subject: Joi.string().trim().min(1).max(200).required(),
  htmlContent: Joi.string().required(),
  textContent: Joi.string().optional(),
  variables: Joi.array().items(Joi.string()).optional(),
  category: Joi.string().trim().max(50).required(),
});

export const UpdateEmailTemplateSchema = CreateEmailTemplateSchema.fork(
  ['name', 'subject', 'htmlContent', 'category'],
  (schema) => schema.optional()
);

export const SendEmailSchema = Joi.object({
  to: Joi.alternatives().try(
    ValidationPatterns.email,
    Joi.array().items(ValidationPatterns.email).min(1)
  ).required(),
  subject: Joi.string().trim().min(1).max(200).required(),
  htmlContent: Joi.string().optional(),
  textContent: Joi.string().optional(),
  templateId: ValidationPatterns.cuid.optional(),
  templateData: Joi.object().optional(),
  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string().required(),
      content: Joi.string().required(),
      contentType: Joi.string().optional(),
    })
  ).optional(),
});

// File upload schemas
export const FileUploadSchema = Joi.object({
  folder: Joi.string().trim().max(100).default('general'),
  allowedTypes: Joi.array().items(Joi.string()).optional(),
  maxSize: Joi.number().integer().positive().optional(),
});

// Analytics schemas
export const AnalyticsFiltersSchema = Joi.object({
  startDate: ValidationPatterns.date.optional(),
  endDate: ValidationPatterns.date.optional(),
  groupBy: Joi.string().valid('day', 'week', 'month', 'year').default('month'),
  metrics: Joi.array().items(Joi.string()).optional(),
}).custom((value, helpers) => {
  if (value.startDate && value.endDate && value.startDate >= value.endDate) {
    return helpers.error('date.range', { message: 'startDate must be before endDate' });
  }
  return value;
});

// Export all schemas for easy access
export const ValidationSchemas = {
  // Authentication
  Login: LoginSchema,
  Register: RegisterSchema,
  ForgotPassword: ForgotPasswordSchema,
  ResetPassword: ResetPasswordSchema,

  // Users
  CreateUser: CreateUserSchema,
  UpdateUser: UpdateUserSchema,

  // Customers
  CreateCustomer: CreateCustomerSchema,
  UpdateCustomer: UpdateCustomerSchema,
  CustomerFilters: CustomerFiltersSchema,

  // Products
  CreateProduct: CreateProductSchema,
  UpdateProduct: UpdateProductSchema,
  ProductFilters: ProductFiltersSchema,

  // Quotations
  CreateQuotation: CreateQuotationSchema,
  UpdateQuotation: UpdateQuotationSchema,
  QuotationFilters: QuotationFiltersSchema,
  DuplicateQuotation: DuplicateQuotationSchema,
  SendQuotationEmail: SendQuotationEmailSchema,

  // Orders
  CreateOrder: CreateOrderSchema,
  UpdateOrder: UpdateOrderSchema,
  OrderFilters: OrderFiltersSchema,

  // Email
  CreateEmailTemplate: CreateEmailTemplateSchema,
  UpdateEmailTemplate: UpdateEmailTemplateSchema,
  SendEmail: SendEmailSchema,

  // Files
  FileUpload: FileUploadSchema,

  // Analytics
  AnalyticsFilters: AnalyticsFiltersSchema,

  // Common
  Pagination: PaginationSchema,
  Search: SearchSchema,
  DateRange: DateRangeSchema,
};