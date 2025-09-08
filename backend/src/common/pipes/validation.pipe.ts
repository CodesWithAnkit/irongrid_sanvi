import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return this.sanitizeInput(value);
    }
    
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    
    if (errors.length > 0) {
      const messages = errors.map(error => {
        return {
          property: error.property,
          constraints: error.constraints,
        };
      });
      throw new BadRequestException({
        message: 'Validation failed',
        errors: messages,
      });
    }
    
    return this.sanitizeInput(object);
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: any): any {
    if (typeof value !== 'object' || value === null) {
      return typeof value === 'string' ? this.sanitizeString(value) : value;
    }

    const sanitized: Record<string, any> | any[] = Array.isArray(value) ? [] : {} as Record<string, any>;
    
    Object.keys(value as Record<string, any>).forEach((key: string) => {
      const val = (value as Record<string, any>)[key];
      if (typeof val === 'object' && val !== null) {
        (sanitized as Record<string, any>)[key] = this.sanitizeInput(val);
      } else if (typeof val === 'string') {
        (sanitized as Record<string, any>)[key] = this.sanitizeString(val);
      } else {
        (sanitized as Record<string, any>)[key] = val;
      }
    });
    
    return sanitized;
  }

  private sanitizeString(value: string): string {
    // Minimal XSS protection by escaping HTML special characters
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
