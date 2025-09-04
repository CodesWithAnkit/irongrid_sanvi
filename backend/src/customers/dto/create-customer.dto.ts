import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType, PaymentTerms } from '@prisma/client';
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max, 
  IsBoolean,
  MaxLength,
  MinLength,
  Matches
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Company or business name',
    example: 'Acme Industries Ltd.',
    maxLength: 200
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  companyName: string;

  @ApiProperty({
    description: 'Primary contact person name',
    example: 'John Smith',
    maxLength: 100
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  contactPerson: string;

  @ApiProperty({
    description: 'Primary email address for communication',
    example: 'john.smith@acme.com',
    format: 'email'
  })
  @IsEmail()
  email: string;

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
    default: 'India',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string = 'India';

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
    example: CustomerType.ENTERPRISE,
    default: CustomerType.SMALL_BUSINESS
  })
  @IsOptional()
  @IsEnum(CustomerType)
  customerType?: CustomerType = CustomerType.SMALL_BUSINESS;

  @ApiPropertyOptional({
    description: 'Credit limit in INR',
    example: 500000,
    minimum: 0,
    default: 0
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number = 0;

  @ApiPropertyOptional({
    description: 'Payment terms for invoices',
    enum: PaymentTerms,
    example: PaymentTerms.NET_30,
    default: PaymentTerms.NET_30
  })
  @IsOptional()
  @IsEnum(PaymentTerms)
  paymentTerms?: PaymentTerms = PaymentTerms.NET_30;

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
    example: 'Key customer for industrial machinery. Prefers email communication.',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether the customer is active',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}