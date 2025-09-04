import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggerService, AuditLogLevel } from './audit-logger.service';

export interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: Date;
  details: any;
  status: 'new' | 'investigating' | 'resolved' | 'false_positive';
  ipAddress?: string;
  userId?: string;
}

@Injectable()
export class SecurityMonitorService implements OnModuleInit {
  private readonly alertThresholds = {
    failedLoginAttempts: 5,
    rateLimitExceeded: 10,
    suspiciousActivities: 3,
  };

  private readonly monitoringEnabled: boolean;
  private readonly autoBlockEnabled: boolean;
  private readonly alertNotificationsEnabled: boolean;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly auditLogger: AuditLoggerService,
  ) {
    this.monitoringEnabled = this.configService.get<boolean>('SECURITY_MONITORING_ENABLED') ?? true;
    this.autoBlockEnabled = this.configService.get<boolean>('SECURITY_AUTO_BLOCK_ENABLED') ?? true;
    this.alertNotificationsEnabled = this.configService.get<boolean>('SECURITY_ALERT_NOTIFICATIONS') ?? true;
  }

  onModuleInit() {
    if (!this.monitoringEnabled) {
      console.log('Security monitoring is disabled');
      return;
    }

    // Subscribe to relevant events
    this.eventEmitter.on('auth.login.failed', this.handleFailedLogin.bind(this));
    this.eventEmitter.on('rate_limit.exceeded', this.handleRateLimitExceeded.bind(this));
    this.eventEmitter.on('audit.log', this.analyzeAuditLog.bind(this));
    
    console.log('Security monitoring initialized');
  }

  /**
   * Generate a security alert
   */
  async createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'status'>): Promise<SecurityAlert> {
    const newAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      timestamp: new Date(),
      status: 'new',
    };

    try {
      // Log to database
      await this.prisma.securityAlert.create({
        data: {
          id: newAlert.id,
          type: newAlert.type,
          severity: newAlert.severity,
          source: newAlert.source,
          details: JSON.stringify(newAlert.details),
          status: newAlert.status,
          ipAddress: newAlert.ipAddress || null,
          userId: newAlert.userId || null,
        },
      });

      // Log to audit log
      await this.auditLogger.logSecurity({
        action: 'security_alert_created',
        resource: 'security',
        resourceId: newAlert.id,
        details: {
          alertType: newAlert.type,
          severity: newAlert.severity,
          source: newAlert.source,
        },
        ipAddress: newAlert.ipAddress,
        userId: newAlert.userId,
      });

      // Emit event for real-time notifications
      if (this.alertNotificationsEnabled) {
        this.eventEmitter.emit('security.alert', newAlert);
      }

      // Auto-block if enabled and high severity
      if (this.autoBlockEnabled && (newAlert.severity === 'high' || newAlert.severity === 'critical')) {
        await this.blockSuspiciousIP(newAlert.ipAddress);
      }

      return newAlert;
    } catch (error) {
      console.error('Failed to create security alert:', error);
      throw new Error('Failed to create security alert');
    }
  }

  /**
   * Get all security alerts with optional filtering
   */
  async getAlerts(options: {
    type?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    status?: 'new' | 'investigating' | 'resolved' | 'false_positive';
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const {
      type,
      severity,
      status,
      fromDate,
      toDate,
      limit = 50,
      offset = 0,
    } = options;

    const where = {
      ...(type && { type }),
      ...(severity && { severity }),
      ...(status && { status }),
      ...(fromDate || toDate) && {
        timestamp: {
          ...(fromDate && { gte: fromDate }),
          ...(toDate && { lte: toDate }),
        },
      },
    };

    const [alerts, total] = await Promise.all([
      this.prisma.securityAlert.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.securityAlert.count({ where }),
    ]);

    return {
      alerts: alerts.map(alert => ({
        ...alert,
        details: JSON.parse(alert.details),
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Update the status of a security alert
   */
  async updateAlertStatus(alertId: string, status: 'investigating' | 'resolved' | 'false_positive', notes?: string) {
    await this.prisma.securityAlert.update({
      where: { id: alertId },
      data: { 
        status,
        ...(notes && { notes }),
      },
    });

    await this.auditLogger.logSecurity({
      action: 'security_alert_updated',
      resource: 'security',
      resourceId: alertId,
      details: { status, notes },
    });
  }

  /**
   * Handle failed login attempts
   */
  private async handleFailedLogin(data: { username: string; ipAddress: string; userAgent: string }) {
    try {
      const { username, ipAddress, userAgent } = data;
      
      // Count recent failed logins from this IP
      const recentFailures = await this.prisma.auditLog.count({
        where: {
          action: 'login_failed',
          ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
          },
        },
      });

      if (recentFailures >= this.alertThresholds.failedLoginAttempts) {
        await this.createAlert({
          type: 'brute_force_attempt',
          severity: recentFailures > this.alertThresholds.failedLoginAttempts * 2 ? 'high' : 'medium',
          source: 'authentication',
          details: {
            username,
            failedAttempts: recentFailures,
            userAgent,
          },
          ipAddress,
        });
      }
    } catch (error) {
      console.error('Error handling failed login:', error);
    }
  }

  /**
   * Handle rate limit exceeded events
   */
  private async handleRateLimitExceeded(data: { endpoint: string; ipAddress: string; userAgent: string; userId?: string }) {
    try {
      const { endpoint, ipAddress, userAgent, userId } = data;
      
      // Count recent rate limit violations from this IP
      const recentViolations = await this.prisma.auditLog.count({
        where: {
          action: 'rate_limit_exceeded',
          ipAddress,
          createdAt: {
            gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
          },
        },
      });

      if (recentViolations >= this.alertThresholds.rateLimitExceeded) {
        await this.createAlert({
          type: 'api_abuse',
          severity: recentViolations > this.alertThresholds.rateLimitExceeded * 2 ? 'high' : 'medium',
          source: 'rate_limiter',
          details: {
            endpoint,
            violationsCount: recentViolations,
            userAgent,
          },
          ipAddress,
          userId,
        });
      }
    } catch (error) {
      console.error('Error handling rate limit exceeded:', error);
    }
  }

  /**
   * Analyze audit logs for suspicious patterns
   */
  private async analyzeAuditLog(entry: any) {
    // Only analyze security-level logs
    if (entry.level !== AuditLogLevel.SECURITY) return;
    
    // Examples of suspicious activities to monitor:
    const suspiciousActions = [
      'permission_denied',
      'access_forbidden',
      'invalid_token',
      'role_escalation_attempt',
      'sensitive_data_access',
      'configuration_changed',
    ];

    if (suspiciousActions.includes(entry.action)) {
      try {
        // Check for repeated suspicious actions
        const recentSuspicious = await this.prisma.auditLog.count({
          where: {
            level: AuditLogLevel.SECURITY,
            action: {
              in: suspiciousActions,
            },
            ipAddress: entry.ipAddress,
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000), // Last 60 minutes
            },
          },
        });

        if (recentSuspicious >= this.alertThresholds.suspiciousActivities) {
          await this.createAlert({
            type: 'suspicious_activity',
            severity: 'high',
            source: 'audit_logs',
            details: {
              action: entry.action,
              resource: entry.resource,
              suspiciousCount: recentSuspicious,
            },
            ipAddress: entry.ipAddress,
            userId: entry.userId,
          });
        }
      } catch (error) {
        console.error('Error analyzing audit log:', error);
      }
    }
  }

  /**
   * Block a suspicious IP address
   */
  private async blockSuspiciousIP(ipAddress: string) {
    if (!ipAddress) return;
    
    try {
      // Add IP to blocked list
      await this.prisma.blockedIP.upsert({
        where: { ip: ipAddress },
        update: { 
          blockCount: { increment: 1 },
          lastBlockedAt: new Date(),
          isActive: true,
        },
        create: {
          ip: ipAddress,
          reason: 'Automated security block',
          blockCount: 1,
          isActive: true,
        },
      });

      await this.auditLogger.logSecurity({
        action: 'ip_blocked',
        resource: 'security',
        details: { ipAddress },
        ipAddress,
      });
    } catch (error) {
      console.error('Failed to block IP:', error);
    }
  }
}
