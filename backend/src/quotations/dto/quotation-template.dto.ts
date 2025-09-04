import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsBoolean, 
  IsEnum, 
  IsNotEmpty, 
  IsNumber, 
  IsObject, 
  IsOptional, 
  IsString, 
  MaxLength, 
  Min, 
  ValidateNested 
} from 'class-validator';

export enum TemplateCategory {
  STANDARD = 'STANDARD',
  CUSTOM = 'CUSTOM',
  INDUSTRY_SPECIFIC = 'INDUSTRY_SPECIFIC',
  CUSTOMER_SPECIFIC = 'CUSTOMER_SPECIFIC'
}

export class TemplateItemDto {
  @ApiProperty({
    description: 'Product ID for the template item',
    example: 'cm1prod123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    description: 'Default quantity for this item',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({
    description: 'Default unit price (can be overridden)',
    example: 25000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({
    description: 'Default discount amount',
    example: 1000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    description: 'Custom specifications for this template item',
    example: { color: 'Blue', warranty: '2 years' }
  })
  @IsOptional()
  @IsObject()
  customSpecifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Default delivery timeline',
    example: '4-6 weeks'
  })
  @IsOptional()
  @IsString()
  deliveryTimeline?: string;
}

export class CreateQuotationTemplateDto {
  @ApiProperty({
    description: 'Template name',
    example: 'Standard Industrial Machinery Quote',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'Standard template for industrial machinery quotations',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Template category',
    enum: TemplateCategory,
    example: TemplateCategory.STANDARD
  })
  @IsEnum(TemplateCategory)
  category!: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Whether this template is public (visible to all users)',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;

  @ApiProperty({
    description: 'Template items with default products and configurations',
    type: [TemplateItemDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items!: TemplateItemDto[];

  @ApiPropertyOptional({
    description: 'Default validity period in days',
    example: 30,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultValidityDays?: number = 30;

  @ApiPropertyOptional({
    description: 'Default terms and conditions',
    example: 'Payment within 30 days of delivery. Prices valid for 30 days.',
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  defaultTermsConditions?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing and searching templates',
    example: ['machinery', 'industrial', 'standard'],
    isArray: true,
    type: String
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];
}

export class UpdateQuotationTemplateDto {
  @ApiPropertyOptional({
    description: 'Template name',
    example: 'Updated Industrial Machinery Quote',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Template description',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Template category',
    enum: TemplateCategory
  })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Whether this template is public'
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this template is active'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Template items',
    type: [TemplateItemDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  items?: TemplateItemDto[];

  @ApiPropertyOptional({
    description: 'Default validity period in days',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  defaultValidityDays?: number;

  @ApiPropertyOptional({
    description: 'Default terms and conditions',
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  defaultTermsConditions?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing and searching templates',
    isArray: true,
    type: String
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class QuotationTemplateFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by template category',
    enum: TemplateCategory
  })
  @IsOptional()
  @IsEnum(TemplateCategory)
  category?: TemplateCategory;

  @ApiPropertyOptional({
    description: 'Filter by public/private templates'
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by active/inactive templates'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search in template name and description'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags'
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of items to skip',
    example: 0,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class CreateQuotationFromTemplateDto {
  @ApiProperty({
    description: 'Template ID to use',
    example: 'cm1tpl123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({
    description: 'Customer ID for the quotation',
    example: 'cm1cust123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({
    description: 'Override default validity days',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({
    description: 'Override default terms and conditions'
  })
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for this quotation'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Customize template items (override quantities, prices, etc.)',
    type: [TemplateItemDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateItemDto)
  customizations?: TemplateItemDto[];
}

export class BulkQuotationCreateDto {
  @ApiProperty({
    description: 'Job name for tracking',
    example: 'Q4 2024 Bulk Quotations',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Job description',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Template ID to use for all quotations',
    example: 'cm1tpl123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  templateId!: string;

  @ApiProperty({
    description: 'Array of customer IDs to create quotations for',
    example: ['cm1cust123', 'cm1cust456', 'cm1cust789']
  })
  @IsArray()
  @IsString({ each: true })
  customerIds!: string[];

  @ApiPropertyOptional({
    description: 'Override default validity days for all quotations',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({
    description: 'Override default terms and conditions for all quotations'
  })
  @IsOptional()
  @IsString()
  termsConditions?: string;

  @ApiPropertyOptional({
    description: 'Additional notes for all quotations'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QuotationTemplateResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: TemplateCategory })
  category!: TemplateCategory;

  @ApiProperty()
  isPublic!: boolean;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  templateData!: any;

  @ApiProperty()
  defaultValidityDays!: number;

  @ApiPropertyOptional()
  defaultTermsConditions?: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  usageCount!: number;

  @ApiPropertyOptional()
  lastUsedAt?: Date;

  @ApiPropertyOptional()
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedQuotationTemplatesResponseDto {
  @ApiProperty({ type: [QuotationTemplateResponseDto] })
  data!: QuotationTemplateResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}

export class BulkQuotationJobResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  template?: QuotationTemplateResponseDto;

  @ApiProperty({ type: [String] })
  customerIds!: string[];

  @ApiProperty()
  status!: string;

  @ApiProperty()
  totalCustomers!: number;

  @ApiProperty()
  processedCustomers!: number;

  @ApiProperty()
  successfulQuotations!: number;

  @ApiProperty()
  failedQuotations!: number;

  @ApiPropertyOptional()
  errorLog?: any;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}