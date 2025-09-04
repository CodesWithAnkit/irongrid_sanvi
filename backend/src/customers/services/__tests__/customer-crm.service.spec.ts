import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerCrmService } from '../customer-crm.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInteractionDto, InteractionType, InteractionPriority, InteractionStatus } from '../../dto/customer-crm.dto';

describe('CustomerCrmService', () => {
  let service: CustomerCrmService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    customerInteraction: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    followUpTask: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    quotation: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    customerEngagementScore: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    creditLimitHistory: {
      create: jest.fn(),
    },
    customerLifetimeValue: {
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerCrmService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomerCrmService>(CustomerCrmService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInteraction', () => {
    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      email: 'john@test.com',
    };

    const mockUser = {
      id: 'user-1',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@company.com',
    };

    const createInteractionDto: CreateInteractionDto = {
      customerId: 'customer-1',
      type: InteractionType.EMAIL,
      subject: 'Test interaction',
      description: 'Test description',
      priority: InteractionPriority.MEDIUM,
      status: InteractionStatus.PENDING,
    };

    it('should create an interaction successfully', async () => {
      const mockInteraction = {
        id: 'interaction-1',
        ...createInteractionDto,
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        customer: mockCustomer,
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customerInteraction.create.mockResolvedValue(mockInteraction);

      const result = await service.createInteraction(createInteractionDto, 'user-1');

      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
      });
      expect(mockPrismaService.customerInteraction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          customerId: 'customer-1',
          userId: 'user-1',
          type: InteractionType.EMAIL,
          subject: 'Test interaction',
          description: 'Test description',
          priority: InteractionPriority.MEDIUM,
          status: InteractionStatus.PENDING,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockInteraction);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.createInteraction(createInteractionDto, 'user-1')
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
      });
      expect(mockPrismaService.customerInteraction.create).not.toHaveBeenCalled();
    });
  });

  describe('getCustomerTimeline', () => {
    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      email: 'john@test.com',
    };

    const mockInteractions = [
      {
        id: 'interaction-1',
        type: 'EMAIL',
        subject: 'Test email',
        description: 'Email description',
        createdAt: new Date('2024-02-15'),
        status: 'COMPLETED',
        priority: 'MEDIUM',
        user: {
          id: 'user-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@company.com',
        },
      },
    ];

    const mockQuotations = [
      {
        id: 'quotation-1',
        quotationNumber: 'QUO-2024-001',
        status: 'SENT',
        totalAmount: 100000,
        createdAt: new Date('2024-02-14'),
        emailSentAt: new Date('2024-02-14'),
        customerViewedAt: null,
        customerRespondedAt: null,
      },
    ];

    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-2024-001',
        status: 'DELIVERED',
        totalAmount: 100000,
        createdAt: new Date('2024-02-13'),
      },
    ];

    it('should return customer timeline successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customerInteraction.findMany.mockResolvedValue(mockInteractions);
      mockPrismaService.quotation.findMany.mockResolvedValue(mockQuotations);
      mockPrismaService.order.findMany.mockResolvedValue(mockOrders);

      const result = await service.getCustomerTimeline('customer-1', 50);

      expect(result.customerId).toBe('customer-1');
      expect(result.customer).toEqual(mockCustomer);
      expect(result.events).toHaveLength(3); // 1 interaction + 1 quotation + 1 order
      expect(result.summary.totalEvents).toBe(3);
      expect(result.summary.totalInteractions).toBe(1);
      expect(result.summary.totalQuotations).toBe(1);
      expect(result.summary.totalOrders).toBe(1);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.getCustomerTimeline('customer-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('calculateRelationshipScore', () => {
    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      createdAt: new Date('2024-01-01'),
      interactions: [
        { id: 'int-1', createdAt: new Date('2024-02-01') },
        { id: 'int-2', createdAt: new Date('2024-02-10') },
      ],
      quotations: [
        {
          id: 'quo-1',
          emailSentAt: new Date('2024-02-01'),
          customerRespondedAt: new Date('2024-02-02'),
        },
      ],
      orders: [
        {
          id: 'ord-1',
          status: 'DELIVERED',
          totalAmount: 100000,
          createdAt: new Date('2024-02-05'),
        },
      ],
    };

    it('should calculate relationship score successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customerEngagementScore.findUnique.mockResolvedValue({
        engagementScore: 75,
      });

      const result = await service.calculateRelationshipScore('customer-1');

      expect(result.customerId).toBe('customer-1');
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.scoreBreakdown).toHaveProperty('interactionScore');
      expect(result.scoreBreakdown).toHaveProperty('responseScore');
      expect(result.scoreBreakdown).toHaveProperty('purchaseScore');
      expect(result.scoreBreakdown).toHaveProperty('loyaltyScore');
      expect(result.scoreBreakdown).toHaveProperty('engagementScore');
      expect(result.scoreCategory).toMatch(/^(CHAMPION|LOYAL|POTENTIAL|NEW|AT_RISK)$/);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.calculateRelationshipScore('customer-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateCreditLimit', () => {
    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      creditLimit: 100000,
    };

    it('should update credit limit successfully', async () => {
      const updatedCustomer = { ...mockCustomer, creditLimit: 200000 };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue(updatedCustomer);
      mockPrismaService.creditLimitHistory.create.mockResolvedValue({});

      const result = await service.updateCreditLimit('customer-1', 200000, 'Increased due to good payment history', 'user-1');

      expect(mockPrismaService.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: { creditLimit: 200000 },
      });
      expect(mockPrismaService.creditLimitHistory.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-1',
          oldLimit: 100000,
          newLimit: 200000,
          reason: 'Increased due to good payment history',
          changedBy: 'user-1',
        },
      });
      expect(result).toEqual(updatedCustomer);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCreditLimit('customer-1', 200000, 'Test reason', 'user-1')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCreditLimitAlerts', () => {
    const mockCustomers = [
      {
        id: 'customer-1',
        companyName: 'Test Company 1',
        contactPerson: 'John Doe',
        email: 'john@test1.com',
        creditLimit: 100000,
        orders: [
          { totalAmount: 95000 }, // 95% utilization - CRITICAL
        ],
      },
      {
        id: 'customer-2',
        companyName: 'Test Company 2',
        contactPerson: 'Jane Smith',
        email: 'jane@test2.com',
        creditLimit: 200000,
        orders: [
          { totalAmount: 220000 }, // 110% utilization - EXCEEDED
        ],
      },
      {
        id: 'customer-3',
        companyName: 'Test Company 3',
        contactPerson: 'Bob Johnson',
        email: 'bob@test3.com',
        creditLimit: 150000,
        orders: [
          { totalAmount: 50000 }, // 33% utilization - No alert
        ],
      },
    ];

    it('should return credit limit alerts for customers approaching or exceeding limits', async () => {
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.getCreditLimitAlerts();

      expect(result).toHaveLength(2); // Only customers 1 and 2 should have alerts
      
      const exceededAlert = result.find(alert => alert.alertType === 'EXCEEDED');
      expect(exceededAlert).toBeDefined();
      expect(exceededAlert.customerId).toBe('customer-2');
      expect(exceededAlert.utilizationPercentage).toBe(110);

      const criticalAlert = result.find(alert => alert.alertType === 'CRITICAL');
      expect(criticalAlert).toBeDefined();
      expect(criticalAlert.customerId).toBe('customer-1');
      expect(criticalAlert.utilizationPercentage).toBe(95);
    });

    it('should return empty array when no customers have alerts', async () => {
      const customersWithLowUtilization = [
        {
          id: 'customer-1',
          companyName: 'Test Company',
          contactPerson: 'John Doe',
          email: 'john@test.com',
          creditLimit: 100000,
          orders: [{ totalAmount: 50000 }], // 50% utilization
        },
      ];

      mockPrismaService.customer.findMany.mockResolvedValue(customersWithLowUtilization);

      const result = await service.getCreditLimitAlerts();

      expect(result).toHaveLength(0);
    });
  });

  describe('calculateCustomerLifetimeValue', () => {
    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      createdAt: new Date('2024-01-01'),
      orders: [
        {
          totalAmount: 100000,
          status: 'DELIVERED',
          createdAt: new Date('2024-01-15'),
        },
        {
          totalAmount: 150000,
          status: 'PAID',
          createdAt: new Date('2024-02-01'),
        },
        {
          totalAmount: 75000,
          status: 'PENDING', // Should not be included in calculations
          createdAt: new Date('2024-02-10'),
        },
      ],
    };

    it('should calculate customer lifetime value successfully', async () => {
      const mockLifetimeValue = {
        id: 'clv-1',
        customerId: 'customer-1',
        totalRevenue: 250000,
        totalOrders: 2,
        averageOrderValue: 125000,
        customerTenure: 45,
        predictedLifetimeValue: 300000,
        riskScore: 10,
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customerLifetimeValue.upsert.mockResolvedValue(mockLifetimeValue);

      const result = await service.calculateCustomerLifetimeValue('customer-1');

      expect(result.customerId).toBe('customer-1');
      expect(result.totalRevenue).toBe(250000);
      expect(result.totalOrders).toBe(2);
      expect(result.averageOrderValue).toBe(125000);
      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should throw NotFoundException when customer does not exist', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.calculateCustomerLifetimeValue('customer-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});