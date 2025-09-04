import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFiltersDto } from './dto/product-filters.dto';
import { 
  ProductResponseDto, 
  PaginatedProductsResponseDto, 
  CategoryResponseDto,
  ProductPricingRuleDto,
  ProductAnalyticsDto,
  PricingCalculationDto
} from './dto/product-response.dto';
import { 
  CreateCategoryDto, 
  UpdateCategoryDto, 
  CreatePricingRuleDto,
  UpdateInventoryDto,
  BulkUpdateDto,
  ProductSearchDto
} from './dto/product-actions.dto';
import { Prisma, Currency, CustomerType } from '@prisma/client';
import { Customer, Order } from '@prisma/client';

type CategoryWithRelations = Prisma.CategoryGetPayload<{ include: { parent: true, children: true, products: true } }>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product with validation
   */
  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    // Check for duplicate SKU
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: dto.sku }
    });

    if (existingProduct) {
      throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
    }

    // Validate category if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId }
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }

      if (!category.isActive) {
        throw new BadRequestException('Cannot assign product to inactive category');
      }
    }

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description,
        categoryId: dto.categoryId,
        basePrice: dto.basePrice,
        currency: dto.currency || Currency.INR,
        specifications: dto.specifications,
        images: dto.images || [],
        inventoryCount: dto.inventoryCount,
        minOrderQty: dto.minOrderQty || 1,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
      include: {
        category: true
      }
    });

    return this.enrichProductData(product);
  }

  /**
   * Find all products with advanced filtering and search
   */
  async findAll(filters: ProductFiltersDto): Promise<PaginatedProductsResponseDto> {
    const {
      categoryId,
      sku,
      name,
      minPrice,
      maxPrice,
      currency,
      isActive,
      inStock,
      minInventory,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = filters;

    // Build where clause
    const where: Prisma.ProductWhereInput = {};

    if (categoryId) where.categoryId = categoryId;
    if (sku) where.sku = { contains: sku, mode: 'insensitive' };
    if (name) where.name = { contains: name, mode: 'insensitive' };
    if (currency) where.currency = currency;
    if (isActive !== undefined) where.isActive = isActive;

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = minPrice;
      if (maxPrice) where.basePrice.lte = maxPrice;
    }

    if (inStock !== undefined) {
      if (inStock) {
        where.inventoryCount = { gt: 0 };
      } else {
        where.OR = [
          { inventoryCount: { lte: 0 } },
          { inventoryCount: null }
        ];
      }
    }

    if (minInventory !== undefined) {
      where.inventoryCount = { ...(where.inventoryCount as any || {}), gte: minInventory };
    }

    // Full-text search across multiple fields
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build order by
    const orderBy: Prisma.ProductOrderByWithRelationInput = {};
    if (sortBy === 'categoryName') {
      orderBy.category = { name: sortOrder };
    } else {
      orderBy[sortBy as keyof Prisma.ProductOrderByWithRelationInput] = sortOrder;
    }

    // Execute queries
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          category: true,
          quotationItems: {
            select: { quantity: true }
          },
          orderItems: {
            select: { quantity: true }
          }
        }
      }),
      this.prisma.product.count({ where })
    ]);

    const enrichedProducts = products.map(product => this.enrichProductData(product));
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: enrichedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: totalPages > page,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Find a single product by ID with detailed information
   */
  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        quotationItems: {
          select: { quantity: true }
        },
        orderItems: {
          select: { quantity: true }
        },
        pricingRules: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.enrichProductData(product);
  }

  /**
   * Update a product with validation
   */
  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id }
    });

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check for SKU conflicts if SKU is being updated
    if (dto.sku && dto.sku !== existingProduct.sku) {
      const skuConflict = await this.prisma.product.findUnique({
        where: { sku: dto.sku }
      });

      if (skuConflict) {
        throw new ConflictException(`Product with SKU ${dto.sku} already exists`);
      }
    }

    // Validate category if being updated
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId }
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${dto.categoryId} not found`);
      }

      if (!category.isActive) {
        throw new BadRequestException('Cannot assign product to inactive category');
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date()
      },
      include: {
        category: true,
        quotationItems: {
          select: { quantity: true }
        },
        orderItems: {
          select: { quantity: true }
        }
      }
    });

    return this.enrichProductData(updatedProduct);
  }

  /**
   * Soft delete a product (mark as inactive)
   */
  async remove(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        quotationItems: { 
          include: { 
            quotation: true
          } 
        },
        orderItems: { 
          include: { 
            order: true
          } 
        }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Check for active quotations or orders
    const activeQuotations = (product as any).quotationItems?.filter((item: any) => 
      item.quotation && ['DRAFT', 'SENT'].includes(item.quotation.status)
    ) || [];
    const activeOrders = (product as any).orderItems?.filter((item: any) => 
      item.order && ['PENDING', 'PROCESSING'].includes(item.order.status)
    ) || [];

    if (activeQuotations.length > 0 || activeOrders.length > 0) {
      throw new BadRequestException(
        'Cannot delete product with active quotations or orders. Mark as inactive instead.'
      );
    }

    // Soft delete by marking as inactive
    await this.prisma.product.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Advanced product search with full-text capabilities
   */
  async search(dto: ProductSearchDto): Promise<ProductResponseDto[]> {
    const { query, categories, minPrice, maxPrice, inStockOnly, limit = 20 } = dto;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      OR: [
        { sku: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (categories && categories.length > 0) {
      where.categoryId = { in: categories };
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = minPrice;
      if (maxPrice) where.basePrice.lte = maxPrice;
    }

    if (inStockOnly) {
      where.inventoryCount = { gt: 0 };
    }

    const products = await this.prisma.product.findMany({
      where,
      take: limit,
      include: {
        category: true,
        quotationItems: {
          select: { quantity: true }
        },
        orderItems: {
          select: { quantity: true }
        }
      },
      orderBy: [
        { name: 'asc' }, // Prioritize exact name matches
        { createdAt: 'desc' }
      ]
    });

    return products.map(product => this.enrichProductData(product));
  }

  /**
   * Get all categories with hierarchy
   */
  async getCategories(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: { 
        parent: true, 
        children: { 
          include: { 
            parent: true, 
            children: true, 
            products: true 
          } 
        }, 
        products: true 
      }
    });

    const mappedCategories = categories.map(category => this.mapCategoryToDto(category));
    console.log('Mapped categories:', JSON.stringify(mappedCategories, null, 2)); // Log for verification
    return mappedCategories;
  }

  /**
   * Create a new category
   */
  async createCategory(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check for duplicate name
    const existingCategory = await this.prisma.category.findUnique({
      where: { name: dto.name }
    });

    if (existingCategory) {
      throw new ConflictException(`Category with name ${dto.name} already exists`);
    }

    // Validate parent category if provided
    if (dto.parentId) {
      const parentCategory = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        include: { parent: true, children: true, products: true }
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
      }

      if (!parentCategory.isActive) {
        throw new BadRequestException('Cannot create category under inactive parent');
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId
      },
      include: { 
        parent: true, 
        children: { 
          include: { 
            parent: true, 
            children: true, 
            products: true 
          } 
        }, 
        products: true 
      }
    });

    return this.mapCategoryToDto(category);
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: { parent: true, children: true, products: true }
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Check for name conflicts if name is being updated
    if (dto.name && dto.name !== existingCategory.name) {
      const nameConflict = await this.prisma.category.findUnique({
        where: { name: dto.name }
      });

      if (nameConflict) {
        throw new ConflictException(`Category with name ${dto.name} already exists`);
      }
    }

    // Validate parent category if being updated
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parentCategory = await this.prisma.category.findUnique({
        where: { id: dto.parentId }
      });

      if (!parentCategory) {
        throw new NotFoundException(`Parent category with ID ${dto.parentId} not found`);
      }

      if (!parentCategory.isActive) {
        throw new BadRequestException('Cannot set inactive category as parent');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date()
      },
      include: { 
        parent: true, 
        children: { 
          include: { 
            parent: true, 
            children: true, 
            products: true 
          } 
        }, 
        products: true 
      }
    });

    return this.mapCategoryToDto(updatedCategory);
  }

  /**
   * Get pricing rules for a product
   */
  async getPricingRules(productId: string, customerId?: string): Promise<ProductPricingRuleDto[]> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    let customerType: CustomerType | undefined;
    if (customerId) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId }
      });
      customerType = customer?.customerType;
    }

    const where: Prisma.ProductPricingRuleWhereInput = {
      productId,
      isActive: true,
      validFrom: { lte: new Date() },
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    };

    if (customerType) {
      where.OR = [
        { customerType: null }, // General rules
        { customerType }        // Customer type specific rules
      ];
    } else {
      where.customerType = null; // Only general rules
    }

    const pricingRules = await this.prisma.productPricingRule.findMany({
      where,
      orderBy: [
        { customerType: 'desc' }, // Customer-specific rules first
        { minQuantity: 'asc' }    // Lower quantity thresholds first
      ]
    });

    return pricingRules.map(rule => ({
      id: rule.id,
      productId: rule.productId,
      customerType: rule.customerType,
      minQuantity: rule.minQuantity,
      maxQuantity: rule.maxQuantity,
      discountPercent: rule.discountPercent.toNumber(),
      fixedPrice: rule.fixedPrice?.toNumber(),
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
      isActive: rule.isActive,
      createdAt: rule.createdAt,
    }));
  }

  /**
   * Create a pricing rule for a product
   */
  async createPricingRule(dto: CreatePricingRuleDto): Promise<ProductPricingRuleDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    if (!dto.discountPercent && !dto.fixedPrice) {
      throw new BadRequestException('Either discountPercent or fixedPrice must be provided');
    }

    if (dto.maxQuantity && dto.maxQuantity <= dto.minQuantity) {
      throw new BadRequestException('maxQuantity must be greater than minQuantity');
    }

    const pricingRule = await this.prisma.productPricingRule.create({
      data: {
        productId: dto.productId,
        customerType: dto.customerType,
        minQuantity: dto.minQuantity,
        maxQuantity: dto.maxQuantity,
        discountPercent: dto.discountPercent || 0,
        fixedPrice: dto.fixedPrice,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined
      }
    });

    return {
      id: pricingRule.id,
      productId: pricingRule.productId,
      customerType: pricingRule.customerType,
      minQuantity: pricingRule.minQuantity,
      maxQuantity: pricingRule.maxQuantity,
      discountPercent: pricingRule.discountPercent.toNumber(),
      fixedPrice: pricingRule.fixedPrice?.toNumber(),
      validFrom: pricingRule.validFrom,
      validUntil: pricingRule.validUntil,
      isActive: pricingRule.isActive,
      createdAt: pricingRule.createdAt,
    };
  }

  /**
   * Calculate pricing for a product based on quantity and customer
   */
  async calculatePricing(productId: string, quantity: number, customerId?: string): Promise<PricingCalculationDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const basePrice = Number(product.basePrice);
    const pricingRules = await this.getPricingRules(productId, customerId);

    // Find applicable rules for the given quantity
    const applicableRules = pricingRules.filter(rule => {
      const meetsMinQuantity = quantity >= rule.minQuantity;
      const meetsMaxQuantity = !rule.maxQuantity || quantity <= rule.maxQuantity;
      return meetsMinQuantity && meetsMaxQuantity;
    });

    let finalPrice = basePrice;
    let totalDiscount = 0;

    if (applicableRules.length > 0) {
      // Use the most specific rule (customer-specific over general, higher quantity threshold)
      const bestRule = applicableRules.reduce((best, current) => {
        // Prioritize customer-specific rules
        if (current.customerType && !best.customerType) return current;
        if (!current.customerType && best.customerType) return best;
        
        // Then prioritize higher quantity thresholds
        return current.minQuantity > best.minQuantity ? current : best;
      });

      if (bestRule.fixedPrice) {
        finalPrice = Number(bestRule.fixedPrice);
        totalDiscount = basePrice - finalPrice;
      } else if (bestRule.discountPercent) {
        const discountAmount = basePrice * (Number(bestRule.discountPercent) / 100);
        finalPrice = basePrice - discountAmount;
        totalDiscount = discountAmount;
      }
    }

    const discountPercentage = basePrice > 0 ? (totalDiscount / basePrice) * 100 : 0;

    return {
      productId,
      customerId,
      quantity,
      basePrice,
      applicableRules,
      finalPrice: Math.max(0, finalPrice), // Ensure non-negative price
      totalDiscount,
      discountPercentage
    };
  }

  /**
   * Update product inventory
   */
  async updateInventory(id: string, dto: UpdateInventoryDto): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    let newInventoryCount: number;
    const currentInventory = product.inventoryCount || 0;

    switch (dto.operation) {
      case 'ADD':
        newInventoryCount = currentInventory + dto.quantity;
        break;
      case 'SUBTRACT':
        newInventoryCount = Math.max(0, currentInventory - dto.quantity);
        break;
      case 'SET':
      default:
        newInventoryCount = dto.quantity;
        break;
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { 
        inventoryCount: newInventoryCount,
        updatedAt: new Date()
      },
      include: {
        category: true
      }
    });

    return this.enrichProductData(updatedProduct);
  }

  /**
   * Get product analytics
   */
  async getAnalytics(): Promise<ProductAnalyticsDto> {
    console.log('Verifying getAnalytics method execution');
    const [
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      averagePrice,
      categoryBreakdown,
      totalQuotations,
      approvedQuotations,
      totalQuantityQuoted,
      totalQuantityOrdered,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.product.count(),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.count({ 
        where: { 
          isActive: true,
          OR: [
            { inventoryCount: { lte: 0 } },
            { inventoryCount: null }
          ]
        } 
      }),
      this.prisma.product.count({ 
        where: { 
          isActive: true,
          inventoryCount: { gt: 0, lte: 10 } 
        } 
      }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _avg: { basePrice: true }
      }),
      this.prisma.category.findMany({
        where: { isActive: true },
        include: { 
          parent: true, 
          children: { 
            include: { 
              parent: true, 
              children: true, 
              products: true 
            } 
          }, 
          products: true 
        }
      }),
      this.prisma.quotation.count(),
      this.prisma.quotation.count({ where: { status: 'APPROVED' } }),
      this.prisma.quotationItem.aggregate({
        _sum: { quantity: true },
        where: { quotation: { status: { not: 'REJECTED' } } }
      }),
      this.prisma.orderItem.aggregate({
        _sum: { quantity: true },
        where: { order: { status: { in: ['DELIVERED', 'PAID'] } } }
      }),
      this.prisma.orderItem.aggregate({
        _sum: { lineTotal: true },
        where: { order: { status: { in: ['DELIVERED', 'PAID'] } } }
      }),
    ]);

    const conversionRate = totalQuotations > 0 ? (approvedQuotations / totalQuotations) * 100 : 0;

    const monthlyTrends: Array<{ month: string; quotations: number; orders: number; revenue: number; quantity: number }> = []; // Implement logic if needed

    const topCustomers = await this.prisma.customer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }, // Fallback ordering; consider enhancing for accuracy
      include: { orders: { include: { items: true } } }
    }).then((customers) => customers.map((cust: Customer & { orders: Order[] }) => {
      const totalOrders = cust.orders.length;
      const totalQuantity = cust.orders.reduce((sum: number, order: Order & { items: { quantity: number }[] }) => sum + order.items.reduce((itemSum: number, item: { quantity: number }) => itemSum + item.quantity, 0), 0);
      const totalValue = cust.orders.reduce((sum: number, order: Order) => sum + order.totalAmount.toNumber(), 0);
      return {
        customerId: cust.id,
        companyName: cust.companyName,
        totalOrders,
        totalQuantity,
        totalValue
      };
    })) as Array<{ customerId: string; companyName: string; totalOrders: number; totalQuantity: number; totalValue: number }>;

    const inventoryAnalysis = {
      currentStock: 0,
      averageMonthlyUsage: 0,
      stockoutRisk: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH',
      reorderPoint: 10
    };

    const categoryBreakdownFormatted = categoryBreakdown.map((category) => ({
      category: this.mapCategoryToDto(category),
      productCount: category.products ? category.products.length : 0,
      totalValue: category.products.reduce((sum: number, product: any) => sum + Number(product.basePrice), 0)
    }));

    const priceRanges = [
      { range: '0-1000', min: 0, max: 1000 },
      { range: '1001-5000', min: 1001, max: 5000 },
      { range: '5001-10000', min: 5001, max: 10000 },
      { range: '10001-50000', min: 10001, max: 50000 },
      { range: '50000+', min: 50001, max: null }
    ];
    const priceDistribution = await Promise.all(
      priceRanges.map(async (range) => {
        const where: any = { isActive: true, basePrice: { gte: range.min } };
        if (range.max) where.basePrice.lte = range.max;
        const count = await this.prisma.product.count({ where });
        return { range: range.range, count };
      })
    );

    const topSellingProducts = await this.getTopSellingProducts(5);

    return {
      totalProducts,
      activeProducts,
      outOfStockProducts,
      lowStockProducts,
      averagePrice: Number(averagePrice._avg.basePrice || 0),
      totalQuotations,
      approvedQuotations,
      conversionRate,
      totalQuantityQuoted: totalQuantityQuoted._sum.quantity || 0,
      totalQuantityOrdered: totalQuantityOrdered._sum.quantity || 0,
      totalRevenue: totalRevenue._sum.lineTotal ? Number(totalRevenue._sum.lineTotal) : 0,
      averageQuotationValue: 0, // Add calculation if needed
      profitMargin: 0, // Placeholder
      monthlyTrends,
      topCustomers,
      inventoryAnalysis,
      topSellingProducts,
      categoryBreakdown: categoryBreakdownFormatted,
      priceDistribution
    };
  }

  /**
   * Get analytics for a specific product
   */
  async getProductAnalytics(id: string, filters: any): Promise<ProductAnalyticsDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        orderItems: { include: { order: true } },
        quotationItems: { include: { quotation: true } }
      }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Placeholder for full DTO fields; implement based on actual data
    return {
      productId: id,
      totalQuotations: product.quotationItems.length,
      approvedQuotations: 0, // Assume 0 or compute from filters if available
      conversionRate: 0, // Compute if data available
      totalQuantityQuoted: product.quotationItems.reduce((sum, item) => sum + item.quantity, 0),
      totalQuantityOrdered: product.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      averageQuotationValue: 0, // Compute from quotations
      totalRevenue: product.orderItems.reduce((sum, item) => sum + (item.quantity * Number(item.unitPrice || product.basePrice)), 0),
      profitMargin: 0, // Assume 0 or compute
      monthlyTrends: [], // Implement if filters provide date range
      topCustomers: [], // Implement if data available
      inventoryAnalysis: {
        currentStock: product.inventoryCount || 0,
        averageMonthlyUsage: 0, // Compute from historical data
        stockoutRisk: 'LOW', // Placeholder, compute based on logic
        reorderPoint: 10, // Example value, should be configurable
      },
      totalProducts: 0, // This seems global; may need adjustment
      activeProducts: 0, // Global field, potentially misplaced
      outOfStockProducts: 0, // Global, not product-specific
      lowStockProducts: 0, // Global, not product-specific
      averagePrice: 0, // Global, not product-specific
      topSellingProducts: [], // Global, not product-specific
      categoryBreakdown: [], // Global, not product-specific
      priceDistribution: [], // Global, not product-specific
    } as ProductAnalyticsDto;
  }

  /**
   * Perform bulk actions on products
   */
  async performBulkAction(dto: BulkUpdateDto): Promise<{ success: number; failed: number; errors: string[] }> {
    const { productIds, action, data } = dto;
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const productId of productIds) {
      try {
        switch (action) {
          case 'ACTIVATE':
            await this.update(productId, { isActive: true });
            break;
          case 'DEACTIVATE':
            await this.update(productId, { isActive: false });
            break;
          case 'UPDATE_CATEGORY':
            await this.update(productId, { categoryId: data.categoryId });
            break;
          case 'UPDATE_PRICE':
            await this.update(productId, { basePrice: data.basePrice });
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Get top selling products
   */
  private async getTopSellingProducts(limit: number = 10): Promise<Array<{ product: ProductResponseDto; totalSold: number; revenue: number }>> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        orderItems: {
          include: {
            order: true
          }
        }
      },
      take: 50 // Get more than needed to calculate sales
    });

    const productsWithSales = products.map(product => {
      const orderItems = (product as any).orderItems || [];
      const totalSold = orderItems
        .filter((item: any) => item.order && ['DELIVERED', 'PAID'].includes(item.order.status))
        .reduce((sum: number, item: any) => sum + item.quantity, 0);
      
      const revenue = orderItems
        .filter((item: any) => item.order && ['DELIVERED', 'PAID'].includes(item.order.status))
        .reduce((sum: number, item: any) => sum + (item.quantity * Number(item.unitPrice)), 0);

      return {
        product: this.enrichProductData(product),
        totalSold,
        revenue
      };
    });

    return productsWithSales
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, limit);
  }

  /**
   * Import products
   */
  async importProducts(importData: any): Promise<any> {
    throw new Error('Import functionality not implemented');
  }

  /**
   * Enrich product data with computed fields
   */
  private enrichProductData(product: any): ProductResponseDto {
    const enriched = { ...product } as ProductResponseDto;

    // Calculate effective price (could include default discounts)
    enriched.effectivePrice = Number(product.basePrice);

    // Check if in stock
    enriched.isInStock = product.inventoryCount ? product.inventoryCount > 0 : false;

    // Calculate total sold
    if ((product as any).orderItems) {
      enriched.totalSold = (product as any).orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    }

    return enriched;
  }

  /**
   * Recursive mapping function for categories
   */
  private mapCategoryToDto(category: CategoryWithRelations): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId ?? undefined,
      parent: category.parent ? this.mapCategoryToDto(category.parent as CategoryWithRelations) : undefined,
      children: category.children ? category.children.map(child => this.mapCategoryToDto(child as CategoryWithRelations)) : [],
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      productCount: category.products ? category.products.length : 0
    } as CategoryResponseDto;
  }
}
