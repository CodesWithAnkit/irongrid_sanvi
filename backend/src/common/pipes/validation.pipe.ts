import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

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

    const sanitized = Array.isArray(value) ? [] : {};
    
    Object.keys(value).forEach(key => {
      const val = value[key];
      if (typeof val === 'object' && val !== null) {
        sanitized[key] = this.sanitizeInput(val);
      } else if (typeof val === 'string') {
        sanitized[key] = this.sanitizeString(val);
      } else {
        sanitized[key] = val;
      }
    });
    
    return sanitized;
  }

  private sanitizeString(value: string): string {
    // Prevent XSS by sanitizing HTML content
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'recursiveEscape',
    });
  }
}
