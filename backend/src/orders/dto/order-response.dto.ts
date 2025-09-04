import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'Unique order item identifier',
    example: 'cm1item123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Product identifier',
    example: 'cm1prod123abc456def789'
  })
  productId: string;

  @ApiProperty({
    description: 'Quantity of the product',
    example: 2
  })
  quantity: number;

  @ApiProperty({
    description: 'Unit price for the product',
    example: 25000
  })
  unitPrice: Decimal;

  @ApiProperty({
    description: 'Discount amount in INR',
    example: 2500
  })
  discountAmount: Decimal;

  @ApiProperty({
    description: 'Line total after discount',
    example: 47500
  })
  lineTotal: Decimal;

  @ApiPropertyOptional({
    description: 'Product information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'cm1prod123abc456def789' },
      sku: { type: 'string', example: 'IND-LATHE-001' },
      name: { type: 'string', example: 'CNC Lathe Machine - Model X200' },
      description: { type: 'string', example: 'High-precision CNC lathe machine' }
    }
  })
  product?: {
    id: string;
    sku: string;
    name: string;
    description?: string;
  };
}

export class OrderResponseDto {
  @ApiProperty({
    description: 'Unique order identifier',
    example: 'cm1ord123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Human-readable order number',
    example: 'ORD-2024-000123'
  })
  orderNumber: string;

  @ApiPropertyOptional({
    description: 'Quotation identifier if converted from quotation',
    example: 'cm1quo123abc456def789'
  })
  quotationId?: string;

  @ApiProperty({
    description: 'Customer identifier',
    example: 'cm1cust123abc456def789'
  })
  customerId: string;

  @ApiProperty({
    description: 'Current order status',
    enum: OrderStatus,
    example: OrderStatus.PROCESSING
  })
  status: OrderStatus;

  @ApiProperty({
    description: 'Subtotal before discounts and taxes',
    example: 50000
  })
  subtotal: Decimal;

  @ApiProperty({
    description: 'Total discount amount',
    example: 2500
  })
  discountAmount: Decimal;

  @ApiProperty({
    description: 'Tax amount (GST, etc.)',
    example: 8550
  })
  taxAmount: Decimal;

  @ApiProperty({
    description: 'Final total amount',
    example: 56050
  })
  totalAmount: Decimal;

  @ApiPropertyOptional({
    description: 'Payment status',
    example: 'PAID'
  })
  paymentStatus?: string;

  @ApiPropertyOptional({
    description: 'Payment ID from payment gateway',
    example: 'pay_123456789'
  })
  paymentId?: string;

  @ApiPropertyOptional({
    description: 'Shipping address',
    example: '123 Industrial Area, Sector 5, Gurgaon, Haryana 122001'
  })
  shippingAddress?: string;

  @ApiPropertyOptional({
    description: 'Expected delivery date',
    example: '2024-03-15T00:00:00Z'
  })
  expectedDelivery?: Date;

  @ApiProperty({
    description: 'Order creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-17T11:45:00Z'
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'ID of user who created the order',
    example: 'cm1user123abc456def789'
  })
  createdByUserId?: string;
  
  @ApiPropertyOptional({
    description: 'Customer information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'cm1cust123abc456def789' },
      companyName: { type: 'string', example: 'Acme Industries Ltd.' },
      contactPerson: { type: 'string', example: 'John Smith' },
      email: { type: 'string', example: 'john.smith@acme.com' }
    }
  })
  customer?: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  };
  
  @ApiProperty({
    description: 'Array of order line items',
    type: [OrderItemResponseDto]
  })
  items: OrderItemResponseDto[];
  
  @ApiPropertyOptional({
    description: 'Information about user who created the order',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'cm1user123abc456def789' },
      firstName: { type: 'string', example: 'Jane' },
      lastName: { type: 'string', example: 'Doe' },
      email: { type: 'string', example: 'jane.doe@sanvi-machinery.com' }
    }
  })
  createdBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Quotation information if converted from quotation',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'cm1quo123abc456def789' },
      quotationNumber: { type: 'string', example: 'QUO-2024-000123' },
      status: { type: 'string', example: 'APPROVED' }
    }
  })
  quotation?: {
    id: string;
    quotationNumber: string;
    status: string;
  };
}

export class PaginatedOrdersResponseDto {
  @ApiProperty({
    description: 'Array of order records',
    type: [OrderResponseDto]
  })
  data: OrderResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: 'object',
    properties: {
      page: { type: 'number', example: 1 },
      limit: { type: 'number', example: 20 },
      total: { type: 'number', example: 150 },
      totalPages: { type: 'number', example: 8 },
      hasNext: { type: 'boolean', example: true },
      hasPrev: { type: 'boolean', example: false }
    }
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-20T10:30:00Z'
  })
  timestamp: string;
}

export class OrderAnalyticsDto {
  @ApiProperty({
    description: 'Total number of orders',
    example: 145
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Total revenue from orders',
    example: 5250000
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Average order value in INR',
    example: 125000
  })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Average fulfillment time in days',
    example: 12.5
  })
  averageFulfillmentTime: number;

  @ApiProperty({
    description: 'Breakdown of orders by status',
    example: {
      PENDING: 15,
      PAID: 25,
      PROCESSING: 45,
      SHIPPED: 35,
      DELIVERED: 120,
      CANCELLED: 5
    }
  })
  statusBreakdown: Record<OrderStatus, number>;

  @ApiProperty({
    description: 'Monthly order trends',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        month: { type: 'string', example: '2024-01' },
        count: { type: 'number', example: 25 },
        revenue: { type: 'number', example: 3125000 },
        averageValue: { type: 'number', example: 125000 }
      }
    }
  })
  monthlyTrends: Array<{
    month: string;
    count: number;
    revenue: number;
    averageValue: number;
  }>;
}