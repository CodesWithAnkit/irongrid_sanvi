import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export enum AuditLogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SECURITY = 'SECURITY',
}

export interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  level: AuditLogLevel;
}

@Injectable()
export class AuditLoggerService {
  private readonly enableConsoleOutput: boolean;
  private readonly enableDbStorage: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {
    this.enableConsoleOutput = this.configService.get<boolean>('AUDIT_CONSOLE_OUTPUT') ?? true;
    this.enableDbStorage = this.configService.get<boolean>('AUDIT_DB_STORAGE') ?? true;
  }

  /**
   * Log an audit event
   * @param entry The audit log entry to record
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Always emit the event so subscribers can react
      this.eventEmitter.emit('audit.log', entry);
      
      // Log to console if enabled
      if (this.enableConsoleOutput) {
        this.logToConsole(entry);
      }

      // Store in database if enabled
      if (this.enableDbStorage) {
        await this.storeInDatabase(entry);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log security-specific events
   * @param entry The audit log entry excluding the level
   */
  async logSecurity(entry: Omit<AuditLogEntry, 'level'>): Promise<void> {
    await this.log({
      ...entry,
      level: AuditLogLevel.SECURITY,
    });
  }

  /**
   * Create multiple audit log entries in a batch
   * @param entries Array of audit log entries
   */
  async bulkLog(entries: AuditLogEntry[]): Promise<void> {
    try {
      const dbEntries = entries.map(entry => this.formatForDb(entry));
      
      if (this.enableDbStorage) {
        await this.prisma.auditLog.createMany({ data: dbEntries });
      }
      
      if (this.enableConsoleOutput) {
        entries.forEach(entry => this.logToConsole(entry));
      }
      
      entries.forEach(entry => {
        this.eventEmitter.emit('audit.log', entry);
      });
    } catch (error) {
      console.error('Failed to bulk log audit events:', error);
    }
  }

  /**
   * Get audit logs with filtering options
   */
  async getAuditLogs(options: {
    userId?: string;
    resource?: string;
    action?: string;
    level?: AuditLogLevel;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      userId,
      resource,
      action,
      level,
      fromDate,
      toDate,
      limit = 50,
      offset = 0,
    } = options;

    const where = {
      ...(userId && { userId }),
      ...(resource && { resource }),
      ...(action && { action }),
      ...(level && { level }),
      ...(fromDate || toDate) && {
        createdAt: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      },
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      limit,
      offset,
    };
  }

  private logToConsole(entry: AuditLogEntry): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[AUDIT][${timestamp}][${entry.level}] User: ${entry.userId || 'anonymous'} | Action: ${
        entry.action
      } | Resource: ${entry.resource}${entry.resourceId ? `/${entry.resourceId}` : ''} | IP: ${
        entry.ipAddress || 'unknown'
      } | Details: ${JSON.stringify(entry.details || {})}`,
    );
  }

  private async storeInDatabase(entry: AuditLogEntry): Promise<void> {
    const formattedEntry = this.formatForDb(entry);
    await this.prisma.auditLog.create({ data: formattedEntry });
  }

  private formatForDb(entry: AuditLogEntry): any {
    return {
      userId: entry.userId || null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || null,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      level: entry.level,
    };
  }
}
