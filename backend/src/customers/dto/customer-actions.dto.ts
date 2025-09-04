import { IsString, IsOptional, IsDateString, IsEnum, IsArray } from 'class-validator';

export class CreateInteractionDto {
  @IsString()
  customerId!: string;

  @IsEnum(['EMAIL', 'CALL', 'MEETING', 'NOTE'])
  type!: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

export class UpdateCreditLimitDto {
  @IsString()
  creditLimit!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class CustomerSegmentationDto {
  @IsEnum(['BUSINESS_TYPE', 'VOLUME', 'CREDIT_RATING', 'LOCATION'])
  criteria!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  filters?: string[];
}

export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  customerIds!: string[];

  @IsEnum(['ACTIVATE', 'DEACTIVATE', 'UPDATE_PAYMENT_TERMS', 'EXPORT'])
  action!: string;

  @IsOptional()
  data?: any;
}