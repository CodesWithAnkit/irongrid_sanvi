# Caching Implementation Guide

This document describes the comprehensive caching system implemented for the Sanvi Machinery backend application.

## Overview

The caching system provides:
- **Redis-based caching** with intelligent key management
- **Event-driven cache invalidation** with dependency tracking
- **Cache warming** for critical data with background refresh
- **Performance monitoring** with metrics and alerting
- **Query optimization** analysis and recommendations

## Architecture

### Core Services

1. **CacheService** - Main caching interface with Redis backend
2. **CacheWarmingService** - Automated cache warming and background refresh
3. **CacheMonitoringService** - Performance monitoring and alerting
4. **QueryOptimizationService** - Database query analysis and optimization

### Decorators

- `@Cache()` - Method-level caching with configurable options
- `@CacheInvalidate()` - Automatic cache invalidation by tags/dependencies
- `@CacheEvict()` - Specific cache entry eviction

### Interceptors

- **CacheInterceptor** - Handles cache get/set operations
- **CacheInvalidationInterceptor** - Manages cache invalidation after method execution

## Usage Examples

### Basic Caching

```typescript
@Cache({ namespace: 'products', ttl: 3600, tags: ['products'] })
async getProducts(): Promise<Product[]> {
  return this.prisma.product.findMany();
}
```

### Cache with Custom Key Generation

```typescript
@Cache({ 
  namespace: 'products', 
  ttl: 1800,
  keyGenerator: (userId, page) => `user_${userId}_page_${page}`
})
async getUserProducts(userId: string, page: number): Promise<Product[]> {
  return this.prisma.product.findMany({
    where: { userId },
    skip: (page - 1) * 10,
    take: 10,
  });
}
```

### Cache Invalidation

```typescript
@CacheInvalidate({ tags: ['products'], dependencies: ['product_list'] })
async createProduct(data: CreateProductDto): Promise<Product> {
  return this.prisma.product.create({ data });
}
```

### Cache Eviction

```typescript
@CacheEvict({ 
  namespace: 'products', 
  keyGenerator: (id) => `detail_${id}` 
})
async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
  return this.prisma.product.update({ where: { id }, data });
}
```

## Configuration

