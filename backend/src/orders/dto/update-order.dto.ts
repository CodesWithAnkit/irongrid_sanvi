import { ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsDateString, MaxLength } from 'class-validator';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Order status',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'Payment status',
    example: 'PAID',
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentStatus?: string;

  @ApiPropertyOptional({
    description: 'Payment ID from payment gateway',
    example: 'pay_123456789',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  paymentId?: string;

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
    example: 'Updated delivery instructions',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}