import { IsOptional, IsString, IsEmail, IsArray, IsBoolean } from 'class-validator';

export class SendQuotationEmailDto {
  @IsEmail()
  recipientEmail: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  ccEmails?: string[];

  @IsOptional()
  @IsBoolean()
  attachPdf?: boolean = true;
}

export class DuplicateQuotationDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsBoolean()
  resetStatus?: boolean = true;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConvertToOrderDto {
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ApproveQuotationDto {
  @IsOptional()
  @IsString()
  approvalNotes?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;
}