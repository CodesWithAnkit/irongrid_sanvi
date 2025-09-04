import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailOptions } from '../interfaces/email.interface';

export class SendQuotationEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsString()
  recipientEmail: string;

  @ApiPropertyOptional({ description: 'Additional email options' })
  @IsOptional()
  @IsObject()
  options?: Partial<EmailOptions>;
}