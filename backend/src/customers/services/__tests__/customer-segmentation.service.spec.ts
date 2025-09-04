import { Test, TestingModule } from '@nestjs/testing';
import { CustomerSegmentationService } from '../customer-segmentation.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CustomerType } from '@prisma/client';
import { CustomerSegmentationRuleDto } from '../../dto/customer-segmentation.dto';

describe('CustomerSegmentationService', () => {
  let service: CustomerSegmentationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customerSegmentationRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    customer: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    order: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    customerInteraction: {
      groupBy: jest.fn(),
    },
    segmentPricingRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerSegmentationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomerSegmentationService>(CustomerSegmentationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSegmentationRule', () => {
    const createRuleDto: CustomerSegmentationRuleDto = {
      name: 'High Value Enterprise',
      description: 'Enterprise customers with high credit limits',
      criteria: {
        type: 'BUSINESS_TYPE',
        rules: [
          { field: 'customerType', operator: 'equals', value: 'ENTERPRISE' },
          { field: 'creditLimit', operator: 'greater_than', value: 500000 },
        ],
      },
      isActive: true,
      priority: 1,
    };

    it('should create a segmentation rule successfully', async () => {
      const mockRule = {
        id: 'rule-1',
        ...createRuleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.customerSegmentationRule.create.mockResolvedValue(mockRule);

      const result = await service.createSegmentationRule(createRuleDto);

      expect(mockPrismaService.customerSegmentationRule.create).toHaveBeenCalledWith({
        data: {
          name: createRuleDto.name,
          description: createRuleDto.description,
          criteria: createRuleDto.criteria,
          isActive: true,
          priority: 1,
        },
      });
      expect(result).toEqual(mockRule);
    });
  });

  describe('segmentByBusinessType', () => {
    const mockBusinessTypeSegments = [
      {
        customerType: CustomerType.ENTERPRISE,
        _count: { customerType: 25 },
        _sum: { creditLimit: 12500000 },
      },
      {
        customerType: CustomerType.SMALL_BUSINESS,
        _count: { customerType: 150 },
        _sum: { creditLimit: 7500000 },
      },
    ];

    const mockEnterpriseCustomers = [
      {
        id: 'customer-1',
        companyName: 'Enterprise Corp',
        contactPerson: 'John CEO',
        email: 'john@enterprise.com',
        customerType: CustomerType.ENTERPRISE,
        quotations: [{ totalAmount: 500000, status: 'APPROVED' }],
        orders: [{ totalAmount: 500000, status: 'DELIVERED' }],
      },
    ];

    it('should segment customers by business type successfully', async () => {
      mockPrismaService.customer.groupBy.mockResolvedValue(mockBusinessTypeSegments);
      mockPrismaService.customer.findMany.mockResolvedValue(mockEnterpriseCustomers);
      mockPrismaService.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 500000 } });

      const result = await service.segmentByBusinessType();

      expect(result).toHaveLength(2);
      
      const enterpriseSegment = result.find(s => s.segmentId === 'business_type_enterprise');
      expect(enterpriseSegment).toBeDefined();
      expect(enterpriseSegment!.name).toBe('Enterprise');
      expect(enterpriseSegment!.customerCount).toBe(25);
      expect(enterpriseSegment!.totalValue).toBe(12500000);
      expect(enterpriseSegment!.averageValue).toBe(500000);

      const smallBusinessSegment = result.find(s => s.segmentId === 'business_type_small_business');
      expect(smallBusinessSegment).toBeDefined();
      expect(smallBusinessSegment!.name).toBe('Small Business');
      expect(smallBusinessSegment!.customerCount).toBe(150);
    });
  });

  describe('segmentByVolume', () => {
    it('should segment customers by purchase volume successfully', async () => {
      // Mock high volume customers
      const highVolumeCustomerIds = ['customer-1', 'customer-2'];
      const mockHighVolumeCustomers = [
        {
          id: 'customer-1',
          companyName: 'High Volume Corp',
          quotations: [{ totalAmount: 1000000, status: 'APPROVED' }],
          orders: [{ totalAmount: 1000000, status: 'DELIVERED' }],
        },
      ];

      mockPrismaService.order.groupBy
        .mockResolvedValueOnce([
          { customerId: 'customer-1', _sum: { totalAmount: 1000000 } },
          { customerId: 'customer-2', _sum: { totalAmount: 750000 } },
        ])
        .mockResolvedValueOnce([
          { customerId: 'customer-3', _sum: { totalAmount: 250000 } },
        ])
        .mockResolvedValueOnce([
          { customerId: 'customer-4', _sum: { totalAmount: 50000 } },
        ]);

      mockPrismaService.customer.findMany.mockResolvedValue(mockHighVolumeCustomers);
      mockPrismaService.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 1000000 } });

      const result = await service.segmentByVolume();

      expect(result).toHaveLength(3);
      
      const highVolumeSegment = result.find(s => s.segmentId === 'volume_high_volume');
      expect(highVolumeSegment).toBeDefined();
      expect(highVolumeSegment!.name).toBe('High Volume');
      expect(highVolumeSegment!.description).toContain('above ₹5L');
    });
  });

  describe('categorizeCustomer', () => {
    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      customerType: CustomerType.ENTERPRISE,
      state: 'Maharashtra',
      quotations: [{ totalAmount: 500000, status: 'APPROVED' }],
      orders: [{ totalAmount: 1000000, status: 'DELIVERED' }],
      interactions: [
        { id: 'int-1' },
        { id: 'int-2' },
        { id: 'int-3' },
        { id: 'int-4' },
        { id: 'int-5' },
        { id: 'int-6' },
      ],
    };

    it('should categorize customer correctly', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.categorizeCustomer('customer-1');

      expect(result).toContain('business_type_enterprise');
      expect(result).toContain('volume_high_volume'); // 1M > 500k
      expect(result).toContain('location_maharashtra');
      expect(result).toContain('engagement_moderately_engaged'); // 6 interactions (5-9 range)
    });

    it('should throw error when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.categorizeCustomer('non-existent')).rejects.toThrow(
        'Customer non-existent not found'
      );
    });
  });

  describe('getSegmentAnalytics', () => {
    const mockCustomers = [
      {
        id: 'customer-1',
        companyName: 'Enterprise Corp',
        customerType: CustomerType.ENTERPRISE,
        quotations: [
          { totalAmount: 500000, status: 'APPROVED', createdAt: new Date('2024-01-15') },
          { totalAmount: 300000, status: 'SENT', createdAt: new Date('2024-02-01') },
        ],
        orders: [
          { totalAmount: 500000, status: 'DELIVERED', createdAt: new Date('2024-01-20') },
        ],
      },
    ];

    it('should return segment analytics for business type segment', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrismaService.order.aggregate.mockResolvedValue({ _sum: { totalAmount: 500000 } });

      const result = await service.getSegmentAnalytics('business_type_enterprise');

      expect(result.segmentId).toBe('business_type_enterprise');
      expect(result.customerCount).toBe(1);
      expect(result.totalRevenue).toBe(500000);
      expect(result.totalQuotations).toBe(2);
      expect(result.totalOrders).toBe(1);
      expect(result.conversionRate).toBe(50); // 1 order / 2 quotations * 100
      expect(result.monthlyTrends).toHaveLength(12);
      expect(result.topCustomers).toHaveLength(1);
    });

    it('should throw error for unsupported segment type', async () => {
      await expect(service.getSegmentAnalytics('unsupported_segment_type')).rejects.toThrow(
        'Unsupported segment type: unsupported'
      );
    });
  });

  describe('createSegmentPricingRule', () => {
    const pricingRuleDto = {
      segmentId: 'business_type_enterprise',
      productId: 'product-1',
      discountPercentage: 15,
      minQuantity: 10,
      validFrom: '2024-01-01T00:00:00Z',
      validUntil: '2024-12-31T23:59:59Z',
      isActive: true,
    };

    it('should create segment pricing rule successfully', async () => {
      const mockRule = {
        id: 'rule-1',
        ...pricingRuleDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.segmentPricingRule.create.mockResolvedValue(mockRule);

      const result = await service.createSegmentPricingRule(pricingRuleDto);

      expect(mockPrismaService.segmentPricingRule.create).toHaveBeenCalledWith({
        data: {
          segmentId: pricingRuleDto.segmentId,
          productId: pricingRuleDto.productId,
          discountPercentage: pricingRuleDto.discountPercentage,
          fixedPrice: undefined,
          minQuantity: pricingRuleDto.minQuantity,
          maxQuantity: undefined,
          validFrom: new Date(pricingRuleDto.validFrom),
          validUntil: new Date(pricingRuleDto.validUntil),
          isActive: true,
        },
      });
      expect(result).toEqual(mockRule);
    });
  });

  describe('getSegmentPricingRules', () => {
    const mockPricingRules = [
      {
        id: 'rule-1',
        segmentId: 'business_type_enterprise',
        productId: 'product-1',
        discountPercentage: 15,
        isActive: true,
        validUntil: null,
        product: {
          id: 'product-1',
          name: 'Industrial Machine',
          sku: 'IM-001',
          basePrice: 100000,
        },
      },
    ];

    it('should return pricing rules for segment', async () => {
      mockPrismaService.segmentPricingRule.findMany.mockResolvedValue(mockPricingRules);

      const result = await service.getSegmentPricingRules('business_type_enterprise');

      expect(mockPrismaService.segmentPricingRule.findMany).toHaveBeenCalledWith({
        where: {
          segmentId: 'business_type_enterprise',
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gte: expect.any(Date) } },
          ],
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, basePrice: true },
          },
        },
      });
      expect(result).toEqual(mockPricingRules);
    });
  });
});