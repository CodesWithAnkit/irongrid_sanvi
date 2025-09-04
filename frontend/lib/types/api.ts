// Common API types and interfaces

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  SALES_MANAGER = 'SALES_MANAGER',
  SALES_REP = 'SALES_REP',
  CUSTOMER = 'CUSTOMER',
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
}

// Customer types
export interface Customer {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: Address;
  customerType: CustomerType;
  creditLimit: number;
  paymentTerms: PaymentTerms;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}export i
nterface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export enum CustomerType {
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER',
  END_USER = 'END_USER',
}

export enum PaymentTerms {
  NET_30 = 'NET_30',
  NET_60 = 'NET_60',
  NET_90 = 'NET_90',
  ADVANCE = 'ADVANCE',
  COD = 'COD',
}

// Product types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: Category;
  basePrice: number;
  currency: Currency;
  specifications: ProductSpecification[];
  images: string[];
  inventoryCount?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  isActive: boolean;
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
}

export enum Currency {
  INR = 'INR',
  USD = 'USD',
  EUR = 'EUR',
}

// Quotation types
export interface Quotation {
  id: string;
  quotationNumber: string;
  customer: Customer;
  createdBy: User;
  status: QuotationStatus;
  items: QuotationItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  validUntil: string;
  termsConditions: string;
  notes?: string;
  pdfUrl?: string;
  emailSentAt?: string;
  customerViewedAt?: string;
  customerRespondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id: string;
  quotationId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  discountAmount: number;
  lineTotal: number;
  customSpecifications?: ProductSpecification[];
  deliveryTimeline?: string;
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  VIEWED = 'VIEWED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',
}// Order t
ypes
export interface Order {
  id: string;
  orderNumber: string;
  quotationId?: string;
  customer: Customer;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  deliveryStatus: DeliveryStatus;
  deliveryDate?: string;
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

// Analytics types
export interface BusinessMetrics {
  quotationMetrics: QuotationMetrics;
  customerMetrics: CustomerMetrics;
  revenueMetrics: RevenueMetrics;
  productMetrics: ProductMetrics;
}

export interface QuotationMetrics {
  totalQuotations: number;
  conversionRate: number;
  averageValue: number;
  responseTime: number;
  statusBreakdown: Record<QuotationStatus, number>;
}

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers: number;
  customerLifetimeValue: number;
  topCustomers: CustomerRevenue[];
}

export interface RevenueMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  forecastedRevenue: number;
  revenueByMonth: MonthlyRevenue[];
}

export interface ProductMetrics {
  totalProducts: number;
  topSellingProducts: ProductRevenue[];
  lowStockProducts: Product[];
  categoryPerformance: CategoryRevenue[];
}

export interface CustomerRevenue {
  customer: Customer;
  totalRevenue: number;
  orderCount: number;
  lastOrderDate: string;
}

export interface ProductRevenue {
  product: Product;
  totalRevenue: number;
  quantitySold: number;
  orderCount: number;
}

export interface CategoryRevenue {
  category: Category;
  totalRevenue: number;
  productCount: number;
  orderCount: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
  orderCount: number;
  customerCount: number;
}