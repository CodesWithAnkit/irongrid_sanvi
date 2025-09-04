import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({
    description: 'Customer unique identifier',
    example: 'cm1cust123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'ABC Manufacturing Ltd.'
  })
  companyName: string;

  @ApiProperty({
    description: 'Primary contact person name',
    example: 'John Smith'
  })
  contactPerson: string;

  @ApiProperty({
    description: 'Primary email address',
    example: 'john.smith@abcmanufacturing.com'
  })
  email: string;

  @ApiPropertyOptional({
    description: 'Primary phone number',
    example: '+91-9876543210'
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Alternate phone number',
    example: '+91-9876543211'
  })
  alternatePhone?: string;

  @ApiPropertyOptional({
    description: 'Complete address',
    example: '123 Industrial Area, Sector 5'
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Mumbai'
  })
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'Maharashtra'
  })
  state?: string;

  @ApiPropertyOptional({
    description: 'Country',
    example: 'India'
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '400001'
  })
  postalCode?: string;

  @ApiProperty({
    description: 'Customer type',
    enum: ['INDIVIDUAL', 'SMALL_BUSINESS', 'ENTERPRISE', 'GOVERNMENT'],
    example: 'ENTERPRISE'
  })
  customerType: string;

  @ApiProperty({
    description: 'Credit limit amount',
    example: 500000
  })
  creditLimit: number;

  @ApiProperty({
    description: 'Payment terms',
    enum: ['NET_15', 'NET_30', 'NET_45', 'NET_60', 'IMMEDIATE', 'ADVANCE'],
    example: 'NET_30'
  })
  paymentTerms: string;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: 'TAX123456789'
  })
  taxId?: string;

  @ApiPropertyOptional({
    description: 'GST number',
    example: '27AAAAA0000A1Z5'
  })
  gstNumber?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Preferred customer with good payment history'
  })
  notes?: string;

  @ApiProperty({
    description: 'Whether customer is active',
    example: true
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Customer creation timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-20T14:45:00Z'
  })
  updatedAt: Date;

  // Additional computed fields for enhanced customer data
  @ApiPropertyOptional({
    description: 'Total number of quotations',
    example: 15
  })
  totalQuotations?: number;

  @ApiPropertyOptional({
    description: 'Total number of orders',
    example: 8
  })
  totalOrders?: number;

  @ApiPropertyOptional({
    description: 'Customer lifetime value',
    example: 1250000
  })
  lifetimeValue?: number;

  @ApiPropertyOptional({
    description: 'Engagement score (0-100)',
    example: 75
  })
  engagementScore?: number;

  @ApiPropertyOptional({
    description: 'Last interaction date',
    example: '2024-02-10T16:20:00Z'
  })
  lastInteractionAt?: Date;

  @ApiPropertyOptional({
    description: 'Customer segments',
    type: [String],
    example: ['business_type_enterprise', 'volume_high_volume', 'location_maharashtra']
  })
  segments?: string[];
}

export class CustomerInteractionDto {
  id: string;
  createdAt: Date;
  user: { id: string; firstName: string; lastName: string; email: string };
  type: string;
  subject: string;
  description: string;
  scheduledAt?: Date;
  completedAt?: Date;
}

export class CustomerSegmentDto {
  segment: string;
  count: number;
  totalValue: number;
  averageValue: number;
  customers: CustomerResponseDto[];
}

export class CustomerAnalyticsDto {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  averageLifetimeValue: number;
  topCustomersByValue: any[];
  segmentBreakdown: Record<string, number>;
  monthlyGrowth: any[];
}

export class ImportResultDto {
  totalProcessed: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
  duplicatesFound: number;
  duplicatesSkipped: number;
}

export class PaginatedCustomersResponseDto {
  @ApiProperty({ type: [CustomerResponseDto] }) data: CustomerResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
  @ApiProperty() totalPages: number;
}

export class CustomerSpecificAnalyticsDto {
  @ApiProperty({ description: 'Customer unique identifier' })
  customerId: string;

  @ApiProperty({ description: 'Lifetime value of the customer' })
  lifetimeValue: number;

  @ApiProperty({ description: 'Total number of quotations' })
  totalQuotations: number;

  @ApiProperty({ description: 'Total number of interactions' })
  totalInteractions: number;
  // Add more properties as needed based on requirements
}