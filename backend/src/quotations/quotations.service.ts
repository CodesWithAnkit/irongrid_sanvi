import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationFiltersDto } from './dto/quotation-filters.dto';
import { QuotationResponseDto, PaginatedQuotationsResponseDto, QuotationAnalyticsDto } from './dto/quotation-response.dto';
import { SendQuotationEmailDto, DuplicateQuotationDto, ConvertToOrderDto, ApproveQuotationDto } from './dto/quotation-actions.dto';
import { QuotationConfigService } from './quotation-config.service';
import { QuotationStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface QuotationWithRelations {
  id: string;
  quotationNumber: string;
  customerId: string;
  status: QuotationStatus;
  subtotal: Decimal;
  discountAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
  validUntil?: Date;
  termsConditions?: string;
  notes?: string;
  pdfUrl?: string;
  emailSentAt?: Date;
  customerViewedAt?: Date;
  customerRespondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId?: string;
  customer?: any;
  items?: any[];
  createdBy?: any;
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: QuotationConfigService,
  ) {}

  /**
   * Generate a unique quotation number based on configuration
   */
  private async generateQuotationNumber(): Promise<string> {
    const config = this.configService.getQuotationNumberConfig();
    const now = new Date();
    
    const prefix = config.prefix;
    const datePart = this.configService.formatDatePart(now, config.dateFormat);
    const separator = config.separator;
    
    // Get the reset period key for sequence numbering
    const resetPeriodKey = this.configService.getResetPeriodKey(now, config.resetSequence);
    
    // Find the last quotation number for this period
    let sequenceNumber = 1;
    
    if (config.resetSequence !== 'NEVER') {
      const lastQuotation = await this.prisma.quotation.findFirst({
        where: {
          quotationNumber: {
            startsWith: `${prefix}${separator}${datePart}${separator}`
          }
        },
        orderBy: { quotationNumber: 'desc' }
      });
      
      if (lastQuotation) {
        const lastNumberPart = lastQuotation.quotationNumber.split(separator).pop();
        if (lastNumberPart && !isNaN(parseInt(lastNumberPart))) {
          sequenceNumber = parseInt(lastNumberPart) + 1;
        }
      }
    } else {
      // For NEVER reset, get the global sequence
      const lastQuotation = await this.prisma.quotation.findFirst({
        orderBy: { quotationNumber: 'desc' }
      });
      
      if (lastQuotation) {
        const lastNumberPart = lastQuotation.quotationNumber.split(separator).pop();
        if (lastNumberPart && !isNaN(parseInt(lastNumberPart))) {
          sequenceNumber = parseInt(lastNumberPart) + 1;
        }
      }
    }
    
    const paddedSequence = String(sequenceNumber).padStart(config.sequenceLength, '0');
    const quotationNumber = `${prefix}${separator}${datePart}${separator}${paddedSequence}`;
    
    // Ensure uniqueness
    const existing = await this.prisma.quotation.findUnique({
      where: { quotationNumber }
    });
    
    if (existing) {
      // If somehow we have a collision, try with next number
      return this.generateQuotationNumber();
    }
    
    return quotationNumber;
  }

  /**
   * Validate quotation status transitions
   */
  private validateStatusTransition(currentStatus: QuotationStatus, newStatus: QuotationStatus): boolean {
    const validTransitions: Record<QuotationStatus, QuotationStatus[]> = {
      [QuotationStatus.DRAFT]: [QuotationStatus.SENT, QuotationStatus.REJECTED],
      [QuotationStatus.SENT]: [QuotationStatus.APPROVED, QuotationStatus.REJECTED, QuotationStatus.EXPIRED],
      [QuotationStatus.APPROVED]: [QuotationStatus.REJECTED], // Can be rejected even after approval
      [QuotationStatus.REJECTED]: [], // Terminal state
      [QuotationStatus.EXPIRED]: [QuotationStatus.SENT], // Can be resent
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Calculate quotation totals with business rules
   */
  private calculateQuotationTotals(items: any[]): {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    let totalDiscountAmount = 0;

    for (const item of items) {
      const lineSubtotal = item.quantity * item.unitPrice;
      const lineDiscount = item.discountAmount || 0;
      
      subtotal += lineSubtotal;
      totalDiscountAmount += lineDiscount;
    }

    // Tax calculation (simplified - in real implementation, this would be more complex)
    const taxableAmount = subtotal - totalDiscountAmount;
    const taxAmount = taxableAmount * 0.18; // 18% GST for India
    
    const totalAmount = subtotal - totalDiscountAmount + taxAmount;

    return {
      subtotal,
      discountAmount: totalDiscountAmount,
      taxAmount,
      totalAmount
    };
  }

  /**
   * Create a new quotation with comprehensive validation
   */
  async create(dto: CreateQuotationDto, createdByUserId?: string): Promise<QuotationResponseDto> {
    // Validate input
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Quotation must contain at least one item');
    }

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    if (!customer.isActive) {
      throw new BadRequestException('Cannot create quotation for inactive customer');
    }

    // Validate all products exist and are active
    const productIds = dto.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: { 
        id: { in: productIds },
        isActive: true
      }
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Products not found or inactive: ${missingIds.join(', ')}`);
    }

    // Calculate line totals and validate quantities
    const processedItems = dto.items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }

      if (item.quantity < product.minOrderQty) {
        throw new BadRequestException(
          `Minimum order quantity for ${product.name} is ${product.minOrderQty}`
        );
      }

      const lineSubtotal = item.quantity * item.unitPrice;
      const discountAmount = item.discount || 0;
      const lineTotal = lineSubtotal - discountAmount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount,
        lineTotal
      };
    });

    // Calculate quotation totals
    const totals = this.calculateQuotationTotals(processedItems);

    // Generate quotation number
    const quotationNumber = await this.generateQuotationNumber();

    // Set default valid until date (30 days from now)
    const validUntil = dto.validUntil 
      ? new Date(dto.validUntil) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create quotation with transaction
    const quotation = await this.prisma.$transaction(async (tx) => {
      const newQuotation = await tx.quotation.create({
        data: {
          quotationNumber,
          customerId: dto.customerId,
          status: QuotationStatus.DRAFT,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          validUntil,
          createdByUserId,
          items: {
            create: processedItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount,
              lineTotal: item.lineTotal
            }))
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  description: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      return newQuotation;
    });

    return quotation as QuotationResponseDto;
  }

  /**
   * Find all quotations with advanced filtering and pagination
   */
  async findAll(filters: QuotationFiltersDto): Promise<PaginatedQuotationsResponseDto> {
    const {
      status,
      customerId,
      quotationNumber,
      createdAfter,
      createdBefore,
      validAfter,
      validBefore,
      customerName,
      minAmount,
      maxAmount,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = filters;

    // Build where clause
    const where: Prisma.QuotationWhereInput = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (quotationNumber) where.quotationNumber = { contains: quotationNumber, mode: 'insensitive' };
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }
    if (validAfter || validBefore) {
      where.validUntil = {};
      if (validAfter) where.validUntil.gte = new Date(validAfter);
      if (validBefore) where.validUntil.lte = new Date(validBefore);
    }
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = minAmount;
      if (maxAmount) where.totalAmount.lte = maxAmount;
    }

    if (customerName) {
      where.customer = {
        OR: [
          { companyName: { contains: customerName, mode: 'insensitive' } },
          { contactPerson: { contains: customerName, mode: 'insensitive' } }
        ]
      };
    }

    if (search) {
      where.OR = [
        { quotationNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { customer: { contactPerson: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build order by
    const orderBy: Prisma.QuotationOrderByWithRelationInput = {};
    if (sortBy === 'customerName') {
      orderBy.customer = { companyName: sortOrder };
    } else {
      orderBy[sortBy as keyof Prisma.QuotationOrderByWithRelationInput] = sortOrder;
    }

    // Execute queries
    const [quotations, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
              email: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  sku: true,
                  name: true,
                  description: true
                }
              }
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      this.prisma.quotation.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: quotations as QuotationResponseDto[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Find a single quotation by ID
   */
  async findOne(id: string): Promise<QuotationResponseDto> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true,
            phone: true,
            address: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true,
                specifications: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    return quotation as QuotationResponseDto;
  }

  /**
   * Update a quotation with status validation
   */
  async update(id: string, dto: UpdateQuotationDto, userId?: string): Promise<QuotationResponseDto> {
    const existingQuotation = await this.prisma.quotation.findUnique({
      where: { id }
    });

    if (!existingQuotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== existingQuotation.status) {
      if (!this.validateStatusTransition(existingQuotation.status, dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${existingQuotation.status} to ${dto.status}`
        );
      }
    }

    // Only allow updates to DRAFT quotations for most fields
    if (existingQuotation.status !== QuotationStatus.DRAFT && Object.keys(dto).some(key => key !== 'status')) {
      throw new ForbiddenException('Only status can be updated for non-draft quotations');
    }

    const updatedQuotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: dto.status,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        updatedAt: new Date()
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return updatedQuotation as QuotationResponseDto;
  }

  /**
   * Delete a quotation (only if in DRAFT status)
   */
  async remove(id: string): Promise<void> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id }
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    if (quotation.status !== QuotationStatus.DRAFT) {
      throw new ForbiddenException('Only draft quotations can be deleted');
    }

    await this.prisma.quotation.delete({
      where: { id }
    });
  }

  /**
   * Duplicate an existing quotation
   */
  async duplicate(id: string, dto: DuplicateQuotationDto, userId?: string): Promise<QuotationResponseDto> {
    const originalQuotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    if (!originalQuotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    const customerId = dto.customerId || originalQuotation.customerId;
    const quotationNumber = await this.generateQuotationNumber();

    const duplicatedQuotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        customerId,
        status: dto.resetStatus ? QuotationStatus.DRAFT : originalQuotation.status,
        subtotal: originalQuotation.subtotal,
        discountAmount: originalQuotation.discountAmount,
        taxAmount: originalQuotation.taxAmount,
        totalAmount: originalQuotation.totalAmount,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        termsConditions: originalQuotation.termsConditions,
        notes: dto.notes || originalQuotation.notes,
        createdByUserId: userId,
        items: {
          createMany: {
            data: originalQuotation.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountPercentage: item.discountPercentage,
              discountAmount: item.discountAmount,
              lineTotal: item.lineTotal,
              customSpecifications: item.customSpecifications as any,
              deliveryTimeline: item.deliveryTimeline
            }))
          }
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                description: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return duplicatedQuotation as QuotationResponseDto;
  }

  /**
   * Get quotation analytics
   */
  async getAnalytics(filters?: Partial<QuotationFiltersDto>): Promise<QuotationAnalyticsDto> {
    const where: Prisma.QuotationWhereInput = {};
    
    if (filters?.createdAfter) where.createdAt = { gte: new Date(filters.createdAfter) };
    if (filters?.createdAfter || filters?.createdBefore) {
      where.createdAt = {};
      if (filters?.createdAfter) where.createdAt.gte = new Date(filters.createdAfter);
      if (filters?.createdBefore) where.createdAt.lte = new Date(filters.createdBefore);
    }

    const [
      totalQuotations,
      statusBreakdown,
      averageValue,
      conversionData
    ] = await Promise.all([
      this.prisma.quotation.count({ where }),
      this.prisma.quotation.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      this.prisma.quotation.aggregate({
        where,
        _avg: { totalAmount: true }
      }),
      this.prisma.quotation.findMany({
        where: {
          ...where,
          status: { in: [QuotationStatus.SENT, QuotationStatus.APPROVED] }
        },
        select: {
          status: true,
          createdAt: true,
          customerRespondedAt: true
        }
      })
    ]);

    const statusBreakdownMap = statusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<QuotationStatus, number>);

    const approvedCount = statusBreakdownMap[QuotationStatus.APPROVED] || 0;
    const sentCount = statusBreakdownMap[QuotationStatus.SENT] || 0;
    const conversionRate = sentCount > 0 ? (approvedCount / sentCount) * 100 : 0;

    // Calculate average response time
    const responseTimes = conversionData
      .filter(q => q.customerRespondedAt)
      .map(q => {
        const responseTime = q.customerRespondedAt!.getTime() - q.createdAt.getTime();
        return responseTime / (1000 * 60 * 60); // Convert to hours
      });

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    // Generate monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [monthlyCount, monthlyValue, monthlyApproved] = await Promise.all([
        this.prisma.quotation.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        this.prisma.quotation.aggregate({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          },
          _sum: { totalAmount: true }
        }),
        this.prisma.quotation.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: QuotationStatus.APPROVED
          }
        })
      ]);

      monthlyTrends.push({
        month: date.toISOString().substring(0, 7), // YYYY-MM format
        count: monthlyCount,
        value: Number(monthlyValue._sum.totalAmount || 0),
        conversionRate: monthlyCount > 0 ? (monthlyApproved / monthlyCount) * 100 : 0
      });
    }

    return {
      totalQuotations,
      conversionRate,
      averageValue: Number(averageValue._avg.totalAmount || 0),
      averageResponseTime,
      statusBreakdown: statusBreakdownMap,
      monthlyTrends
    };
  }
}
