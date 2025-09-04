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

export class OrderItemInputDto {
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
  discountAmount?: number = 0;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer identifier for whom the order is being created',
    example: 'cm1cust123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @ApiPropertyOptional({
    description: 'Quotation ID if this order is converted from a quotation',
    example: 'cm1quo123abc456def789'
  })
  @IsOptional()
  @IsString()
  quotationId?: string;

  @ApiProperty({
    description: 'Array of order line items with products, quantities, and pricing',
    type: [OrderItemInputDto],
    minItems: 1
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @ApiPropertyOptional({
    description: 'Shipping address for the order',
    example: '123 Industrial Area, Sector 5, Gurgaon, Haryana 122001',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingAddress?: string;

  @ApiPropertyOptional({
    description: 'Expected delivery date (ISO 8601 format)',
    example: '2024-03-15T00:00:00Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  expectedDelivery?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or comments for the order',
    example: 'Handle with care. Customer prefers morning delivery.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}