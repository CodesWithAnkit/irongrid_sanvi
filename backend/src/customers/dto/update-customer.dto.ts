import { ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, PaymentTerms } from '@prisma/client';
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Min, 
  IsBoolean,
  MaxLength,
  MinLength,
  Matches
} from 'class-validator';

export class UpdateCustomerDto {
  @ApiPropertyOptional({
    description: 'Company or business name',
    example: 'Acme Industries Ltd.',
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName?: string;

  @ApiPropertyOptional({
    description: 'Primary contact person name',
    example: 'John Smith',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  contactPerson?: string;

  @ApiPropertyOptional({
    description: 'Primary email address for communication',
    example: 'john.smith@acme.com',
    format: 'email'
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Primary phone number with country code',
    example: '+91-9876543210',
    pattern: '^\\+?[\\d\\s\\-\\(\\)]+$'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-\(\)]+$/, { message: 'Invalid phone number format' })
  @MinLength(10)
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Alternate phone number',
    example: '+91-9876543211',
    pattern: '^\\+?[\\d\\s\\-\\(\\)]+$'
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-\(\)]+$/, { message: 'Invalid phone number format' })
  @MinLength(10)
  @MaxLength(20)
  alternatePhone?: string;

  @ApiPropertyOptional({
    description: 'Complete business address',
    example: '123 Industrial Area, Sector 5, Near Metro Station',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Mumbai',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State or province name',
    example: 'Maharashtra',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'India',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal or ZIP code',
    example: '400001',
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({
    description: 'Type of customer business',
    enum: CustomerType,
    example: CustomerType.ENTERPRISE
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType;

  @ApiPropertyOptional({
    description: 'Credit limit in INR',
    example: 500000,
    minimum: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({
    description: 'Payment terms for invoices',
    enum: PaymentTerms,
    example: PaymentTerms.NET_30
  })
  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: 'PAN123456789',
    maxLength: 50
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({
    description: 'GST registration number (India)',
    example: '27ABCDE1234F1Z5',
    maxLength: 20
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gstNumber?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the customer',
    example: 'Updated credit limit due to good payment history',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether the customer is active',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}