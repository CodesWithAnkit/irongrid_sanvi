import { SetMetadata } from '@nestjs/common';

export interface CacheDecoratorOptions {
  namespace?: string;
  ttl?: number; // Time to live in seconds
  tags?: string[];
  dependencies?: string[];
  keyGenerator?: (...args: any[]) => string;
}

export const CACHE_METADATA_KEY = 'cache_options';

/**
 * Cache decorator for method-level caching
 * 
 * @param options Cache configuration options
 * 
 * @example
 * ```typescript
 * @Cache({ namespace: 'products', ttl: 3600, tags: ['products'] })
 * async getProducts(): Promise<Product[]> {
 *   return this.prisma.product.findMany();
 * }
 * 
 * @Cache({ 
 *   namespace: 'user', 
 *   ttl: 1800, 
 *   keyGenerator: (userId) => `profile_${userId}` 
 * })
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   return this.prisma.user.findUnique({ where: { id: userId } });
 * }
 * ```
 */
export const Cache = (options: CacheDecoratorOptions = {}) => {
  return SetMetadata(CACHE_METADATA_KEY, {
    namespace: options.namespace || 'default',
    ttl: options.ttl || 3600,
    tags: options.tags || [],
    dependencies: options.dependencies || [],
    keyGenerator: options.keyGenerator,
  });
};

/**
 * Cache invalidation decorator for methods that should invalidate cache
 * 
 * @param tags Cache tags to invalidate
 * @param dependencies Cache dependencies to invalidate
 * 
 * @example
 * ```typescript
 * @CacheInvalidate({ tags: ['products'], dependencies: ['product_list'] })
 * async createProduct(data: CreateProductDto): Promise<Product> {
 *   return this.prisma.product.create({ data });
 * }
 * ```
 */
export const CacheInvalidate = (options: { tags?: string[]; dependencies?: string[] }) => {
  return SetMetadata('cache_invalidate', options);
};

/**
 * Cache evict decorator for clearing specific cache entries
 * 
 * @param namespace Cache namespace to clear
 * @param keyGenerator Function to generate cache key to evict
 * 
 * @example
 * ```typescript
 * @CacheEvict({ 
 *   namespace: 'user', 
 *   keyGenerator: (userId) => `profile_${userId}` 
 * })
 * async updateUserProfile(userId: string, data: UpdateUserDto): Promise<User> {
 *   return this.prisma.user.update({ where: { id: userId }, data });
 * }
 * ```
 */
export const CacheEvict = (options: { 
  namespace: string; 
  keyGenerator?: (...args: any[]) => string;
  clearAll?: boolean;
}) => {
  return SetMetadata('cache_evict', options);
};