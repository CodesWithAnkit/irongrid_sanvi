import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeType } from './dto/analytics.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    quotation: {
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    customer: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      aggregate: jest.fn(),
    },
    quotationItem: {
      groupBy: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getBusinessMetrics', () => {
    it('should return business metrics for last 30 days', async () => {
      // Mock data
      mockPrismaService.quotation.count.mockResolvedValue(100);
      mockPrismaService.quotation.groupBy.mockResolvedValue([
        { status: 'DRAFT', _count: { id: 30 } },
        { status: 'SENT', _count: { id: 40 } },
        { status: 'APPROVED', _count: { id: 25 } },
        { status: 'REJECTED', _count: { id: 5 } },
      ]);
      mockPrismaService.quotation.aggregate.mockResolvedValue({
        _avg: { totalAmount: 50000 },
        _sum: { totalAmount: 5000000 },
      });
      mockPrismaService.customer.count
        .mockResolvedValueOnce(500) // total customers
        .mockResolvedValueOnce(50) // new customers
        .mockResolvedValueOnce(200); // active customers
      mockPrismaService.customer.findMany.mockResolvedValue([
        {
          id: '1',
          companyName: 'Test Company',
          quotations: [{ totalAmount: 100000 }],
        },
      ]);

      const result = await service.getBusinessMetrics({
        dateRange: DateRangeType.LAST_30_DAYS,
      });

      expect(result).toBeDefined();
      expect(result.quotationMetrics.totalQuotations).toBe(100);
      expect(result.quotationMetrics.conversionRate).toBe(25);
      expect(result.quotationMetrics.averageValue).toBe(50000);
      expect(result.customerMetrics.totalCustomers).toBe(500);
      expect(result.customerMetrics.newCustomers).toBe(50);
      expect(result.customerMetrics.activeCustomers).toBe(200);
    });

    it('should handle custom date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      mockPrismaService.quotation.count.mockResolvedValue(50);
      mockPrismaService.quotation.groupBy.mockResolvedValue([]);
      mockPrismaService.quotation.aggregate.mockResolvedValue({
        _avg: { totalAmount: 25000 },
        _sum: { totalAmount: 1250000 },
      });
      mockPrismaService.customer.count
        .mockResolvedValueOnce(300)
        .mockResolvedValueOnce(25)
        .mockResolvedValueOnce(100);
      mockPrismaService.customer.findMany.mockResolvedValue([]);

      const result = await service.getBusinessMetrics({
        dateRange: DateRangeType.CUSTOM,
        startDate,
        endDate,
      });

      expect(result).toBeDefined();
      expect(result.quotationMetrics.totalQuotations).toBe(50);
      expect(result.quotationMetrics.averageValue).toBe(25000);
    });
  });

  describe('getSalesPerformance', () => {
    it('should return sales performance metrics', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 1000000 } }) // current period
        .mockResolvedValueOnce({ _sum: { totalAmount: 800000 } }); // previous period
      mockPrismaService.quotation.count.mockResolvedValue(40);

      const result = await service.getSalesPerformance({
        dateRange: DateRangeType.LAST_30_DAYS,
      });

      expect(result).toBeDefined();
      expect(result.totalSales).toBe(1000000);
      expect(result.salesGrowth).toBe(25); // (1000000 - 800000) / 800000 * 100
      expect(result.averageDealSize).toBe(25000); // 1000000 / 40
    });

    it('should handle zero previous sales', async () => {
      mockPrismaService.order.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 500000 } })
        .mockResolvedValueOnce({ _sum: { totalAmount: null } });
      mockPrismaService.quotation.count.mockResolvedValue(20);

      const result = await service.getSalesPerformance({
        dateRange: DateRangeType.LAST_7_DAYS,
      });

      expect(result.salesGrowth).toBe(0);
      expect(result.averageDealSize).toBe(25000);
    });
  });

  describe('getCustomerLifetimeValue', () => {
    it('should calculate customer lifetime value metrics', async () => {
      const mockCustomers = [
        {
          id: '1',
          companyName: 'Customer A',
          quotations: [],
          orders: [
            { totalAmount: 50000, createdAt: new Date('2024-01-15') },
            { totalAmount: 30000, createdAt: new Date('2024-02-10') },
          ],
        },
        {
          id: '2',
          companyName: 'Customer B',
          quotations: [],
          orders: [
            { totalAmount: 100000, createdAt: new Date('2024-01-20') },
          ],
        },
      ];

      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.getCustomerLifetimeValue({
        dateRange: DateRangeType.LAST_90_DAYS,
      });

      expect(result).toBeDefined();
      expect(result.averageClv).toBe(90000); // (80000 + 100000) / 2
      expect(result.topValueCustomers).toHaveLength(2);
      expect(result.topValueCustomers[0].customerName).toBe('Customer B');
      expect(result.topValueCustomers[0].clv).toBe(100000);
    });
  });

  describe('getProductPerformance', () => {
    it('should return product performance metrics', async () => {
      const mockProductStats = [
        {
          productId: 'prod1',
          _sum: { lineTotal: 200000, quantity: 10 },
          _count: { quotationId: 5 },
        },
        {
          productId: 'prod2',
          _sum: { lineTotal: 150000, quantity: 8 },
          _count: { quotationId: 3 },
        },
      ];

      const mockProducts = [
        { id: 'prod1', name: 'Product A' },
        { id: 'prod2', name: 'Product B' },
      ];

      mockPrismaService.quotationItem.groupBy.mockResolvedValue(mockProductStats);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const result = await service.getProductPerformance({
        dateRange: DateRangeType.LAST_30_DAYS,
      });

      expect(result).toBeDefined();
      expect(result.totalProducts).toBe(2);
      expect(result.topPerformingProducts).toHaveLength(2);
      expect(result.topPerformingProducts[0].productName).toBe('Product A');
      expect(result.topPerformingProducts[0].revenue).toBe(200000);
    });
  });

  describe('getRevenueForecasting', () => {
    it('should return revenue forecasting data', async () => {
      mockPrismaService.quotation.aggregate
        .mockResolvedValueOnce({ _sum: { totalAmount: 1000000 } }) // current period
        .mockResolvedValueOnce({ _sum: { totalAmount: 900000 } }); // previous period

      const result = await service.getRevenueForecasting({
        dateRange: DateRangeType.LAST_90_DAYS,
      });

      expect(result).toBeDefined();
      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.optimistic).toBeGreaterThan(result.scenarios.realistic);
      expect(result.scenarios.pessimistic).toBeLessThan(result.scenarios.realistic);
      expect(result.trendAnalysis).toBeDefined();
    });
  });

  describe('date range handling', () => {
    it('should handle different date range types', () => {
      const testCases = [
        DateRangeType.LAST_7_DAYS,
        DateRangeType.LAST_30_DAYS,
        DateRangeType.LAST_90_DAYS,
        DateRangeType.LAST_YEAR,
      ];

      testCases.forEach(async (dateRange) => {
        mockPrismaService.quotation.count.mockResolvedValue(10);
        mockPrismaService.quotation.groupBy.mockResolvedValue([]);
        mockPrismaService.quotation.aggregate.mockResolvedValue({
          _avg: { totalAmount: 10000 },
          _sum: { totalAmount: 100000 },
        });
        mockPrismaService.customer.count
          .mockResolvedValue(50)
          .mockResolvedValue(5)
          .mockResolvedValue(20);
        mockPrismaService.customer.findMany.mockResolvedValue([]);

        const result = await service.getBusinessMetrics({ dateRange });
        expect(result).toBeDefined();
      });
    });
  });
});