import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, CustomerType } from '@prisma/client';

export class ProductCategoryDto {
  @ApiProperty({
    description: 'Category identifier',
    example: 'cm1cat123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'CNC Machines'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Computer Numerical Control machines for precision manufacturing'
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for hierarchical structure',
    example: 'cm1cat456def789abc123'
  })
  parentId?: string;
}

export class ProductResponseDto {
  @ApiProperty({
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Stock Keeping Unit - unique product identifier',
    example: 'IND-LATHE-001'
  })
  sku: string;

  @ApiProperty({
    description: 'Product name',
    example: 'CNC Lathe Machine - Model X200'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Detailed product description',
    example: 'High-precision CNC lathe machine suitable for industrial manufacturing'
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Product category information',
    type: ProductCategoryDto
  })
  category?: ProductCategoryDto;

  @ApiProperty({
    description: 'Base price in specified currency',
    example: 250000
  })
  basePrice: number;

  @ApiProperty({
    description: 'Currency for pricing',
    enum: Currency,
    example: Currency.INR
  })
  currency: Currency;

  @ApiPropertyOptional({
    description: 'Computed effective price after any discounts or rules',
    example: 225000
  })
  effectivePrice?: number;

  @ApiPropertyOptional({
    description: 'Product specifications as key-value pairs',
    example: {
      power: '15 KW',
      weight: '2500 kg',
      dimensions: '3000x1500x2000 mm',
      accuracy: '±0.01 mm',
      maxRPM: 4000
    }
  })
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Array of product image URLs',
    example: [
      'https://example.com/images/lathe-front.jpg',
      'https://example.com/images/lathe-side.jpg'
    ]
  })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Current inventory count',
    example: 5
  })
  inventoryCount?: number;

  @ApiPropertyOptional({
    description: 'Whether the product is in stock based on inventory count',
    example: true
  })
  isInStock?: boolean;

  @ApiProperty({
    description: 'Minimum order quantity',
    example: 1
  })
  minOrderQty: number;

  @ApiProperty({
    description: 'Whether the product is active and available',
    example: true
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Product weight in kilograms',
    example: 2500
  })
  weight?: number;

  @ApiPropertyOptional({
    description: 'Product dimensions (LxWxH) in millimeters',
    example: '3000x1500x2000'
  })
  dimensions?: string;

  @ApiPropertyOptional({
    description: 'Manufacturer or brand name',
    example: 'Sanvi Machinery'
  })
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Model number or version',
    example: 'X200-Pro'
  })
  modelNumber?: string;

  @ApiPropertyOptional({
    description: 'Warranty period in months',
    example: 24
  })
  warrantyMonths?: number;

  @ApiPropertyOptional({
    description: 'Lead time for delivery in days',
    example: 30
  })
  leadTimeDays?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the product',
    example: 'Requires special installation and training'
  })
  notes?: string;

  @ApiProperty({
    description: 'Product creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T14:45:00Z'
  })
  updatedAt: Date;

  // Optional aggregated data
  @ApiPropertyOptional({
    description: 'Number of times this product has been quoted',
    example: 25
  })
  quotationCount?: number;

  @ApiPropertyOptional({
    description: 'Number of times this product has been ordered',
    example: 12
  })
  orderCount?: number;

  @ApiPropertyOptional({
    description: 'Average selling price based on recent quotations',
    example: 245000
  })
  averageSellingPrice?: number;

  @ApiPropertyOptional({
    description: 'Last quotation date for this product',
    example: '2024-01-18T16:20:00Z'
  })
  lastQuotedAt?: Date;

  @ApiPropertyOptional({
    description: 'Current pricing rules for this product',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cm1rule123abc456def789' },
        type: { type: 'string', example: 'VOLUME_DISCOUNT' },
        description: { type: 'string', example: '10% discount for 5+ units' },
        isActive: { type: 'boolean', example: true }
      }
    }
  })
  pricingRules?: Array<{
    id: string;
    type: string;
    description: string;
    isActive: boolean;
  }>;

  @ApiPropertyOptional({
    description: 'Related or similar products',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cm1prod456def789abc123' },
        sku: { type: 'string', example: 'IND-LATHE-002' },
        name: { type: 'string', example: 'CNC Lathe Machine - Model X300' },
        basePrice: { type: 'number', example: 350000 }
      }
    }
  })
  relatedProducts?: Array<{
    id: string;
    sku: string;
    name: string;
    basePrice: number;
  }>;

  @ApiPropertyOptional({
    description: 'Total quantity sold of this product',
    example: 100
  })
  totalSold?: number;
}

export class ProductPricingRuleDto {
  @ApiProperty({ description: 'Pricing rule identifier' }) id: string;
  @ApiProperty({ description: 'Product identifier' }) productId: string;
  @ApiPropertyOptional({ description: 'Customer type for rule' }) customerType?: CustomerType | null;
  @ApiProperty({ description: 'Minimum quantity for rule' }) minQuantity: number;
  @ApiPropertyOptional({ description: 'Maximum quantity for rule' }) maxQuantity?: number | null;
  @ApiProperty({ description: 'Discount percentage' }) discountPercent: number;
  @ApiPropertyOptional({ description: 'Fixed price override' }) fixedPrice?: number | null;
  @ApiProperty({ description: 'Rule validity start date' }) validFrom: Date;
  @ApiPropertyOptional({ description: 'Rule validity end date' }) validUntil?: Date | null;
  @ApiProperty({ description: 'Whether rule is active' }) isActive: boolean;
  @ApiProperty({ description: 'Rule creation timestamp' }) createdAt: Date;
}

