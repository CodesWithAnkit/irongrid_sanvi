import { IsString, IsOptional, IsArray, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailCategory, TemplateVariable } from '../interfaces/email.interface';

export class CreateTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email subject template' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'HTML content template' })
  @IsString()
  htmlContent: string;

  @ApiPropertyOptional({ description: 'Plain text content template' })
  @IsOptional()
  @IsString()
  textContent?: string;

  @ApiPropertyOptional({ description: 'Template variables' })
  @IsOptional()
  @IsArray()
  variables?: TemplateVariable[];

  @ApiProperty({ 
    description: 'Template category',
    enum: EmailCategory,
    default: EmailCategory.NOTIFICATION
  })
  @IsEnum(EmailCategory)
  category: EmailCategory;

  @ApiPropertyOptional({ description: 'Is template active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}