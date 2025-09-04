import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuotationStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class QuotationItemResponseDto {
  @ApiProperty({
    description: 'Unique quotation item identifier',
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
    description: 'Discount percentage applied',
    example: 5.0
  })
  discountPercentage: Decimal;

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
    description: 'Custom specifications for this line item',
    example: {
      color: 'Blue',
      customFeature: 'Extended warranty'
    }
  })
  customSpecifications?: any;

  @ApiPropertyOptional({
    description: 'Delivery timeline for this item',
    example: '4-6 weeks'
  })
  deliveryTimeline?: string;

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

export class QuotationResponseDto {
  @ApiProperty({
    description: 'Unique quotation identifier',
    example: 'cm1quo123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Human-readable quotation number',
    example: 'QUO-2024-000123'
  })
  quotationNumber: string;

  @ApiProperty({
    description: 'Customer identifier',
    example: 'cm1cust123abc456def789'
  })
  customerId: string;

  @ApiProperty({
    description: 'Current quotation status',
    enum: QuotationStatus,
    example: QuotationStatus.SENT
  })
  status: QuotationStatus;

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
    description: 'Quotation validity date',
    example: '2024-12-31T23:59:59Z'
  })
  validUntil?: Date;

  @ApiPropertyOptional({
    description: 'Terms and conditions',
    example: 'Payment within 30 days of delivery'
  })
  termsConditions?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Special handling required for this order'
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'URL to generated PDF document',
    example: 'https://files.sanvi-machinery.com/quotations/QUO-2024-000123.pdf'
  })
  pdfUrl?: string;

  @ApiPropertyOptional({
    description: 'Timestamp when email was sent to customer',
    example: '2024-01-15T14:30:00Z'
  })
  emailSentAt?: Date;

  @ApiPropertyOptional({
    description: 'Timestamp when customer viewed the quotation',
    example: '2024-01-16T09:15:00Z'
  })
  customerViewedAt?: Date;

  @ApiPropertyOptional({
    description: 'Timestamp when customer responded to the quotation',
    example: '2024-01-17T11:45:00Z'
  })
  customerRespondedAt?: Date;

  @ApiProperty({
    description: 'Quotation creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-17T11:45:00Z'
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'ID of user who created the quotation',
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
    description: 'Array of quotation line items',
    type: [QuotationItemResponseDto]
  })
  items: QuotationItemResponseDto[];
  
  @ApiPropertyOptional({
    description: 'Information about user who created the quotation',
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
}

export class PaginatedQuotationsResponseDto {
  @ApiProperty({
    description: 'Array of quotation records',
    type: [QuotationResponseDto]
  })
  data: QuotationResponseDto[];

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

export class QuotationAnalyticsDto {
  @ApiProperty({
    description: 'Total number of quotations',
    example: 245
  })
  totalQuotations: number;

  @ApiProperty({
    description: 'Overall conversion rate as percentage',
    example: 68.5
  })
  conversionRate: number;

  @ApiProperty({
    description: 'Average quotation value in INR',
    example: 125000
  })
  averageValue: number;

  @ApiProperty({
    description: 'Average response time in hours',
    example: 48.5
  })
  averageResponseTime: number;

  @ApiProperty({
    description: 'Breakdown of quotations by status',
    example: {
      DRAFT: 15,
      SENT: 45,
      APPROVED: 120,
      REJECTED: 35,
      EXPIRED: 30
    }
  })
  statusBreakdown: Record<QuotationStatus, number>;

  @ApiProperty({
    description: 'Monthly quotation trends',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        month: { type: 'string', example: '2024-01' },
        count: { type: 'number', example: 25 },
        value: { type: 'number', example: 3125000 },
        conversionRate: { type: 'number', example: 72.0 }
      }
    }
  })
  monthlyTrends: Array<{
    month: string;
    count: number;
    value: number;
    conversionRate: number;
  }>;
}