import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CACHE_METADATA_KEY, CacheDecoratorOptions } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<CacheDecoratorOptions>(
      CACHE_METADATA_KEY,
      context.getHandler(),
    );

    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;
    const args = context.getArgs();

    // Generate cache key
    const cacheKey = this.generateCacheKey(
      methodName,
      className,
      args,
      cacheOptions.keyGenerator,
    );

    // Generate cache parameters for complex key generation
    const cacheParams = this.generateCacheParams(args, request);

    try {
      // Try to get from cache first
      const cachedResult = await this.cacheService.get(
        cacheOptions.namespace,
        cacheKey,
        cacheParams,
      );

      if (cachedResult !== null) {
        this.logger.debug(`Cache HIT: ${cacheOptions.namespace}:${cacheKey}`);
        return of(cachedResult);
      }

      this.logger.debug(`Cache MISS: ${cacheOptions.namespace}:${cacheKey}`);

      // Execute the method and cache the result
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== undefined && result !== null) {
            await this.cacheService.set(
              cacheOptions.namespace,
              cacheKey,
              result,
              {
                ttl: cacheOptions.ttl,
                tags: cacheOptions.tags,
                dependencies: cacheOptions.dependencies,
              },
              cacheParams,
            );
            this.logger.debug(`Cache SET: ${cacheOptions.namespace}:${cacheKey}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for ${cacheOptions.namespace}:${cacheKey}:`, error);
      // Continue with method execution if cache fails
      return next.handle();
    }
  }

  private generateCacheKey(
    methodName: string,
    className: string,
    args: any[],
    keyGenerator?: (...args: any[]) => string,
  ): string {
    if (keyGenerator) {
      try {
        return keyGenerator(...args);
      } catch (error) {
        this.logger.warn('Custom key generator failed, using default:', error);
      }
    }

    // Default key generation
    const baseKey = `${className}.${methodName}`;
    
    if (args.length === 0) {
      return baseKey;
    }

    // Extract meaningful parameters for key generation
    const keyParts: string[] = [];
    
    args.forEach((arg, index) => {
      if (arg !== undefined && arg !== null) {
        if (typeof arg === 'string' || typeof arg === 'number') {
          keyParts.push(String(arg));
        } else if (typeof arg === 'object') {
          // For objects, create a hash of key properties
          const objKey = this.createObjectKey(arg);
          if (objKey) {
            keyParts.push(objKey);
          }
        }
      }
    });

    return keyParts.length > 0 ? `${baseKey}:${keyParts.join(':')}` : baseKey;
  }

  private generateCacheParams(args: any[], request?: any): Record<string, any> {
    const params: Record<string, any> = {};

    // Add request-specific parameters if available
    if (request) {
      if (request.user?.id) {
        params.userId = request.user.id;
      }
      if (request.query) {
        // Include relevant query parameters
        Object.keys(request.query).forEach(key => {
          if (['page', 'limit', 'sort', 'filter'].includes(key)) {
            params[key] = request.query[key];
          }
        });
      }
    }

    // Add method arguments as parameters
    args.forEach((arg, index) => {
      if (arg !== undefined && arg !== null) {
        if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
          params[`arg${index}`] = arg;
        } else if (typeof arg === 'object' && !Array.isArray(arg)) {
          // Include specific object properties
          if (arg.id) params[`arg${index}_id`] = arg.id;
          if (arg.page) params[`arg${index}_page`] = arg.page;
          if (arg.limit) params[`arg${index}_limit`] = arg.limit;
        }
      }
    });

    return params;
  }

  private createObjectKey(obj: any): string | null {
    try {
      if (obj.id) {
        return String(obj.id);
      }

      // For query/filter objects, create a deterministic key
      if (typeof obj === 'object') {
        const relevantKeys = ['page', 'limit', 'sort', 'filter', 'where', 'orderBy'];
        const keyParts: string[] = [];

        relevantKeys.forEach(key => {
          if (obj[key] !== undefined) {
            keyParts.push(`${key}=${JSON.stringify(obj[key])}`);
          }
        });

        if (keyParts.length > 0) {
          return keyParts.join('&');
        }
      }

      return null;
    } catch (error) {
      this.logger.warn('Failed to create object key:', error);
      return null;
    }
  }
}