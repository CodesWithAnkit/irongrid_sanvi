import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggerService } from './audit-logger.service';
import { EncryptionService } from './encryption.service';

export interface PersonalDataRequest {
  id: string;
  userId: string;
  email: string;
  requestType: 'access' | 'deletion' | 'correction' | 'restriction' | 'portability';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  completionDate?: Date;
  details?: string;
  dataProvided?: string;
}

@Injectable()
export class GdprComplianceService {
  private readonly retentionPeriods = {
    customerData: 730, // days (2 years)
    transactionData: 2555, // days (7 years)
    analyticsData: 90, // days
    userLogs: 365, // days (1 year)
    marketingConsent: 1095, // days (3 years)
  };

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private auditLogger: AuditLoggerService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Process a data subject access request (DSAR)
   */
  async processDataRequest(request: Omit<PersonalDataRequest, 'id' | 'requestDate' | 'status'>): Promise<PersonalDataRequest> {
    const requestId = `gdpr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    try {
      const newRequest = await this.prisma.dataRequest.create({
        data: {
          id: requestId,
          userId: request.userId,
          email: request.email,
          requestType: request.requestType,
          status: 'pending',
          details: request.details || null,
        },
      });
      
      // Log the request
      await this.auditLogger.log({
        userId: request.userId,
        action: `gdpr_${request.requestType}_requested`,
        resource: 'data_privacy',
        resourceId: requestId,
        details: { email: request.email },
        level: 'SECURITY',
      });
      
      return {
        ...newRequest,
        requestDate: newRequest.createdAt,
      };
    } catch (error) {
      console.error('Failed to process data request:', error);
      throw new Error('Failed to process GDPR data request');
    }
  }

  /**
   * Handle a data access request and compile all user data
   */
  async handleAccessRequest(requestId: string): Promise<any> {
    const request = await this.prisma.dataRequest.findUnique({
      where: { id: requestId },
    });
    
    if (!request || request.requestType !== 'access') {
      throw new Error('Invalid request');
    }
    
    try {
      // Update request status
      await this.prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });
      
      // Collect all user data
      const userData = await this.collectUserData(request.userId);
      
      // Convert to portable format (JSON)
      const portableData = JSON.stringify(userData);
      
      // Encrypt the data for secure delivery
      const encryptedData = this.encryptionService.encrypt(portableData);
      
      // Update request with completion
      await this.prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completionDate: new Date(),
          dataProvided: encryptedData,
        },
      });
      
      await this.auditLogger.log({
        userId: request.userId,
        action: 'gdpr_access_completed',
        resource: 'data_privacy',
        resourceId: requestId,
        level: 'SECURITY',
      });
      
      return {
        requestId,
        status: 'completed',
        message: 'Data access request processed successfully',
      };
    } catch (error) {
      console.error('Error processing access request:', error);
      
      // Update request with error
      await this.prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          details: `Failed to process: ${error.message}`,
        },
      });
      
      throw error;
    }
  }

  /**
   * Handle a data deletion request
   */
  async handleDeletionRequest(requestId: string): Promise<any> {
    const request = await this.prisma.dataRequest.findUnique({
      where: { id: requestId },
    });
    
    if (!request || request.requestType !== 'deletion') {
      throw new Error('Invalid request');
    }
    
    try {
      // Update request status
      await this.prisma.dataRequest.update({
        where: { id: requestId },
        data: { status: 'processing' },
      });
      
      // Begin transaction for data deletion
      await this.prisma.$transaction(async (tx) => {
        // Anonymize user data instead of hard deletion
        await tx.user.update({
          where: { id: request.userId },
          data: {
            email: `anonymized_${Date.now()}@deleted.user`,
            firstName: 'Anonymized',
            lastName: 'User',
            phone: null,
            address: null,
            isActive: false,
          },
        });
        
        // Delete or anonymize related data
        await tx.customer.updateMany({
          where: { userId: request.userId },
          data: {
            email: `anonymized_${Date.now()}@deleted.customer`,
            firstName: 'Anonymized',
            lastName: 'Customer',
            phone: null,
            address: null,
            isActive: false,
          },
        });
        
        // Mark user as deleted but keep necessary records for legal/business purposes
        await tx.userDeletion.create({
          data: {
            userId: request.userId,
            reason: 'GDPR Deletion Request',
            requestId,
          },
        });
      });
      
      // Update request with completion
      await this.prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completionDate: new Date(),
        },
      });
      
      await this.auditLogger.log({
        userId: request.userId,
        action: 'gdpr_deletion_completed',
        resource: 'data_privacy',
        resourceId: requestId,
        level: 'SECURITY',
      });
      
      return {
        requestId,
        status: 'completed',
        message: 'Data deletion request processed successfully',
      };
    } catch (error) {
      console.error('Error processing deletion request:', error);
      
      // Update request with error
      await this.prisma.dataRequest.update({
        where: { id: requestId },
        data: {
          status: 'rejected',
          details: `Failed to process: ${error.message}`,
        },
      });
      
      throw error;
    }
  }

  /**
   * Generate a GDPR compliance report for the organization
   */
  async generateComplianceReport(): Promise<any> {
    try {
      const now = new Date();
      const reportId = `gdpr_report_${now.toISOString().split('T')[0]}`;
      
      const [
        totalUsers,
        activeConsents,
        dataRequests,
        privacyIncidents,
        dataRetention,
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.userConsent.count({
          where: { isActive: true },
        }),
        this.prisma.dataRequest.groupBy({
          by: ['requestType', 'status'],
          _count: true,
        }),
        this.prisma.securityAlert.count({
          where: {
            type: { startsWith: 'privacy_' },
            createdAt: { gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.checkDataRetentionCompliance(),
      ]);
      
      const report = {
        reportId,
        generatedAt: now,
        metrics: {
          totalUsers,
          activeConsents,
          consentPercentage: totalUsers > 0 ? (activeConsents / totalUsers) * 100 : 0,
          dataRequests: this.formatDataRequestStats(dataRequests),
          privacyIncidents,
          dataRetentionCompliance: dataRetention,
        },
        complianceStatus: this.calculateComplianceStatus({
          consentPercentage: totalUsers > 0 ? (activeConsents / totalUsers) * 100 : 0,
          dataRequests,
          privacyIncidents,
          dataRetention,
        }),
        recommendations: [],
      };
      
      // Add recommendations based on compliance issues
      if (report.metrics.consentPercentage < 90) {
        report.recommendations.push(
          'Improve user consent collection process to reach at least 90% coverage',
        );
      }
      
      if (report.metrics.dataRequests.pendingRequests > 0) {
        report.recommendations.push(
          `Process ${report.metrics.dataRequests.pendingRequests} pending data subject requests`,
        );
      }
      
      if (!dataRetention.fullyCompliant) {
        report.recommendations.push(
          'Review data retention policies for non-compliant data categories',
        );
      }
      
      // Store the report
      await this.prisma.gdprReport.create({
        data: {
          id: reportId,
          reportData: JSON.stringify(report),
        },
      });
      
      return report;
    } catch (error) {
      console.error('Failed to generate GDPR compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  /**
   * Check if we're respecting data retention periods
   */
  private async checkDataRetentionCompliance(): Promise<{
    fullyCompliant: boolean;
    details: Record<string, { compliant: boolean; oldRecordsCount: number }>;
  }> {
    const result = {
      fullyCompliant: true,
      details: {},
    };
    
    // Check customer data retention
    const oldCustomerData = await this.prisma.customer.count({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - this.retentionPeriods.customerData * 24 * 60 * 60 * 1000),
        },
        isActive: false,
      },
    });
    
    result.details.customerData = {
      compliant: oldCustomerData === 0,
      oldRecordsCount: oldCustomerData,
    };
    
    if (oldCustomerData > 0) {
      result.fullyCompliant = false;
    }
    
    // Check analytics data retention
    const oldAnalyticsData = await this.prisma.analytics.count({
      where: {
        timestamp: {
          lt: new Date(Date.now() - this.retentionPeriods.analyticsData * 24 * 60 * 60 * 1000),
        },
      },
    });
    
    result.details.analyticsData = {
      compliant: oldAnalyticsData === 0,
      oldRecordsCount: oldAnalyticsData,
    };
    
    if (oldAnalyticsData > 0) {
      result.fullyCompliant = false;
    }
    
    return result;
  }

  /**
   * Format data request statistics
   */
  private formatDataRequestStats(dataRequests: any[]): any {
    const stats = {
      totalRequests: 0,
      accessRequests: 0,
      deletionRequests: 0,
      correctionRequests: 0,
      pendingRequests: 0,
      completedRequests: 0,
      averageCompletionTime: 0, // Will be calculated later
    };
    
    dataRequests.forEach(item => {
      const count = item._count || 0;
      stats.totalRequests += count;
      
      // Count by request type
      if (item.requestType === 'access') stats.accessRequests += count;
      if (item.requestType === 'deletion') stats.deletionRequests += count;
      if (item.requestType === 'correction') stats.correctionRequests += count;
      
      // Count by status
      if (item.status === 'pending' || item.status === 'processing') stats.pendingRequests += count;
      if (item.status === 'completed') stats.completedRequests += count;
    });
    
    return stats;
  }

  /**
   * Calculate overall compliance status
   */
  private calculateComplianceStatus(metrics: any): 'compliant' | 'partially_compliant' | 'non_compliant' {
    // This is a simplified calculation - real-world compliance is more complex
    const issues = [];
    
    if (metrics.consentPercentage < 85) issues.push('consent');
    if (metrics.privacyIncidents > 5) issues.push('incidents');
    if (!metrics.dataRetention.fullyCompliant) issues.push('retention');
    if (metrics.dataRequests.find(r => r.status === 'pending' && 
        new Date(r.createdAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))) {
      issues.push('request_handling');
    }
    
    if (issues.length === 0) return 'compliant';
    if (issues.length <= 2) return 'partially_compliant';
    return 'non_compliant';
  }

  /**
   * Collect all data for a specific user
   */
  private async collectUserData(userId: string): Promise<any> {
    const [
      userData,
      customerData,
      quotations,
      orders,
      invoices,
      consentHistory,
      auditLogs,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.customer.findMany({
        where: { userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          company: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.quotation.findMany({
        where: { 
          customer: { userId } 
        },
        select: {
          id: true,
          title: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          quotationItems: true,
        },
      }),
      this.prisma.order.findMany({
        where: { 
          customer: { userId } 
        },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          items: true,
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          order: {
            customer: { userId }
          }
        },
        select: {
          id: true,
          invoiceNumber: true,
          amount: true,
          status: true,
          createdAt: true,
          dueDate: true,
        },
      }),
      this.prisma.userConsent.findMany({
        where: { userId },
        select: {
          consentType: true,
          isActive: true,
          givenAt: true,
          revokedAt: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where: { userId },
        select: {
          action: true,
          resource: true,
          createdAt: true,
          ipAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
    ]);
    
    return {
      personalData: userData,
      customerProfiles: customerData,
      businessData: {
        quotations,
        orders,
        invoices,
      },
      consentHistory,
      activityLogs: auditLogs,
    };
  }
}
