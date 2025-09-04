import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsDateString, 
  IsNotEmpty, 
  IsOptional, 
  IsPositive, 
  Min, 
  ValidateNested, 
  IsString, 
  IsNumber,
  MaxLength,
  IsObject
} from 'class-validator';

export class QuotationItemInputDto {
  @ApiProperty({
    description: 'Unique product identifier',
    example: 'cm1prod123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Unit price for the product in INR',
    example: 25000,
    minimum: 0
  })
  @IsNumber()
  @IsPositive()
  unitPrice!: number;

  @ApiPropertyOptional({
    description: 'Flat discount amount per line item in INR',
    example: 1000,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number = 0;

  @ApiPropertyOptional({
    description: 'Custom specifications for this line item',
    example: {
      color: 'Blue',
      customFeature: 'Extended warranty',
      installation: 'Included'
    }
  })
  @IsOptional()
  @IsObject()
  customSpecifications?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Delivery timeline for this item',
    example: '4-6 weeks',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  deliveryTimeline?: string;
}

export class CreateQuotationDto {
  @ApiProperty({
    description: 'Customer identifier for whom the quotation is being created',
    example: 'cm1cust123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({
    description: 'Quotation validity date (ISO 8601 format). If not provided, defaults to 30 days from creation',
    example: '2024-12-31T23:59:59Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiProperty({
    description: 'Array of quotation line items with products, quantities, and pricing',
    type: [QuotationItemInputDto],
    minItems: 1
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemInputDto)
  items!: QuotationItemInputDto[];

  @ApiPropertyOptional({
    description: 'Terms and conditions for the quotation',
    example: 'Payment within 30 days of delivery. Prices valid for 30 days. Installation and training included.',
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  termsConditions?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or comments for the quotation',
    example: 'Special handling required for this order. Customer prefers morning delivery.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
