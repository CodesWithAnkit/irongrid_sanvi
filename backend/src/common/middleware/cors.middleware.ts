import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  private readonly allowedOrigins: string[];
  private readonly allowCredentials: boolean;
  private readonly maxAge: number;
  private readonly allowedMethods: string[];
  private readonly allowedHeaders: string[];
  
  constructor(private configService: ConfigService) {
    this.allowedOrigins = this.parseOrigins(
      this.configService.get<string>('CORS_ALLOWED_ORIGINS') || 'http://localhost:3000,http://localhost:3001'
    );
    
    this.allowCredentials = this.configService.get<boolean>('CORS_ALLOW_CREDENTIALS') ?? true;
    this.maxAge = this.configService.get<number>('CORS_MAX_AGE') || 86400; // 24 hours
    
    this.allowedMethods = [
      'GET', 
      'POST', 
      'PUT', 
      'DELETE', 
      'PATCH', 
      'OPTIONS'
    ];
    
    this.allowedHeaders = [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-API-Key',
    ];
  }

  use(req: Request, res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    
    // Check if the request origin is allowed
    if (origin && this.isOriginAllowed(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      // Default when no origin header or not allowed
      res.setHeader('Access-Control-Allow-Origin', this.allowedOrigins[0] || '*');
    }

    // Set other CORS headers
    res.setHeader('Access-Control-Allow-Methods', this.allowedMethods.join(','));
    res.setHeader('Access-Control-Allow-Headers', this.allowedHeaders.join(','));
    res.setHeader('Access-Control-Max-Age', this.maxAge.toString());
    
    if (this.allowCredentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    next();
  }

  private parseOrigins(originsString: string): string[] {
    return originsString.split(',').map(origin => origin.trim());
  }

  private isOriginAllowed(origin: string): boolean {
    return this.allowedOrigins.includes('*') || this.allowedOrigins.includes(origin);
  }
}
