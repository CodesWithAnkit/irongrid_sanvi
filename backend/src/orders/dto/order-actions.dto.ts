import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsDateString, MaxLength, IsNumber, Min } from 'class-validator';

export class ConvertQuotationToOrderDto {
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
    description: 'Additional notes for the order',
    example: 'Converted from quotation QUO-2024-000123',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'New order status',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @ApiPropertyOptional({
    description: 'Notes about the status change',
    example: 'Order moved to processing after payment confirmation',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  statusNotes?: string;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({
    description: 'Payment status',
    example: 'PAID',
    maxLength: 50
  })
  @IsString()
  @MaxLength(50)
  paymentStatus!: string;

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
    description: 'Payment amount',
    example: 56050,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentAmount?: number;

  @ApiPropertyOptional({
    description: 'Payment notes',
    example: 'Payment received via Razorpay',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  paymentNotes?: string;
}

export class ModifyOrderDto {
  @ApiPropertyOptional({
    description: 'Reason for modification',
    example: 'Customer requested quantity change',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  modificationReason?: string;

  @ApiPropertyOptional({
    description: 'Modification notes',
    example: 'Increased quantity from 2 to 3 units',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  modificationNotes?: string;

  @ApiPropertyOptional({
    description: 'Requires approval for modification',
    example: true
  })
  @IsOptional()
  requiresApproval?: boolean = false;
}