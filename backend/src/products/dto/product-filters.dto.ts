import { ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsNumber, 
  Min, 
  IsBoolean,
  IsString,
  MaxLength,
  IsDateString,
  IsInt,
  IsEnum
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Currency } from '@prisma/client';

export class ProductFiltersDto {
  // Pagination
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    default: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  // Search
  @ApiPropertyOptional({
    description: 'Search term for product name, SKU, or description',
    example: 'CNC lathe machine',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by SKU', example: 'SKU123' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sku?: string;

  @ApiPropertyOptional({ description: 'Filter by product name', example: 'CNC lathe machine' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by product description',
    example: 'High precision CNC lathe machine',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;



  @ApiPropertyOptional({
    description: 'Filter by currency',
    example: 'INR',
    enum: Currency
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Filter by product base price',
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  offset?: number;

  // Filters
  @ApiPropertyOptional({
    description: 'Filter by product category ID',
    example: 'cm1cat123abc456def789'
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by product active status',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter products with price greater than or equal to this value',
    example: 10000,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter products with price less than or equal to this value',
    example: 500000,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter products that are in stock (inventory > 0)',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by manufacturer name',
    example: 'Sanvi Machinery',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Filter products with minimum inventory count',
    example: 5,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  minInventory?: number;

  @ApiPropertyOptional({
    description: 'Filter products with maximum inventory count',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  maxInventory?: number;

  @ApiPropertyOptional({
    description: 'Filter products with minimum weight in kg',
    example: 100,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minWeight?: number;

  @ApiPropertyOptional({
    description: 'Filter products with maximum weight in kg',
    example: 5000,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxWeight?: number;

  // Date range filters
  @ApiPropertyOptional({
    description: 'Filter products created after this date',
    example: '2024-01-01T00:00:00Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter products created before this date',
    example: '2024-12-31T23:59:59Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  // Specification filters (dynamic)
  @ApiPropertyOptional({
    description: 'Filter by product specifications (key-value pairs)',
    example: { power: '15 KW', accuracy: '±0.01 mm' }
  })
  @IsOptional()
  specifications?: Record<string, any>;
}