export class PricingCalculationDto {
  @ApiProperty({ description: 'Product identifier' }) productId: string;
  @ApiPropertyOptional({ description: 'Customer identifier' }) customerId?: string;
  @ApiProperty({ description: 'Quantity for pricing calculation' }) quantity: number;
  @ApiProperty({ description: 'Base price of the product' }) basePrice: number;
  @ApiProperty({ description: 'Applicable pricing rules' }) applicableRules: any[];
  @ApiProperty({ description: 'Final calculated price' }) finalPrice: number;
  @ApiProperty({ description: 'Total discount applied' }) totalDiscount: number;
  @ApiProperty({ description: 'Discount percentage' }) discountPercentage: number;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({
    description: 'Array of product records',
    type: [ProductResponseDto]
  })
  data: ProductResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      total: { type: 'number', example: 250 },
      totalPages: { type: 'number', example: 13 },
      hasNext: { type: 'boolean', example: true },
      hasPrev: { type: 'boolean', example: false }
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-20T10:30:00Z'
  })
  timestamp: string;
}

export class ProductAnalyticsDto {
  @ApiProperty({
    description: 'Total number of quotations for this product',
    example: 45
  })
  totalQuotations: number;

  @ApiProperty({
    description: 'Number of approved quotations',
    example: 28
  })
  approvedQuotations: number;

  @ApiProperty({
    description: 'Quotation conversion rate as percentage',
    example: 62.2
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Total quantity quoted',
    example: 125
  })
  totalQuantityQuoted: number;

  @ApiProperty({
    description: 'Total quantity ordered',
    example: 78
  })
  totalQuantityOrdered: number;

  @ApiProperty({
    description: 'Average quotation value for this product',
    example: 245000
  })
  averageQuotationValue: number;

  @ApiProperty({
    description: 'Total revenue generated from this product',
    example: 19110000
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Profit margin percentage',
    example: 35.5
  })
  profitMargin: number;

  @ApiProperty({
    description: 'Monthly sales trends',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        month: { type: 'string', example: '2024-01' },
        quotations: { type: 'number', example: 8 },
        orders: { type: 'number', example: 5 },
        revenue: { type: 'number', example: 1225000 },
        quantity: { type: 'number', example: 12 }
      }
    }
  })
  monthlyTrends: Array<{
    month: string;
    quotations: number;
    orders: number;
    revenue: number;
    quantity: number;
  }>;

  @ApiProperty({
    description: 'Top customers for this product',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        customerId: { type: 'string', example: 'cm1cust123abc456def789' },
        companyName: { type: 'string', example: 'Acme Industries' },
        totalOrders: { type: 'number', example: 8 },
        totalQuantity: { type: 'number', example: 15 },
        totalValue: { type: 'number', example: 3675000 }
      }
    }
  })
  topCustomers: Array<{
    customerId: string;
    companyName: string;
    totalOrders: number;
    totalQuantity: number;
    totalValue: number;
  }>;

  @ApiProperty({
    description: 'Inventory movement analysis',
    type: 'object',
    properties: {
      currentStock: { type: 'number', example: 5 },
      averageMonthlyUsage: { type: 'number', example: 3.2 },
      stockoutRisk: { type: 'string', example: 'MEDIUM' },
      reorderPoint: { type: 'number', example: 8 },
      lastRestocked: { type: 'string', format: 'date-time' }
    }
  })
  inventoryAnalysis: {
    currentStock: number;
    averageMonthlyUsage: number;
    stockoutRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    reorderPoint: number;
  };

  @ApiProperty({
    description: 'Total number of products in the system',
    example: 100
  })
  totalProducts: number;

  @ApiProperty({
    description: 'Number of active products',
    example: 80
  })
  activeProducts: number;

  @ApiProperty({
    description: 'Number of out-of-stock products',
    example: 15
  })
  outOfStockProducts: number;

  @ApiProperty({
    description: 'Number of low-stock products',
    example: 10
  })
  lowStockProducts: number;

  @ApiProperty({
    description: 'Average price of products',
    example: 25000
  })
  averagePrice: number;

  @ApiProperty({
    description: 'Top selling products data',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        product: { type: 'object' },
        totalSold: { type: 'number' },
        revenue: { type: 'number' }
      }
    }
  })
  topSellingProducts: Array<{ product: any; totalSold: number; revenue: number }>;

  @ApiProperty({
    description: 'Category breakdown data',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        category: { type: 'object' },
        productCount: { type: 'number' },
        totalValue: { type: 'number' }
      }
    }
  })
  categoryBreakdown: Array<{ category: any; productCount: number; totalValue: number }>;

  @ApiProperty({
    description: 'Price distribution data',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        range: { type: 'string' },
        count: { type: 'number' }
      }
    }
  })
  priceDistribution: Array<{ range: string; count: number }>;
}

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Category identifier',
    example: 'cm1cat123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Category name',
    example: 'CNC Machines'
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Computer Numerical Control machines for precision manufacturing'
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for hierarchical structure',
    example: 'cm1cat456def789abc123'
  })
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Parent category information',
    type: () => CategoryResponseDto
  })
  parent?: CategoryResponseDto;

  @ApiPropertyOptional({
    description: 'Child categories',
    type: [CategoryResponseDto]
  })
  children?: CategoryResponseDto[];

  @ApiProperty({
    description: 'Whether the category is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Category creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T14:45:00Z'
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Number of active products in this category',
    example: 15
  })
  productCount: number;
}