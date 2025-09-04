import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderConfigService } from './order-config.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, QuotationStatus } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { ConvertQuotationToOrderDto } from './dto/order-actions.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;
  let configService: OrderConfigService;

  const mockPrismaService = {
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
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
    quotation: {
      findUnique: jest.fn(),
    },
    orderItem: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockConfigService = {
    getOrderNumberConfig: jest.fn().mockReturnValue({
      prefix: 'ORD',
      separator: '-',
      dateFormat: 'YYYY',
      sequenceLength: 6,
      resetSequence: 'YEARLY'
    }),
    formatDatePart: jest.fn().mockReturnValue('2024'),
    getDefaultTaxRate: jest.fn().mockReturnValue(0.18),
    getStatusTransitionRules: jest.fn().mockReturnValue({
      PENDING: ['PAID', 'CANCELLED'],
      PAID: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: []
    }),
    getNotificationSettings: jest.fn().mockReturnValue({
      PENDING: { customer: true, internal: true },
      PAID: { customer: true, internal: true },
      PROCESSING: { customer: true, internal: true },
      SHIPPED: { customer: true, internal: true },
      DELIVERED: { customer: true, internal: true },
      CANCELLED: { customer: true, internal: true }
    })
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OrderConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<OrderConfigService>(OrderConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const mockCustomer = {
      id: 'customer-1',
      companyName: 'Test Company',
      isActive: true,
    };

    const mockProducts = [
      {
        id: 'product-1',
        sku: 'SKU001',
        name: 'Test Product',
        minOrderQty: 1,
        basePrice: 1000,
      },
    ];

    const createOrderDto: CreateOrderDto = {
      customerId: 'customer-1',
      items: [
        {
          productId: 'product-1',
          quantity: 2,
          unitPrice: 1000,
          discountAmount: 0,
        },
      ],
      shippingAddress: '123 Test Street',
    };

    beforeEach(() => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);
      mockPrismaService.order.findFirst.mockResolvedValue(null);
      mockPrismaService.order.findUnique.mockResolvedValue(null);
    });

    it('should create an order successfully', async () => {
      const mockCreatedOrder = {
        id: 'order-1',
        orderNumber: 'ORD-2024-000001',
        customerId: 'customer-1',
        status: OrderStatus.PENDING,
        subtotal: 2000,
        discountAmount: 0,
        taxAmount: 360,
        totalAmount: 2360,
        customer: mockCustomer,
        items: [
          {
            id: 'item-1',
            productId: 'product-1',
            quantity: 2,
            unitPrice: 1000,
            lineTotal: 2000,
            product: mockProducts[0],
          },
        ],
        createdBy: null,
        quotation: null,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue(mockCreatedOrder),
          },
        });
      });

      const result = await service.create(createOrderDto, 'user-1');

      expect(result).toEqual(mockCreatedOrder);
      expect(mockPrismaService.customer.findUnique).toHaveBeenCalledWith({
        where: { id: 'customer-1' },
      });
      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['product-1'] }, isActive: true },
      });
    });

    it('should throw NotFoundException when customer not found', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        new NotFoundException('Customer with ID customer-1 not found')
      );
    });

    it('should throw BadRequestException when customer is inactive', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue({
        ...mockCustomer,
        isActive: false,
      });

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Cannot create order for inactive customer')
      );
    });

    it('should throw BadRequestException when no items provided', async () => {
      const invalidDto = { ...createOrderDto, items: [] };

      await expect(service.create(invalidDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Order must contain at least one item')
      );
    });

    it('should throw BadRequestException when product not found', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await expect(service.create(createOrderDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Products not found or inactive: product-1')
      );
    });

    it('should throw BadRequestException when quantity below minimum', async () => {
      const invalidDto = {
        ...createOrderDto,
        items: [
          {
            productId: 'product-1',
            quantity: 0,
            unitPrice: 1000,
            discountAmount: 0,
          },
        ],
      };

      await expect(service.create(invalidDto, 'user-1')).rejects.toThrow(
        new BadRequestException('Minimum order quantity for Test Product is 1')
      );
    });
  });

  describe('convertFromQuotation', () => {
    const mockQuotation = {
      id: 'quotation-1',
      quotationNumber: 'QUO-2024-000001',
      customerId: 'customer-1',
      status: QuotationStatus.APPROVED,
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
          unitPrice: 1000,
          discountAmount: 0,
        },
      ],
      customer: {
        id: 'customer-1',
        companyName: 'Test Company',
        isActive: true,
      },
    };

    const convertDto: ConvertQuotationToOrderDto = {
      shippingAddress: '123 Test Street',
    };

    beforeEach(() => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.order.findUnique.mockResolvedValue(null);
      mockPrismaService.customer.findUnique.mockResolvedValue(mockQuotation.customer);
      mockPrismaService.product.findMany.mockResolvedValue([
        {
          id: 'product-1',
          sku: 'SKU001',
          name: 'Test Product',
          minOrderQty: 1,
        },
      ]);
    });

    it('should convert quotation to order successfully', async () => {
      const mockCreatedOrder = {
        id: 'order-1',
        orderNumber: 'ORD-2024-000001',
        quotationId: 'quotation-1',
        customerId: 'customer-1',
        status: OrderStatus.PENDING,
      };

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          order: {
            create: jest.fn().mockResolvedValue(mockCreatedOrder),
          },
        });
      });

      const result = await service.convertFromQuotation('quotation-1', convertDto, 'user-1');

      expect(result).toEqual(mockCreatedOrder);
      expect(mockPrismaService.quotation.findUnique).toHaveBeenCalledWith({
        where: { id: 'quotation-1' },
        include: { items: true, customer: true },
      });
    });

    it('should throw NotFoundException when quotation not found', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      await expect(
        service.convertFromQuotation('quotation-1', convertDto, 'user-1')
      ).rejects.toThrow(new NotFoundException('Quotation with ID quotation-1 not found'));
    });

    it('should throw BadRequestException when quotation not approved', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue({
        ...mockQuotation,
        status: QuotationStatus.DRAFT,
      });

      await expect(
        service.convertFromQuotation('quotation-1', convertDto, 'user-1')
      ).rejects.toThrow(
        new BadRequestException('Can only convert approved quotations to orders')
      );
    });

    it('should throw BadRequestException when order already exists', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'existing-order',
        quotationId: 'quotation-1',
      });

      await expect(
        service.convertFromQuotation('quotation-1', convertDto, 'user-1')
      ).rejects.toThrow(
        new BadRequestException('Order already exists for this quotation')
      );
    });
  });

  describe('updateStatus', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2024-000001',
      status: OrderStatus.PENDING,
      customer: {
        id: 'customer-1',
        companyName: 'Test Company',
        email: 'test@company.com',
      },
    };

    beforeEach(() => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
    });

    it('should update order status successfully', async () => {
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.PAID,
      };

      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-1', { status: OrderStatus.PAID }, 'user-1');

      expect(result).toEqual(updatedOrder);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: {
          status: OrderStatus.PAID,
          updatedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus('order-1', { status: OrderStatus.PAID }, 'user-1')
      ).rejects.toThrow(new NotFoundException('Order with ID order-1 not found'));
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      await expect(
        service.updateStatus('order-1', { status: OrderStatus.DELIVERED }, 'user-1')
      ).rejects.toThrow(
        new BadRequestException('Invalid status transition from PENDING to DELIVERED')
      );
    });
  });

  describe('requestModification', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2024-000001',
      status: OrderStatus.PENDING,
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
        },
      ],
    };

    beforeEach(() => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
    });

    it('should create modification request successfully', async () => {
      const result = await service.requestModification(
        'order-1',
        'QUANTITY_CHANGE',
        { items: [{ productId: 'product-1', quantity: 3 }] },
        'Customer requested quantity change',
        'user-1'
      );

      expect(result).toMatchObject({
        orderId: 'order-1',
        modificationType: 'QUANTITY_CHANGE',
        reason: 'Customer requested quantity change',
        status: 'PENDING',
        requestedBy: 'user-1',
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.requestModification(
          'order-1',
          'QUANTITY_CHANGE',
          {},
          'Test reason',
          'user-1'
        )
      ).rejects.toThrow(new NotFoundException('Order with ID order-1 not found'));
    });

    it('should throw BadRequestException for delivered orders', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.DELIVERED,
      });

      await expect(
        service.requestModification(
          'order-1',
          'QUANTITY_CHANGE',
          {},
          'Test reason',
          'user-1'
        )
      ).rejects.toThrow(
        new BadRequestException('Cannot modify delivered or cancelled orders')
      );
    });
  });

  describe('getFulfillmentMetrics', () => {
    it('should calculate fulfillment metrics correctly', async () => {
      const mockDeliveredOrders = [
        {
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-05'),
          expectedDelivery: new Date('2024-01-07'),
        },
        {
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-04'),
          expectedDelivery: new Date('2024-01-03'),
        },
      ];

      mockPrismaService.order.findMany.mockResolvedValue(mockDeliveredOrders);

      const result = await service.getFulfillmentMetrics();

      expect(result).toMatchObject({
        averageFulfillmentTime: expect.any(Number),
        onTimeDeliveryRate: expect.any(Number),
        orderAccuracyRate: 98.5,
        customerSatisfactionScore: 4.2,
      });

      expect(result.averageFulfillmentTime).toBeGreaterThan(0);
      expect(result.onTimeDeliveryRate).toBe(50); // 1 out of 2 orders on time
    });
  });

  describe('getOrderPerformanceTracking', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2024-000001',
      status: OrderStatus.PROCESSING,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-03'),
    };

    beforeEach(() => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
    });

    it('should return performance tracking data', async () => {
      const result = await service.getOrderPerformanceTracking('order-1');

      expect(result).toMatchObject({
        milestones: expect.any(Array),
        currentStatus: OrderStatus.PROCESSING,
        estimatedCompletion: expect.any(Date),
        delays: expect.any(Array),
      });

      expect(result.milestones).toHaveLength(2);
      expect(result.milestones[0].status).toBe(OrderStatus.PENDING);
      expect(result.milestones[1].status).toBe(OrderStatus.PROCESSING);
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.getOrderPerformanceTracking('order-1')).rejects.toThrow(
        new NotFoundException('Order with ID order-1 not found')
      );
    });
  });

  describe('remove', () => {
    it('should delete pending order successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.PENDING,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.delete.mockResolvedValue(mockOrder);

      await service.remove('order-1');

      expect(mockPrismaService.order.delete).toHaveBeenCalledWith({
        where: { id: 'order-1' },
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.remove('order-1')).rejects.toThrow(
        new NotFoundException('Order with ID order-1 not found')
      );
    });

    it('should throw ForbiddenException for non-pending orders', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID,
      });

      await expect(service.remove('order-1')).rejects.toThrow(
        new ForbiddenException('Only pending orders can be deleted')
      );
    });
  });
});