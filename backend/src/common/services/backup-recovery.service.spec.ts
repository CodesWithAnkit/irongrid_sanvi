import { Test, TestingModule } from '@nestjs/testing';
import { BackupRecoveryService } from './backup-recovery.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuditLoggerService } from './audit-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('mock file content'),
    copyFile: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue(['file1', 'file2']),
    stat: jest.fn().mockImplementation((path) => {
      return Promise.resolve({
        isDirectory: () => path.includes('dir'),
        size: 1024,
      });
    }),
    rm: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('BackupRecoveryService', () => {
  let service: BackupRecoveryService;
  let prisma: PrismaService;
  let auditLogger: AuditLoggerService;
  let configService: ConfigService;
  let eventEmitter: EventEmitter2;

  const mockPrisma = {
    recoveryPoint: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      count: jest.fn(),
    },
    systemConfig: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    blockedIP: {
      upsert: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key) => {
      const config = {
        'BACKUP_ENABLED': true,
        'BACKUP_SCHEDULE': '0 0 * * *',
        'BACKUP_RETENTION_DAYS': 30,
        'BACKUP_STORAGE_LOCATION': './test-backups',
        'BACKUP_COMPRESS': true,
        'BACKUP_TYPES': 'database,files,configs',
        'DATABASE_URL': 'postgres://user:pass@localhost:5432/testdb',
      };
      return config[key];
    }),
  };

  const mockAuditLogger = {
    log: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    (exec as jest.Mock).mockImplementation((cmd, options, callback) => {
      if (callback) {
        callback(null, { stdout: 'success', stderr: '' });
      }
      return {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupRecoveryService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuditLoggerService,
          useValue: mockAuditLogger,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
      ],
    }).compile();

    service = module.get<BackupRecoveryService>(BackupRecoveryService);
    prisma = module.get<PrismaService>(PrismaService);
    auditLogger = module.get<AuditLoggerService>(AuditLoggerService);
    configService = module.get<ConfigService>(ConfigService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      // Mock successful recovery point creation
      mockPrisma.recoveryPoint.create.mockResolvedValue({
        id: 'backup_123',
        type: 'manual',
        status: 'in_progress',
        location: './test-backups/backup_123',
      });

      mockPrisma.recoveryPoint.update.mockResolvedValue({
        id: 'backup_123',
        type: 'manual',
        status: 'completed',
        size: 1024,
        location: './test-backups/backup_123',
      });

      const result = await service.createBackup('manual', { testMeta: true });

      expect(fs.promises.mkdir).toHaveBeenCalled();
      expect(mockPrisma.recoveryPoint.create).toHaveBeenCalled();
      expect(mockPrisma.recoveryPoint.update).toHaveBeenCalledWith({
        where: { id: expect.stringContaining('backup_') },
        data: expect.objectContaining({
          status: 'completed',
          size: expect.any(Number),
        }),
      });
      expect(mockEventEmitter.emit).toHaveBeenCalledWith('backup.completed', expect.anything());

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('metadata');
    });

    it('should handle backup creation failure', async () => {
      mockPrisma.recoveryPoint.create.mockResolvedValue({
        id: 'backup_123',
        type: 'manual',
        status: 'in_progress',
        location: './test-backups/backup_123',
      });

      // Simulate failure during backup process
      fs.promises.mkdir = jest.fn().mockRejectedValue(new Error('Permission denied'));

      await expect(service.createBackup('manual')).rejects.toThrow();

      expect(mockPrisma.recoveryPoint.update).toHaveBeenCalledWith({
        where: { id: expect.stringContaining('backup_') },
        data: expect.objectContaining({
          status: 'failed',
          metadata: expect.stringContaining('error'),
        }),
      });
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup successfully', async () => {
      mockPrisma.recoveryPoint.findUnique.mockResolvedValue({
        id: 'backup_123',
        status: 'completed',
        location: './test-backups/backup_123',
      });

      const result = await service.restoreFromBackup('backup_123');

      expect(mockAuditLogger.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'restore_initiated',
        resourceId: 'backup_123',
      }));

      expect(mockAuditLogger.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'restore_completed',
        resourceId: 'backup_123',
      }));

      expect(result).toHaveProperty('status', 'success');
    });

    it('should handle restore failure', async () => {
      mockPrisma.recoveryPoint.findUnique.mockResolvedValue({
        id: 'backup_123',
        status: 'completed',
        location: './test-backups/backup_123',
      });

      // Make restore operation fail
      fs.existsSync = jest.fn().mockReturnValueOnce(true).mockReturnValueOnce(false);

      await expect(service.restoreFromBackup('backup_123')).rejects.toThrow();

      expect(mockAuditLogger.log).toHaveBeenCalledWith(expect.objectContaining({
        action: 'restore_failed',
        resourceId: 'backup_123',
      }));
    });

    it('should reject restore from incomplete backup', async () => {
      mockPrisma.recoveryPoint.findUnique.mockResolvedValue({
        id: 'backup_123',
        status: 'in_progress',
        location: './test-backups/backup_123',
      });

      await expect(service.restoreFromBackup('backup_123')).rejects.toThrow('Cannot restore from an incomplete backup');
    });
  });

  describe('listRecoveryPoints', () => {
    it('should list available recovery points', async () => {
      const mockRecoveryPoints = [
        {
          id: 'backup_123',
          type: 'scheduled',
          status: 'completed',
          metadata: JSON.stringify({ test: true }),
          createdAt: new Date(),
        },
        {
          id: 'backup_456',
          type: 'manual',
          status: 'completed',
          metadata: null,
          createdAt: new Date(),
        },
      ];

      mockPrisma.recoveryPoint.findMany.mockResolvedValue(mockRecoveryPoints);
      mockPrisma.recoveryPoint.count.mockResolvedValue(2);

      const result = await service.listRecoveryPoints(10, 0);

      expect(mockPrisma.recoveryPoint.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(result).toHaveProperty('recoveryPoints');
      expect(result).toHaveProperty('total', 2);
      expect(result.recoveryPoints).toHaveLength(2);
      expect(result.recoveryPoints[0].metadata).toEqual({ test: true });
      expect(result.recoveryPoints[1].metadata).toEqual({});
    });

    it('should filter recovery points by type', async () => {
      mockPrisma.recoveryPoint.findMany.mockResolvedValue([]);
      mockPrisma.recoveryPoint.count.mockResolvedValue(0);

      await service.listRecoveryPoints(10, 0, 'manual');

      expect(mockPrisma.recoveryPoint.findMany).toHaveBeenCalledWith({
        where: { type: 'manual' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('generateDisasterRecoveryPlan', () => {
    it('should generate a disaster recovery plan document', async () => {
      const plan = await service.generateDisasterRecoveryPlan();

      expect(plan).toHaveProperty('generatedAt');
      expect(plan).toHaveProperty('backupStrategy');
      expect(plan).toHaveProperty('recoveryProcedures');
      expect(plan).toHaveProperty('testingSchedule');
      expect(plan).toHaveProperty('responsiblePersonnel');
      expect(plan).toHaveProperty('estimatedRecoveryTime');
    });
  });
});
