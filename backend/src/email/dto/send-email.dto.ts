import { IsString, IsOptional, IsArray, IsObject, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailAttachmentDto {
  @ApiProperty({ description: 'Attachment filename' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Attachment content (base64 encoded)' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Content type' })
  @IsOptional()
  @IsString()
  contentType?: string;

  @ApiPropertyOptional({ description: 'Content ID for inline attachments' })
  @IsOptional()
  @IsString()
  cid?: string;
}

export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address(es)' })
  @IsString()
  to: string | string[];

  @ApiPropertyOptional({ description: 'CC email address(es)' })
  @IsOptional()
  cc?: string | string[];

  @ApiPropertyOptional({ description: 'BCC email address(es)' })
  @IsOptional()
  bcc?: string | string[];

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: 'HTML content' })
  @IsOptional()
  @IsString()
  html?: string;

  @ApiPropertyOptional({ description: 'Plain text content' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'Template ID to use' })
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Template data for variable substitution' })
  @IsOptional()
  @IsObject()
  templateData?: any;

  @ApiPropertyOptional({ description: 'Email attachments' })
  @IsOptional()
  @IsArray()
  attachments?: EmailAttachmentDto[];

  @ApiPropertyOptional({ 
    description: 'Email priority',
    enum: ['high', 'normal', 'low'],
    default: 'normal'
  })
  @IsOptional()
  @IsEnum(['high', 'normal', 'low'])
  priority?: 'high' | 'normal' | 'low';

  @ApiPropertyOptional({ description: 'Schedule email for later delivery' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: Date;

  @ApiPropertyOptional({ description: 'Track email opens', default: false })
  @IsOptional()
  @IsBoolean()
  trackOpens?: boolean;

  @ApiPropertyOptional({ description: 'Track email clicks', default: false })
  @IsOptional()
  @IsBoolean()
  trackClicks?: boolean;
}