import { ValidationPipe } from './validation.pipe';
import { BadRequestException } from '@nestjs/common';
import { IsString, IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { plainToClass } from 'class-transformer';

class TestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  constructor(partial: Partial<TestDto>) {
    Object.assign(this, partial);
  }
}

describe('ValidationPipe', () => {
  let validationPipe: ValidationPipe;

  beforeEach(() => {
    validationPipe = new ValidationPipe();
  });

  it('should be defined', () => {
    expect(validationPipe).toBeDefined();
  });

  describe('transform', () => {
    it('should pass validation for valid data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const result = await validationPipe.transform(validData, {
        type: 'body',
        metatype: TestDto,
      } as any);

      expect(result).toBeInstanceOf(TestDto);
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john@example.com');
      expect(result.password).toBe('password123');
    });

    it('should sanitize HTML in string fields', async () => {
      const dataWithHtml = {
        name: '<script>alert("XSS");</script>John Doe',
        email: 'john@example.com',
        password: 'password123<img src=x onerror=alert(1)>',
      };

      const result = await validationPipe.transform(dataWithHtml, {
        type: 'body',
        metatype: TestDto,
      } as any);

      expect(result.name).not.toContain('<script>');
      expect(result.password).not.toContain('<img');
    });

    it('should throw BadRequestException for invalid data', async () => {
      const invalidData = {
        name: '',
        email: 'not-an-email',
        password: 'short',
      };

      await expect(
        validationPipe.transform(invalidData, {
          type: 'body',
          metatype: TestDto,
        } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it('should return original value if no metatype is provided', async () => {
      const data = { name: 'John Doe' };

      const result = await validationPipe.transform(data, {
        type: 'body',
      } as any);

      expect(result).toBe(data);
    });

    it('should handle nested objects for sanitization', async () => {
      class NestedDto {
        @IsString()
        description: string;
      }

      class ParentDto {
        @IsString()
        name: string;

        details: NestedDto;
      }

      const dataWithNestedHtml = {
        name: 'John Doe',
        details: {
          description: '<script>alert("nested XSS");</script>Details',
        },
      };

      const metatype = ParentDto;
      validationPipe['isTransformable'] = jest.fn().mockReturnValue(true);

      const result = await validationPipe.transform(dataWithNestedHtml, {
        type: 'body',
        metatype,
      } as any);

      expect(result.details.description).not.toContain('<script>');
    });

    it('should process arrays correctly', async () => {
      const dataWithArray = [
        {
          name: '<b>User 1</b>',
          email: 'user1@example.com',
          password: 'password123',
        },
        {
          name: '<i>User 2</i>',
          email: 'user2@example.com',
          password: 'password456',
        },
      ];

      validationPipe['isTransformable'] = jest.fn().mockReturnValue(true);
      validationPipe['toValidate'] = jest.fn().mockReturnValue(true);

      const result = await validationPipe.transform(dataWithArray, {
        type: 'body',
        metatype: TestDto,
      } as any);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('User 1');
      expect(result[1].name).toBe('User 2');
    });
  });

  describe('sanitizeHtml', () => {
    it('should sanitize HTML in string input', () => {
      const input = '<script>alert("XSS");</script>Safe Content';
      const sanitized = validationPipe['sanitizeHtml'](input);
      expect(sanitized).toBe('Safe Content');
    });

    it('should preserve safe HTML if allowed tags are configured', () => {
      const originalAllowedTags = validationPipe['allowedTags'];
      validationPipe['allowedTags'] = ['b', 'i'];

      const input = '<b>Bold</b> and <i>Italic</i> but <script>no script</script>';
      const sanitized = validationPipe['sanitizeHtml'](input);
      
      expect(sanitized).toBe('<b>Bold</b> and <i>Italic</i> but no script');
      
      // Restore original configuration
      validationPipe['allowedTags'] = originalAllowedTags;
    });

    it('should handle null and undefined values', () => {
      expect(validationPipe['sanitizeHtml'](null)).toBeNull();
      expect(validationPipe['sanitizeHtml'](undefined)).toBeUndefined();
    });

    it('should handle non-string types', () => {
      expect(validationPipe['sanitizeHtml'](123)).toBe(123);
      expect(validationPipe['sanitizeHtml'](true)).toBe(true);
    });
  });

  describe('sanitizeObject', () => {
    it('should recursively sanitize object properties', () => {
      const complexObject = {
        name: '<script>alert(1)</script>John',
        details: {
          bio: '<img src=x onerror=alert(2)>About me',
          links: ['<a onclick="evil()">Click</a>', 'https://example.com'],
        },
        tags: ['<b>Tag1</b>', '<i>Tag2</i>'],
      };

      const sanitized = validationPipe['sanitizeObject'](complexObject);

      expect(sanitized.name).toBe('John');
      expect(sanitized.details.bio).toBe('About me');
      expect(sanitized.details.links[0]).toBe('Click');
      expect(sanitized.tags[0]).toBe('Tag1');
      expect(sanitized.tags[1]).toBe('Tag2');
    });

    it('should handle cyclic references', () => {
      const cyclicObj: any = {
        name: '<script>alert(1)</script>John',
      };
      cyclicObj.self = cyclicObj;

      expect(() => validationPipe['sanitizeObject'](cyclicObj)).not.toThrow();
      expect(validationPipe['sanitizeObject'](cyclicObj).name).toBe('John');
    });
  });
});
