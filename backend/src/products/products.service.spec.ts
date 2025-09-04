import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { Currency, CustomerType } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { ProductAnalyticsDto } from './dto/product-response.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    product: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    category: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    productPricingRule: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
    },
  };

  const mockCategory = {
    id: 'category-1',
    name: 'Test Category',
    description: 'Test Description',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockProduct = {
    id: 'product-1',
    sku: 'SKU001',
    name: 'Test Product',
    description: 'Test Description',
    categoryId: 'category-1',
    basePrice: 1000,
    currency: Currency.INR,
    specifications: { weight: '10kg' },
    images: ['image1.jpg'],
    inventoryCount: 100,
    minOrderQty: 1,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    category: mockCategory,
    quotationItems: [],
    orderItems: [],
    effectivePrice: 1000,
    isInStock: true,
    totalSold: 0,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProductDto: CreateProductDto = {
      sku: 'SKU001',
      name: 'Test Product',
      description: 'Test Description',
      categoryId: 'category-1',
      basePrice: 1000,
      currency: Currency.INR,
      specifications: { weight: '10kg' },
      images: ['image1.jpg'],
      inventoryCount: 100,
      minOrderQty: 1,
    };

    it('should create a product successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null); // No existing product
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { sku: 'SKU001' }
      });
      expect(mockPrismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'category-1' }
      });
      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sku: 'SKU001',
          name: 'Test Product',
          basePrice: 1000,
          currency: Currency.INR,
          minOrderQty: 1,
          isActive: true,
        }),
        include: { category: true }
      });
    });

    it('should throw ConflictException when SKU already exists', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.create(createProductDto)).rejects.toThrow(
        new ConflictException('Product with SKU SKU001 already exists')
      );
    });

    it('should throw NotFoundException when category not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(
        new NotFoundException('Category with ID category-1 not found')
      );
    });

    it('should throw BadRequestException when category is inactive', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.category.findUnique.mockResolvedValue({
        ...mockCategory,
        isActive: false
      });

      await expect(service.create(createProductDto)).rejects.toThrow(
        new BadRequestException('Cannot assign product to inactive category')
      );
    });

    it('should set default values for optional fields', async () => {
      const minimalDto = {
        sku: 'SKU001',
        name: 'Test Product',
        basePrice: 1000,
      };

      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      await service.create(minimalDto);

      expect(mockPrismaService.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          currency: Currency.INR,
          images: [],
          minOrderQty: 1,
          isActive: true,
        }),
        include: { category: true }
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const filters: ProductFiltersDto = {
        categoryId: 'category-1',
        limit: 10,
        offset: 0,
      };

      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      const result = await service.findAll(filters);

      expect(result).toEqual({
        data: [mockProduct],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { categoryId: 'category-1' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
        include: expect.any(Object),
      });
    });

    it('should handle search filters', async () => {
      const filters: ProductFiltersDto = {
        search: 'test',
        limit: 20,
        offset: 0,
      };

      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll(filters);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { sku: { contains: 'test', mode: 'insensitive' } },
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
            { category: { name: { contains: 'test', mode: 'insensitive' } } }
          ]
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });

    it('should handle price range filters', async () => {
      const filters: ProductFiltersDto = {
        minPrice: 500,
        maxPrice: 2000,
        limit: 20,
        offset: 0,
      };

      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll(filters);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          basePrice: {
            gte: 500,
            lte: 2000
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });

    it('should handle in stock filter', async () => {
      const filters: ProductFiltersDto = {
        inStock: true,
        limit: 20,
        offset: 0,
      };

      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await service.findAll(filters);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          inventoryCount: { gt: 0 }
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
        include: expect.any(Object),
      });
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-1');

      expect(result).toEqual(mockProduct);
      expect(mockPrismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        new NotFoundException('Product with ID non-existent not found')
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'Updated Product',
      basePrice: 1500,
    };

    it('should update a product successfully', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        name: 'Updated Product',
        basePrice: 1500,
      });

      const result = await service.update('product-1', updateDto);

      expect(result.name).toBe('Updated Product');
      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          ...updateDto,
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', updateDto)).rejects.toThrow(
        new NotFoundException('Product with ID non-existent not found')
      );
    });

    it('should throw ConflictException when updating to existing SKU', async () => {
      const existingProduct = { ...mockProduct, sku: 'SKU001' };
      const conflictProduct = { ...mockProduct, id: 'other-product', sku: 'SKU002' };
      
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(existingProduct) // First call for existing product
        .mockResolvedValueOnce(conflictProduct); // Second call for SKU conflict check

      await expect(service.update('product-1', { sku: 'SKU002' })).rejects.toThrow(
        new ConflictException('Product with SKU SKU002 already exists')
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a product with no active quotations or orders', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...mockProduct,
        quotationItems: [],
        orderItems: []
      });
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        isActive: false
      });

      await service.remove('product-1');

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: { isActive: false }
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        new NotFoundException('Product with ID non-existent not found')
      );
    });

    it('should throw BadRequestException when product has active quotations', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue({
        ...mockProduct,
        quotationItems: [{ quotation: { id: 'quote-1', status: 'SENT' } }],
        orderItems: []
      });

      await expect(service.remove('product-1')).rejects.toThrow(
        new BadRequestException('Cannot delete product with active quotations or orders. Mark as inactive instead.')
      );
    });
  });

  describe('search', () => {
    it('should search products by query', async () => {
      const searchDto = {
        query: 'test',
        limit: 10
      };

      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);

      const result = await service.search(searchDto);

      expect(result).toEqual([mockProduct]);
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { sku: { contains: 'test', mode: 'insensitive' } },
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        take: 10,
        include: expect.any(Object),
        orderBy: [
          { name: 'asc' },
          { createdAt: 'desc' }
        ]
      });
    });

    it('should search with category filters', async () => {
      const searchDto = {
        query: 'test',
        categories: ['category-1', 'category-2'],
        limit: 10
      };

      mockPrismaService.product.findMany.mockResolvedValue([]);

      await service.search(searchDto);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          categoryId: { in: ['category-1', 'category-2'] },
          OR: [
            { sku: { contains: 'test', mode: 'insensitive' } },
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        take: 10,
        include: expect.any(Object),
        orderBy: [
          { name: 'asc' },
          { createdAt: 'desc' }
        ]
      });
    });
  });

  describe('getCategories', () => {
    it('should return all active categories with product counts', async () => {
      const mockCategories = [
        {
          ...mockCategory,
          parent: null,
          children: [],
          products: [{ id: 'product-1' }, { id: 'product-2' }]
        }
      ];

      mockPrismaService.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockCategories[0],
        productCount: 2
      });
    });
  });

  describe('createCategory', () => {
    const createCategoryDto = {
      name: 'New Category',
      description: 'New Description'
    };

    it('should create a category successfully', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);
      mockPrismaService.category.create.mockResolvedValue({
        ...mockCategory,
        name: 'New Category',
        products: []
      });

      const result = await service.createCategory(createCategoryDto);

      expect(result.name).toBe('New Category');
      expect(result.productCount).toBe(0);
    });

    it('should throw ConflictException when category name already exists', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

      await expect(service.createCategory(createCategoryDto)).rejects.toThrow(
        new ConflictException('Category with name New Category already exists')
      );
    });
  });

  describe('getPricingRules', () => {
    it('should return pricing rules for a product', async () => {
      const mockPricingRules = [
        {
          id: 'rule-1',
          productId: 'product-1',
          customerType: null,
          minQuantity: 10,
          maxQuantity: null,
          discountPercent: 5,
          fixedPrice: null,
          validFrom: new Date(),
          validUntil: null,
          isActive: true,
          createdAt: new Date()
        }
      ];

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.productPricingRule.findMany.mockResolvedValue(mockPricingRules);

      const result = await service.getPricingRules('product-1');

      expect(result).toEqual(mockPricingRules);
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.getPricingRules('non-existent')).rejects.toThrow(
        new NotFoundException('Product with ID non-existent not found')
      );
    });
  });

  describe('calculatePricing', () => {
    it('should calculate pricing without rules', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.productPricingRule.findMany.mockResolvedValue([]);

      const result = await service.calculatePricing('product-1', 5);

      expect(result).toEqual({
        productId: 'product-1',
        customerId: undefined,
        quantity: 5,
        basePrice: 1000,
        applicableRules: [],
        finalPrice: 1000,
        totalDiscount: 0,
        discountPercentage: 0
      });
    });

    it('should calculate pricing with discount rule', async () => {
      const mockPricingRule = {
        id: 'rule-1',
        productId: 'product-1',
        customerType: null,
        minQuantity: 5,
        maxQuantity: null,
        discountPercent: 10,
        fixedPrice: null,
        validFrom: new Date(),
        validUntil: null,
        isActive: true,
        createdAt: new Date()
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.productPricingRule.findMany.mockResolvedValue([mockPricingRule]);

      const result = await service.calculatePricing('product-1', 10);

      expect(result.finalPrice).toBe(900); // 1000 - 10% discount
      expect(result.totalDiscount).toBe(100);
      expect(result.discountPercentage).toBe(10);
    });
  });

  describe('updateInventory', () => {
    it('should update inventory with SET operation', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        inventoryCount: 50
      });

      const result = await service.updateInventory('product-1', {
        quantity: 50,
        operation: 'SET'
      });

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          inventoryCount: 50,
          updatedAt: expect.any(Date)
        },
        include: { category: true }
      });
    });

    it('should update inventory with ADD operation', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        inventoryCount: 120
      });

      await service.updateInventory('product-1', {
        quantity: 20,
        operation: 'ADD'
      });

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          inventoryCount: 120, // 100 + 20
          updatedAt: expect.any(Date)
        },
        include: { category: true }
      });
    });

    it('should update inventory with SUBTRACT operation', async () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        inventoryCount: 70
      });

      await service.updateInventory('product-1', {
        quantity: 30,
        operation: 'SUBTRACT'
      });

      expect(mockPrismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: {
          inventoryCount: 70, // 100 - 30
          updatedAt: expect.any(Date)
        },
        include: { category: true }
      });
    });
  });

  describe('getAnalytics', () => {
    it('should return product analytics', async () => {
      mockPrismaService.product.count
        .mockResolvedValueOnce(100) // Total products
        .mockResolvedValueOnce(85)  // Active products
        .mockResolvedValueOnce(5)   // Out of stock
        .mockResolvedValueOnce(10); // Low stock

      mockPrismaService.product.aggregate.mockResolvedValue({
        _avg: { basePrice: 1500 }
      });

      mockPrismaService.category.findMany.mockResolvedValue([
        {
          ...mockCategory,
          products: [
            { basePrice: 1000 },
            { basePrice: 2000 }
          ]
        }
      ]);

      // Mock the private method
      jest.spyOn(service as any, 'getTopSellingProducts').mockResolvedValue([]);

      const result = await service.getAnalytics();

      expect(result).toEqual({
        totalProducts: 100,
        activeProducts: 85,
        outOfStockProducts: 5,
        lowStockProducts: 10,
        averagePrice: 1500,
        topSellingProducts: [],
        categoryBreakdown: expect.any(Array),
        priceDistribution: expect.any(Array)
      });

      expect(result.categoryBreakdown).toHaveLength(1);
      expect(result.priceDistribution).toHaveLength(5);
    });
  });

  describe('performBulkAction', () => {
    it('should perform bulk activation', async () => {
      const bulkActionDto = {
        productIds: ['product-1', 'product-2'],
        action: 'ACTIVATE' as const
      };

      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
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
        productIds: ['product-1', 'non-existent'],
        action: 'ACTIVATE' as const
      };

      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(null);
      
      mockPrismaService.product.update
        .mockResolvedValueOnce({ ...mockProduct, isActive: true })
        .mockRejectedValueOnce(new Error('Product not found'));

      const result = await service.performBulkAction(bulkActionDto);

      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('getProductAnalytics', () => {
    it('should return product analytics for a given product ID', async () => {
      const mockProductWithRelations = {
        id: 'product-1',
        quotationItems: [{ quantity: 5 }, { quantity: 3 }],
        orderItems: [{ quantity: 10, unitPrice: 100 }],
        inventoryCount: 20,
        basePrice: 100,
      };
      mockPrismaService.product.findUnique.mockResolvedValue(mockProductWithRelations);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProductWithRelations);
      const result = await service.getProductAnalytics('product-1', {});
      expect(result.productId).toBe('product-1');
      expect(result.totalQuotations).toBe(8); // Sum of quotationItems quantities
      expect(result.totalQuantityOrdered).toBe(10);
      expect(result.totalRevenue).toBe(1000); // 10 * 100
    });
  });
});