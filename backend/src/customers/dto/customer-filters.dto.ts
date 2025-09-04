import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, PaymentTerms } from '@prisma/client';
import { 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Min, 
  IsBoolean,
  IsString,
  MaxLength,
  IsDateString,
  IsInt
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CustomerFiltersDto {
  // Pagination
  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    example: 0,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  offset?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'createdAt',
    default: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  // Search
  @ApiPropertyOptional({
    description: 'Search term for company name, contact person, or email',
    example: 'Acme Industries',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Filters
  @ApiPropertyOptional({
    description: 'Filter by customer business type',
    enum: CustomerType,
    example: CustomerType.ENTERPRISE
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional({
    description: 'Filter by customer active status',
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by payment terms',
    enum: PaymentTerms,
    example: PaymentTerms.NET_30
  })
  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @ApiPropertyOptional({
    description: 'Filter by customer city',
    example: 'Mumbai',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer state/province',
    example: 'Maharashtra',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Filter by customer country',
    example: 'India',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter customers with credit limit greater than or equal to this value',
    example: 100000,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minCreditLimit?: number;

  @ApiPropertyOptional({
    description: 'Filter customers with credit limit less than or equal to this value',
    example: 1000000,
    minimum: 0
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxCreditLimit?: number;

  // Date range filters
  @ApiPropertyOptional({
    description: 'Filter customers created after this date',
    example: '2024-01-01T00:00:00Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter customers created before this date',
    example: '2024-12-31T23:59:59Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}