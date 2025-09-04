import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePdfDto {
  @ApiProperty({ description: 'HTML template content' })
  @IsString()
  template: string;

  @ApiProperty({ description: 'Data to inject into template' })
  @IsObject()
  data: any;

  @ApiPropertyOptional({ description: 'Output filename' })
  @IsOptional()
  @IsString()
  filename?: string;

  @ApiPropertyOptional({ 
    description: 'Page format',
    enum: ['A4', 'Letter'],
    default: 'A4'
  })
  @IsOptional()
  @IsEnum(['A4', 'Letter'])
  format?: 'A4' | 'Letter';

  @ApiPropertyOptional({ 
    description: 'Page orientation',
    enum: ['portrait', 'landscape'],
    default: 'portrait'
  })
  @IsOptional()
  @IsEnum(['portrait', 'landscape'])
  orientation?: 'portrait' | 'landscape';

  @ApiPropertyOptional({ description: 'Page margins' })
  @IsOptional()
  @IsObject()
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}