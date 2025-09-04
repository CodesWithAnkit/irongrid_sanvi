import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cache, CacheInvalidate, CacheEvict } from '../common/decorators/cache.decorator';

@Injectable()
export class ProductsServiceExample {
  constructor(private prisma: PrismaService) {}

  /**
   * Example: Cache product list with tags for invalidation
   */
  @Cache({ 
    namespace: 'products', 
    ttl: 3600, 
    tags: ['products', 'product_list'],
    keyGenerator: (page, limit, category) => `list_${page}_${limit}_${category || 'all'}`
  })
  async getProducts(page: number = 1, limit: number = 10, category?: string) {
    const where = category ? { category, isActive: true } : { isActive: true };
    
    return this.prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Example: Cache individual product with dependencies
   */
  @Cache({ 
    namespace: 'products', 
    ttl: 1800, 
    tags: ['products'],
    dependencies: ['product_details'],
    keyGenerator: (id) => `detail_${id}`
  })
  async getProductById(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        orderItems: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Example: Cache popular products
   */
  @Cache({ 
    namespace: 'products', 
    ttl: 900, 
    tags: ['products', 'popular'],
    keyGenerator: (limit) => `popular_${limit}`
  })
  async getPopularProducts(limit: number = 10) {
    return this.prisma.product.findMany({
      take: limit,
      orderBy: {
        orderItems: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Example: Cache product categories
   */
  @Cache({ 
    namespace: 'products', 
    ttl: 7200, 
    tags: ['products', 'categories']
  })
  async getProductCategories() {
    return this.prisma.product.findMany({
      select: {
        category: true,
      },
      distinct: ['category'],
      where: {
        isActive: true,
      },
    });
  }

  /**
   * Example: Invalidate cache when creating product
   */
  @CacheInvalidate({ 
    tags: ['products', 'product_list', 'categories'],
    dependencies: ['product_details']
  })
  async createProduct(data: any) {
    return this.prisma.product.create({
      data,
    });
  }

  /**
   * Example: Evict specific product cache when updating
   */
  @CacheEvict({ 
    namespace: 'products', 
    keyGenerator: (id) => `detail_${id}`
  })
  @CacheInvalidate({ 
    tags: ['products', 'product_list', 'popular']
  })
  async updateProduct(id: string, data: any) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Example: Clear all product cache when performing bulk operations
   */
  @CacheEvict({ 
    namespace: 'products', 
    clearAll: true
  })
  async bulkUpdateProducts(updates: Array<{ id: string; data: any }>) {
    const promises = updates.map(update =>
      this.prisma.product.update({
        where: { id: update.id },
        data: update.data,
      })
    );

    return Promise.all(promises);
  }

  /**
   * Example: Cache search results with complex key generation
   */
  @Cache({ 
    namespace: 'products', 
    ttl: 600, 
    tags: ['products', 'search'],
    keyGenerator: (query, filters) => {
      const filterKey = filters ? Object.keys(filters)
        .sort()
        .map(k => `${k}=${filters[k]}`)
        .join('&') : 'no_filters';
      return `search_${query}_${filterKey}`;
    }
  })
  async searchProducts(query: string, filters?: Record<string, any>) {
    const where: any = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (filters) {
      Object.assign(where, filters);
    }

    return this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Example: Cache aggregated data
   */
  @Cache({ 
    namespace: 'products', 
    ttl: 1800, 
    tags: ['products', 'stats']
  })
  async getProductStatistics() {
    const [totalProducts, activeProducts, totalCategories] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.groupBy({
        by: ['category'],
        _count: true,
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      totalCategories: totalCategories.length,
      categoriesBreakdown: totalCategories,
    };
  }
}