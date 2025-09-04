import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderFiltersDto } from './dto/order-filters.dto';
import { OrderResponseDto, PaginatedOrdersResponseDto, OrderAnalyticsDto } from './dto/order-response.dto';
import { ConvertQuotationToOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto, ModifyOrderDto } from './dto/order-actions.dto';
import { OrderConfigService } from './order-config.service';
import { OrderStatus, QuotationStatus, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface OrderModificationRequest {
  id: string;
  orderId: string;
  requestedBy: string;
  modificationType: 'QUANTITY_CHANGE' | 'PRODUCT_CHANGE' | 'ADDRESS_CHANGE' | 'DELIVERY_DATE_CHANGE';
  originalData: any;
  requestedData: any;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface OrderNotification {
  orderId: string;
  type: 'STATUS_CHANGE' | 'PAYMENT_UPDATE' | 'DELIVERY_UPDATE';
  recipient: 'CUSTOMER' | 'INTERNAL' | 'BOTH';
  message: string;
  data: any;
}

export interface OrderWithRelations {
  id: string;
  orderNumber: string;
  quotationId?: string;
  customerId: string;
  status: OrderStatus;
  subtotal: Decimal;
  discountAmount: Decimal;
  taxAmount: Decimal;
  totalAmount: Decimal;
  paymentStatus?: string;
  paymentId?: string;
  shippingAddress?: string;
  expectedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId?: string;
  customer?: any;
  items?: any[];
  createdBy?: any;
  quotation?: any;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: OrderConfigService,
  ) {}

  /**
   * Generate a unique order number based on configuration
   */
  private async generateOrderNumber(): Promise<string> {
    const config = this.configService.getOrderNumberConfig();
    const now = new Date();
    
    const prefix = config.prefix;
    const datePart = this.configService.formatDatePart(now, config.dateFormat);
    const separator = config.separator;
    
    // Find the last order number for this period
    let sequenceNumber = 1;
    
    if (config.resetSequence !== 'NEVER') {
      const lastOrder = await this.prisma.order.findFirst({
        where: {
          orderNumber: {
            startsWith: `${prefix}${separator}${datePart}${separator}`
          }
        },
        orderBy: { orderNumber: 'desc' }
      });
      
      if (lastOrder) {
        const lastNumberPart = lastOrder.orderNumber.split(separator).pop();
        if (lastNumberPart && !isNaN(parseInt(lastNumberPart))) {
          sequenceNumber = parseInt(lastNumberPart) + 1;
        }
      }
    } else {
      // For NEVER reset, get the global sequence
      const lastOrder = await this.prisma.order.findFirst({
        orderBy: { orderNumber: 'desc' }
      });
      
      if (lastOrder) {
        const lastNumberPart = lastOrder.orderNumber.split(separator).pop();
        if (lastNumberPart && !isNaN(parseInt(lastNumberPart))) {
          sequenceNumber = parseInt(lastNumberPart) + 1;
        }
      }
    }
    
    const paddedSequence = String(sequenceNumber).padStart(config.sequenceLength, '0');
    const orderNumber = `${prefix}${separator}${datePart}${separator}${paddedSequence}`;
    
    // Ensure uniqueness
    const existing = await this.prisma.order.findUnique({
      where: { orderNumber }
    });
    
    if (existing) {
      // If somehow we have a collision, try with next number
      return this.generateOrderNumber();
    }
    
    return orderNumber;
  }

  /**
   * Validate order status transitions
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions = this.configService.getStatusTransitionRules();
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Calculate order totals with business rules
   */
  private calculateOrderTotals(items: any[]): {
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

    // Tax calculation using configured tax rate
    const taxableAmount = subtotal - totalDiscountAmount;
    const taxAmount = taxableAmount * this.configService.getDefaultTaxRate();
    
    const totalAmount = subtotal - totalDiscountAmount + taxAmount;

    return {
      subtotal,
      discountAmount: totalDiscountAmount,
      taxAmount,
      totalAmount
    };
  }

  /**
   * Create a new order with comprehensive validation
   */
  async create(dto: CreateOrderDto, createdByUserId?: string): Promise<OrderResponseDto> {
    // Validate input
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Validate customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    if (!customer.isActive) {
      throw new BadRequestException('Cannot create order for inactive customer');
    }

    // If quotationId is provided, validate it exists and is approved
    if (dto.quotationId) {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id: dto.quotationId }
      });

      if (!quotation) {
        throw new NotFoundException(`Quotation with ID ${dto.quotationId} not found`);
      }

      if (quotation.status !== QuotationStatus.APPROVED) {
        throw new BadRequestException('Can only create orders from approved quotations');
      }

      // Check if order already exists for this quotation
      const existingOrder = await this.prisma.order.findUnique({
        where: { quotationId: dto.quotationId }
      });

      if (existingOrder) {
        throw new BadRequestException('Order already exists for this quotation');
      }
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
      const discountAmount = item.discountAmount || 0;
      const lineTotal = lineSubtotal - discountAmount;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount,
        lineTotal
      };
    });

    // Calculate order totals
    const totals = this.calculateOrderTotals(processedItems);

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Set expected delivery date if not provided
    const expectedDelivery = dto.expectedDelivery 
      ? new Date(dto.expectedDelivery) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // Create order with transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          quotationId: dto.quotationId,
          customerId: dto.customerId,
          status: OrderStatus.PENDING,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          shippingAddress: dto.shippingAddress,
          expectedDelivery,
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
          },
          quotation: {
            select: {
              id: true,
              quotationNumber: true,
              status: true
            }
          }
        }
      });

      return newOrder;
    });

    return order as OrderResponseDto;
  }

  /**
   * Convert a quotation to an order
   */
  async convertFromQuotation(quotationId: string, dto: ConvertQuotationToOrderDto, createdByUserId?: string): Promise<OrderResponseDto> {
    // Get the quotation with items
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        customer: true
      }
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }

    if (quotation.status !== QuotationStatus.APPROVED) {
      throw new BadRequestException('Can only convert approved quotations to orders');
    }

    // Check if order already exists for this quotation
    const existingOrder = await this.prisma.order.findUnique({
      where: { quotationId }
    });

    if (existingOrder) {
      throw new BadRequestException('Order already exists for this quotation');
    }

    // Create order DTO from quotation data
    const createOrderDto: CreateOrderDto = {
      customerId: quotation.customerId,
      quotationId: quotation.id,
      items: quotation.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discountAmount: Number(item.discountAmount)
      })),
      shippingAddress: dto.shippingAddress,
      expectedDelivery: dto.expectedDelivery,
      notes: dto.notes
    };

    return this.create(createOrderDto, createdByUserId);
  }

  /**
   * Find all orders with advanced filtering and pagination
   */
  async findAll(filters: OrderFiltersDto): Promise<PaginatedOrdersResponseDto> {
    const {
      status,
      customerId,
      orderNumber,
      quotationId,
      paymentStatus,
      createdAfter,
      createdBefore,
      deliveryAfter,
      deliveryBefore,
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
    const where: Prisma.OrderWhereInput = {};

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (quotationId) where.quotationId = quotationId;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (orderNumber) where.orderNumber = { contains: orderNumber, mode: 'insensitive' };
    
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }
    
    if (deliveryAfter || deliveryBefore) {
      where.expectedDelivery = {};
      if (deliveryAfter) where.expectedDelivery.gte = new Date(deliveryAfter);
      if (deliveryBefore) where.expectedDelivery.lte = new Date(deliveryBefore);
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
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { shippingAddress: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { customer: { contactPerson: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Build order by
    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    if (sortBy === 'customerName') {
      orderBy.customer = { companyName: sortOrder };
    } else {
      orderBy[sortBy as keyof Prisma.OrderOrderByWithRelationInput] = sortOrder;
    }

    // Execute queries
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
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
          },
          quotation: {
            select: {
              id: true,
              quotationNumber: true,
              status: true
            }
          }
        }
      }),
      this.prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(offset / limit) + 1;

    return {
      data: orders as OrderResponseDto[],
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
   * Find a single order by ID
   */
  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
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
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            status: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order as OrderResponseDto;
  }

  /**
   * Update an order with status validation
   */
  async update(id: string, dto: UpdateOrderDto, userId?: string): Promise<OrderResponseDto> {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Validate status transition if status is being changed
    if (dto.status && dto.status !== existingOrder.status) {
      if (!this.validateStatusTransition(existingOrder.status, dto.status)) {
        throw new BadRequestException(
          `Invalid status transition from ${existingOrder.status} to ${dto.status}`
        );
      }
    }

    // Only allow certain updates for delivered or cancelled orders
    if (existingOrder.status === OrderStatus.DELIVERED || existingOrder.status === OrderStatus.CANCELLED) {
      const allowedFields = ['notes'];
      const hasDisallowedFields = Object.keys(dto).some(key => !allowedFields.includes(key));
      if (hasDisallowedFields) {
        throw new ForbiddenException('Limited updates allowed for delivered or cancelled orders');
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
        paymentStatus: dto.paymentStatus,
        paymentId: dto.paymentId,
        shippingAddress: dto.shippingAddress,
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : undefined,
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
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            status: true
          }
        }
      }
    });

    return updatedOrder as OrderResponseDto;
  }

  /**
   * Update order status with validation and notifications
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId?: string): Promise<OrderResponseDto> {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true
      }
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (!this.validateStatusTransition(existingOrder.status, dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${existingOrder.status} to ${dto.status}`
      );
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: dto.status,
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
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            status: true
          }
        }
      }
    });

    // Send automated notifications based on status change
    const notificationSettings = this.configService.getNotificationSettings();
    const shouldNotify = notificationSettings[dto.status];

    if (shouldNotify) {
      const notification: OrderNotification = {
        orderId: id,
        type: 'STATUS_CHANGE',
        recipient: shouldNotify.customer && shouldNotify.internal ? 'BOTH' : 
                  shouldNotify.customer ? 'CUSTOMER' : 'INTERNAL',
        message: this.generateStatusChangeMessage(existingOrder.status, dto.status, updatedOrder.orderNumber),
        data: {
          orderNumber: updatedOrder.orderNumber,
          oldStatus: existingOrder.status,
          newStatus: dto.status,
          customerName: existingOrder.customer?.companyName,
          customerEmail: existingOrder.customer?.email
        }
      };

      await this.sendOrderNotification(notification);
    }

    this.logger.log(`Order ${updatedOrder.orderNumber} status updated from ${existingOrder.status} to ${dto.status}`);

    return updatedOrder as OrderResponseDto;
  }

  /**
   * Generate status change message for notifications
   */
  private generateStatusChangeMessage(oldStatus: OrderStatus, newStatus: OrderStatus, orderNumber: string): string {
    const statusMessages = {
      [OrderStatus.PENDING]: 'has been created and is pending payment',
      [OrderStatus.PAID]: 'payment has been confirmed',
      [OrderStatus.PROCESSING]: 'is now being processed',
      [OrderStatus.SHIPPED]: 'has been shipped',
      [OrderStatus.DELIVERED]: 'has been delivered',
      [OrderStatus.CANCELLED]: 'has been cancelled'
    };

    return `Order ${orderNumber} ${statusMessages[newStatus] || `status changed to ${newStatus}`}`;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(id: string, dto: UpdatePaymentStatusDto, userId?: string): Promise<OrderResponseDto> {
    const existingOrder = await this.prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        paymentStatus: dto.paymentStatus,
        paymentId: dto.paymentId,
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
        },
        quotation: {
          select: {
            id: true,
            quotationNumber: true,
            status: true
          }
        }
      }
    });

    // If payment is confirmed, automatically update order status to PAID
    if (dto.paymentStatus === 'PAID' && existingOrder.status === OrderStatus.PENDING) {
      await this.updateStatus(id, { status: OrderStatus.PAID }, userId);
    }

    return updatedOrder as OrderResponseDto;
  }

  /**
   * Delete an order (only if in PENDING status)
   */
  async remove(id: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ForbiddenException('Only pending orders can be deleted');
    }

    await this.prisma.order.delete({
      where: { id }
    });
  }

  /**
   * Request order modification with approval workflow
   */
  async requestModification(
    orderId: string, 
    modificationType: OrderModificationRequest['modificationType'],
    requestedData: any,
    reason: string,
    requestedByUserId: string
  ): Promise<OrderModificationRequest> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if order can be modified
    if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot modify delivered or cancelled orders');
    }

    // Store original data based on modification type
    let originalData: any = {};
    switch (modificationType) {
      case 'QUANTITY_CHANGE':
        originalData = { items: order.items };
        break;
      case 'ADDRESS_CHANGE':
        originalData = { shippingAddress: order.shippingAddress };
        break;
      case 'DELIVERY_DATE_CHANGE':
        originalData = { expectedDelivery: order.expectedDelivery };
        break;
      default:
        originalData = { order };
    }

    // Create modification request (would be stored in a separate table in real implementation)
    const modificationRequest: OrderModificationRequest = {
      id: `mod_${Date.now()}`,
      orderId,
      requestedBy: requestedByUserId,
      modificationType,
      originalData,
      requestedData,
      reason,
      status: 'PENDING',
      createdAt: new Date()
    };

    this.logger.log(`Order modification requested: ${modificationRequest.id} for order ${orderId}`);

    // In a real implementation, this would be stored in database
    // For now, we'll return the request object
    return modificationRequest;
  }

  /**
   * Approve or reject order modification
   */
  async processModificationRequest(
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    approvedByUserId: string,
    comments?: string
  ): Promise<OrderModificationRequest> {
    // In a real implementation, this would fetch from database
    // For now, we'll simulate the approval process
    
    this.logger.log(`Processing modification request ${requestId}: ${action}`);

    // Simulate modification request processing
    const modificationRequest: OrderModificationRequest = {
      id: requestId,
      orderId: 'simulated-order-id',
      requestedBy: 'user-id',
      modificationType: 'QUANTITY_CHANGE',
      originalData: {},
      requestedData: {},
      reason: 'Customer request',
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approvedBy: approvedByUserId,
      approvedAt: new Date(),
      createdAt: new Date()
    };

    if (action === 'APPROVE') {
      // Apply the modification to the order
      await this.applyModification(modificationRequest);
    }

    return modificationRequest;
  }

  /**
   * Apply approved modification to order
   */
  private async applyModification(modificationRequest: OrderModificationRequest): Promise<void> {
    const { orderId, modificationType, requestedData } = modificationRequest;

    switch (modificationType) {
      case 'QUANTITY_CHANGE':
        await this.updateOrderItems(orderId, requestedData.items);
        break;
      case 'ADDRESS_CHANGE':
        await this.prisma.order.update({
          where: { id: orderId },
          data: { shippingAddress: requestedData.shippingAddress }
        });
        break;
      case 'DELIVERY_DATE_CHANGE':
        await this.prisma.order.update({
          where: { id: orderId },
          data: { expectedDelivery: new Date(requestedData.expectedDelivery) }
        });
        break;
    }

    this.logger.log(`Applied modification ${modificationRequest.id} to order ${orderId}`);
  }

  /**
   * Update order items (for quantity changes)
   */
  private async updateOrderItems(orderId: string, newItems: any[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Delete existing items
      await tx.orderItem.deleteMany({
        where: { orderId }
      });

      // Create new items
      await tx.orderItem.createMany({
        data: newItems.map((item: any) => ({
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount || 0,
          lineTotal: item.quantity * item.unitPrice - (item.discountAmount || 0)
        }))
      });

      // Recalculate order totals
      const totals = this.calculateOrderTotals(newItems);
      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount
        }
      });
    });
  }

  /**
   * Get order status history
   */
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    // In a real implementation, this would fetch from a status history table
    // For now, we'll return a simulated history
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Simulate status history
    const history: OrderStatusHistory[] = [
      {
        id: `hist_${Date.now()}_1`,
        orderId,
        fromStatus: OrderStatus.PENDING,
        toStatus: order.status,
        changedBy: order.createdByUserId || 'system',
        reason: 'Order created',
        timestamp: order.createdAt
      }
    ];

    return history;
  }

  /**
   * Send order notifications
   */
  async sendOrderNotification(notification: OrderNotification): Promise<void> {
    this.logger.log(`Sending notification for order ${notification.orderId}: ${notification.type}`);
    
    // In a real implementation, this would integrate with email/SMS services
    // For now, we'll just log the notification
    
    if (notification.recipient === 'CUSTOMER' || notification.recipient === 'BOTH') {
      // Send to customer
      this.logger.log(`Customer notification: ${notification.message}`);
    }

    if (notification.recipient === 'INTERNAL' || notification.recipient === 'BOTH') {
      // Send to internal team
      this.logger.log(`Internal notification: ${notification.message}`);
    }
  }

  /**
   * Get fulfillment metrics for analytics
   */
  async getFulfillmentMetrics(filters?: Partial<OrderFiltersDto>): Promise<{
    averageFulfillmentTime: number;
    onTimeDeliveryRate: number;
    orderAccuracyRate: number;
    customerSatisfactionScore: number;
  }> {
    const where: Prisma.OrderWhereInput = {};
    
    if (filters?.createdAfter || filters?.createdBefore) {
      where.createdAt = {};
      if (filters?.createdAfter) where.createdAt.gte = new Date(filters.createdAfter);
      if (filters?.createdBefore) where.createdAt.lte = new Date(filters.createdBefore);
    }

    const deliveredOrders = await this.prisma.order.findMany({
      where: {
        ...where,
        status: OrderStatus.DELIVERED
      },
      select: {
        createdAt: true,
        updatedAt: true,
        expectedDelivery: true
      }
    });

    // Calculate average fulfillment time
    const fulfillmentTimes = deliveredOrders.map(order => {
      const fulfillmentTime = order.updatedAt.getTime() - order.createdAt.getTime();
      return fulfillmentTime / (1000 * 60 * 60 * 24); // Convert to days
    });

    const averageFulfillmentTime = fulfillmentTimes.length > 0 
      ? fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length 
      : 0;

    // Calculate on-time delivery rate
    const onTimeDeliveries = deliveredOrders.filter(order => 
      order.expectedDelivery && order.updatedAt <= order.expectedDelivery
    ).length;

    const onTimeDeliveryRate = deliveredOrders.length > 0 
      ? (onTimeDeliveries / deliveredOrders.length) * 100 
      : 0;

    // Simulate other metrics (in real implementation, these would come from actual data)
    const orderAccuracyRate = 98.5; // Percentage of orders without issues
    const customerSatisfactionScore = 4.2; // Out of 5

    return {
      averageFulfillmentTime,
      onTimeDeliveryRate,
      orderAccuracyRate,
      customerSatisfactionScore
    };
  }

  /**
   * Get order performance tracking
   */
  async getOrderPerformanceTracking(orderId: string): Promise<{
    milestones: Array<{
      status: OrderStatus;
      timestamp: Date;
      duration?: number; // in hours
      isOnTime: boolean;
    }>;
    currentStatus: OrderStatus;
    estimatedCompletion?: Date;
    delays: Array<{
      reason: string;
      duration: number; // in hours
      impact: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Simulate milestone tracking (in real implementation, this would come from status history)
    const milestones = [
      {
        status: OrderStatus.PENDING,
        timestamp: order.createdAt,
        isOnTime: true
      },
      {
        status: order.status,
        timestamp: order.updatedAt,
        duration: (order.updatedAt.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60), // hours
        isOnTime: true
      }
    ];

    // Simulate delays (in real implementation, this would come from actual tracking data)
    const delays: Array<{
      reason: string;
      duration: number;
      impact: 'LOW' | 'MEDIUM' | 'HIGH';
    }> = [];

    // Estimate completion based on current status and historical data
    let estimatedCompletion: Date | undefined;
    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
      estimatedCompletion = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }

    return {
      milestones,
      currentStatus: order.status,
      estimatedCompletion,
      delays
    };
  }

  /**
   * Get order analytics
   */
  async getAnalytics(filters?: Partial<OrderFiltersDto>): Promise<OrderAnalyticsDto> {
    const where: Prisma.OrderWhereInput = {};
    
    if (filters?.createdAfter || filters?.createdBefore) {
      where.createdAt = {};
      if (filters?.createdAfter) where.createdAt.gte = new Date(filters.createdAfter);
      if (filters?.createdBefore) where.createdAt.lte = new Date(filters.createdBefore);
    }

    const [
      totalOrders,
      statusBreakdown,
      revenueData,
      fulfillmentData
    ] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { status: true }
      }),
      this.prisma.order.aggregate({
        where,
        _sum: { totalAmount: true },
        _avg: { totalAmount: true }
      }),
      this.prisma.order.findMany({
        where: {
          ...where,
          status: OrderStatus.DELIVERED
        },
        select: {
          createdAt: true,
          updatedAt: true
        }
      })
    ]);

    const statusBreakdownMap = statusBreakdown.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<OrderStatus, number>);

    const totalRevenue = Number(revenueData._sum.totalAmount || 0);
    const averageOrderValue = Number(revenueData._avg.totalAmount || 0);

    // Calculate average fulfillment time
    const fulfillmentTimes = fulfillmentData.map(order => {
      const fulfillmentTime = order.updatedAt.getTime() - order.createdAt.getTime();
      return fulfillmentTime / (1000 * 60 * 60 * 24); // Convert to days
    });

    const averageFulfillmentTime = fulfillmentTimes.length > 0 
      ? fulfillmentTimes.reduce((sum, time) => sum + time, 0) / fulfillmentTimes.length 
      : 0;

    // Generate monthly trends (last 12 months)
    const monthlyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [monthlyCount, monthlyRevenue] = await Promise.all([
        this.prisma.order.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          },
          _sum: { totalAmount: true },
          _avg: { totalAmount: true }
        })
      ]);

      monthlyTrends.push({
        month: date.toISOString().substring(0, 7), // YYYY-MM format
        count: monthlyCount,
        revenue: Number(monthlyRevenue._sum.totalAmount || 0),
        averageValue: Number(monthlyRevenue._avg.totalAmount || 0)
      });
    }

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      averageFulfillmentTime,
      statusBreakdown: statusBreakdownMap,
      monthlyTrends
    };
  }
}
