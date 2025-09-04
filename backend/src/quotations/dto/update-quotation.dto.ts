import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { QuotationStatus } from '@prisma/client';

export class UpdateQuotationDto {
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
