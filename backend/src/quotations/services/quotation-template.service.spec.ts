import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { QuotationTemplateService } from './quotation-template.service';
import { QuotationsService } from '../quotations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuotationTemplateDto, TemplateCategory } from '../dto/quotation-template.dto';

describe('QuotationTemplateService', () => {
  let service: QuotationTemplateService;
  let prismaService: PrismaService;
  let quotationsService: QuotationsService;

  const mockPrismaService = {
    quotationTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    bulkQuotationJob: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockQuotationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationTemplateService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: QuotationsService,
          useValue: mockQuotationsService,
        },
      ],
    }).compile();

    service = module.get<QuotationTemplateService>(QuotationTemplateService);
    prismaService = module.get<PrismaService>(PrismaService);
    quotationsService = module.get<QuotationsService>(QuotationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTemplateDto: CreateQuotationTemplateDto = {
      name: 'Test Template',
      description: 'Test template description',
      category: TemplateCategory.STANDARD,
      isPublic: false,
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          unitPrice: 1000,
          discountAmount: 100,
        },
      ],
      defaultValidityDays: 30,
      defaultTermsConditions: 'Test terms',
      tags: ['test'],
    };

    const mockProducts = [
      {
        id: 'product-1',
        name: 'Test Product',
        sku: 'TEST-001',
        basePrice: 1000,
        isActive: true,
      },
    ];

    const mockCreatedTemplate = {
      id: 'template-1',
      name: 'Test Template',
      description: 'Test template description',
      category: TemplateCategory.STANDARD,
      isPublic: false,
      templateData: {
        items: [
          {
            productId: 'product-1',
            productName: 'Test Product',
            productSku: 'TEST-001',
            quantity: 2,
            unitPrice: 1000,
            discountAmount: 100,
            customSpecifications: {},
            deliveryTimeline: undefined,
          },
        ],
        metadata: {
          totalItems: 1,
          estimatedValue: 1900, // (2 * 1000) - 100
        },
      },
      defaultValidityDays: 30,
      defaultTermsConditions: 'Test terms',
      tags: ['test'],
      usageCount: 0,
      lastUsedAt: null,
      createdBy: {
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a template successfully', async () => {
      mockPrismaService.quotationTemplate.findUnique.mockResolvedValue(null);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.quotationTemplate.create.mockResolvedValue(mockCreatedTemplate);

      const result = await service.create(createTemplateDto, 'user-1');

      expect(result).toEqual(mockCreatedTemplate);
      expect(mockPrismaService.quotationTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: 'Test Template' },
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['product-1'] },
          isActive: true,
        },
      });
      expect(mockPrismaService.quotationTemplate.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if template name already exists', async () => {
      mockPrismaService.quotationTemplate.findUnique.mockResolvedValue({
        id: 'existing-template',
        name: 'Test Template',
      });

      await expect(service.create(createTemplateDto, 'user-1')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.quotationTemplate.findUnique).toHaveBeenCalledWith({
        where: { name: 'Test Template' },
      });
    });

    it('should throw BadRequestException if products are not found', async () => {
      mockPrismaService.quotationTemplate.findUnique.mockResolvedValue(null);
      mockPrismaService.product.findMany.mockResolvedValue([]); // No products found

      await expect(service.create(createTemplateDto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['product-1'] },
          isActive: true,
        },
      });
    });

    it('should calculate template data correctly', async () => {
      mockPrismaService.quotationTemplate.findUnique.mockResolvedValue(null);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.quotationTemplate.create.mockResolvedValue(mockCreatedTemplate);

      await service.create(createTemplateDto, 'user-1');

      const createCall = mockPrismaService.quotationTemplate.create.mock.calls[0][0];
      const templateData = createCall.data.templateData;

      expect(templateData.items).toHaveLength(1);
      expect(templateData.items[0]).toMatchObject({
        productId: 'product-1',
        productName: 'Test Product',
        productSku: 'TEST-001',
        quantity: 2,
        unitPrice: 1000,
        discountAmount: 100,
      });
      expect(templateData.metadata.totalItems).toBe(1);
      expect(templateData.metadata.estimatedValue).toBe(1900);
    });
  });

  describe('findAll', () => {
    const mockTemplates = [
      {
        id: 'template-1',
        name: 'Template 1',
        category: TemplateCategory.STANDARD,
        isPublic: true,
        isActive: true,
        createdBy: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      },
      {
        id: 'template-2',
        name: 'Template 2',
        category: TemplateCategory.CUSTOM,
        isPublic: false,
        isActive: true,
        createdByUserId: 'user-1',
        createdBy: {
          id: 'user-1',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
        },
      },
    ];

    it('should return paginated templates', async () => {
      mockPrismaService.quotationTemplate.findMany.mockResolvedValue(mockTemplates);
      mockPrismaService.quotationTemplate.count.mockResolvedValue(2);

      const filters = {
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      const result = await service.findAll(filters, 'user-1');

      expect(result).toEqual({
        data: mockTemplates,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaService.quotationTemplate.findMany).toHaveBeenCalled();
      expect(mockPrismaService.quotationTemplate.count).toHaveBeenCalled();
    });

    it('should filter by category', async () => {
      mockPrismaService.quotationTemplate.findMany.mockResolvedValue([mockTemplates[0]]);
      mockPrismaService.quotationTemplate.count.mockResolvedValue(1);

      const filters = {
        category: TemplateCategory.STANDARD,
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      await service.findAll(filters, 'user-1');

      const findManyCall = mockPrismaService.quotationTemplate.findMany.mock.calls[0][0];
      expect(findManyCall.where.category).toBe(TemplateCategory.STANDARD);
    });

    it('should filter by search term', async () => {
      mockPrismaService.quotationTemplate.findMany.mockResolvedValue(mockTemplates);
      mockPrismaService.quotationTemplate.count.mockResolvedValue(2);

      const filters = {
        search: 'Template',
        limit: 20,
        offset: 0,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
      };

      await service.findAll(filters, 'user-1');

      const findManyCall = mockPrismaService.quotationTemplate.findMany.mock.calls[0][0];
      expect(findManyCall.where.OR).toBeDefined();
      expect(findManyCall.where.OR).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    const mockTemplate = {
      id: 'template-1',
      name: 'Test Template',
      isPublic: true,
      createdByUserId: 'user-1',
      createdBy: {
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
    };

    it('should return template if found and accessible', async () => {
      mockPrismaService.quotationTemplate.findUnique.mockResolvedValue(mockTemplate);

      const result = await service.findOne('template-1', 'user-1');

      expect(result).toEqual(mockTemplate);
      expect(mockPrismaService.quotationTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if template not found', async () => {
      mockPrismaService.quotationTemplate.findUnique.mockResolvedValue(null);

      await expect(service.findOne('template-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if template is private and user is not creator', async () => {
      const privateTemplate = {
        ...mockTemplate,
        isPublic: false,
        createdByUserId: 'other-user',
      };
      mockPrismaService.quotationTemplate.findUnique.mockResolvedValue(privateTemplate);

      await expect(service.findOne('template-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createQuotationFromTemplate', () => {
    const mockTemplate = {
      id: 'template-1',
      name: 'Test Template',
      templateData: {
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            unitPrice: 1000,
            discountAmount: 100,
          },
        ],
      },
      defaultValidityDays: 30,
      defaultTermsConditions: 'Test terms',
    };

    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      isActive: true,
    };

    const mockQuotation = {
      id: 'quotation-1',
      quotationNumber: 'QUO-2024-000001',
      customerId: 'customer-1',
      totalAmount: 1900,
    };

    it('should create quotation from template successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as any);
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockQuotationsService.create.mockResolvedValue(mockQuotation);
      mockPrismaService.quotationTemplate.update.mockResolvedValue(mockTemplate);

      const dto = {
        templateId: 'template-1',
        customerId: 'customer-1',
        notes: 'Test quotation',
      };

      const result = await service.createQuotationFromTemplate(dto, 'user-1');

      expect(result).toEqual(mockQuotation);
      expect(service.findOne).toHaveBeenCalledWith('template-1', 'user-1');
      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
      });
      expect(mockQuotationsService.create).toHaveBeenCalled();
      expect(mockPrismaService.quotationTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: expect.any(Date),
        },
      });
    });

    it('should throw BadRequestException if customer not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as any);
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      const dto = {
        templateId: 'template-1',
        customerId: 'customer-1',
      };

      await expect(service.createQuotationFromTemplate(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should apply customizations to template items', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as any);
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockQuotationsService.create.mockResolvedValue(mockQuotation);
      mockPrismaService.quotationTemplate.update.mockResolvedValue(mockTemplate);

      const dto = {
        templateId: 'template-1',
        customerId: 'customer-1',
        customizations: [
          {
            productId: 'product-1',
            quantity: 3,
            unitPrice: 900,
          },
        ],
      };

      await service.createQuotationFromTemplate(dto, 'user-1');

      const createCall = mockQuotationsService.create.mock.calls[0][0];
      expect(createCall.items[0]).toMatchObject({
        productId: 'product-1',
        quantity: 3,
        unitPrice: 900,
        discount: 100, // Original discount amount
      });
    });
  });

  describe('createBulkQuotationJob', () => {
    const mockTemplate = {
      id: 'template-1',
      name: 'Test Template',
    };

    const mockCustomers = [
      { id: 'customer-1', companyName: 'Company 1', isActive: true },
      { id: 'customer-2', companyName: 'Company 2', isActive: true },
    ];

    const mockJob = {
      id: 'job-1',
      name: 'Test Bulk Job',
      templateId: 'template-1',
      customerIds: ['customer-1', 'customer-2'],
      totalCustomers: 2,
      status: 'PENDING',
      template: mockTemplate,
      createdBy: {
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
    };

    it('should create bulk quotation job successfully', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as any);
      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrismaService.bulkQuotationJob.create.mockResolvedValue(mockJob);

      const dto = {
        name: 'Test Bulk Job',
        templateId: 'template-1',
        customerIds: ['customer-1', 'customer-2'],
      };

      const result = await service.createBulkQuotationJob(dto, 'user-1');

      expect(result).toEqual(mockJob);
      expect(service.findOne).toHaveBeenCalledWith('template-1', 'user-1');
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['customer-1', 'customer-2'] },
          isActive: true,
        },
      });
      expect(mockPrismaService.bulkQuotationJob.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if some customers not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTemplate as any);
      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomers[0]]); // Only one customer found

      const dto = {
        name: 'Test Bulk Job',
        templateId: 'template-1',
        customerIds: ['customer-1', 'customer-2'],
      };

      await expect(service.createBulkQuotationJob(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});