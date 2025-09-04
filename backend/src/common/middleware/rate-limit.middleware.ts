import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(private configService: ConfigService) {
    this.windowMs = this.configService.get<number>('RATE_LIMIT_WINDOW_MS') || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = this.configService.get<number>('RATE_LIMIT_MAX_REQUESTS') || 100;
  }

  use(req: Request, res: Response, next: NextFunction) {
    const key = this.getKey(req);
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);

    const record = this.store[key];
    
    if (!record) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
      return next();
    }

    if (now > record.resetTime) {
      // Reset the window
      record.count = 1;
      record.resetTime = now + this.windowMs;
      return next();
    }

    if (record.count >= this.maxRequests) {
      const resetTime = new Date(record.resetTime);
      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toISOString(),
      });
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          error: 'Rate limit exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    
    res.set({
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': (this.maxRequests - record.count).toString(),
      'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
    });

    next();
  }

  private getKey(req: Request): string {
    // Use IP address as the key, but could be enhanced with user ID for authenticated requests
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
    return `rate_limit:${ip}`;
  }

  private cleanup(now: number) {
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}