import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { 
  IsOptional, 
  IsEnum, 
  IsString, 
  IsDateString, 
  IsNumber, 
  Min, 
  Max,
  IsIn
} from 'class-validator';

export class OrderFiltersDto {
  @ApiPropertyOptional({
    description: 'Filter by order status',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 'cm1cust123abc456def789'
  })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by order number (partial match)',
    example: 'ORD-2024'
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by quotation ID',
    example: 'cm1quo123abc456def789'
  })
  @IsOptional()
  @IsString()
  quotationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    example: 'PAID'
  })
  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @ApiPropertyOptional({
    description: 'Filter orders created after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter orders created before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter orders with expected delivery after this date (ISO 8601)',
    example: '2024-03-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  deliveryAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter orders with expected delivery before this date (ISO 8601)',
    example: '2024-03-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  deliveryBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer name (partial match)',
    example: 'Acme Industries'
  })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Filter orders with total amount greater than or equal to this value',
    example: 50000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Filter orders with total amount less than or equal to this value',
    example: 500000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @ApiPropertyOptional({
    description: 'General search term (searches order number, customer name, notes)',
    example: 'urgent delivery'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Number of records to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Number of records to skip',
    example: 0,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'orderNumber', 'totalAmount', 'status', 'customerName', 'expectedDelivery'],
    default: 'createdAt'
  })
  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'orderNumber', 'totalAmount', 'status', 'customerName', 'expectedDelivery'])
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}