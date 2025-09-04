import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomerType, PaymentTerms } from '@prisma/client';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFiltersDto } from './dto/customer-filters.dto';

describe('CustomersService', () => {
  let service: CustomersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customer: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    customerInteraction: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    order: {
      aggregate: jest.fn(),
    },
    quotation: {
      count: jest.fn(),
    }
  };

  const mockCustomer = {
    id: 'customer-1',
    companyName: 'Test Company',
    contactPerson: 'John Doe',
    email: 'john@test.com',
    phone: '+1234567890',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    country: 'India',
    customerType: CustomerType.SMALL_BUSINESS,
    creditLimit: 50000,
    paymentTerms: PaymentTerms.NET_30,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    quotations: [],
    orders: [],
    interactions: [],
    totalQuotations: 0,
    totalOrders: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      companyName: 'Test Company',
      contactPerson: 'John Doe',
      email: 'john@test.com',
      phone: '+1234567890',
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      country: 'India',
      customerType: CustomerType.SMALL_BUSINESS,
      creditLimit: 50000,
      paymentTerms: PaymentTerms.NET_30,
    };

    it('should create a customer successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null); // No existing customer
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create(createCustomerDto);

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { email: 'john@test.com' }
      });
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyName: 'Test Company',
          contactPerson: 'John Doe',
          email: 'john@test.com',
          country: 'India',
          customerType: CustomerType.SMALL_BUSINESS,
          paymentTerms: 'NET_30',
        })
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      await expect(service.create(createCustomerDto)).rejects.toThrow(
        new ConflictException('Customer with email john@test.com already exists')
      );
    });

    it('should set default values for optional fields', async () => {
      const minimalDto = {
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        email: 'john@test.com',
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      await service.create(minimalDto);

      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          country: 'India',
          customerType: CustomerType.SMALL_BUSINESS,
          creditLimit: 0,
          paymentTerms: 'NET_30',
        })
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const filters: CustomerFiltersDto = {
        customerType: CustomerType.SMALL_BUSINESS,
        limit: 10,
        offset: 0,
      };

      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(result).toEqual({
        data: [mockCustomer],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: { customerType: CustomerType.SMALL_BUSINESS },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
      });
    });

    it('should handle search filters', async () => {
      const filters: CustomerFiltersDto = {
        search: 'test',
        limit: 20,
        offset: 0,
      };

      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.count.mockResolvedValue(0);

      await service.findAll(filters);

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { companyName: { contains: 'test', mode: 'insensitive' } },
            { contactPerson: { contains: 'test', mode: 'insensitive' } },
            { email: { contains: 'test', mode: 'insensitive' } },
            { phone: { contains: 'test', mode: 'insensitive' } },
            { city: { contains: 'test', mode: 'insensitive' } },
            { state: { contains: 'test', mode: 'insensitive' } },
            { gstNumber: { contains: 'test', mode: 'insensitive' } },
            { notes: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });

    it('should handle date range filters', async () => {
      const filters: CustomerFiltersDto = {
        createdAfter: '2024-01-01',
        createdBefore: '2024-12-31',
        limit: 20,
        offset: 0,
      };

      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.count.mockResolvedValue(0);

      await service.findAll(filters);

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-12-31')
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);

      const result = await service.findOne('customer-1');

      expect(result).toEqual(mockCustomer);
      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Customer with ID non-existent not found')
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateCustomerDto = {
      companyName: 'Updated Company',
      creditLimit: 75000,
    };

    it('should update a customer successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        companyName: 'Updated Company',
        creditLimit: 75000,
      });

      const result = await service.update('customer-1', updateDto);

      expect(result.companyName).toBe('Updated Company');
      expect(mockPrismaService.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: {
          ...updateDto,
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        new NotFoundException('Customer with ID non-existent not found')
      );
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingCustomer = { ...mockCustomer, email: 'existing@test.com' };
      const conflictCustomer = { ...mockCustomer, id: 'other-customer', email: 'new@test.com' };
      
      mockPrismaService.customer.findUnique
        .mockResolvedValueOnce(existingCustomer) // First call for existing customer
        .mockResolvedValueOnce(conflictCustomer); // Second call for email conflict check

      await expect(service.update('customer-1', { email: 'new@test.com' })).rejects.toThrow(
        new ConflictException('Customer with email new@test.com already exists')
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a customer with no active quotations or orders', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({
        ...mockCustomer,
        quotations: [],
        orders: []
      });
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        isActive: false
      });

      await service.remove('customer-1');

      expect(mockPrismaService.customer.update).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
        data: { isActive: false }
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Customer with ID non-existent not found')
      );
    });

    it('should throw BadRequestException when customer has active quotations', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({
        ...mockCustomer,
        quotations: [{ id: 'quote-1', status: 'SENT' }],
        orders: []
      });

      await expect(service.remove('customer-1')).rejects.toThrow(
        new BadRequestException('Cannot delete customer with active quotations or orders. Mark as inactive instead.')
      );
    });
  });

  describe('calculateLifetimeValue', () => {
    it('should calculate customer lifetime value', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 150000 }
      });

      const result = await service.calculateLifetimeValue('customer-1');

      expect(result).toBe(150000);
      expect(mockPrismaService.order.aggregate).toHaveBeenCalledWith({
        where: { 
          customerId: 'customer-1',
          status: { in: ['DELIVERED', 'PAID'] }
        },
        _sum: { totalAmount: true }
      });
    });

    it('should return 0 when customer has no orders', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: null }
      });

      const result = await service.calculateLifetimeValue('customer-1');

      expect(result).toBe(0);
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.calculateLifetimeValue('non-existent')).rejects.toThrow(
        new NotFoundException('Customer with ID non-existent not found')
      );
    });
  });

  describe('getInteractionHistory', () => {
    it('should return customer interaction history', async () => {
      const mockInteractions = [
        {
          id: 'interaction-1',
          customerId: 'customer-1',
          userId: 'user-1',
          type: 'EMAIL',
          subject: 'Follow up',
          createdAt: new Date(),
          user: {
            id: 'user-1',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@company.com'
          }
        }
      ];

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customerInteraction.findMany.mockResolvedValue(mockInteractions);

      const result = await service.getInteractionHistory('customer-1');

      expect(result).toEqual(mockInteractions);
      expect(mockPrismaService.customerInteraction.findMany).toHaveBeenCalledWith({
        where: { customerId: 'customer-1' },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    });
  });

  describe('createInteraction', () => {
    it('should create a customer interaction', async () => {
      const interactionDto = {
        customerId: 'customer-1',
        type: 'EMAIL',
        subject: 'Follow up call',
        description: 'Discussed new requirements'
      };

      const mockInteraction = {
        id: 'interaction-1',
        ...interactionDto,
        userId: 'user-1',
        createdAt: new Date(),
        user: {
          id: 'user-1',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@company.com'
        }
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customerInteraction.create.mockResolvedValue(mockInteraction);

      const result = await service.createInteraction(interactionDto, 'user-1');

      expect(result).toEqual(mockInteraction);
      expect(mockPrismaService.customerInteraction.create).toHaveBeenCalledWith({
        data: {
          customerId: 'customer-1',
          userId: 'user-1',
          type: 'EMAIL',
          subject: 'Follow up call',
          description: 'Discussed new requirements',
          scheduledAt: undefined,
          completedAt: undefined
        },
        include: expect.any(Object)
      });
    });
  });

  describe('segmentCustomers', () => {
    it('should segment customers by business type', async () => {
      const segmentationDto = {
        criteria: 'BUSINESS_TYPE' as const,
      };

      mockPrismaService.customer.groupBy.mockResolvedValue([
        { 
          customerType: CustomerType.SMALL_BUSINESS, 
          _count: { customerType: 5 },
          _sum: { creditLimit: 250000 }
        }
      ]);

      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);

      const result = await service.segmentCustomers(segmentationDto);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        segment: CustomerType.SMALL_BUSINESS,
        count: 5,
        totalValue: 250000,
        averageValue: 50000,
        customers: [mockCustomer]
      });
    });
  });

  describe('getAnalytics', () => {
    it('should return customer analytics', async () => {
      mockPrismaService.customer.count
        .mockResolvedValueOnce(100) // Total customers
        .mockResolvedValueOnce(85)  // Active customers
        .mockResolvedValueOnce(10)  // New customers this month
        .mockResolvedValue(1);      // Monthly counts

      mockPrismaService.customer.groupBy.mockResolvedValue([
        { customerType: CustomerType.SMALL_BUSINESS, _count: { customerType: 50 } },
        { customerType: CustomerType.ENTERPRISE, _count: { customerType: 35 } }
      ]);

      mockPrismaService.customer.findMany.mockResolvedValue([
        { id: 'customer-1' },
        { id: 'customer-2' }
      ]);

      mockPrismaService.order.aggregate.mockResolvedValue({
        _sum: { totalAmount: 1000 }
      });

      // Mock calculateLifetimeValue calls
      jest.spyOn(service, 'calculateLifetimeValue' as any).mockResolvedValue(50000);

      const result = await service.getAnalytics();

      expect(result).toEqual({
        totalCustomers: 100,
        activeCustomers: 85,
        newCustomersThisMonth: 10,
        averageLifetimeValue: expect.any(Number),
        topCustomersByValue: expect.any(Array),
        segmentBreakdown: {
          SMALL_BUSINESS: 50,
          ENTERPRISE: 35
        },
        monthlyGrowth: expect.any(Array)
      });

      expect(result.monthlyGrowth).toHaveLength(12);
    });
  });

  describe('performBulkAction', () => {
    it('should perform bulk activation', async () => {
      const bulkActionDto = {
        customerIds: ['customer-1', 'customer-2'],
        action: 'ACTIVATE' as const
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        isActive: true
      });

      const result = await service.performBulkAction(bulkActionDto);

      expect(result).toEqual({
        success: 2,
        failed: 0,
        errors: []
      });
    });

    it('should handle bulk action failures', async () => {
      const bulkActionDto = {
        customerIds: ['customer-1', 'non-existent'],
        action: 'ACTIVATE' as const
      };

      mockPrismaService.customer.findUnique
        .mockResolvedValueOnce(mockCustomer)
        .mockResolvedValueOnce(null);
      
      mockPrismaService.customer.update
        .mockResolvedValueOnce({ ...mockCustomer, isActive: true })
        .mockRejectedValueOnce(new Error('Customer not found'));

      const result = await service.performBulkAction(bulkActionDto);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return analytics for a valid customer ID', async () => {
      const mockCustomerId = 'test-customer-id';
      const mockCustomer = { id: mockCustomerId } as any;
      const mockAnalytics = {
        customerId: mockCustomerId,
        lifetimeValue: 1000,
        totalQuotations: 5,
        totalInteractions: 3,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockCustomer);
      jest.spyOn(service, 'calculateLifetimeValue').mockResolvedValue(1000);
      (prismaService.order.aggregate as jest.Mock).mockResolvedValue({ _sum: { totalAmount: 1000 } });
      (prismaService.quotation.count as jest.Mock).mockResolvedValue(5);
      (prismaService.customerInteraction.count as jest.Mock).mockResolvedValue(3);

      const result = await service.getCustomerAnalytics(mockCustomerId);
      expect(result).toEqual(mockAnalytics);
    });

    it('should throw NotFoundException for invalid customer ID', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
      await expect(service.getCustomerAnalytics('invalid-id')).rejects.toThrow(NotFoundException);
    });
  });
});