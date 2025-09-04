import { IsString, IsOptional, IsNumber, Min, IsDateString, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { CustomerType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreatePricingRuleDto {
  @IsString()
  productId!: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @IsNumber()
  @Min(1)
  minQuantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPercent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateInventoryDto {
  @IsNumber()
  quantity!: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(['ADD', 'SUBTRACT', 'SET'])
  operation?: string = 'SET';
}

export class BulkUpdateDto {
  @IsArray()
  @IsString({ each: true })
  productIds!: string[];

  @IsEnum(['ACTIVATE', 'DEACTIVATE', 'UPDATE_CATEGORY', 'UPDATE_PRICE'])
  action!: string;

  @IsOptional()
  data?: any;
}

export class ProductSearchDto {
  @IsString()
  query!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsBoolean()
  inStockOnly?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}