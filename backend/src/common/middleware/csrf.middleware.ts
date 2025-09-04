import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly csrfSecret: string;
  private readonly csrfTokenExpiry: number;
  private readonly nonCsrfPaths: string[];
  private readonly nonCsrfMethods: string[];

  constructor(private configService: ConfigService) {
    // Use a secure secret or generate one at application startup
    this.csrfSecret = this.configService.get<string>('CSRF_SECRET') || crypto.randomBytes(32).toString('hex');
    this.csrfTokenExpiry = this.configService.get<number>('CSRF_TOKEN_EXPIRY') || 24 * 60 * 60 * 1000; // 24 hours
    
    // Paths that don't require CSRF protection (e.g., login, public APIs)
    this.nonCsrfPaths = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password'];
    this.nonCsrfMethods = ['GET', 'HEAD', 'OPTIONS'];
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for safe methods and exempted paths
    if (
      this.nonCsrfMethods.includes(req.method) ||
      this.nonCsrfPaths.some(path => req.path.startsWith(path))
    ) {
      return next();
    }

    const csrfToken = req.headers['x-csrf-token'] as string;
    
    if (!csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    const [timestamp, hash] = csrfToken.split('.');
    const timestampNumber = parseInt(timestamp, 10);

    // Check if token is expired
    if (Date.now() > timestampNumber + this.csrfTokenExpiry) {
      throw new ForbiddenException('CSRF token expired');
    }

    // Validate token
    const expectedHash = this.generateHash(timestamp);
    if (hash !== expectedHash) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    next();
  }

  /**
   * Generate a CSRF token to be sent to the client
   */
  generateToken(): string {
    const timestamp = Date.now().toString();
    const hash = this.generateHash(timestamp);
    return `${timestamp}.${hash}`;
  }

  private generateHash(timestamp: string): string {
    return crypto
      .createHmac('sha256', this.csrfSecret)
      .update(timestamp)
      .digest('hex');
  }
}
