import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { QuotationsService } from './quotations.service';
import { QuotationConfigService } from './quotation-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuotationStatus } from '@prisma/client';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationFiltersDto } from './dto/quotation-filters.dto';

describe('QuotationsService', () => {
  let service: QuotationsService;
  let prismaService: PrismaService;
  let configService: QuotationConfigService;

  const mockPrismaService = {
    quotation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    getQuotationNumberConfig: jest.fn().mockReturnValue({
      prefix: 'QUO',
      dateFormat: 'YYYY',
      separator: '-',
      sequenceLength: 6,
      resetSequence: 'YEARLY'
    }),
    formatDatePart: jest.fn().mockReturnValue('2024'),
    getResetPeriodKey: jest.fn().mockReturnValue('2024'),
  };

  const mockCustomer = {
    id: 'customer-1',
    companyName: 'Test Company',
    contactPerson: 'John Doe',
    email: 'john@test.com',
    isActive: true,
  };

  const mockProduct = {
    id: 'product-1',
    sku: 'SKU001',
    name: 'Test Product',
    description: 'Test Description',
    basePrice: 100,
    minOrderQty: 1,
    isActive: true,
  };

  const mockQuotation = {
    id: 'quotation-1',
    quotationNumber: 'QUO-2024-000001',
    customerId: 'customer-1',
    status: QuotationStatus.DRAFT,
    subtotal: 100,
    discountAmount: 0,
    taxAmount: 18,
    totalAmount: 118,
    validUntil: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdByUserId: 'user-1',
    customer: mockCustomer,
    items: [{
      id: 'item-1',
      productId: 'product-1',
      quantity: 1,
      unitPrice: 100,
      discountAmount: 0,
      lineTotal: 100,
      product: mockProduct,
    }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QuotationConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<QuotationsService>(QuotationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<QuotationConfigService>(QuotationConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createQuotationDto: CreateQuotationDto = {
      customerId: 'customer-1',
      validUntil: '2024-12-31',
      items: [{
        productId: 'product-1',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
      }],
    };

    it('should create a quotation successfully', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.quotation.findUnique.mockResolvedValue(null); // No existing quotation
      mockPrismaService.quotation.findFirst.mockResolvedValue(null); // No previous quotation for numbering
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          quotation: {
            create: jest.fn().mockResolvedValue(mockQuotation),
          },
        });
      });

      const result = await service.create(createQuotationDto, 'user-1');

      expect(result).toEqual(mockQuotation);
      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1' }
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { 
          id: { in: ['product-1'] },
          isActive: true
        }
      });
    });

    it('should throw BadRequestException when no items provided', async () => {
      const invalidDto = { ...createQuotationDto, items: [] };

      await expect(service.create(invalidDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Quotation must contain at least one item')
      );
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(createQuotationDto, 'user-1')).rejects.toThrow(
        new NotFoundException('Customer with ID customer-1 not found')
      );
    });

    it('should throw BadRequestException when customer is inactive', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({
        ...mockCustomer,
        isActive: false,
      });

      await expect(service.create(createQuotationDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Cannot create quotation for inactive customer')
      );
    });

    it('should throw BadRequestException when product not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue([]); // No products found

      await expect(service.create(createQuotationDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Products not found or inactive: product-1')
      );
    });

    it('should throw BadRequestException when quantity below minimum', async () => {
      const productWithMinQty = { ...mockProduct, minOrderQty: 5 };
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue([productWithMinQty]);

      await expect(service.create(createQuotationDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Minimum order quantity for Test Product is 5')
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated quotations', async () => {
      const filters: QuotationFiltersDto = {
        status: QuotationStatus.DRAFT,
        limit: 10,
        offset: 0,
      };

      mockPrismaService.quotation.findMany.mockResolvedValue([mockQuotation]);
      mockPrismaService.quotation.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(result).toEqual({
        data: [mockQuotation],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockPrismaService.quotation.findMany).toHaveBeenCalledWith({
        where: { status: QuotationStatus.DRAFT },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
      });
    });

    it('should handle search filters', async () => {
      const filters: QuotationFiltersDto = {
        search: 'test',
        limit: 20,
        offset: 0,
      };

      mockPrismaService.quotation.findMany.mockResolvedValue([]);
      mockPrismaService.quotation.count.mockResolvedValue(0);

      await service.findAll(filters);

      expect(mockPrismaService.quotation.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { quotationNumber: { contains: 'test', mode: 'insensitive' } },
            { notes: { contains: 'test', mode: 'insensitive' } },
            { customer: { companyName: { contains: 'test', mode: 'insensitive' } } },
            { customer: { contactPerson: { contains: 'test', mode: 'insensitive' } } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a quotation by id', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);

      const result = await service.findOne('quotation-1');

      expect(result).toEqual(mockQuotation);
      expect(mockPrismaService.quotation.findUnique).toHaveBeenCalledWith({
        where: { id: 'quotation-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when quotation not found', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Quotation with ID non-existent not found')
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateQuotationDto = {
      status: QuotationStatus.SENT,
    };

    it('should update a quotation successfully', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.quotation.update.mockResolvedValue({
        ...mockQuotation,
        status: QuotationStatus.SENT,
      });

      const result = await service.update('quotation-1', updateDto, 'user-1');

      expect(result.status).toBe(QuotationStatus.SENT);
      expect(mockPrismaService.quotation.update).toHaveBeenCalledWith({
        where: { id: 'quotation-1' },
        data: {
          status: QuotationStatus.SENT,
          validUntil: undefined,
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when quotation not found', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto, 'user-1')).rejects.toThrow(
        new NotFoundException('Quotation with ID non-existent not found')
      );
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const rejectedQuotation = { ...mockQuotation, status: QuotationStatus.REJECTED };
      mockPrismaService.quotation.findUnique.mockResolvedValue(rejectedQuotation);

      await expect(service.update('quotation-1', { status: QuotationStatus.SENT }, 'user-1')).rejects.toThrow(
        new BadRequestException('Invalid status transition from REJECTED to SENT')
      );
    });

    it('should throw ForbiddenException when updating non-draft quotation with non-status fields', async () => {
      const sentQuotation = { ...mockQuotation, status: QuotationStatus.SENT };
      mockPrismaService.quotation.findUnique.mockResolvedValue(sentQuotation);

      await expect(service.update('quotation-1', { validUntil: '2024-12-31' }, 'user-1')).rejects.toThrow(
        new ForbiddenException('Only status can be updated for non-draft quotations')
      );
    });
  });

  describe('remove', () => {
    it('should delete a draft quotation', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.quotation.delete.mockResolvedValue(mockQuotation);

      await service.remove('quotation-1');

      expect(mockPrismaService.quotation.delete).toHaveBeenCalledWith({
        where: { id: 'quotation-1' }
      });
    });

    it('should throw NotFoundException when quotation not found', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Quotation with ID non-existent not found')
      );
    });

    it('should throw ForbiddenException when deleting non-draft quotation', async () => {
      const sentQuotation = { ...mockQuotation, status: QuotationStatus.SENT };
      mockPrismaService.quotation.findUnique.mockResolvedValue(sentQuotation);

      await expect(service.remove('quotation-1')).rejects.toThrow(
        new ForbiddenException('Only draft quotations can be deleted')
      );
    });
  });

  describe('duplicate', () => {
    it('should duplicate a quotation successfully', async () => {
      const duplicateDto = { resetStatus: true };
      
      mockPrismaService.quotation.findUnique
        .mockResolvedValueOnce(mockQuotation) // Original quotation
        .mockResolvedValueOnce(null); // No existing quotation with new number
      mockPrismaService.quotation.findFirst.mockResolvedValue(null); // No previous quotation for numbering
      mockPrismaService.quotation.create.mockResolvedValue({
        ...mockQuotation,
        id: 'quotation-2',
        quotationNumber: 'QUO-2024-000002',
      });

      const result = await service.duplicate('quotation-1', duplicateDto, 'user-1');

      expect(result.id).toBe('quotation-2');
      expect(result.quotationNumber).toBe('QUO-2024-000002');
      expect(mockPrismaService.quotation.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException when original quotation not found', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      await expect(service.duplicate('non-existent', {}, 'user-1')).rejects.toThrow(
        new NotFoundException('Quotation with ID non-existent not found')
      );
    });
  });

  describe('getAnalytics', () => {
    it('should return quotation analytics', async () => {
      mockPrismaService.quotation.count
        .mockResolvedValueOnce(10) // Total quotations
        .mockResolvedValue(1); // Monthly counts
      
      mockPrismaService.quotation.groupBy.mockResolvedValue([
        { status: QuotationStatus.DRAFT, _count: { status: 5 } },
        { status: QuotationStatus.SENT, _count: { status: 3 } },
        { status: QuotationStatus.APPROVED, _count: { status: 2 } },
      ]);
      
      mockPrismaService.quotation.aggregate
        .mockResolvedValueOnce({ _avg: { totalAmount: 1000 } }) // Overall average
        .mockResolvedValue({ _sum: { totalAmount: 100 } }); // Monthly values
      
      mockPrismaService.quotation.findMany.mockResolvedValue([
        {
          status: QuotationStatus.APPROVED,
          createdAt: new Date('2024-01-01'),
          customerRespondedAt: new Date('2024-01-02'),
        }
      ]);

      const result = await service.getAnalytics();

      expect(result).toEqual({
        totalQuotations: 10,
        conversionRate: expect.any(Number),
        averageValue: 1000,
        averageResponseTime: expect.any(Number),
        statusBreakdown: {
          DRAFT: 5,
          SENT: 3,
          APPROVED: 2,
        },
        monthlyTrends: expect.any(Array),
      });
      
      expect(result.monthlyTrends).toHaveLength(12);
      expect(result.monthlyTrends[0]).toEqual({
        month: expect.stringMatching(/^\d{4}-\d{2}$/),
        count: 1,
        value: 100,
        conversionRate: expect.any(Number),
      });
    });
  });

  describe('quotation number generation', () => {
    it('should generate unique quotation numbers', async () => {
      mockPrismaService.quotation.findFirst.mockResolvedValue(null);
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      // Access the private method through reflection for testing
      const generateQuotationNumber = (service as any).generateQuotationNumber.bind(service);
      const quotationNumber = await generateQuotationNumber();

      expect(quotationNumber).toMatch(/^QUO-\d{4}-\d{6}$/);
    });

    it('should increment sequence number when previous quotations exist', async () => {
      mockPrismaService.quotation.findFirst.mockResolvedValue({
        quotationNumber: 'QUO-2024-000005'
      });
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      const generateQuotationNumber = (service as any).generateQuotationNumber.bind(service);
      const quotationNumber = await generateQuotationNumber();

      expect(quotationNumber).toBe('QUO-2024-000006');
    });
  });

  describe('status transition validation', () => {
    it('should allow valid status transitions', () => {
      const validateStatusTransition = (service as any).validateStatusTransition.bind(service);

      expect(validateStatusTransition(QuotationStatus.DRAFT, QuotationStatus.SENT)).toBe(true);
      expect(validateStatusTransition(QuotationStatus.SENT, QuotationStatus.APPROVED)).toBe(true);
      expect(validateStatusTransition(QuotationStatus.SENT, QuotationStatus.REJECTED)).toBe(true);
      expect(validateStatusTransition(QuotationStatus.EXPIRED, QuotationStatus.SENT)).toBe(true);
    });

    it('should reject invalid status transitions', () => {
      const validateStatusTransition = (service as any).validateStatusTransition.bind(service);

      expect(validateStatusTransition(QuotationStatus.REJECTED, QuotationStatus.SENT)).toBe(false);
      expect(validateStatusTransition(QuotationStatus.APPROVED, QuotationStatus.DRAFT)).toBe(false);
      expect(validateStatusTransition(QuotationStatus.DRAFT, QuotationStatus.APPROVED)).toBe(false);
    });
  });

  describe('quotation totals calculation', () => {
    it('should calculate totals correctly', () => {
      const calculateQuotationTotals = (service as any).calculateQuotationTotals.bind(service);
      
      const items = [
        { quantity: 2, unitPrice: 100, discountAmount: 10 },
        { quantity: 1, unitPrice: 50, discountAmount: 5 },
      ];

      const result = calculateQuotationTotals(items);

      expect(result).toEqual({
        subtotal: 250, // (2 * 100) + (1 * 50)
        discountAmount: 15, // 10 + 5
        taxAmount: 42.3, // (250 - 15) * 0.18
        totalAmount: 277.3, // 250 - 15 + 42.3
      });
    });
  });
});