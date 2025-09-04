import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsEnum, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CustomerResponseDto } from './customer-response.dto';

export class SegmentationRuleDto {
  @ApiProperty({
    description: 'Field to evaluate',
    example: 'customerType'
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Comparison operator',
    enum: ['equals', 'greater_than', 'less_than', 'between', 'in', 'contains'],
    example: 'equals'
  })
  @IsEnum(['equals', 'greater_than', 'less_than', 'between', 'in', 'contains'])
  operator: string;

  @ApiProperty({
    description: 'Value to compare against',
    example: 'ENTERPRISE'
  })
  value: any;

  @ApiPropertyOptional({
    description: 'Weight of this rule in scoring (1-10)',
    example: 5
  })
  @IsOptional()
  @IsNumber()
  weight?: number;
}

export class SegmentationCriteriaDto {
  @ApiProperty({
    description: 'Type of segmentation',
    enum: ['BUSINESS_TYPE', 'VOLUME', 'CREDIT_RATING', 'LOCATION', 'PURCHASE_HISTORY', 'ENGAGEMENT'],
    example: 'BUSINESS_TYPE'
  })
  @IsEnum(['BUSINESS_TYPE', 'VOLUME', 'CREDIT_RATING', 'LOCATION', 'PURCHASE_HISTORY', 'ENGAGEMENT'])
  type: string;

  @ApiProperty({
    description: 'Array of segmentation rules',
    type: [SegmentationRuleDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentationRuleDto)
  rules: SegmentationRuleDto[];
}

export class CustomerSegmentationRuleDto {
  @ApiProperty({
    description: 'Name of the segmentation rule',
    example: 'High Value Enterprise Customers'
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the segmentation rule',
    example: 'Enterprise customers with credit limit above 10L'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Segmentation criteria',
    type: SegmentationCriteriaDto
  })
  @ValidateNested()
  @Type(() => SegmentationCriteriaDto)
  criteria: SegmentationCriteriaDto;

  @ApiPropertyOptional({
    description: 'Whether the rule is active',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Priority of the rule (lower number = higher priority)',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class CustomerSegmentDto {
  @ApiProperty({
    description: 'Unique segment identifier',
    example: 'business_type_enterprise'
  })
  segmentId: string;

  @ApiProperty({
    description: 'Display name of the segment',
    example: 'Enterprise Customers'
  })
  name: string;

  @ApiProperty({
    description: 'Description of the segment',
    example: 'Large enterprise customers with high volume requirements'
  })
  description: string;

  @ApiProperty({
    description: 'Segmentation criteria used',
    type: SegmentationCriteriaDto
  })
  criteria: SegmentationCriteriaDto;

  @ApiProperty({
    description: 'Number of customers in this segment',
    example: 25
  })
  customerCount: number;

  @ApiProperty({
    description: 'Total value of all customers in segment',
    example: 5000000
  })
  totalValue: number;

  @ApiProperty({
    description: 'Average value per customer in segment',
    example: 200000
  })
  averageValue: number;

  @ApiProperty({
    description: 'Average lifetime value per customer',
    example: 1500000
  })
  averageLifetimeValue: number;

  @ApiProperty({
    description: 'Sample customers from this segment',
    type: [CustomerResponseDto]
  })
  customers: CustomerResponseDto[];

  @ApiProperty({
    description: 'Segment creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T14:45:00Z'
  })
  updatedAt: Date;
}

export class SegmentAnalyticsDto {
  @ApiProperty({
    description: 'Segment identifier',
    example: 'business_type_enterprise'
  })
  segmentId: string;

  @ApiProperty({
    description: 'Number of customers in segment',
    example: 25
  })
  customerCount: number;

  @ApiProperty({
    description: 'Total revenue from segment',
    example: 15000000
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Average lifetime value per customer',
    example: 600000
  })
  averageLifetimeValue: number;

  @ApiProperty({
    description: 'Total quotations from segment',
    example: 150
  })
  totalQuotations: number;

  @ApiProperty({
    description: 'Total orders from segment',
    example: 90
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Conversion rate percentage',
    example: 60
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Monthly performance trends',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        month: { type: 'string', example: '2024-01' },
        quotations: { type: 'number', example: 12 },
        orders: { type: 'number', example: 8 },
        revenue: { type: 'number', example: 1200000 },
        conversionRate: { type: 'number', example: 66.7 }
      }
    }
  })
  monthlyTrends: Array<{
    month: string;
    quotations: number;
    orders: number;
    revenue: number;
    conversionRate: number;
  }>;

  @ApiProperty({
    description: 'Top customers in segment by value',
    type: [CustomerResponseDto]
  })
  topCustomers: CustomerResponseDto[];
}

export class SegmentPricingRuleDto {
  @ApiProperty({
    description: 'Segment identifier',
    example: 'business_type_enterprise'
  })
  @IsString()
  segmentId: string;

  @ApiPropertyOptional({
    description: 'Product ID (if rule applies to specific product)',
    example: 'cm1prod123abc456def789'
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Discount percentage for segment',
    example: 15.5
  })
  @IsOptional()
  @IsNumber()
  discountPercentage?: number;

  @ApiPropertyOptional({
    description: 'Fixed price for segment (overrides base price)',
    example: 85000
  })
  @IsOptional()
  @IsNumber()
  fixedPrice?: number;

  @ApiPropertyOptional({
    description: 'Minimum quantity for rule to apply',
    example: 1
  })
  @IsOptional()
  @IsNumber()
  minQuantity?: number;

  @ApiPropertyOptional({
    description: 'Maximum quantity for rule to apply',
    example: 100
  })
  @IsOptional()
  @IsNumber()
  maxQuantity?: number;

  @ApiPropertyOptional({
    description: 'Rule valid from date',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: 'Rule valid until date',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    description: 'Whether the rule is active',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CustomerCategorizationDto {
  @ApiProperty({
    description: 'Customer ID to categorize',
    example: 'cm1cust123abc456def789'
  })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({
    description: 'Force recategorization even if already categorized',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  forceRecategorization?: boolean;
}

export class BulkSegmentationDto {
  @ApiProperty({
    description: 'Array of customer IDs to segment',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  customerIds: string[];

  @ApiProperty({
    description: 'Segmentation criteria to apply',
    type: SegmentationCriteriaDto
  })
  @ValidateNested()
  @Type(() => SegmentationCriteriaDto)
  criteria: SegmentationCriteriaDto;
}

export class SegmentPerformanceDto {
  @ApiProperty({
    description: 'Segment identifier',
    example: 'business_type_enterprise'
  })
  segmentId: string;

  @ApiProperty({
    description: 'Performance metrics',
    type: 'object',
    properties: {
      quotationConversionRate: { type: 'number', example: 65.5 },
      averageOrderValue: { type: 'number', example: 125000 },
      customerRetentionRate: { type: 'number', example: 85.2 },
      averageResponseTime: { type: 'number', example: 24 },
      profitMargin: { type: 'number', example: 22.5 }
    }
  })
  metrics: {
    quotationConversionRate: number;
    averageOrderValue: number;
    customerRetentionRate: number;
    averageResponseTime: number;
    profitMargin: number;
  };

  @ApiProperty({
    description: 'Comparison with other segments',
    type: 'object',
    properties: {
      rankByRevenue: { type: 'number', example: 1 },
      rankByConversion: { type: 'number', example: 2 },
      rankByCustomerCount: { type: 'number', example: 3 }
    }
  })
  ranking: {
    rankByRevenue: number;
    rankByConversion: number;
    rankByCustomerCount: number;
  };
}