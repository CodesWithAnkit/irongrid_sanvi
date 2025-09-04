import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheService, CacheOptions } from './cache.service';
import { PrismaService } from '../../prisma/prisma.service';

interface WarmingTask {
  name: string;
  namespace: string;
  key: string;
  fetchFunction: () => Promise<any>;
  options?: CacheOptions;
  params?: Record<string, any>;
  priority: number; // 1 = highest priority
  enabled: boolean;
}

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmingService.name);
  private warmingTasks: WarmingTask[] = [];

  constructor(
    private cacheService: CacheService,
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    this.initializeWarmingTasks();
    
    // Warm critical cache on startup
    await this.warmCriticalCache();
  }

  /**
   * Initialize all cache warming tasks
   */
  private initializeWarmingTasks(): void {
    this.warmingTasks = [
      // Product categories and popular products
      {
        name: 'Product Categories',
        namespace: 'products',
        key: 'categories',
        fetchFunction: () => this.fetchProductCategories(),
        options: { ttl: 3600, tags: ['products', 'categories'] },
        priority: 1,
        enabled: true,
      },
      {
        name: 'Popular Products',
        namespace: 'products',
        key: 'popular',
        fetchFunction: () => this.fetchPopularProducts(),
        options: { ttl: 1800, tags: ['products', 'popular'] },
        priority: 1,
        enabled: true,
      },
      
      // User statistics and analytics
      {
        name: 'User Statistics',
        namespace: 'analytics',
        key: 'user_stats',
        fetchFunction: () => this.fetchUserStatistics(),
        options: { ttl: 900, tags: ['analytics', 'users'] },
        priority: 2,
        enabled: true,
      },
      
      // Order statistics
      {
        name: 'Order Statistics',
        namespace: 'analytics',
        key: 'order_stats',
        fetchFunction: () => this.fetchOrderStatistics(),
        options: { ttl: 600, tags: ['analytics', 'orders'] },
        priority: 2,
        enabled: true,
      },
      
      // Payment methods and settings
      {
        name: 'Payment Methods',
        namespace: 'payments',
        key: 'methods',
        fetchFunction: () => this.fetchPaymentMethods(),
        options: { ttl: 7200, tags: ['payments', 'methods'] },
        priority: 3,
        enabled: true,
      },
      
      // System configuration
      {
        name: 'System Configuration',
        namespace: 'system',
        key: 'config',
        fetchFunction: () => this.fetchSystemConfiguration(),
        options: { ttl: 3600, tags: ['system', 'config'] },
        priority: 1,
        enabled: true,
      },
    ];

    this.logger.log(`Initialized ${this.warmingTasks.length} cache warming tasks`);
  }

  /**
   * Warm critical cache (priority 1 tasks)
   */
  async warmCriticalCache(): Promise<void> {
    const criticalTasks = this.warmingTasks
      .filter(task => task.enabled && task.priority === 1)
      .map(task => ({
        namespace: task.namespace,
        key: task.key,
        fetchFunction: task.fetchFunction,
        options: task.options,
        params: task.params,
      }));

    await this.cacheService.warmCache(criticalTasks);
  }

  /**
   * Warm all enabled cache
   */
  async warmAllCache(): Promise<void> {
    const allTasks = this.warmingTasks
      .filter(task => task.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(task => ({
        namespace: task.namespace,
        key: task.key,
        fetchFunction: task.fetchFunction,
        options: task.options,
        params: task.params,
      }));

    await this.cacheService.warmCache(allTasks);
  }

  /**
   * Scheduled cache warming - runs every 30 minutes
   */
  @Cron('0 */30 * * * *')
  async scheduledCacheWarming(): Promise<void> {
    this.logger.log('Starting scheduled cache warming');
    await this.warmCriticalCache();
  }

  /**
   * Background refresh for expiring cache - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async backgroundRefresh(): Promise<void> {
    this.logger.debug('Starting background cache refresh');
    
    // Refresh cache that's about to expire (within 10% of TTL)
    const refreshTasks = this.warmingTasks
      .filter(task => task.enabled && task.priority <= 2)
      .map(async (task) => {
        try {
          // Check if cache exists and refresh if needed
          const cached = await this.cacheService.get(task.namespace, task.key, task.params);
          if (!cached) {
            const value = await task.fetchFunction();
            await this.cacheService.set(task.namespace, task.key, value, task.options, task.params);
            this.logger.debug(`Background refreshed: ${task.name}`);
          }
        } catch (error) {
          this.logger.error(`Background refresh failed for ${task.name}:`, error);
        }
      });

    await Promise.allSettled(refreshTasks);
  }

  /**
   * Fetch product categories
   */
  private async fetchProductCategories(): Promise<any[]> {
    return this.prismaService.product.findMany({
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
   * Fetch popular products based on order frequency
   */
  private async fetchPopularProducts(): Promise<any[]> {
    return this.prismaService.product.findMany({
      take: 20,
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
   * Fetch user statistics
   */
  private async fetchUserStatistics(): Promise<any> {
    const [totalUsers, activeUsers, newUsersToday] = await Promise.all([
      this.prismaService.user.count(),
      this.prismaService.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      this.prismaService.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)), // Today
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      timestamp: new Date(),
    };
  }

  /**
   * Fetch order statistics
   */
  private async fetchOrderStatistics(): Promise<any> {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [totalOrders, ordersToday, ordersThisMonth, totalRevenue] = await Promise.all([
      this.prismaService.order.count(),
      this.prismaService.order.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      }),
      this.prismaService.order.count({
        where: {
          createdAt: {
            gte: thisMonth,
          },
        },
      }),
      this.prismaService.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: 'COMPLETED',
        },
      }),
    ]);

    return {
      totalOrders,
      ordersToday,
      ordersThisMonth,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      timestamp: new Date(),
    };
  }

  /**
   * Fetch payment methods
   */
  private async fetchPaymentMethods(): Promise<any[]> {
    // This would typically come from a configuration table or external service
    return [
      { id: 'credit_card', name: 'Credit Card', enabled: true },
      { id: 'bank_transfer', name: 'Bank Transfer', enabled: true },
      { id: 'cash_on_delivery', name: 'Cash on Delivery', enabled: true },
    ];
  }

  /**
   * Fetch system configuration
   */
  private async fetchSystemConfiguration(): Promise<any> {
    // This would typically come from a configuration table
    return {
      maintenanceMode: false,
      maxOrderAmount: 100000,
      defaultCurrency: 'USD',
      supportedLanguages: ['en', 'es', 'fr'],
      timestamp: new Date(),
    };
  }

  /**
   * Add a new warming task
   */
  addWarmingTask(task: WarmingTask): void {
    this.warmingTasks.push(task);
    this.logger.log(`Added new warming task: ${task.name}`);
  }

  /**
   * Remove a warming task
   */
  removeWarmingTask(taskName: string): void {
    this.warmingTasks = this.warmingTasks.filter(task => task.name !== taskName);
    this.logger.log(`Removed warming task: ${taskName}`);
  }

  /**
   * Get all warming tasks
   */
  getWarmingTasks(): WarmingTask[] {
    return [...this.warmingTasks];
  }

  /**
   * Enable/disable a warming task
   */
  toggleWarmingTask(taskName: string, enabled: boolean): void {
    const task = this.warmingTasks.find(t => t.name === taskName);
    if (task) {
      task.enabled = enabled;
      this.logger.log(`${enabled ? 'Enabled' : 'Disabled'} warming task: ${taskName}`);
    }
  }
}