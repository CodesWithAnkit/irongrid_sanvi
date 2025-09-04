import { Test, TestingModule } from '@nestjs/testing';
import { SecurityMonitorService } from './security-monitor.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditLoggerService } from './audit-logger.service';

describe('SecurityMonitorService', () => {
  let service: SecurityMonitorService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;
  let auditLogger: AuditLoggerService;

  const mockPrisma = {
    securityAlert: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      count: jest.fn(),
    },
    blockedIP: {
      upsert: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      const config = {
        'SECURITY_MONITORING_ENABLED': true,
        'SECURITY_AUTO_BLOCK_ENABLED': true,
        'SECURITY_ALERT_NOTIFICATIONS': true,
      };
      return config[key];
    }),
  };

  const mockEventEmitter = {
    on: jest.fn(),
    emit: jest.fn(),
  };

  const mockAuditLogger = {
    logSecurity: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityMonitorService,
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
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
      ],
    }).compile();

    service = module.get<SecurityMonitorService>(SecurityMonitorService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    auditLogger = module.get<AuditLoggerService>(AuditLoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize event listeners', () => {
      service.onModuleInit();

      expect(mockEventEmitter.on).toHaveBeenCalledTimes(3);
      expect(mockEventEmitter.on).toHaveBeenCalledWith('auth.login.failed', expect.any(Function));
      expect(mockEventEmitter.on).toHaveBeenCalledWith('rate_limit.exceeded', expect.any(Function));
      expect(mockEventEmitter.on).toHaveBeenCalledWith('audit.log', expect.any(Function));
    });

    it('should not initialize if monitoring is disabled', () => {
      mockConfigService.get.mockReturnValueOnce(false);
      service.onModuleInit();
      expect(mockEventEmitter.on).not.toHaveBeenCalled();
    });
  });

  describe('createAlert', () => {
    it('should create a security alert', async () => {
      const alertData = {
        type: 'suspicious_login',
        severity: 'high' as const,
        source: 'auth_service',
        details: { reason: 'multiple_failures' },
        ipAddress: '192.168.1.100',
      };

      mockPrisma.securityAlert.create.mockResolvedValue({
        id: 'alert_123',
        ...alertData,
        timestamp: new Date(),
        status: 'new',
      });

      const result = await service.createAlert(alertData);

      expect(mockPrisma.securityAlert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          type: 'suspicious_login',
          severity: 'high',
          source: 'auth_service',
          details: expect.any(String),
          status: 'new',
        }),
      });

      expect(mockAuditLogger.logSecurity).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('security.alert', expect.anything());
      expect(mockPrisma.blockedIP.upsert).toHaveBeenCalled();

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'new');
      expect(result).toHaveProperty('severity', 'high');
    });

    it('should not auto-block for medium severity alerts', async () => {
      const alertData = {
        type: 'rate_limit',
        severity: 'medium' as const,
        source: 'api_gateway',
        details: { endpoint: '/api/users' },
        ipAddress: '192.168.1.100',
      };

      mockPrisma.securityAlert.create.mockResolvedValue({
        id: 'alert_456',
        ...alertData,
        timestamp: new Date(),
        status: 'new',
      });

      await service.createAlert(alertData);

      expect(mockPrisma.blockedIP.upsert).not.toHaveBeenCalled();
    });

    it('should handle errors during alert creation', async () => {
      mockPrisma.securityAlert.create.mockRejectedValue(new Error('Database error'));

      const alertData = {
        type: 'suspicious_login',
        severity: 'high' as const,
        source: 'auth_service',
        details: { reason: 'multiple_failures' },
      };

      await expect(service.createAlert(alertData)).rejects.toThrow();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getAlerts', () => {
    it('should retrieve security alerts with filters', async () => {
      const mockAlerts = [
        {
          id: 'alert_123',
          type: 'suspicious_login',
          severity: 'high',
          details: JSON.stringify({ reason: 'multiple_failures' }),
          status: 'new',
          timestamp: new Date(),
        },
        {
          id: 'alert_456',
          type: 'api_abuse',
          severity: 'medium',
          details: JSON.stringify({ endpoint: '/api/users' }),
          status: 'investigating',
          timestamp: new Date(),
        },
      ];

      mockPrisma.securityAlert.findMany.mockResolvedValue(mockAlerts);
      mockPrisma.securityAlert.count.mockResolvedValue(2);

      const options = {
        severity: 'high' as const,
        status: 'new' as const,
        limit: 10,
        offset: 0,
      };

      const result = await service.getAlerts(options);

      expect(mockPrisma.securityAlert.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          severity: 'high',
          status: 'new',
        }),
        orderBy: { timestamp: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toHaveProperty('alerts');
      expect(result).toHaveProperty('total', 2);
      expect(result.alerts[0]).toHaveProperty('details', { reason: 'multiple_failures' });
    });
  });

  describe('updateAlertStatus', () => {
    it('should update a security alert status', async () => {
      const alertId = 'alert_123';
      const status = 'investigating' as const;
      const notes = 'Under investigation by security team';

      await service.updateAlertStatus(alertId, status, notes);

      expect(mockPrisma.securityAlert.update).toHaveBeenCalledWith({
        where: { id: alertId },
        data: {
          status,
          notes,
        },
      });

      expect(mockAuditLogger.logSecurity).toHaveBeenCalledWith(expect.objectContaining({
        action: 'security_alert_updated',
        resourceId: alertId,
      }));
    });
  });
});
