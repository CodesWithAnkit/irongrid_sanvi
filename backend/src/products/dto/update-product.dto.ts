import { ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';
import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Min, 
  IsBoolean,
  MaxLength,
  MinLength,
  IsArray,
  IsUrl,
  IsObject,
  IsInt
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    description: 'Stock Keeping Unit - unique product identifier',
    example: 'IND-LATHE-001',
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  sku?: string;

  @ApiPropertyOptional({
    description: 'Product name',
    example: 'CNC Lathe Machine - Model X200 Pro',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Detailed product description',
    example: 'Updated high-precision CNC lathe machine with enhanced features',
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Product category identifier',
    example: 'cm1cat123abc456def789'
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Base price in specified currency',
    example: 275000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    description: 'Currency for pricing',
    enum: Currency,
    example: Currency.INR
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiPropertyOptional({
    description: 'Product specifications as key-value pairs',
    example: {
      power: '18 KW',
      weight: '2600 kg',
      dimensions: '3000x1500x2000 mm',
      accuracy: '±0.005 mm',
      maxRPM: 4500,
      material: 'Cast Iron',
      warranty: '3 years'
    }
  })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Array of product image URLs',
    example: [
      'https://example.com/images/lathe-front-updated.jpg',
      'https://example.com/images/lathe-side-updated.jpg'
    ],
    maxItems: 10
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];

  @ApiPropertyOptional({
    description: 'Current inventory count',
    example: 8,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  inventoryCount?: number;

  @ApiPropertyOptional({
    description: 'Minimum order quantity',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  minOrderQty?: number;

  @ApiPropertyOptional({
    description: 'Whether the product is active and available for quotations',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Product weight in kilograms',
    example: 2600,
    minimum: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Product dimensions (LxWxH) in millimeters',
    example: '3000x1500x2000',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  dimensions?: string;

  @ApiPropertyOptional({
    description: 'Manufacturer or brand name',
    example: 'Sanvi Machinery',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Model number or version',
    example: 'X200-Pro-V2',
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  modelNumber?: string;

  @ApiPropertyOptional({
    description: 'Warranty period in months',
    example: 36,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  warrantyMonths?: number;

  @ApiPropertyOptional({
    description: 'Lead time for delivery in days',
    example: 25,
    minimum: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the product',
    example: 'Updated with improved accuracy and power efficiency',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}