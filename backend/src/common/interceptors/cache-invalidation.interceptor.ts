import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInvalidationInterceptor.name);

  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const invalidateOptions = this.reflector.get<{ tags?: string[]; dependencies?: string[] }>(
      'cache_invalidate',
      context.getHandler(),
    );

    const evictOptions = this.reflector.get<{
      namespace: string;
      keyGenerator?: (...args: any[]) => string;
      clearAll?: boolean;
    }>('cache_evict', context.getHandler());

    // If no cache operations are needed, proceed normally
    if (!invalidateOptions && !evictOptions) {
      return next.handle();
    }

    const args = context.getArgs();
    const methodName = context.getHandler().name;
    const className = context.getClass().name;

    return next.handle().pipe(
      tap(async (result) => {
        try {
          // Handle cache invalidation by tags and dependencies
          if (invalidateOptions) {
            if (invalidateOptions.tags && invalidateOptions.tags.length > 0) {
              await this.cacheService.invalidateByTags(invalidateOptions.tags);
              this.logger.debug(`Invalidated cache by tags: ${invalidateOptions.tags.join(', ')}`);
            }

            if (invalidateOptions.dependencies && invalidateOptions.dependencies.length > 0) {
              await this.cacheService.invalidateByDependencies(invalidateOptions.dependencies);
              this.logger.debug(`Invalidated cache by dependencies: ${invalidateOptions.dependencies.join(', ')}`);
            }
          }

          // Handle cache eviction for specific keys
          if (evictOptions) {
            if (evictOptions.clearAll) {
              await this.cacheService.clearNamespace(evictOptions.namespace);
              this.logger.debug(`Cleared all cache for namespace: ${evictOptions.namespace}`);
            } else if (evictOptions.keyGenerator) {
              try {
                const cacheKey = evictOptions.keyGenerator(...args);
                await this.cacheService.delete(evictOptions.namespace, cacheKey);
                this.logger.debug(`Evicted cache: ${evictOptions.namespace}:${cacheKey}`);
              } catch (error) {
                this.logger.warn('Failed to generate cache key for eviction:', error);
              }
            } else {
              // Generate default key for eviction
              const defaultKey = this.generateDefaultKey(methodName, className, args);
              await this.cacheService.delete(evictOptions.namespace, defaultKey);
              this.logger.debug(`Evicted cache: ${evictOptions.namespace}:${defaultKey}`);
            }
          }
        } catch (error) {
          this.logger.error('Cache invalidation/eviction failed:', error);
          // Don't throw error to avoid breaking the main operation
        }
      }),
    );
  }

  private generateDefaultKey(methodName: string, className: string, args: any[]): string {
    const baseKey = `${className}.${methodName}`;
    
    if (args.length === 0) {
      return baseKey;
    }

    const keyParts: string[] = [];
    
    args.forEach((arg) => {
      if (arg !== undefined && arg !== null) {
        if (typeof arg === 'string' || typeof arg === 'number') {
          keyParts.push(String(arg));
        } else if (typeof arg === 'object' && arg.id) {
          keyParts.push(String(arg.id));
        }
      }
    });

    return keyParts.length > 0 ? `${baseKey}:${keyParts.join(':')}` : baseKey;
  }
}