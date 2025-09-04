import { Test, TestingModule } from '@nestjs/testing';
import { AuditLoggerService, AuditLogLevel } from './audit-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

describe('AuditLoggerService', () => {
  let service: AuditLoggerService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      const config = {
        'AUDIT_CONSOLE_OUTPUT': true,
        'AUDIT_DB_STORAGE': true,
      };
      return config[key];
    }),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLoggerService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<AuditLoggerService>(AuditLoggerService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should log an audit event successfully', async () => {
      const auditEntry = {
        userId: 'user123',
        action: 'login',
        resource: 'auth',
        details: { browser: 'Chrome' },
        ipAddress: '127.0.0.1',
        level: AuditLogLevel.INFO,
      };

      await service.log(auditEntry);

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('audit.log', auditEntry);
      expect(console.log).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user123',
          action: 'login',
          resource: 'auth',
          details: JSON.stringify({ browser: 'Chrome' }),
          ipAddress: '127.0.0.1',
          level: 'INFO',
        }),
      });
    });

    it('should handle errors during logging', async () => {
      const auditEntry = {
        action: 'login',
        resource: 'auth',
        level: AuditLogLevel.ERROR,
      };

      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database error'));

      await service.log(auditEntry);

      expect(mockEventEmitter.emit).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('logSecurity', () => {
    it('should log security events with SECURITY level', async () => {
      const securityEntry = {
        action: 'permission_denied',
        resource: 'admin_panel',
        ipAddress: '127.0.0.1',
      };

      jest.spyOn(service, 'log').mockResolvedValue();

      await service.logSecurity(securityEntry);

      expect(service.log).toHaveBeenCalledWith({
        ...securityEntry,
        level: AuditLogLevel.SECURITY,
      });
    });
  });

  describe('bulkLog', () => {
    it('should log multiple entries in batch', async () => {
      const entries = [
        {
          action: 'login',
          resource: 'auth',
          level: AuditLogLevel.INFO,
        },
        {
          action: 'data_access',
          resource: 'customers',
          level: AuditLogLevel.SECURITY,
        },
      ];

      await service.bulkLog(entries);

      expect(mockPrisma.auditLog.createMany).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs with filters', async () => {
      const mockLogs = [
        { id: 1, action: 'login', resource: 'auth' },
        { id: 2, action: 'logout', resource: 'auth' },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrisma.auditLog.count.mockResolvedValue(2);

      const options = {
        action: 'login',
        resource: 'auth',
        fromDate: new Date('2023-01-01'),
        limit: 10,
        offset: 0,
      };

      const result = await service.getAuditLogs(options);

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          action: 'login',
          resource: 'auth',
          createdAt: expect.objectContaining({
            gte: options.fromDate,
          }),
        }),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toEqual({
        logs: mockLogs,
        total: 2,
        limit: 10,
        offset: 0,
      });
    });
  });
});
