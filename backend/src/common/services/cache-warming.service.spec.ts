import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheWarmingService } from './cache-warming.service';
import { CacheService } from './cache.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CacheWarmingService', () => {
  let service: CacheWarmingService;
  let cacheService: CacheService;
  let prismaService: PrismaService;

  const mockCacheService = {
    warmCache: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheWarmingService,
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheWarmingService>(CacheWarmingService);
    cacheService = module.get<CacheService>(CacheService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should initialize warming tasks and warm critical cache', async () => {
      mockCacheService.warmCache.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockCacheService.warmCache).toHaveBeenCalled();
    });
  });

  describe('warmCriticalCache', () => {
    it('should warm only priority 1 tasks', async () => {
      mockCacheService.warmCache.mockResolvedValue(undefined);

      await service.warmCriticalCache();

      expect(mockCacheService.warmCache).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            namespace: 'products',
            key: 'categories',
          }),
          expect.objectContaining({
            namespace: 'products',
            key: 'popular',
          }),
          expect.objectContaining({
            namespace: 'system',
            key: 'config',
          }),
        ])
      );
    });
  });

  describe('warmAllCache', () => {
    it('should warm all enabled tasks sorted by priority', async () => {
      mockCacheService.warmCache.mockResolvedValue(undefined);

      await service.warmAllCache();

      expect(mockCacheService.warmCache).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ namespace: 'products' }),
          expect.objectContaining({ namespace: 'analytics' }),
          expect.objectContaining({ namespace: 'payments' }),
          expect.objectContaining({ namespace: 'system' }),
        ])
      );
    });
  });

  describe('fetchProductCategories', () => {
    it('should fetch distinct product categories', async () => {
      const mockCategories = [
        { category: 'Electronics' },
        { category: 'Machinery' },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockCategories);

      // Access private method for testing
      const result = await (service as any).fetchProductCategories();

      expect(result).toEqual(mockCategories);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        select: { category: true },
        distinct: ['category'],
        where: { isActive: true },
      });
    });
  });

  describe('fetchPopularProducts', () => {
    it('should fetch popular products by order count', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          _count: { orderItems: 10 },
        },
        {
          id: '2',
          name: 'Product 2',
          _count: { orderItems: 8 },
        },
      ];

      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await (service as any).fetchPopularProducts();

      expect(result).toEqual(mockProducts);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
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
    });
  });

  describe('fetchUserStatistics', () => {
    it('should fetch user statistics', async () => {
      const mockStats = {
        totalUsers: 100,
        activeUsers: 80,
        newUsersToday: 5,
      };

      mockPrismaService.user.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80)  // activeUsers
        .mockResolvedValueOnce(5);  // newUsersToday

      const result = await (service as any).fetchUserStatistics();

      expect(result).toMatchObject(mockStats);
      expect(result).toHaveProperty('timestamp');
      expect(mockPrismaService.user.count).toHaveBeenCalledTimes(3);
    });
  });

  describe('fetchOrderStatistics', () => {
    it('should fetch order statistics', async () => {
      mockPrismaService.order.count
        .mockResolvedValueOnce(500) // totalOrders
        .mockResolvedValueOnce(10)  // ordersToday
        .mockResolvedValueOnce(150); // ordersThisMonth

      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 50000 },
      });

      const result = await (service as any).fetchOrderStatistics();

      expect(result).toMatchObject({
        totalOrders: 500,
        ordersToday: 10,
        ordersThisMonth: 150,
        totalRevenue: 50000,
      });
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('scheduledCacheWarming', () => {
    it('should perform scheduled cache warming', async () => {
      mockCacheService.warmCache.mockResolvedValue(undefined);

      await service.scheduledCacheWarming();

      expect(mockCacheService.warmCache).toHaveBeenCalled();
    });
  });

  describe('backgroundRefresh', () => {
    it('should refresh cache that does not exist', async () => {
      mockCacheService.get.mockResolvedValue(null);
      mockCacheService.set.mockResolvedValue(undefined);
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.backgroundRefresh();

      // Should attempt to get cache for priority 1 and 2 tasks
      expect(mockCacheService.get).toHaveBeenCalled();
    });

    it('should skip refresh if cache exists', async () => {
      mockCacheService.get.mockResolvedValue({ data: 'cached' });

      await service.backgroundRefresh();

      expect(mockCacheService.set).not.toHaveBeenCalled();
    });
  });

  describe('task management', () => {
    it('should add new warming task', () => {
      const newTask = {
        name: 'Test Task',
        namespace: 'test',
        key: 'test_key',
        fetchFunction: jest.fn(),
        priority: 1,
        enabled: true,
      };

      service.addWarmingTask(newTask);

      const tasks = service.getWarmingTasks();
      expect(tasks).toContainEqual(newTask);
    });

    it('should remove warming task', () => {
      const initialTasksCount = service.getWarmingTasks().length;

      service.removeWarmingTask('Product Categories');

      const tasks = service.getWarmingTasks();
      expect(tasks.length).toBe(initialTasksCount - 1);
      expect(tasks.find(t => t.name === 'Product Categories')).toBeUndefined();
    });

    it('should toggle warming task', () => {
      service.toggleWarmingTask('Product Categories', false);

      const tasks = service.getWarmingTasks();
      const task = tasks.find(t => t.name === 'Product Categories');
      expect(task?.enabled).toBe(false);

      service.toggleWarmingTask('Product Categories', true);

      const updatedTasks = service.getWarmingTasks();
      const updatedTask = updatedTasks.find(t => t.name === 'Product Categories');
      expect(updatedTask?.enabled).toBe(true);
    });

    it('should return all warming tasks', () => {
      const tasks = service.getWarmingTasks();

      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0]).toHaveProperty('name');
      expect(tasks[0]).toHaveProperty('namespace');
      expect(tasks[0]).toHaveProperty('priority');
    });
  });

  describe('error handling', () => {
    it('should handle fetch function errors gracefully', async () => {
      mockPrismaService.product.findMany.mockRejectedValue(new Error('Database error'));
      mockCacheService.warmCache.mockResolvedValue(undefined);

      await expect(service.warmCriticalCache()).resolves.not.toThrow();
    });

    it('should handle background refresh errors gracefully', async () => {
      mockCacheService.get.mockRejectedValue(new Error('Cache error'));

      await expect(service.backgroundRefresh()).resolves.not.toThrow();
    });
  });
});