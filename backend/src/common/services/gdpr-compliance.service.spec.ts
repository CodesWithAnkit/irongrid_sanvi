import { Test, TestingModule } from '@nestjs/testing';
import { GdprComplianceService } from './gdpr-compliance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditLoggerService } from './audit-logger.service';
import { EncryptionService } from './encryption.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('GdprComplianceService', () => {
  let service: GdprComplianceService;
  let prisma: PrismaService;
  let auditLogger: AuditLoggerService;
  let encryptionService: EncryptionService;

  const mockPrisma = {
    dataRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    userConsent: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    customer: {
      count: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    analytics: {
      count: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
    },
    quotation: {
      findMany: jest.fn(),
    },
    order: {
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    gdprReport: {
      create: jest.fn(),
    },
    dataRequest: {
      groupBy: jest.fn(),
    },
    securityAlert: {
      count: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(callback => callback(mockPrisma)),
    userDeletion: {
      create: jest.fn(),
    },
  };

  const mockAuditLogger = {
    log: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn().mockReturnValue('encrypted-data'),
    decrypt: jest.fn().mockReturnValue('decrypted-data'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GdprComplianceService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<GdprComplianceService>(GdprComplianceService);
    prisma = module.get<PrismaService>(PrismaService);
    auditLogger = module.get<AuditLoggerService>(AuditLoggerService);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processDataRequest', () => {
    it('should create a new data request', async () => {
      const mockRequest = {
        userId: 'user123',
        email: 'user@example.com',
        requestType: 'access' as const,
        details: 'Test request',
      };

      mockPrisma.dataRequest.create.mockResolvedValue({
        id: 'gdpr_123',
        ...mockRequest,
        status: 'pending',
        createdAt: new Date(),
        completionDate: null,
        dataProvided: null,
      });

      const result = await service.processDataRequest(mockRequest);

      expect(mockPrisma.dataRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          email: 'user@example.com',
          requestType: 'access',
          status: 'pending',
        }),
      });

      expect(mockAuditLogger.log).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.status).toBe('pending');
    });

    it('should handle errors when creating a request', async () => {
      mockPrisma.dataRequest.create.mockRejectedValue(new Error('Database error'));

      const mockRequest = {
        userId: 'user123',
        email: 'user@example.com',
        requestType: 'access' as const,
      };

      await expect(service.processDataRequest(mockRequest)).rejects.toThrow();
    });
  });

  describe('handleAccessRequest', () => {
    it('should process an access request successfully', async () => {
      const requestId = 'gdpr_123';
      const userId = 'user123';

      // Mock the request lookup
      mockPrisma.dataRequest.findUnique.mockResolvedValue({
        id: requestId,
        userId,
        requestType: 'access',
        status: 'pending',
      });

      // Mock user data collection
      mockPrisma.user.findUnique.mockResolvedValue({ id: userId, email: 'user@example.com' });
      mockPrisma.userConsent.findMany.mockResolvedValue([{ consentType: 'marketing', isActive: true }]);
      mockPrisma.customer.findMany.mockResolvedValue([{ id: 'cust1', firstName: 'John' }]);
      mockPrisma.quotation.findMany.mockResolvedValue([{ id: 'q1', title: 'Test Quote' }]);
      mockPrisma.order.findMany.mockResolvedValue([{ id: 'o1', status: 'pending' }]);
      mockPrisma.invoice.findMany.mockResolvedValue([{ id: 'i1', amount: 100 }]);
      mockPrisma.auditLog.findMany.mockResolvedValue([{ action: 'login', createdAt: new Date() }]);

      const result = await service.handleAccessRequest(requestId);

      expect(mockPrisma.dataRequest.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.dataRequest.update).toHaveBeenNthCalledWith(1, {
        where: { id: requestId },
        data: { status: 'processing' },
      });
      expect(mockPrisma.dataRequest.update).toHaveBeenNthCalledWith(2, {
        where: { id: requestId },
        data: expect.objectContaining({
          status: 'completed',
          dataProvided: 'encrypted-data',
        }),
      });

      expect(mockEncryptionService.encrypt).toHaveBeenCalled();
      expect(mockAuditLogger.log).toHaveBeenCalled();
      expect(result).toHaveProperty('status', 'completed');
    });

    it('should handle errors during access request processing', async () => {
      const requestId = 'gdpr_123';

      // Mock the request lookup
      mockPrisma.dataRequest.findUnique.mockResolvedValue({
        id: requestId,
        userId: 'user123',
        requestType: 'access',
        status: 'pending',
      });

      // Mock an error during processing
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.handleAccessRequest(requestId)).rejects.toThrow();

      expect(mockPrisma.dataRequest.update).toHaveBeenCalledTimes(2);
      expect(mockPrisma.dataRequest.update).toHaveBeenNthCalledWith(2, {
        where: { id: requestId },
        data: expect.objectContaining({
          status: 'rejected',
          details: expect.stringContaining('Failed to process'),
        }),
      });
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate a GDPR compliance report', async () => {
      // Mock data for report
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.userConsent.count.mockResolvedValue(90);
      mockPrisma.dataRequest.groupBy.mockResolvedValue([
        { requestType: 'access', status: 'completed', _count: 10 },
        { requestType: 'deletion', status: 'pending', _count: 5 },
      ]);
      mockPrisma.securityAlert.count.mockResolvedValue(2);
      mockPrisma.customer.count.mockResolvedValue(0);
      mockPrisma.analytics.count.mockResolvedValue(0);

      const report = await service.generateComplianceReport();

      expect(mockPrisma.gdprReport.create).toHaveBeenCalled();
      expect(report).toHaveProperty('reportId');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('complianceStatus');
      expect(report).toHaveProperty('recommendations');
    });
  });
});
