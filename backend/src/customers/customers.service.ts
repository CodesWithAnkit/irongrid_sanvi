import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFiltersDto } from './dto/customer-filters.dto';
import { 
  CustomerResponseDto, 
  PaginatedCustomersResponseDto, 
  CustomerInteractionDto,
  CustomerSegmentDto,
  CustomerAnalyticsDto,
  CustomerSpecificAnalyticsDto,
  ImportResultDto
} from './dto/customer-response.dto';
import { 
  CreateInteractionDto, 
  UpdateCreditLimitDto, 
  CustomerSegmentationDto,
  BulkActionDto
} from './dto/customer-actions.dto';
import { Prisma, CustomerType } from '@prisma/client';
// import * as csv from 'csv-parser';
// import { Readable } from 'stream';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new customer with validation
   */
  async create(dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    // Check for duplicate email
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: dto.email }
    });

    if (existingCustomer) {
      throw new ConflictException(`Customer with email ${dto.email} already exists`);
    }

    const customer = await this.prisma.customer.create({
      data: {
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        alternatePhone: dto.alternatePhone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country || 'India',
        postalCode: dto.postalCode,
        customerType: dto.customerType || CustomerType.SMALL_BUSINESS,
        creditLimit: dto.creditLimit || 0,
        paymentTerms: dto.paymentTerms || 'NET_30',
        taxId: dto.taxId,
        gstNumber: dto.gstNumber,
        notes: dto.notes,
      }
    });

    return this.enrichCustomerData(customer);
  }

  /**
   * Find all customers with advanced filtering and search
   */
  async findAll(filters: CustomerFiltersDto): Promise<PaginatedCustomersResponseDto> {
    const {
      customerType,
      paymentTerms,
      city,
      state,
      country,
      createdAfter,
      createdBefore,
      minCreditLimit,
      maxCreditLimit,
      isActive,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = filters;

    // Build where clause
    const where: Prisma.CustomerWhereInput = {};

    if (customerType) where.customerType = customerType;
    if (paymentTerms) where.paymentTerms = paymentTerms;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (state) where.state = { contains: state, mode: 'insensitive' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive;

    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }

    if (minCreditLimit || maxCreditLimit) {
      where.creditLimit = {};
      if (minCreditLimit) where.creditLimit.gte = minCreditLimit;
      if (maxCreditLimit) where.creditLimit.lte = maxCreditLimit;
    }

    // Full-text search across multiple fields
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
        { gstNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build order by
    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.CustomerOrderByWithRelationInput] = sortOrder;

    // Execute queries
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          quotations: {
            select: { id: true, totalAmount: true, status: true }
          },
          orders: {
            select: { id: true, totalAmount: true, status: true }
          },
          interactions: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      this.prisma.customer.count({ where })
    ]);

    const enrichedCustomers = customers.map(customer => this.enrichCustomerData(customer));
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: enrichedCustomers,
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Find a single customer by ID with detailed information
   */
  async findOne(id: string): Promise<CustomerResponseDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: {
          select: { 
            id: true, 
            quotationNumber: true,
            totalAmount: true, 
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          select: { 
            id: true, 
            orderNumber: true,
            totalAmount: true, 
            status: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        interactions: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.enrichCustomerData(customer);
  }

  /**
   * Get customer quotations
   */
  async getCustomerQuotations(id: string, filters: any): Promise<any> {
    console.log(`Fetching quotations for customer ID: ${id} with filters:`, filters);
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const whereClause: Prisma.QuotationWhereInput = { customerId: id };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    const limit = filters.limit ? parseInt(filters.limit, 10) : 20;
    const offset = filters.offset ? parseInt(filters.offset, 10) : 0;

    const quotations = await this.prisma.quotation.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await this.prisma.quotation.count({ where: whereClause });

    return { data: quotations, total, limit, offset };
  }

  /**
   * Update a customer with validation
   */
  async update(id: string, dto: UpdateCustomerDto): Promise<CustomerResponseDto> {
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { id }
    });

    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check for email conflicts if email is being updated
    if (dto.email && dto.email !== existingCustomer.email) {
      const emailConflict = await this.prisma.customer.findUnique({
        where: { email: dto.email }
      });

      if (emailConflict) {
        throw new ConflictException(`Customer with email ${dto.email} already exists`);
      }
    }

    const updatedCustomer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date()
      },
      include: {
        quotations: {
          select: { id: true, totalAmount: true, status: true }
        },
        orders: {
          select: { id: true, totalAmount: true, status: true }
        },
        interactions: {
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return this.enrichCustomerData(updatedCustomer);
  }

  /**
   * Soft delete a customer (mark as inactive)
   */
  async remove(id: string): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        quotations: { where: { status: { in: ['DRAFT', 'SENT'] } } },
        orders: { where: { status: { in: ['PENDING', 'PROCESSING'] } } }
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check for active quotations or orders
    if (customer.quotations.length > 0 || customer.orders.length > 0) {
      throw new BadRequestException(
        'Cannot delete customer with active quotations or orders. Mark as inactive instead.'
      );
    }

    // Soft delete by marking as inactive
    await this.prisma.customer.update({
      where: { id },
      data: { isActive: false }
    });
  }

  /**
   * Get customer interaction history
   */
  async getInteractionHistory(customerId: string): Promise<CustomerInteractionDto[]> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const interactions = await this.prisma.customerInteraction.findMany({
      where: { customerId },
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

    return interactions as CustomerInteractionDto[];
  }

  /**
   * Create a customer interaction
   */
  async createInteraction(dto: CreateInteractionDto, userId: string): Promise<CustomerInteractionDto> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const interaction = await this.prisma.customerInteraction.create({
      data: {
        customerId: dto.customerId,
        userId,
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return interaction as CustomerInteractionDto;
  }

  /**
   * Calculate customer lifetime value
   */
  async calculateLifetimeValue(customerId: string): Promise<number> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const orderTotal = await this.prisma.order.aggregate({
      where: { 
        customerId,
        status: { in: ['DELIVERED', 'PAID'] }
      },
      _sum: { totalAmount: true }
    });

    return Number(orderTotal._sum.totalAmount || 0);
  }

  /**
   * Segment customers based on criteria
   */
  async segmentCustomers(dto: CustomerSegmentationDto): Promise<CustomerSegmentDto[]> {
    const { criteria, filters } = dto;
    const segments: CustomerSegmentDto[] = [];

    switch (criteria) {
      case 'BUSINESS_TYPE':
        const typeSegments = await this.prisma.customer.groupBy({
          by: ['customerType'],
          where: { isActive: true },
          _count: { customerType: true },
          _sum: { creditLimit: true }
        });

        for (const segment of typeSegments) {
          const customers = await this.prisma.customer.findMany({
            where: { 
              customerType: segment.customerType,
              isActive: true
            },
            take: 10 // Limit for performance
          });

          segments.push({
            segment: segment.customerType,
            count: segment._count.customerType,
            totalValue: Number(segment._sum.creditLimit || 0),
            averageValue: Number(segment._sum.creditLimit || 0) / segment._count.customerType,
            customers: customers.map(c => this.enrichCustomerData(c))
          });
        }
        break;

      case 'VOLUME':
        // Segment by order volume
        const volumeSegments = [
          { name: 'High Volume', min: 100000 },
          { name: 'Medium Volume', min: 50000, max: 99999 },
          { name: 'Low Volume', max: 49999 }
        ];

        for (const volumeSegment of volumeSegments) {
          const where: any = { isActive: true };
          if (volumeSegment.min) where.creditLimit = { gte: volumeSegment.min };
          if (volumeSegment.max) where.creditLimit = { ...where.creditLimit, lte: volumeSegment.max };

          const [count, customers] = await Promise.all([
            this.prisma.customer.count({ where }),
            this.prisma.customer.findMany({ where, take: 10 })
          ]);

          const totalValue = await this.prisma.customer.aggregate({
            where,
            _sum: { creditLimit: true }
          });

          segments.push({
            segment: volumeSegment.name,
            count,
            totalValue: Number(totalValue._sum.creditLimit || 0),
            averageValue: count > 0 ? Number(totalValue._sum.creditLimit || 0) / count : 0,
            customers: customers.map(c => this.enrichCustomerData(c))
          });
        }
        break;

      case 'LOCATION':
        const locationSegments = await this.prisma.customer.groupBy({
          by: ['state'],
          where: { isActive: true, state: { not: null } },
          _count: { state: true }
        });

        for (const segment of locationSegments) {
          if (!segment.state) continue;

          const customers = await this.prisma.customer.findMany({
            where: { 
              state: segment.state,
              isActive: true
            },
            take: 10
          });

          const totalValue = await this.prisma.customer.aggregate({
            where: { state: segment.state, isActive: true },
            _sum: { creditLimit: true }
          });

          segments.push({
            segment: segment.state,
            count: segment._count.state,
            totalValue: Number(totalValue._sum.creditLimit || 0),
            averageValue: Number(totalValue._sum.creditLimit || 0) / segment._count.state,
            customers: customers.map(c => this.enrichCustomerData(c))
          });
        }
        break;
    }

    return segments;
  }

  /**
   * Get customer analytics
   */
  async getAnalytics(): Promise<CustomerAnalyticsDto> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      segmentBreakdown,
      topCustomers
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { isActive: true } }),
      this.prisma.customer.count({ 
        where: { 
          createdAt: { gte: startOfMonth },
          isActive: true 
        } 
      }),
      this.prisma.customer.groupBy({
        by: ['customerType'],
        where: { isActive: true },
        _count: { customerType: true }
      }),
      this.getTopCustomersByValue(5)
    ]);

    // Calculate average lifetime value
    const lifetimeValues = await Promise.all(
      (await this.prisma.customer.findMany({ 
        where: { isActive: true },
        select: { id: true }
      })).map(c => this.calculateLifetimeValue(c.id))
    );

    const averageLifetimeValue = lifetimeValues.length > 0 
      ? lifetimeValues.reduce((sum, val) => sum + val, 0) / lifetimeValues.length 
      : 0;

    // Generate monthly growth data (last 12 months)
    const monthlyGrowth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [newCustomers, monthlyValue] = await Promise.all([
        this.prisma.customer.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: { in: ['DELIVERED', 'PAID'] }
          },
          _sum: { totalAmount: true }
        })
      ]);

      monthlyGrowth.push({
        month: date.toISOString().substring(0, 7),
        newCustomers,
        totalValue: Number(monthlyValue._sum.totalAmount || 0)
      });
    }

    const segmentBreakdownMap = segmentBreakdown.reduce((acc, item) => {
      acc[item.customerType] = item._count.customerType;
      return acc;
    }, {} as Record<CustomerType, number>);

    return {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      averageLifetimeValue,
      topCustomersByValue: topCustomers,
      segmentBreakdown: segmentBreakdownMap,
      monthlyGrowth
    };
  }

  /**
   * Get analytics for a specific customer
   */
  async getCustomerAnalytics(customerId: string, filters: any = {}): Promise<CustomerSpecificAnalyticsDto> {
    const customer = await this.findOne(customerId);
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const [orderTotal, quotationCount] = await Promise.all([
      this.prisma.order.aggregate({
        where: { customerId, status: { in: ['DELIVERED', 'PAID'] } },
        _sum: { totalAmount: true }
      }),
      this.prisma.quotation.count({ where: { customerId } })
    ]);

    const lifetimeValue = await this.calculateLifetimeValue(customerId);
    const interactionCount = await this.prisma.customerInteraction.count({ where: { customerId } });

    return {
      customerId,
      lifetimeValue: Number(orderTotal._sum.totalAmount || 0),
      totalQuotations: quotationCount,
      totalInteractions: interactionCount,
    } as CustomerSpecificAnalyticsDto;
  }

  /**
   * Import customers from CSV file (placeholder implementation)
   */
  async importCustomers(file: any): Promise<ImportResultDto> {
    // TODO: Implement CSV parsing when csv-parser is available
    const results: ImportResultDto = {
      totalProcessed: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: [],
      duplicatesFound: 0,
      duplicatesSkipped: 0
    };

    // Placeholder implementation
    throw new Error('CSV import functionality not yet implemented');
  }

  /**
   * Update customer credit limit
   */
  async updateCreditLimit(customerId: string, dto: UpdateCreditLimitDto, userId: string): Promise<CustomerResponseDto> {
    const customer = await this.findOne(customerId);
    const newCreditLimit = parseFloat(dto.creditLimit);

    const updatedCustomer = await this.update(customerId, {
      creditLimit: newCreditLimit
    });

    // Log the credit limit change as an interaction
    await this.createInteraction({
      customerId,
      type: 'NOTE',
      subject: 'Credit Limit Updated',
      description: `Credit limit updated from ${customer.creditLimit} to ${newCreditLimit}. Reason: ${dto.reason || 'Not specified'}`
    }, userId);

    return updatedCustomer;
  }

  /**
   * Perform bulk actions on customers
   */
  async performBulkAction(dto: BulkActionDto): Promise<{ success: number; failed: number; errors: string[] }> {
    const { customerIds, action, data } = dto;
    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (const customerId of customerIds) {
      try {
        switch (action) {
          case 'ACTIVATE':
            await this.update(customerId, { isActive: true });
            break;
          case 'DEACTIVATE':
            await this.update(customerId, { isActive: false });
            break;
          case 'UPDATE_PAYMENT_TERMS':
            await this.update(customerId, { paymentTerms: data.paymentTerms });
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Customer ${customerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Get top customers by lifetime value
   */
  private async getTopCustomersByValue(limit: number = 10): Promise<Array<{ customer: CustomerResponseDto; lifetimeValue: number }>> {
    const customers = await this.prisma.customer.findMany({
      where: { isActive: true },
      include: {
        orders: {
          where: { status: { in: ['DELIVERED', 'PAID'] } },
          select: { totalAmount: true }
        }
      },
      take: 50 // Get more than needed to calculate LTV
    });

    const customersWithLTV = await Promise.all(
      customers.map(async (customer) => ({
        customer: this.enrichCustomerData(customer),
        lifetimeValue: await this.calculateLifetimeValue(customer.id)
      }))
    );

    return customersWithLTV
      .sort((a, b) => b.lifetimeValue - a.lifetimeValue)
      .slice(0, limit);
  }

  /**
   * Enrich customer data with computed fields
   */
  private enrichCustomerData(customer: any): CustomerResponseDto {
    const enriched = { ...customer } as CustomerResponseDto;

    if (customer.quotations) {
      enriched.totalQuotations = customer.quotations.length;
    }

    if (customer.orders) {
      enriched.totalOrders = customer.orders.length;
    }

    if (customer.interactions && customer.interactions.length > 0) {
      enriched.lastInteractionAt = customer.interactions[0].createdAt;
    }

    return enriched;
  }
}
