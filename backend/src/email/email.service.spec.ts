import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplateService } from './services/email-template.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailOptions, EmailStatus } from './interfaces/email.interface';

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([{ headers: { 'x-message-id': 'sg-message-id' } }]),
}));

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  SES: jest.fn().mockImplementation(() => ({
    sendEmail: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ MessageId: 'ses-message-id' }),
    }),
  })),
}));

describe('EmailService', () => {
  let service: EmailService;
  let mockQueue: any;
  let mockPrismaService: any;
  let mockEmailTemplateService: any;
  let mockConfigService: any;

  const mockQuotation = {
    id: 'quotation-1',
    quotationNumber: 'QUO-2024-000001',
    customerId: 'customer-1',
    status: 'SENT',
    subtotal: { toNumber: () => 10000 },
    taxAmount: { toNumber: () => 1800 },
    discountAmount: { toNumber: () => 500 },
    totalAmount: { toNumber: () => 11300 },
    validUntil: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    emailSentAt: null,
    customer: {
      id: 'customer-1',
      companyName: 'Test Company Ltd',
      contactPerson: 'John Doe',
      email: 'john@testcompany.com',
    },
    items: [
      {
        id: 'item-1',
        quantity: 2,
        unitPrice: { toNumber: () => 5000 },
        product: {
          name: 'Test Product',
          description: 'Test product description',
        },
      },
    ],
  };

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    };

    mockPrismaService = {
      quotation: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      emailLog: {
        create: jest.fn(),
        findFirst: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    mockEmailTemplateService = {
      getTemplate: jest.fn().mockResolvedValue({
        id: 'test-template',
        subject: 'Test Subject',
        htmlContent: '<p>Test HTML</p>',
        textContent: 'Test Text',
      }),
      compileTemplate: jest.fn().mockResolvedValue('Compiled content'),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          SENDGRID_API_KEY: 'test-sendgrid-key',
          SENDGRID_FROM_EMAIL: 'noreply@sanvi.com',
          AWS_REGION: 'us-east-1',
          AWS_ACCESS_KEY_ID: 'test-access-key',
          AWS_SECRET_ACCESS_KEY: 'test-secret-key',
          AWS_SES_FROM_EMAIL: 'noreply@sanvi.com',
          COMPANY_NAME: 'Sanvi Machinery',
          COMPANY_PHONE: '+91-1234567890',
          COMPANY_EMAIL: 'info@sanvi.com',
          FRONTEND_URL: 'https://app.sanvi.com',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: getQueueToken('email'),
          useValue: mockQueue,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EmailTemplateService,
          useValue: mockEmailTemplateService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should queue email for sending', async () => {
      // Arrange
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
      };

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-1',
        messageId: 'job-123',
      });

      // Act
      const result = await service.sendEmail(emailOptions);

      // Assert
      expect(result).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith('send-email', {
        options: emailOptions,
        provider: 'sendgrid',
        retryCount: 0,
        maxRetries: 3,
      });
      expect(mockPrismaService.emailLog.create).toHaveBeenCalled();
    });

    it('should process template when templateId is provided', async () => {
      // Arrange
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        templateId: 'test-template',
        templateData: { name: 'John' },
      };

      const mockTemplate = {
        id: 'test-template',
        subject: 'Hello {{name}}',
        htmlContent: '<p>Hello {{name}}</p>',
        textContent: 'Hello {{name}}',
      };

      mockEmailTemplateService.getTemplate.mockResolvedValue(mockTemplate);
      mockEmailTemplateService.compileTemplate
        .mockResolvedValueOnce('<p>Hello John</p>')
        .mockResolvedValueOnce('Hello John');

      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-1',
        messageId: 'job-123',
      });

      // Act
      const result = await service.sendEmail(emailOptions);

      // Assert
      expect(result).toBe('job-123');
      expect(mockEmailTemplateService.getTemplate).toHaveBeenCalledWith('test-template');
      expect(mockEmailTemplateService.compileTemplate).toHaveBeenCalledTimes(2);
    });
  });

  describe('sendQuotationEmail', () => {
    it('should send quotation email successfully', async () => {
      // Arrange
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.quotation.update.mockResolvedValue(mockQuotation);
      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-1',
        messageId: 'job-123',
      });

      // Act
      const result = await service.sendQuotationEmail(
        'quotation-1',
        'customer@example.com',
      );

      // Assert
      expect(result).toBe('job-123');
      expect(mockPrismaService.quotation.findUnique).toHaveBeenCalledWith({
        where: { id: 'quotation-1' },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(mockPrismaService.quotation.update).toHaveBeenCalledWith({
        where: { id: 'quotation-1' },
        data: { emailSentAt: expect.any(Date) },
      });
    });

    it('should throw error for non-existent quotation', async () => {
      // Arrange
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.sendQuotationEmail('invalid-id', 'customer@example.com'),
      ).rejects.toThrow('Failed to send quotation email');
    });
  });

  describe('sendFollowUpEmail', () => {
    it('should send follow-up email successfully', async () => {
      // Arrange
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-1',
        messageId: 'job-123',
      });

      // Act
      const result = await service.sendFollowUpEmail(
        'quotation-1',
        'follow-up-template',
        60, // 1 hour delay
      );

      // Assert
      expect(result).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          options: expect.objectContaining({
            to: 'john@testcompany.com',
            templateId: 'follow-up-template',
            scheduledAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('sendExpiryReminder', () => {
    it('should send expiry reminder email', async () => {
      // Arrange
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.emailLog.create.mockResolvedValue({
        id: 'log-1',
        messageId: 'job-123',
      });

      // Act
      const result = await service.sendExpiryReminder('quotation-1');

      // Assert
      expect(result).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          options: expect.objectContaining({
            templateId: 'quotation-expiry-reminder',
          }),
        }),
      );
    });
  });

  describe('trackDelivery', () => {
    it('should return email delivery status', async () => {
      // Arrange
      const mockEmailLog = {
        messageId: 'test-message-id',
        status: 'DELIVERED',
        deliveredAt: new Date('2024-01-02'),
        openedAt: new Date('2024-01-03'),
        clickedAt: null,
        errorMessage: null,
        sentAt: new Date('2024-01-01'),
      };

      mockPrismaService.emailLog.findFirst.mockResolvedValue(mockEmailLog);

      // Act
      const result = await service.trackDelivery('test-message-id');

      // Assert
      expect(result).toEqual({
        messageId: 'test-message-id',
        status: EmailStatus.DELIVERED,
        deliveredAt: mockEmailLog.deliveredAt,
        openedAt: mockEmailLog.openedAt,
        clickedAt: undefined,
        bouncedAt: mockEmailLog.sentAt,
        errorMessage: undefined,
      });
    });

    it('should throw error for non-existent email', async () => {
      // Arrange
      mockPrismaService.emailLog.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.trackDelivery('invalid-id')).rejects.toThrow(
        'Failed to track email delivery',
      );
    });
  });

  describe('scheduleEmail', () => {
    it('should schedule email with delay', async () => {
      // Arrange
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Scheduled Email',
        html: '<p>Scheduled content</p>',
      };
      const delay = 120; // 2 hours

      // Act
      const result = await service.scheduleEmail(emailOptions, delay);

      // Assert
      expect(result).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          options: expect.objectContaining({
            scheduledAt: expect.any(Date),
          }),
        }),
        {
          delay: delay * 60 * 1000, // Convert to milliseconds
        },
      );
    });
  });

  describe('sendWithSendGrid', () => {
    it('should send email via SendGrid', async () => {
      // Arrange
      const sgMail = require('@sendgrid/mail');
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        trackOpens: true,
        trackClicks: true,
      };

      // Act
      const result = await service.sendWithSendGrid(emailOptions);

      // Assert
      expect(result).toBe('sg-message-id');
      expect(sgMail.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['test@example.com'],
          from: 'noreply@sanvi.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true },
          },
        }),
      );
    });
  });

  describe('sendWithSES', () => {
    it('should send email via AWS SES', async () => {
      // Arrange
      const emailOptions: EmailOptions = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      // Act
      const result = await service.sendWithSES(emailOptions);

      // Assert
      expect(result).toBe('ses-message-id');
    });
  });
});