import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { createClient } from 'redis';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('CacheService', () => {
  let service: CacheService;
  let mockRedisClient: any;
  let configService: ConfigService;

  beforeEach(async () => {
    mockRedisClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      get: jest.fn(),
      set: jest.fn(),
      setEx: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      sAdd: jest.fn(),
      sMembers: jest.fn(),
      sRem: jest.fn(),
      info: jest.fn(),
      on: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('redis://localhost:6379'),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);

    await service.onModuleInit();
  });

  afterEach(async () => {
    await service.onModuleDestroy();
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return cached value when exists', async () => {
      const testValue = { id: 1, name: 'test' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(testValue));

      const result = await service.get('test', 'key1');

      expect(result).toEqual(testValue);
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key1');
    });

    it('should return null when cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('test', 'key1');

      expect(result).toBeNull();
      expect(mockRedisClient.get).toHaveBeenCalledWith('test:key1');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('test', 'key1');

      expect(result).toBeNull();
    });

    it('should generate complex cache key with parameters', async () => {
      const params = { userId: '123', page: 1 };
      mockRedisClient.get.mockResolvedValue(null);

      await service.get('test', 'key1', params);

      const expectedKey = 'test:key1:' + Buffer.from('page=1&userId="123"').toString('base64');
      expect(mockRedisClient.get).toHaveBeenCalledWith(expectedKey);
    });
  });

  describe('set', () => {
    it('should set cache with TTL', async () => {
      const testValue = { id: 1, name: 'test' };
      mockRedisClient.setEx.mockResolvedValue('OK');

      await service.set('test', 'key1', testValue, { ttl: 3600 });

      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:key1',
        3600,
        JSON.stringify(testValue)
      );
    });

    it('should set cache without TTL', async () => {
      const testValue = { id: 1, name: 'test' };
      mockRedisClient.set.mockResolvedValue('OK');

      await service.set('test', 'key1', testValue, { ttl: 0 });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test:key1',
        JSON.stringify(testValue)
      );
    });

    it('should store cache tags', async () => {
      const testValue = { id: 1, name: 'test' };
      const tags = ['products', 'category1'];
      mockRedisClient.setEx.mockResolvedValue('OK');
      mockRedisClient.sAdd.mockResolvedValue(1);

      await service.set('test', 'key1', testValue, { ttl: 3600, tags });

      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('tag:products', 'test:key1');
      expect(mockRedisClient.sAdd).toHaveBeenCalledWith('tag:category1', 'test:key1');
    });

    it('should handle Redis errors gracefully', async () => {
      const testValue = { id: 1, name: 'test' };
      mockRedisClient.setEx.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('test', 'key1', testValue)).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete cache entry', async () => {
      mockRedisClient.del.mockResolvedValue(1);
      mockRedisClient.keys.mockResolvedValue(['tag:products']);
      mockRedisClient.sRem.mockResolvedValue(1);

      await service.delete('test', 'key1');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test:key1');
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Redis error'));

      await expect(service.delete('test', 'key1')).resolves.not.toThrow();
    });
  });

  describe('invalidateByTags', () => {
    it('should invalidate cache entries by tags', async () => {
      const tags = ['products', 'category1'];
      const cacheKeys = ['test:key1', 'test:key2'];
      
      mockRedisClient.sMembers.mockResolvedValue(cacheKeys);
      mockRedisClient.del.mockResolvedValue(2);

      await service.invalidateByTags(tags);

      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('tag:products');
      expect(mockRedisClient.sMembers).toHaveBeenCalledWith('tag:category1');
      expect(mockRedisClient.del).toHaveBeenCalledWith(...cacheKeys);
    });

    it('should handle empty tag sets', async () => {
      mockRedisClient.sMembers.mockResolvedValue([]);

      await service.invalidateByTags(['empty-tag']);

      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const cachedValue = { id: 1, name: 'cached' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedValue));

      const fetchFunction = jest.fn().mockResolvedValue({ id: 1, name: 'fresh' });
      const result = await service.getOrSet('test', 'key1', fetchFunction);

      expect(result).toEqual(cachedValue);
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('should fetch and cache value if not exists', async () => {
      const freshValue = { id: 1, name: 'fresh' };
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.setEx.mockResolvedValue('OK');

      const fetchFunction = jest.fn().mockResolvedValue(freshValue);
      const result = await service.getOrSet('test', 'key1', fetchFunction, { ttl: 3600 });

      expect(result).toEqual(freshValue);
      expect(fetchFunction).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledWith(
        'test:key1',
        3600,
        JSON.stringify(freshValue)
      );
    });
  });

  describe('warmCache', () => {
    it('should warm cache with multiple tasks', async () => {
      const tasks = [
        {
          namespace: 'test1',
          key: 'key1',
          fetchFunction: jest.fn().mockResolvedValue({ data: 'value1' }),
          options: { ttl: 3600 },
        },
        {
          namespace: 'test2',
          key: 'key2',
          fetchFunction: jest.fn().mockResolvedValue({ data: 'value2' }),
          options: { ttl: 1800 },
        },
      ];

      mockRedisClient.setEx.mockResolvedValue('OK');

      await service.warmCache(tasks);

      expect(tasks[0].fetchFunction).toHaveBeenCalled();
      expect(tasks[1].fetchFunction).toHaveBeenCalled();
      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(2);
    });

    it('should handle warming task failures gracefully', async () => {
      const tasks = [
        {
          namespace: 'test1',
          key: 'key1',
          fetchFunction: jest.fn().mockRejectedValue(new Error('Fetch error')),
          options: { ttl: 3600 },
        },
        {
          namespace: 'test2',
          key: 'key2',
          fetchFunction: jest.fn().mockResolvedValue({ data: 'value2' }),
          options: { ttl: 1800 },
        },
      ];

      mockRedisClient.setEx.mockResolvedValue('OK');

      await expect(service.warmCache(tasks)).resolves.not.toThrow();
      expect(mockRedisClient.setEx).toHaveBeenCalledTimes(1);
    });
  });

  describe('metrics', () => {
    it('should track cache hits and misses', async () => {
      // Cache miss
      mockRedisClient.get.mockResolvedValueOnce(null);
      await service.get('test', 'key1');

      // Cache hit
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify({ data: 'test' }));
      await service.get('test', 'key1');

      const metrics = service.getMetrics();

      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(1);
      expect(metrics.totalOperations).toBe(2);
      expect(metrics.hitRate).toBe(50);
    });

    it('should reset metrics', () => {
      service.resetMetrics();
      const metrics = service.getMetrics();

      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.totalOperations).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache information', async () => {
      const mockMemoryInfo = 'used_memory:1024\nmaxmemory:2048';
      const mockKeyspaceInfo = 'db0:keys=100,expires=50';
      
      mockRedisClient.info.mockImplementation((section) => {
        if (section === 'memory') return mockMemoryInfo;
        if (section === 'keyspace') return mockKeyspaceInfo;
        return '';
      });

      const info = await service.getCacheInfo();

      expect(info).toHaveProperty('memory');
      expect(info).toHaveProperty('keyspace');
      expect(info).toHaveProperty('metrics');
    });

    it('should handle Redis info errors gracefully', async () => {
      mockRedisClient.info.mockRejectedValue(new Error('Redis error'));

      const info = await service.getCacheInfo();

      expect(info).toBeNull();
    });
  });
});