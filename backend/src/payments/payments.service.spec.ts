import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        RAZORPAY_KEY_ID: 'test_key_id',
        RAZORPAY_KEY_SECRET: 'test_key_secret',
        RAZORPAY_WEBHOOK_SECRET: 'test_webhook_secret',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
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

    service = module.get<PaymentsService>(PaymentsService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentLink', () => {
    const mockOrder = {
      id: 'order-1',
      orderNumber: 'ORD-2024-000001',
      totalAmount: 100000,
      customer: {
        companyName: 'Test Company',
        contactPerson: 'John Doe',
        email: 'john@test.com',
        phone: '+919999999999',
      },
    };

    beforeEach(() => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
    });

    it('should create payment link successfully', async () => {
      const request = {
        orderId: 'order-1',
        amount: 100000,
        currency: 'INR',
        description: 'Payment for order',
      };

      const result = await service.createPaymentLink(request);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^plink_/),
        url: expect.stringMatching(/^https:\/\/rzp\.io\/l\//),
        shortUrl: expect.stringMatching(/^https:\/\/rzp\.io\/s\//),
        status: 'created',
        amount: 10000000, // Amount in paise
        currency: 'INR',
        description: 'Payment for order',
      });

      expect(mockPrismaService.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          customer: {
            select: {
              companyName: true,
              contactPerson: true,
              email: true,
              phone: true,
            }
          }
        }
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      const request = {
        orderId: 'order-1',
        amount: 100000,
      };

      await expect(service.createPaymentLink(request)).rejects.toThrow(
        new NotFoundException('Order with ID order-1 not found')
      );
    });

    it('should throw BadRequestException when amount mismatch', async () => {
      const request = {
        orderId: 'order-1',
        amount: 50000, // Different from order total
      };

      await expect(service.createPaymentLink(request)).rejects.toThrow(
        new BadRequestException('Payment amount does not match order total')
      );
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment signature successfully', async () => {
      const request = {
        paymentId: 'pay_123456789',
        orderId: 'order_123456789',
        signature: 'valid_signature',
      };

      // Mock the crypto verification to return true
      jest.spyOn(require('crypto'), 'createHmac').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_signature'),
      });

      mockPrismaService.order.update.mockResolvedValue({});

      const result = await service.verifyPayment(request);

      expect(result).toBe(true);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order_123456789' },
        data: {
          paymentId: 'pay_123456789',
          paymentStatus: 'PAID',
          updatedAt: expect.any(Date),
        }
      });
    });

    it('should return false for invalid signature', async () => {
      const request = {
        paymentId: 'pay_123456789',
        orderId: 'order_123456789',
        signature: 'invalid_signature',
      };

      // Mock the crypto verification to return false
      jest.spyOn(require('crypto'), 'createHmac').mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_signature'),
      });

      const result = await service.verifyPayment(request);

      expect(result).toBe(false);
      expect(mockPrismaService.order.update).not.toHaveBeenCalled();
    });
  });

  describe('getPaymentStatus', () => {
    it('should return payment status', async () => {
      const paymentId = 'pay_123456789';

      const result = await service.getPaymentStatus(paymentId);

      expect(result).toMatchObject({
        id: paymentId,
        status: 'paid',
        amount: expect.any(Number),
        currency: 'INR',
        method: expect.any(String),
      });
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const request = {
        paymentId: 'pay_123456789',
        amount: 50000,
        speed: 'normal' as const,
      };

      // Mock getPaymentStatus to return a paid payment
      jest.spyOn(service, 'getPaymentStatus').mockResolvedValue({
        id: 'pay_123456789',
        orderId: 'order_123456789',
        status: 'paid',
        amount: 100000,
        currency: 'INR',
        createdAt: new Date(),
      });

      const result = await service.processRefund(request);

      expect(result).toMatchObject({
        id: expect.stringMatching(/^rfnd_/),
        paymentId: 'pay_123456789',
        amount: 50000,
        currency: 'INR',
        status: 'pending',
        speedRequested: 'normal',
      });
    });

    it('should throw BadRequestException for non-paid payment', async () => {
      const request = {
        paymentId: 'pay_123456789',
        amount: 50000,
      };

      // Mock getPaymentStatus to return a non-paid payment
      jest.spyOn(service, 'getPaymentStatus').mockResolvedValue({
        id: 'pay_123456789',
        orderId: 'order_123456789',
        status: 'failed',
        amount: 100000,
        currency: 'INR',
        createdAt: new Date(),
      });

      await expect(service.processRefund(request)).rejects.toThrow(
        new BadRequestException('Failed to process refund')
      );
    });

    it('should throw BadRequestException when refund amount exceeds payment', async () => {
      const request = {
        paymentId: 'pay_123456789',
        amount: 150000, // More than payment amount
      };

      // Mock getPaymentStatus to return a paid payment
      jest.spyOn(service, 'getPaymentStatus').mockResolvedValue({
        id: 'pay_123456789',
        orderId: 'order_123456789',
        status: 'paid',
        amount: 100000,
        currency: 'INR',
        createdAt: new Date(),
      });

      await expect(service.processRefund(request)).rejects.toThrow(
        new BadRequestException('Failed to process refund')
      );
    });
  });

  describe('handleWebhook', () => {
    const mockWebhookPayload = {
      entity: 'event',
      account_id: 'acc_123456789',
      event: 'payment.captured',
      contains: ['payment'],
      payload: {
        payment: {
          entity: {
            id: 'pay_123456789',
            orderId: 'order_123456789',
            status: 'captured',
            amount: 100000,
            currency: 'INR',
            createdAt: new Date(),
          }
        }
      },
      created_at: Date.now(),
    };

    it('should handle payment captured webhook', async () => {
      const signature = 'valid_signature';

      // Mock webhook signature verification
      jest.spyOn(service as any, 'verifyWebhookSignature').mockReturnValue(true);
      mockPrismaService.order.update.mockResolvedValue({});

      await service.handleWebhook(mockWebhookPayload, signature);

      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: 'order_123456789' },
        data: {
          paymentId: 'pay_123456789',
          paymentStatus: 'PAID',
          updatedAt: expect.any(Date),
        }
      });
    });

    it('should throw BadRequestException for invalid signature', async () => {
      const signature = 'invalid_signature';

      // Mock webhook signature verification to return false
      jest.spyOn(service as any, 'verifyWebhookSignature').mockReturnValue(false);

      await expect(service.handleWebhook(mockWebhookPayload, signature)).rejects.toThrow(
        new BadRequestException('Invalid webhook signature')
      );
    });
  });

  describe('getPaymentAnalytics', () => {
    it('should return payment analytics', async () => {
      const result = await service.getPaymentAnalytics();

      expect(result).toMatchObject({
        totalPayments: expect.any(Number),
        totalAmount: expect.any(Number),
        successRate: expect.any(Number),
        averageAmount: expect.any(Number),
        paymentMethods: expect.any(Object),
        statusBreakdown: expect.any(Object),
      });
    });
  });

  describe('reconcilePayments', () => {
    beforeEach(() => {
      mockPrismaService.order.findMany.mockResolvedValue([
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          totalAmount: 100000,
          paymentStatus: 'PAID',
          paymentId: 'pay_123',
        },
        {
          id: 'order-2',
          orderNumber: 'ORD-002',
          totalAmount: 50000,
          paymentStatus: 'PAID',
          paymentId: null, // Discrepancy
        },
      ]);
    });

    it('should reconcile payments and identify discrepancies', async () => {
      const result = await service.reconcilePayments();

      expect(result).toMatchObject({
        totalOrders: 2,
        paidOrders: 2,
        pendingPayments: 0,
        failedPayments: 0,
        discrepancies: [
          {
            orderId: 'order-2',
            orderAmount: 50000,
            status: 'PAID',
            issue: 'Payment marked as paid but no payment ID found',
          }
        ],
      });
    });
  });
});