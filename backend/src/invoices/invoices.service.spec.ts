import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        DEFAULT_TAX_RATE: 0.18,
        COMPANY_GST_NUMBER: '27ABCDE1234F1Z5',
        COMPANY_STATE: 'Haryana',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateInvoiceFromOrder', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2024-000001',
      customerId: 'customer-1',
      subtotal: 100000,
      discountAmount: 0,
      taxAmount: 18000,
      totalAmount: 118000,
      paymentStatus: 'PAID',
      customer: {
        id: 'customer-1',
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        email: 'john@test.com',
        state: 'Haryana',
      },
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantity: 2,
          unitPrice: 50000,
          discountAmount: 0,
          lineTotal: 100000,
          product: {
            id: 'product-1',
            sku: 'SKU001',
            name: 'Industrial Machine',
          },
        },
      ],
    };

    beforeEach(() => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      // Mock findInvoiceByOrderId to return null (no existing invoice)
      jest.spyOn(service as any, 'findInvoiceByOrderId').mockResolvedValue(null);
    });

    it('should generate invoice from order successfully', async () => {
      const request = {
        orderId: 'order-1',
        notes: 'Thank you for your business',
      };

      const result = await service.generateInvoiceFromOrder(request);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^inv_/),
        invoiceNumber: expect.stringMatching(/^INV-\d{6}-\d{4}$/),
        orderId: 'order-1',
        customerId: 'customer-1',
        subtotal: 100000,
        discountAmount: 0,
        totalAmount: 118000,
        status: 'DRAFT',
        notes: 'Thank you for your business',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        description: 'Industrial Machine (SKU001)',
        quantity: 2,
        unitPrice: 50000,
        lineTotal: 100000,
      });

      expect(result.taxCalculation).toMatchObject({
        taxableAmount: 100000,
        cgst: 9000, // Intra-state: CGST + SGST
        sgst: 9000,
        igst: 0,
        totalTax: 18000,
      });
    });

    it('should calculate IGST for inter-state transactions', async () => {
      const orderWithDifferentState = {
        ...mockOrder,
        customer: {
          ...mockOrder.customer,
          state: 'Maharashtra', // Different state
        },
      };

      mockPrismaService.order.findUnique.mockResolvedValue(orderWithDifferentState);

      const request = {
        orderId: 'order-1',
      };

      const result = await service.generateInvoiceFromOrder(request);

      expect(result.taxCalculation).toMatchObject({
        taxableAmount: 100000,
        cgst: 0,
        sgst: 0,
        igst: 18000, // Inter-state: IGST only
        totalTax: 18000,
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      const request = {
        orderId: 'order-1',
      };

      await expect(service.generateInvoiceFromOrder(request)).rejects.toThrow(
        new NotFoundException('Order with ID order-1 not found')
      );
    });

    it('should throw BadRequestException when order not paid', async () => {
      const unpaidOrder = {
        ...mockOrder,
        paymentStatus: 'PENDING',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(unpaidOrder);

      const request = {
        orderId: 'order-1',
      };

      await expect(service.generateInvoiceFromOrder(request)).rejects.toThrow(
        new BadRequestException('Can only generate invoices for paid orders')
      );
    });

    it('should throw BadRequestException when invoice already exists', async () => {
      // Mock findInvoiceByOrderId to return existing invoice
      jest.spyOn(service as any, 'findInvoiceByOrderId').mockResolvedValue({
        id: 'existing-invoice',
        orderId: 'order-1',
      });

      const request = {
        orderId: 'order-1',
      };

      await expect(service.generateInvoiceFromOrder(request)).rejects.toThrow(
        new BadRequestException('Invoice already exists for this order')
      );
    });
  });

  describe('generateInvoicePDF', () => {
    beforeEach(() => {
      // Mock getInvoiceById
      jest.spyOn(service, 'getInvoiceById').mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'INV-202412-0001',
        orderId: 'order-1',
        customerId: 'customer-1',
        issueDate: new Date(),
        dueDate: new Date(),
        items: [],
        subtotal: 100000,
        discountAmount: 0,
        taxCalculation: {
          taxableAmount: 100000,
          cgst: 9000,
          sgst: 9000,
          igst: 0,
          totalTax: 18000,
        },
        totalAmount: 118000,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock getInvoiceTemplate
      jest.spyOn(service as any, 'getInvoiceTemplate').mockResolvedValue({
        id: 'template-1',
        name: 'Default Template',
        htmlTemplate: '<html>{{invoiceNumber}}</html>',
        isDefault: true,
        companyInfo: {
          name: 'Sanvi Machinery',
          address: 'Test Address',
          phone: '+91-9999999999',
          email: 'info@sanvimachinery.com',
        },
        styling: {
          primaryColor: '#2563eb',
          secondaryColor: '#64748b',
          fontFamily: 'Arial, sans-serif',
        },
      });
    });

    it('should generate PDF successfully', async () => {
      const result = await service.generateInvoicePDF('invoice-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      jest.spyOn(service, 'getInvoiceById').mockResolvedValue(null);

      await expect(service.generateInvoicePDF('invoice-1')).rejects.toThrow(
        new NotFoundException('Invoice with ID invoice-1 not found')
      );
    });
  });

  describe('updateInvoiceStatus', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getInvoiceById').mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'INV-202412-0001',
        orderId: 'order-1',
        customerId: 'customer-1',
        issueDate: new Date(),
        dueDate: new Date(),
        items: [],
        subtotal: 100000,
        discountAmount: 0,
        taxCalculation: {
          taxableAmount: 100000,
          cgst: 9000,
          sgst: 9000,
          igst: 0,
          totalTax: 18000,
        },
        totalAmount: 118000,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should update invoice status successfully', async () => {
      const result = await service.updateInvoiceStatus('invoice-1', 'SENT');

      expect(result.status).toBe('SENT');
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      jest.spyOn(service, 'getInvoiceById').mockResolvedValue(null);

      await expect(service.updateInvoiceStatus('invoice-1', 'SENT')).rejects.toThrow(
        new NotFoundException('Invoice with ID invoice-1 not found')
      );
    });
  });

  describe('sendInvoiceEmail', () => {
    beforeEach(() => {
      jest.spyOn(service, 'getInvoiceById').mockResolvedValue({
        id: 'invoice-1',
        invoiceNumber: 'INV-202412-0001',
        orderId: 'order-1',
        customerId: 'customer-1',
        issueDate: new Date(),
        dueDate: new Date(),
        items: [],
        subtotal: 100000,
        discountAmount: 0,
        taxCalculation: {
          taxableAmount: 100000,
          cgst: 9000,
          sgst: 9000,
          igst: 0,
          totalTax: 18000,
        },
        totalAmount: 118000,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      jest.spyOn(service, 'generateInvoicePDF').mockResolvedValue(Buffer.from('mock pdf'));
      jest.spyOn(service, 'updateInvoiceStatus').mockResolvedValue({} as any);
    });

    it('should send invoice email successfully', async () => {
      await service.sendInvoiceEmail('invoice-1', 'customer@test.com');

      expect(service.generateInvoicePDF).toHaveBeenCalledWith('invoice-1');
      expect(service.updateInvoiceStatus).toHaveBeenCalledWith('invoice-1', 'SENT');
    });

    it('should throw NotFoundException when invoice not found', async () => {
      jest.spyOn(service, 'getInvoiceById').mockResolvedValue(null);

      await expect(service.sendInvoiceEmail('invoice-1')).rejects.toThrow(
        new NotFoundException('Invoice with ID invoice-1 not found')
      );
    });
  });

  describe('getInvoiceAnalytics', () => {
    it('should return invoice analytics', async () => {
      const result = await service.getInvoiceAnalytics();

      expect(result).toMatchObject({
        totalInvoices: expect.any(Number),
        totalAmount: expect.any(Number),
        paidAmount: expect.any(Number),
        pendingAmount: expect.any(Number),
        overdueAmount: expect.any(Number),
        averageAmount: expect.any(Number),
        statusBreakdown: expect.any(Object),
        monthlyTrends: expect.any(Array),
      });

      expect(result.monthlyTrends).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            month: expect.any(String),
            count: expect.any(Number),
            amount: expect.any(Number),
          })
        ])
      );
    });
  });
});