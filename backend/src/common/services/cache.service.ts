import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  dependencies?: string[]; // Cache dependencies
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  averageResponseTime: number;
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalOperations: 0,
    averageResponseTime: 0,
  };
  private responseTimes: number[] = [];

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('redis.url');
    
    this.client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  /**
   * Generate intelligent cache key with namespace and parameters
   */
  private generateCacheKey(namespace: string, key: string, params?: Record<string, any>): string {
    const baseKey = `${namespace}:${key}`;
    if (params) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(k => `${k}=${JSON.stringify(params[k])}`)
        .join('&');
      return `${baseKey}:${Buffer.from(sortedParams).toString('base64')}`;
    }
    return baseKey;
  }

  /**
   * Get value from cache with metrics tracking
   */
  async get<T>(namespace: string, key: string, params?: Record<string, any>): Promise<T | null> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(namespace, key, params);

    try {
      const value = await this.client.get(cacheKey);
      const responseTime = Date.now() - startTime;
      
      this.updateMetrics(value !== null, responseTime);

      if (value) {
        this.logger.debug(`Cache HIT for key: ${cacheKey}`);
        return JSON.parse(value);
      }

      this.logger.debug(`Cache MISS for key: ${cacheKey}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL and tags
   */
  async set<T>(
    namespace: string,
    key: string,
    value: T,
    options: CacheOptions = {},
    params?: Record<string, any>
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(namespace, key, params);
    const { ttl = 3600, tags = [], dependencies = [] } = options;

    try {
      const serializedValue = JSON.stringify(value);
      
      // Set the main cache entry
      if (ttl > 0) {
        await this.client.setEx(cacheKey, ttl, serializedValue);
      } else {
        await this.client.set(cacheKey, serializedValue);
      }

      // Store cache tags for invalidation
      if (tags.length > 0) {
        await this.storeCacheTags(cacheKey, tags);
      }

      // Store cache dependencies
      if (dependencies.length > 0) {
        await this.storeCacheDependencies(cacheKey, dependencies);
      }

      this.logger.debug(`Cache SET for key: ${cacheKey}, TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Delete specific cache entry
   */
  async delete(namespace: string, key: string, params?: Record<string, any>): Promise<void> {
    const cacheKey = this.generateCacheKey(namespace, key, params);

    try {
      await this.client.del(cacheKey);
      await this.cleanupCacheMetadata(cacheKey);
      this.logger.debug(`Cache DELETE for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const cacheKeys = await this.client.sMembers(tagKey);
        
        if (cacheKeys.length > 0) {
          await this.client.del(...cacheKeys);
          await this.client.del(tagKey);
          this.logger.debug(`Invalidated ${cacheKeys.length} cache entries for tag: ${tag}`);
        }
      }
    } catch (error) {
      this.logger.error(`Cache invalidation by tags error:`, error);
    }
  }

  /**
   * Invalidate cache by dependencies
   */
  async invalidateByDependencies(dependencies: string[]): Promise<void> {
    try {
      for (const dependency of dependencies) {
        const depKey = `dep:${dependency}`;
        const cacheKeys = await this.client.sMembers(depKey);
        
        if (cacheKeys.length > 0) {
          await this.client.del(...cacheKeys);
          await this.client.del(depKey);
          this.logger.debug(`Invalidated ${cacheKeys.length} cache entries for dependency: ${dependency}`);
        }
      }
    } catch (error) {
      this.logger.error(`Cache invalidation by dependencies error:`, error);
    }
  }

  /**
   * Clear all cache entries for a namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    try {
      const pattern = `${namespace}:*`;
      const keys = await this.client.keys(pattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(`Cleared ${keys.length} cache entries for namespace: ${namespace}`);
      }
    } catch (error) {
      this.logger.error(`Cache namespace clear error:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    namespace: string,
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {},
    params?: Record<string, any>
  ): Promise<T> {
    const cached = await this.get<T>(namespace, key, params);
    
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFunction();
    await this.set(namespace, key, value, options, params);
    return value;
  }

  /**
   * Warm cache with critical data
   */
  async warmCache(warmingTasks: Array<{
    namespace: string;
    key: string;
    fetchFunction: () => Promise<any>;
    options?: CacheOptions;
    params?: Record<string, any>;
  }>): Promise<void> {
    this.logger.log(`Starting cache warming with ${warmingTasks.length} tasks`);

    const promises = warmingTasks.map(async (task) => {
      try {
        const value = await task.fetchFunction();
        await this.set(task.namespace, task.key, value, task.options, task.params);
        this.logger.debug(`Cache warmed: ${task.namespace}:${task.key}`);
      } catch (error) {
        this.logger.error(`Cache warming failed for ${task.namespace}:${task.key}:`, error);
      }
    });

    await Promise.allSettled(promises);
    this.logger.log('Cache warming completed');
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset cache metrics
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalOperations: 0,
      averageResponseTime: 0,
    };
    this.responseTimes = [];
  }

  /**
   * Get cache info and statistics
   */
  async getCacheInfo(): Promise<any> {
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        metrics: this.getMetrics(),
      };
    } catch (error) {
      this.logger.error('Error getting cache info:', error);
      return null;
    }
  }

  private async storeCacheTags(cacheKey: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tag:${tag}`;
      await this.client.sAdd(tagKey, cacheKey);
    }
  }

  private async storeCacheDependencies(cacheKey: string, dependencies: string[]): Promise<void> {
    for (const dependency of dependencies) {
      const depKey = `dep:${dependency}`;
      await this.client.sAdd(depKey, cacheKey);
    }
  }

  private async cleanupCacheMetadata(cacheKey: string): Promise<void> {
    // Clean up tag references
    const tagKeys = await this.client.keys('tag:*');
    for (const tagKey of tagKeys) {
      await this.client.sRem(tagKey, cacheKey);
    }

    // Clean up dependency references
    const depKeys = await this.client.keys('dep:*');
    for (const depKey of depKeys) {
      await this.client.sRem(depKey, cacheKey);
    }
  }

  private updateMetrics(isHit: boolean, responseTime: number): void {
    this.metrics.totalOperations++;
    
    if (isHit) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }

    this.metrics.hitRate = (this.metrics.hits / this.metrics.totalOperations) * 100;

    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }

    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }
}