### Environment Variables

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Cache Configuration
CACHE_TTL_DEFAULT=3600
CACHE_TTL_SHORT=300
CACHE_TTL_LONG=7200
ENABLE_CACHE_WARMING=true
CACHE_WARMING_INTERVAL=1800000
```

### Cache Options

```typescript
interface CacheOptions {
  ttl?: number;           // Time to live in seconds
  tags?: string[];        // Cache tags for invalidation
  dependencies?: string[]; // Cache dependencies
}
```

## Cache Warming

The system automatically warms critical cache data:

### Predefined Warming Tasks

1. **Product Categories** (Priority 1) - TTL: 3600s
2. **Popular Products** (Priority 1) - TTL: 1800s
3. **User Statistics** (Priority 2) - TTL: 900s
4. **Order Statistics** (Priority 2) - TTL: 600s
5. **Payment Methods** (Priority 3) - TTL: 7200s
6. **System Configuration** (Priority 1) - TTL: 3600s

### Scheduling

- **Critical cache warming**: Every 30 minutes
- **Background refresh**: Every 5 minutes
- **Full cache warming**: On application startup

### Custom Warming Tasks

```typescript
cacheWarmingService.addWarmingTask({
  name: 'Custom Data',
  namespace: 'custom',
  key: 'data',
  fetchFunction: () => this.fetchCustomData(),
  options: { ttl: 3600, tags: ['custom'] },
  priority: 2,
  enabled: true,
});
```

## Monitoring and Metrics

### Available Metrics

- **Hit Rate**: Percentage of cache hits vs total operations
- **Response Time**: Average cache operation response time
- **Total Operations**: Number of cache operations performed
- **Memory Usage**: Redis memory utilization

### Alerts

The system generates alerts for:
- Low hit rate (< 70% warning, < 50% error)
- High response time (> 100ms warning, > 500ms error)
- High memory usage (> 80% warning, > 95% error)

### Monitoring Endpoints

```
GET /admin/cache/info           - Cache information and statistics
GET /admin/cache/metrics        - Performance metrics
GET /admin/cache/monitoring/report - Comprehensive monitoring report
GET /admin/cache/monitoring/alerts - Recent alerts
GET /admin/cache/health         - Health status check
```

## Query Optimization

### Features

- **Slow query detection** and analysis
- **Index recommendations** based on query patterns
- **Query pattern analysis** for optimization opportunities
- **Automated performance monitoring**

### Optimization Report

```typescript
interface QueryOptimizationReport {
  timestamp: Date;
  slowQueries: SlowQuery[];
  indexRecommendations: IndexRecommendation[];
  queryPatterns: QueryPattern[];
  optimizationSuggestions: string[];
}
```

### Endpoints

```
GET /admin/cache/query-optimization/report     - Optimization analysis
GET /admin/cache/query-optimization/statistics - Query statistics
POST /admin/cache/query-optimization/clear-log - Clear query log
```

## Administration

### Cache Management Endpoints

```
POST /admin/cache/warm                    - Warm cache manually
DELETE /admin/cache/clear/:namespace      - Clear namespace
DELETE /admin/cache/invalidate/tags       - Invalidate by tags
DELETE /admin/cache/invalidate/dependencies - Invalidate by dependencies
POST /admin/cache/metrics/reset          - Reset metrics
```

### Manual Cache Operations

```
POST /admin/cache/set                     - Set cache entry
GET /admin/cache/get/:namespace/:key      - Get cache entry
DELETE /admin/cache/delete/:namespace/:key - Delete cache entry
```

## Best Practices

### 1. Cache Key Design

- Use descriptive namespaces (`products`, `users`, `orders`)
- Include relevant parameters in key generation
- Keep keys consistent and predictable

### 2. TTL Strategy

- **Short TTL (5-15 minutes)**: Frequently changing data
- **Medium TTL (30-60 minutes)**: Semi-static data
- **Long TTL (2-24 hours)**: Static configuration data

### 3. Cache Invalidation

- Use tags for related data invalidation
- Use dependencies for hierarchical invalidation
- Prefer specific eviction over broad invalidation

### 4. Performance Optimization

- Monitor hit rates and adjust TTL accordingly
- Use cache warming for critical data
- Implement proper error handling for cache failures

### 5. Memory Management

- Set appropriate Redis memory limits
- Monitor memory usage and implement eviction policies
- Use compression for large cached values

## Troubleshooting

### Common Issues

1. **Low Hit Rate**
   - Check TTL settings
   - Verify cache key consistency
   - Review invalidation patterns

2. **High Memory Usage**
   - Implement cache eviction policies
   - Reduce TTL for less critical data
   - Use data compression

3. **Slow Cache Operations**
   - Check Redis server performance
   - Optimize network connectivity
   - Consider Redis clustering

### Debugging

Enable debug logging:
```typescript
// In your service
private readonly logger = new Logger(YourService.name);
```

Check cache metrics:
```bash
curl http://localhost:3001/admin/cache/metrics
```

Monitor Redis directly:
```bash
redis-cli info memory
redis-cli info stats
```

## Testing

### Unit Tests

The caching system includes comprehensive unit tests:

- `cache.service.spec.ts` - Core caching functionality
- `cache-warming.service.spec.ts` - Cache warming logic
- Integration tests for decorators and interceptors

### Performance Testing

Use the provided endpoints to:
- Monitor cache performance under load
- Test cache warming effectiveness
- Validate invalidation strategies

## Migration Guide

### From No Caching

1. Add cache decorators to existing methods
2. Configure Redis connection
3. Set up cache warming for critical data
4. Monitor performance and adjust TTL

### Cache Strategy Migration

1. Identify current caching patterns
2. Map to new decorator-based approach
3. Implement gradual migration
4. Monitor and optimize performance

## Security Considerations

- Secure Redis connection with authentication
- Implement proper access controls for admin endpoints
- Sanitize cache keys to prevent injection
- Monitor for cache-based attacks

## Performance Benchmarks

Expected performance improvements:
- **Database load reduction**: 60-80% for cached queries
- **Response time improvement**: 50-90% for cached endpoints
- **Memory efficiency**: Intelligent eviction and compression

## Future Enhancements

- **Distributed caching** with Redis Cluster
- **Cache compression** for large objects
- **Advanced analytics** and machine learning optimization
- **Multi-level caching** with in-memory L1 cache