import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateQuotationTemplateDto, 
  UpdateQuotationTemplateDto, 
  QuotationTemplateFiltersDto,
  QuotationTemplateResponseDto,
  PaginatedQuotationTemplatesResponseDto,
  CreateQuotationFromTemplateDto,
  BulkQuotationCreateDto,
  BulkQuotationJobResponseDto
} from '../dto/quotation-template.dto';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { QuotationsService } from '../quotations.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuotationTemplateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly quotationsService: QuotationsService,
  ) {}

  /**
   * Create a new quotation template
   */
  async create(dto: CreateQuotationTemplateDto, createdByUserId?: string): Promise<QuotationTemplateResponseDto> {
    // Check if template name already exists
    const existingTemplate = await this.prisma.quotationTemplate.findUnique({
      where: { name: dto.name }
    });

    if (existingTemplate) {
      throw new ConflictException(`Template with name "${dto.name}" already exists`);
    }

    // Validate that all products exist
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

    // Create template data structure
    const templateData = {
      items: dto.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          productId: item.productId,
          productName: product?.name,
          productSku: product?.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice || Number(product?.basePrice || 0),
          discountAmount: item.discountAmount || 0,
          customSpecifications: item.customSpecifications || {},
          deliveryTimeline: item.deliveryTimeline
        };
      }),
      metadata: {
        totalItems: dto.items.length,
        estimatedValue: dto.items.reduce((sum, item) => {
          const product = products.find(p => p.id === item.productId);
          const unitPrice = item.unitPrice || Number(product?.basePrice || 0);
          return sum + (item.quantity * unitPrice) - (item.discountAmount || 0);
        }, 0)
      }
    };

    const template = await this.prisma.quotationTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        isPublic: dto.isPublic || false,
        templateData: templateData as any,
        defaultValidityDays: dto.defaultValidityDays || 30,
        defaultTermsConditions: dto.defaultTermsConditions,
        tags: dto.tags || [],
        createdByUserId
      },
      include: {
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

    return template as QuotationTemplateResponseDto;
  }

  /**
   * Find all templates with filtering and pagination
   */
  async findAll(filters: QuotationTemplateFiltersDto, userId?: string): Promise<PaginatedQuotationTemplatesResponseDto> {
    const {
      category,
      isPublic,
      isActive,
      search,
      tags,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Build where clause
    const where: Prisma.QuotationTemplateWhereInput = {};

    if (category) where.category = category;
    if (typeof isPublic === 'boolean') where.isPublic = isPublic;
    if (typeof isActive === 'boolean') where.isActive = isActive;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags
      };
    }

    // If not searching for public templates specifically, only show user's templates or public ones
    if (!isPublic && userId) {
      where.OR = [
        { isPublic: true },
        { createdByUserId: userId }
      ];
    }

    // Build order by
    const orderBy: Prisma.QuotationTemplateOrderByWithRelationInput = {};
    orderBy[sortBy as keyof Prisma.QuotationTemplateOrderByWithRelationInput] = sortOrder;

    // Execute queries
    const [templates, total] = await Promise.all([
      this.prisma.quotationTemplate.findMany({
        where,
        orderBy,
        skip: offset,
        take: limit,
        include: {
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
      this.prisma.quotationTemplate.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: templates as QuotationTemplateResponseDto[],
      total,
      page,
      limit,
      totalPages
    };
  }

  /**
   * Find a single template by ID
   */
  async findOne(id: string, userId?: string): Promise<QuotationTemplateResponseDto> {
    const template = await this.prisma.quotationTemplate.findUnique({
      where: { id },
      include: {
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

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Check access permissions
    if (!template.isPublic && template.createdByUserId !== userId) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template as QuotationTemplateResponseDto;
  }

  /**
   * Update a template
   */
  async update(id: string, dto: UpdateQuotationTemplateDto, userId?: string): Promise<QuotationTemplateResponseDto> {
    const existingTemplate = await this.prisma.quotationTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Check permissions - only creator can update
    if (existingTemplate.createdByUserId !== userId) {
      throw new BadRequestException('You can only update templates you created');
    }

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== existingTemplate.name) {
      const nameExists = await this.prisma.quotationTemplate.findUnique({
        where: { name: dto.name }
      });

      if (nameExists) {
        throw new ConflictException(`Template with name "${dto.name}" already exists`);
      }
    }

    // Update template data if items are provided
    let templateData = existingTemplate.templateData;
    if (dto.items) {
      // Validate products
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

      templateData = {
        items: dto.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            productName: product?.name,
            productSku: product?.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice || Number(product?.basePrice || 0),
            discountAmount: item.discountAmount || 0,
            customSpecifications: item.customSpecifications || {},
            deliveryTimeline: item.deliveryTimeline
          };
        }),
        metadata: {
          totalItems: dto.items.length,
          estimatedValue: dto.items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            const unitPrice = item.unitPrice || Number(product?.basePrice || 0);
            return sum + (item.quantity * unitPrice) - (item.discountAmount || 0);
          }, 0)
        }
      };
    }

    const updatedTemplate = await this.prisma.quotationTemplate.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        isPublic: dto.isPublic,
        isActive: dto.isActive,
        templateData: templateData as any,
        defaultValidityDays: dto.defaultValidityDays,
        defaultTermsConditions: dto.defaultTermsConditions,
        tags: dto.tags,
        updatedAt: new Date()
      },
      include: {
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

    return updatedTemplate as QuotationTemplateResponseDto;
  }

  /**
   * Delete a template
   */
  async remove(id: string, userId?: string): Promise<void> {
    const template = await this.prisma.quotationTemplate.findUnique({
      where: { id }
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    // Check permissions - only creator can delete
    if (template.createdByUserId !== userId) {
      throw new BadRequestException('You can only delete templates you created');
    }

    await this.prisma.quotationTemplate.delete({
      where: { id }
    });
  }

  /**
   * Create quotation from template
   */
  async createQuotationFromTemplate(dto: CreateQuotationFromTemplateDto, userId?: string): Promise<any> {
    const template = await this.findOne(dto.templateId, userId);

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId }
    });

    if (!customer || !customer.isActive) {
      throw new BadRequestException('Customer not found or inactive');
    }

    // Build quotation data from template
    const templateItems = template.templateData.items || [];
    
    // Apply customizations if provided
    const items = templateItems.map((templateItem: any) => {
      const customization = dto.customizations?.find(c => c.productId === templateItem.productId);
      
      return {
        productId: templateItem.productId,
        quantity: customization?.quantity || templateItem.quantity,
        unitPrice: customization?.unitPrice || templateItem.unitPrice,
        discount: customization?.discountAmount || templateItem.discountAmount || 0,
        customSpecifications: customization?.customSpecifications || templateItem.customSpecifications,
        deliveryTimeline: customization?.deliveryTimeline || templateItem.deliveryTimeline
      };
    });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (dto.validityDays || template.defaultValidityDays));

    const quotationDto: CreateQuotationDto = {
      customerId: dto.customerId,
      items,
      validUntil: validUntil.toISOString(),
      termsConditions: dto.termsConditions || template.defaultTermsConditions,
      notes: dto.notes
    };

    // Create the quotation
    const quotation = await this.quotationsService.create(quotationDto, userId);

    // Update template usage statistics
    await this.prisma.quotationTemplate.update({
      where: { id: dto.templateId },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date()
      }
    });

    return quotation;
  }

  /**
   * Create bulk quotation job
   */
  async createBulkQuotationJob(dto: BulkQuotationCreateDto, userId?: string): Promise<BulkQuotationJobResponseDto> {
    const template = await this.findOne(dto.templateId, userId);

    // Validate all customers exist and are active
    const customers = await this.prisma.customer.findMany({
      where: { 
        id: { in: dto.customerIds },
        isActive: true
      }
    });

    if (customers.length !== dto.customerIds.length) {
      const foundIds = customers.map(c => c.id);
      const missingIds = dto.customerIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Customers not found or inactive: ${missingIds.join(', ')}`);
    }

    const job = await this.prisma.bulkQuotationJob.create({
      data: {
        name: dto.name,
        description: dto.description,
        templateId: dto.templateId,
        customerIds: dto.customerIds,
        totalCustomers: dto.customerIds.length,
        createdByUserId: userId
      },
      include: {
        template: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
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

    // Process the bulk job asynchronously
    this.processBulkQuotationJob(job.id, dto, userId).catch(error => {
      console.error(`Error processing bulk quotation job ${job.id}:`, error);
    });

    return job as BulkQuotationJobResponseDto;
  }

  /**
   * Process bulk quotation job
   */
  private async processBulkQuotationJob(jobId: string, dto: BulkQuotationCreateDto, userId?: string): Promise<void> {
    try {
      // Update job status to processing
      await this.prisma.bulkQuotationJob.update({
        where: { id: jobId },
        data: {
          status: 'PROCESSING',
          startedAt: new Date()
        }
      });

      const template = await this.prisma.quotationTemplate.findUnique({
        where: { id: dto.templateId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      let successCount = 0;
      let failCount = 0;
      const errors: any[] = [];

      // Process each customer
      for (const customerId of dto.customerIds) {
        try {
          const createDto: CreateQuotationFromTemplateDto = {
            templateId: dto.templateId,
            customerId,
            validityDays: dto.validityDays,
            termsConditions: dto.termsConditions,
            notes: dto.notes
          };

          await this.createQuotationFromTemplate(createDto, userId);
          successCount++;
        } catch (error) {
          failCount++;
          errors.push({
            customerId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        // Update progress
        await this.prisma.bulkQuotationJob.update({
          where: { id: jobId },
          data: {
            processedCustomers: successCount + failCount,
            successfulQuotations: successCount,
            failedQuotations: failCount
          }
        });
      }

      // Mark job as completed
      await this.prisma.bulkQuotationJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          errorLog: errors.length > 0 ? { errors } as any : null
        }
      });

    } catch (error) {
      // Mark job as failed
      await this.prisma.bulkQuotationJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorLog: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      });
    }
  }

  /**
   * Get bulk quotation job status
   */
  async getBulkQuotationJob(jobId: string, userId?: string): Promise<BulkQuotationJobResponseDto> {
    const job = await this.prisma.bulkQuotationJob.findUnique({
      where: { id: jobId },
      include: {
        template: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
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

    if (!job) {
      throw new NotFoundException(`Bulk quotation job with ID ${jobId} not found`);
    }

    // Check permissions
    if (job.createdByUserId !== userId) {
      throw new BadRequestException('You can only view jobs you created');
    }

    return job as BulkQuotationJobResponseDto;
  }

  /**
   * Get user's bulk quotation jobs
   */
  async getUserBulkQuotationJobs(userId: string): Promise<BulkQuotationJobResponseDto[]> {
    const jobs = await this.prisma.bulkQuotationJob.findMany({
      where: { createdByUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
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

    return jobs as BulkQuotationJobResponseDto[];
  }

  /**
   * Get template usage analytics
   */
  async getTemplateAnalytics(templateId: string, userId?: string): Promise<any> {
    const template = await this.findOne(templateId, userId);

    // Get quotations created from this template (we'll need to track this in quotation creation)
    // For now, return basic template stats
    const analytics = {
      templateId: template.id,
      templateName: template.name,
      usageCount: template.usageCount,
      lastUsedAt: template.lastUsedAt,
      category: template.category,
      isPublic: template.isPublic,
      createdAt: template.createdAt,
      estimatedValue: template.templateData.metadata?.estimatedValue || 0,
      totalItems: template.templateData.metadata?.totalItems || 0
    };

    return analytics;
  }
}