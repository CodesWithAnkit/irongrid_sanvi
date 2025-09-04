import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import { 
  CreateInteractionDto, 
  UpdateInteractionDto,
  CreateFollowUpDto,
  CustomerTimelineDto,
  CustomerRelationshipScoreDto,
  CrmAnalyticsDto,
  InteractionPriority
} from '../dto/customer-crm.dto';

export interface InteractionSummary {
  totalInteractions: number;
  interactionsByType: Record<string, number>;
  lastInteractionAt?: Date;
  averageResponseTime: number;
  engagementScore: number;
}

@Injectable()
export class CustomerCrmService {
  private readonly logger = new Logger(CustomerCrmService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new customer interaction
   */
  async createInteraction(dto: CreateInteractionDto, userId: string): Promise<any> {
    this.logger.log(`Creating interaction for customer: ${dto.customerId}`);

    // Verify customer exists
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${dto.customerId} not found`);
    }

    const interaction = await this.prisma.customerInteraction.create({
      data: {
        customerId: dto.customerId,
        userId,
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
        priority: dto.priority || InteractionPriority.MEDIUM,
        status: dto.status || 'PENDING',
        outcome: dto.outcome,
        followUpRequired: dto.followUpRequired || false,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        tags: dto.tags || [],
        attachments: dto.attachments || []
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true
          }
        }
      }
    });

    // Update customer engagement score
    await this.updateEngagementScore(dto.customerId);

    // Create follow-up task if required
    if (dto.followUpRequired && dto.followUpDate) {
      await this.createFollowUpTask({
        customerId: dto.customerId,
        interactionId: interaction.id,
        dueDate: dto.followUpDate,
        description: `Follow up on: ${dto.subject}`,
        priority: dto.priority || InteractionPriority.MEDIUM
      }, userId);
    }

    return interaction;
  }

  /**
   * Update an existing interaction
   */
  async updateInteraction(interactionId: string, dto: UpdateInteractionDto, userId: string): Promise<any> {
    this.logger.log(`Updating interaction: ${interactionId}`);

    const existingInteraction = await this.prisma.customerInteraction.findUnique({
      where: { id: interactionId }
    });

    if (!existingInteraction) {
      throw new NotFoundException(`Interaction with ID ${interactionId} not found`);
    }

    const updatedInteraction = await this.prisma.customerInteraction.update({
      where: { id: interactionId },
      data: {
        type: dto.type,
        subject: dto.subject,
        description: dto.description,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
        priority: dto.priority,
        status: dto.status,
        outcome: dto.outcome,
        followUpRequired: dto.followUpRequired,
        followUpDate: dto.followUpDate ? new Date(dto.followUpDate) : undefined,
        tags: dto.tags,
        attachments: dto.attachments,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true
          }
        }
      }
    });

    // Update engagement score if interaction was completed
    if (dto.status === 'COMPLETED' && existingInteraction.status !== 'COMPLETED') {
      await this.updateEngagementScore(existingInteraction.customerId);
    }

    return updatedInteraction;
  }

  /**
   * Get customer interaction timeline
   */
  async getCustomerTimeline(customerId: string, limit: number = 50): Promise<CustomerTimelineDto> {
    this.logger.log(`Getting timeline for customer: ${customerId}`);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Get interactions
    const interactions = await this.prisma.customerInteraction.findMany({
      where: { customerId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Get quotations
    const quotations = await this.prisma.quotation.findMany({
      where: { customerId },
      select: {
        id: true,
        quotationNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        emailSentAt: true,
        customerViewedAt: true,
        customerRespondedAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Get orders
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Combine and sort timeline events
    const timelineEvents = [
      ...interactions.map(i => ({
        id: i.id,
        type: 'INTERACTION' as const,
        subType: i.type,
        title: i.subject || `${i.type} interaction`,
        description: i.description || '',
        date: i.createdAt,
        status: i.status,
        priority: i.priority,
        user: i.user,
        metadata: {
          outcome: i.outcome,
          followUpRequired: i.followUpRequired,
          followUpDate: i.followUpDate,
          tags: i.tags
        }
      })),
      ...quotations.map(q => ({
        id: q.id,
        type: 'QUOTATION' as const,
        subType: q.status,
        title: `Quotation ${q.quotationNumber}`,
        description: `Quotation for ₹${q.totalAmount}`,
        date: q.createdAt,
        status: q.status,
        metadata: {
          amount: q.totalAmount,
          emailSentAt: q.emailSentAt,
          customerViewedAt: q.customerViewedAt,
          customerRespondedAt: q.customerRespondedAt
        }
      })),
      ...orders.map(o => ({
        id: o.id,
        type: 'ORDER' as const,
        subType: o.status,
        title: `Order ${o.orderNumber}`,
        description: `Order for ₹${o.totalAmount}`,
        date: o.createdAt,
        status: o.status,
        metadata: {
          amount: o.totalAmount
        }
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get interaction summary
    const interactionSummary = await this.getInteractionSummary(customerId);

    return {
      customerId,
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email
      },
      events: timelineEvents,
      summary: {
        totalEvents: timelineEvents.length,
        totalInteractions: interactions.length,
        totalQuotations: quotations.length,
        totalOrders: orders.length,
        lastActivityAt: timelineEvents[0]?.date,
        interactionSummary
      }
    };
  }

  /**
   * Create a follow-up task
   */
  async createFollowUpTask(dto: CreateFollowUpDto, userId: string): Promise<any> {
    this.logger.log(`Creating follow-up task for customer: ${dto.customerId}`);

    return this.prisma.followUpTask.create({
      data: {
        customerId: dto.customerId,
        interactionId: dto.interactionId,
        assignedToUserId: dto.assignedToUserId || userId,
        title: dto.title || 'Follow-up required',
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || InteractionPriority.MEDIUM,
        status: 'PENDING',
        createdByUserId: userId
      },
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
  }

  /**
   * Get follow-up tasks for a user
   */
  async getFollowUpTasks(userId: string, filters?: {
    customerId?: string;
    status?: string;
    priority?: string;
    dueBefore?: string;
    dueAfter?: string;
  }): Promise<any[]> {
    const where: any = { assignedToUserId: userId };

    if (filters?.customerId) where.customerId = filters.customerId;
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    
    if (filters?.dueBefore || filters?.dueAfter) {
      where.dueDate = {};
      if (filters.dueBefore) where.dueDate.lte = new Date(filters.dueBefore);
      if (filters.dueAfter) where.dueDate.gte = new Date(filters.dueAfter);
    }

    return this.prisma.followUpTask.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        interaction: {
          select: {
            id: true,
            subject: true,
            type: true
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' }
      ]
    });
  }

  /**
   * Complete a follow-up task
   */
  async completeFollowUpTask(taskId: string, outcome?: string): Promise<any> {
    return this.prisma.followUpTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        outcome
      }
    });
  }

  /**
   * Calculate customer relationship score
   */
  async calculateRelationshipScore(customerId: string): Promise<CustomerRelationshipScoreDto> {
    this.logger.log(`Calculating relationship score for customer: ${customerId}`);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        interactions: true,
        quotations: true,
        orders: true
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Calculate various scoring factors
    const interactionScore = this.calculateInteractionScore(customer.interactions);
    const responseScore = await this.calculateResponseScore(customerId);
    const purchaseScore = this.calculatePurchaseScore(customer.orders);
    const loyaltyScore = this.calculateLoyaltyScore(customer);
    const engagementScore = await this.getEngagementScore(customerId);

    // Weighted overall score
    const overallScore = Math.round(
      (interactionScore * 0.2) +
      (responseScore * 0.25) +
      (purchaseScore * 0.25) +
      (loyaltyScore * 0.15) +
      (engagementScore * 0.15)
    );

    return {
      customerId,
      overallScore,
      scoreBreakdown: {
        interactionScore,
        responseScore,
        purchaseScore,
        loyaltyScore,
        engagementScore
      },
      scoreCategory: this.getScoreCategory(overallScore),
      recommendations: this.generateRecommendations(overallScore, {
        interactionScore,
        responseScore,
        purchaseScore,
        loyaltyScore,
        engagementScore
      }),
      lastCalculatedAt: new Date()
    };
  }

  /**
   * Get CRM analytics for a date range
   */
  async getCrmAnalytics(startDate: Date, endDate: Date): Promise<CrmAnalyticsDto> {
    this.logger.log(`Getting CRM analytics from ${startDate} to ${endDate}`);

    const [
      totalInteractions,
      interactionsByType,
      completedTasks,
      pendingTasks,
      overdueTasks,
      averageResponseTime,
      topPerformers
    ] = await Promise.all([
      this.prisma.customerInteraction.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.customerInteraction.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { type: true }
      }),
      this.prisma.followUpTask.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.followUpTask.count({
        where: {
          status: 'PENDING',
          dueDate: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.followUpTask.count({
        where: {
          status: 'PENDING',
          dueDate: { lt: new Date() }
        }
      }),
      this.calculateAverageResponseTime(startDate, endDate),
      this.getTopPerformingUsers(startDate, endDate)
    ]);

    const interactionTypeBreakdown = interactionsByType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {} as Record<string, number>);

    return {
      dateRange: { startDate, endDate },
      totalInteractions,
      interactionsByType: interactionTypeBreakdown,
      taskMetrics: {
        completed: completedTasks,
        pending: pendingTasks,
        overdue: overdueTasks,
        completionRate: completedTasks + pendingTasks > 0 ? 
          (completedTasks / (completedTasks + pendingTasks)) * 100 : 0
      },
      averageResponseTime,
      topPerformers
    };
  }

  // Helper methods

  private async getInteractionSummary(customerId: string): Promise<InteractionSummary> {
    const interactions = await this.prisma.customerInteraction.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' }
    });

    const interactionsByType = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedInteractions = interactions.filter(i => i.completedAt);
    const averageResponseTime = completedInteractions.length > 0 ?
      completedInteractions.reduce((sum, i) => {
        if (i.scheduledAt && i.completedAt) {
          return sum + (new Date(i.completedAt).getTime() - new Date(i.scheduledAt).getTime());
        }
        return sum;
      }, 0) / completedInteractions.length / (1000 * 60 * 60) : 0; // Convert to hours

    const engagementScore = await this.getEngagementScore(customerId);

    return {
      totalInteractions: interactions.length,
      interactionsByType,
      lastInteractionAt: interactions[0]?.createdAt,
      averageResponseTime,
      engagementScore
    };
  }

  private async updateEngagementScore(customerId: string): Promise<void> {
    const interactions = await this.prisma.customerInteraction.findMany({
      where: { customerId }
    });

    const quotations = await this.prisma.quotation.findMany({
      where: { customerId }
    });

    const orders = await this.prisma.order.findMany({
      where: { customerId }
    });

    // Calculate engagement metrics
    const interactionCount = interactions?.length || 0;
    const lastInteractionAt = interactions && interactions.length > 0 ? 
      interactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : null;

    const quotationResponseRate = quotations && quotations.length > 0 ?
      (quotations.filter(q => q.customerRespondedAt).length / quotations.length) * 100 : 0;

    const respondedQuotations = quotations ? quotations.filter(q => q.emailSentAt && q.customerRespondedAt) : [];
    const averageResponseTime = respondedQuotations.length > 0 ?
      respondedQuotations.reduce((sum, q) => {
        return sum + (new Date(q.customerRespondedAt!).getTime() - new Date(q.emailSentAt!).getTime());
      }, 0) / respondedQuotations.length / (1000 * 60 * 60) : 0; // Convert to hours

    // Get customer creation date for purchase frequency calculation
    const customerData = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { createdAt: true }
    });

    const purchaseFrequency = orders && orders.length > 0 && customerData ? 
      orders.length / ((new Date().getTime() - new Date(customerData.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0; // Orders per month

    // Calculate overall engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (Math.min(interactionCount * 2, 40)) + // Max 40 points for interactions
      (quotationResponseRate * 0.3) + // Max 30 points for response rate
      (Math.max(0, 100 - averageResponseTime) * 0.2) + // Max 20 points for quick responses
      (Math.min(purchaseFrequency * 10, 10)) // Max 10 points for purchase frequency
    ));

    await this.prisma.customerEngagementScore.upsert({
      where: { customerId },
      update: {
        engagementScore,
        interactionCount,
        lastInteractionAt,
        quotationResponseRate,
        averageResponseTime,
        purchaseFrequency,
        updatedAt: new Date()
      },
      create: {
        customerId,
        engagementScore,
        interactionCount,
        lastInteractionAt,
        quotationResponseRate,
        averageResponseTime,
        purchaseFrequency
      }
    });
  }

  private async getEngagementScore(customerId: string): Promise<number> {
    const engagementData = await this.prisma.customerEngagementScore.findUnique({
      where: { customerId }
    });

    return engagementData?.engagementScore || 0;
  }

  private calculateInteractionScore(interactions: any[]): number {
    if (interactions.length === 0) return 0;
    
    const recentInteractions = interactions.filter(i => {
      const daysSince = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 90; // Last 90 days
    });

    return Math.min(100, recentInteractions.length * 5);
  }

  private async calculateResponseScore(customerId: string): Promise<number> {
    const quotations = await this.prisma.quotation.findMany({
      where: { 
        customerId,
        emailSentAt: { not: null }
      }
    });

    if (quotations.length === 0) return 50; // Neutral score for new customers

    const respondedQuotations = quotations.filter(q => q.customerRespondedAt);
    const responseRate = (respondedQuotations.length / quotations.length) * 100;

    return Math.round(responseRate);
  }

  private calculatePurchaseScore(orders: any[]): number {
    if (orders.length === 0) return 0;

    const completedOrders = orders.filter(o => ['DELIVERED', 'PAID'].includes(o.status));
    const totalValue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Score based on order frequency and value
    const frequencyScore = Math.min(50, completedOrders.length * 5);
    const valueScore = Math.min(50, totalValue / 10000); // ₹10k = 1 point

    return Math.round(frequencyScore + valueScore);
  }

  private calculateLoyaltyScore(customer: any): number {
    const daysSinceJoined = (new Date().getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const monthsSinceJoined = daysSinceJoined / 30;

    // Base loyalty score on tenure
    const tenureScore = Math.min(50, monthsSinceJoined * 2);

    // Bonus for consistent activity
    const recentActivity = customer.interactions.filter((i: any) => {
      const daysSince = (new Date().getTime() - new Date(i.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30;
    }).length;

    const activityBonus = Math.min(50, recentActivity * 10);

    return Math.round(tenureScore + activityBonus);
  }

  private getScoreCategory(score: number): string {
    if (score >= 80) return 'CHAMPION';
    if (score >= 60) return 'LOYAL';
    if (score >= 40) return 'POTENTIAL';
    if (score >= 20) return 'NEW';
    return 'AT_RISK';
  }

  private generateRecommendations(overallScore: number, breakdown: any): string[] {
    const recommendations: string[] = [];

    if (overallScore < 40) {
      recommendations.push('Schedule a check-in call to understand customer needs');
      recommendations.push('Send personalized product recommendations');
    }

    if (breakdown.interactionScore < 30) {
      recommendations.push('Increase interaction frequency with valuable content');
    }

    if (breakdown.responseScore < 50) {
      recommendations.push('Follow up on pending quotations');
      recommendations.push('Improve quotation presentation and clarity');
    }

    if (breakdown.purchaseScore < 30) {
      recommendations.push('Offer special pricing or incentives');
      recommendations.push('Identify barriers to purchase');
    }

    if (overallScore >= 80) {
      recommendations.push('Consider for referral program');
      recommendations.push('Explore upselling opportunities');
    }

    return recommendations;
  }

  private async calculateAverageResponseTime(startDate: Date, endDate: Date): Promise<number> {
    const quotations = await this.prisma.quotation.findMany({
      where: {
        emailSentAt: { gte: startDate, lte: endDate, not: null },
        customerRespondedAt: { not: null }
      }
    });

    if (quotations.length === 0) return 0;

    const totalResponseTime = quotations.reduce((sum, q) => {
      return sum + (new Date(q.customerRespondedAt!).getTime() - new Date(q.emailSentAt!).getTime());
    }, 0);

    return totalResponseTime / quotations.length / (1000 * 60 * 60); // Convert to hours
  }

  private async getTopPerformingUsers(startDate: Date, endDate: Date): Promise<any[]> {
    const userStats = await this.prisma.customerInteraction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { userId: true }
    });

    const usersWithDetails = await Promise.all(
      userStats.map(async (stat) => {
        const user = await this.prisma.user.findUnique({
          where: { id: stat.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        });

        return {
          user,
          interactionCount: stat._count.userId
        };
      })
    );

    return usersWithDetails
      .sort((a, b) => b.interactionCount - a.interactionCount)
      .slice(0, 5);
  }

  /**
   * Update customer credit limit with history tracking
   */
  async updateCreditLimit(customerId: string, newLimit: number, reason?: string, userId?: string): Promise<any> {
    this.logger.log(`Updating credit limit for customer: ${customerId} to ${newLimit}`);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const oldLimit = Number(customer.creditLimit);

    // Update customer credit limit
    const updatedCustomer = await this.prisma.customer.update({
      where: { id: customerId },
      data: { creditLimit: newLimit }
    });

    // Record credit limit history
    if (userId) {
      await this.prisma.creditLimitHistory.create({
        data: {
          customerId,
          oldLimit,
          newLimit,
          reason,
          changedBy: userId
        }
      });
    }

    return updatedCustomer;
  }

  /**
   * Get credit limit alerts for customers approaching or exceeding limits
   */
  async getCreditLimitAlerts(): Promise<any[]> {
    this.logger.log('Getting credit limit alerts');

    const customers = await this.prisma.customer.findMany({
      where: { 
        isActive: true,
        creditLimit: { gt: 0 }
      },
      include: {
        orders: {
          where: {
            status: { in: ['PENDING', 'PROCESSING', 'SHIPPED'] }
          },
          select: { totalAmount: true }
        }
      }
    });

    const alerts = [];

    for (const customer of customers) {
      const outstandingAmount = customer.orders.reduce((sum, order) => 
        sum + Number(order.totalAmount), 0);
      
      const creditLimit = Number(customer.creditLimit);
      const utilizationPercentage = creditLimit > 0 ? (outstandingAmount / creditLimit) * 100 : 0;

      let alertType: 'WARNING' | 'CRITICAL' | 'EXCEEDED' | null = null;
      let message = '';

      if (utilizationPercentage >= 100) {
        alertType = 'EXCEEDED';
        message = `Customer has exceeded credit limit by ₹${(outstandingAmount - creditLimit).toLocaleString()}`;
      } else if (utilizationPercentage >= 90) {
        alertType = 'CRITICAL';
        message = `Customer has utilized ${utilizationPercentage.toFixed(1)}% of credit limit`;
      } else if (utilizationPercentage >= 75) {
        alertType = 'WARNING';
        message = `Customer has utilized ${utilizationPercentage.toFixed(1)}% of credit limit`;
      }

      if (alertType) {
        alerts.push({
          customerId: customer.id,
          currentLimit: creditLimit,
          outstandingAmount,
          utilizationPercentage: Math.round(utilizationPercentage),
          alertType,
          message,
          customer: {
            id: customer.id,
            companyName: customer.companyName,
            contactPerson: customer.contactPerson,
            email: customer.email
          }
        });
      }
    }

    return alerts.sort((a, b) => b.utilizationPercentage - a.utilizationPercentage);
  }

  /**
   * Calculate and update customer lifetime value
   */
  async calculateCustomerLifetimeValue(customerId: string): Promise<any> {
    this.logger.log(`Calculating lifetime value for customer: ${customerId}`);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        orders: {
          where: { status: { in: ['DELIVERED', 'PAID'] } },
          select: { totalAmount: true, createdAt: true }
        }
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const completedOrders = customer.orders;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const totalOrders = completedOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const firstOrderDate = completedOrders.length > 0 ? 
      completedOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt : null;
    
    const lastOrderDate = completedOrders.length > 0 ? 
      completedOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt : null;

    const customerTenure = firstOrderDate ? 
      Math.floor((new Date().getTime() - new Date(firstOrderDate).getTime()) / (1000 * 60 * 60 * 24)) : 
      Math.floor((new Date().getTime() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    // Simple predictive model based on historical data
    const monthlyOrderFrequency = customerTenure > 0 ? (totalOrders / (customerTenure / 30)) : 0;
    const predictedLifetimeValue = monthlyOrderFrequency > 0 ? averageOrderValue * monthlyOrderFrequency * 24 : totalRevenue; // 24 months prediction

    // Calculate risk score based on various factors
    const daysSinceLastOrder = lastOrderDate ? 
      Math.floor((new Date().getTime() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)) : 
      customerTenure;
    
    let riskScore = 0;
    if (daysSinceLastOrder > 180) riskScore += 40; // No orders in 6 months
    else if (daysSinceLastOrder > 90) riskScore += 20; // No orders in 3 months
    
    if (monthlyOrderFrequency < 0.5) riskScore += 30; // Less than 1 order every 2 months
    if (totalOrders === 1) riskScore += 20; // Only one order ever
    if (totalRevenue < 50000) riskScore += 10; // Low total revenue

    riskScore = Math.min(100, riskScore);

    // Upsert customer lifetime value record
    const lifetimeValue = await this.prisma.customerLifetimeValue.upsert({
      where: { customerId },
      update: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        firstOrderDate,
        lastOrderDate,
        customerTenure,
        predictedLifetimeValue,
        riskScore,
        updatedAt: new Date()
      },
      create: {
        customerId,
        totalRevenue,
        totalOrders,
        averageOrderValue,
        firstOrderDate,
        lastOrderDate,
        customerTenure,
        predictedLifetimeValue,
        riskScore
      }
    });

    return lifetimeValue;
  }

  /**
   * Import customers from CSV file
   */
  async importCustomers(file: any, options: { skipDuplicates?: boolean; updateExisting?: boolean } = {}): Promise<any> {
    this.logger.log('Importing customers from CSV file');

    const csv = require('csv-parser');
    const fs = require('fs');
    const results: any[] = [];
    const errors: any[] = [];
    let processed = 0;
    let created = 0;
    let updated = 0;
    let skipped = 0;

    return new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data: any) => results.push(data))
        .on('end', async () => {
          try {
            for (const row of results) {
              processed++;
              
              try {
                // Validate required fields
                if (!row.companyName || !row.contactPerson || !row.email) {
                  errors.push({
                    row: processed,
                    error: 'Missing required fields: companyName, contactPerson, or email',
                    data: row
                  });
                  skipped++;
                  continue;
                }

                // Check if customer exists
                const existingCustomer = await this.prisma.customer.findUnique({
                  where: { email: row.email }
                });

                if (existingCustomer) {
                  if (options.skipDuplicates) {
                    skipped++;
                    continue;
                  } else if (options.updateExisting) {
                    await this.prisma.customer.update({
                      where: { id: existingCustomer.id },
                      data: {
                        companyName: row.companyName,
                        contactPerson: row.contactPerson,
                        phone: row.phone,
                        alternatePhone: row.alternatePhone,
                        address: row.address,
                        city: row.city,
                        state: row.state,
                        country: row.country || 'India',
                        postalCode: row.postalCode,
                        customerType: row.customerType || 'SMALL_BUSINESS',
                        creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : 0,
                        paymentTerms: row.paymentTerms || 'NET_30',
                        taxId: row.taxId,
                        gstNumber: row.gstNumber,
                        notes: row.notes
                      }
                    });
                    updated++;
                  } else {
                    errors.push({
                      row: processed,
                      error: 'Customer with this email already exists',
                      data: row
                    });
                    skipped++;
                  }
                } else {
                  // Create new customer
                  await this.prisma.customer.create({
                    data: {
                      companyName: row.companyName,
                      contactPerson: row.contactPerson,
                      email: row.email,
                      phone: row.phone,
                      alternatePhone: row.alternatePhone,
                      address: row.address,
                      city: row.city,
                      state: row.state,
                      country: row.country || 'India',
                      postalCode: row.postalCode,
                      customerType: row.customerType || 'SMALL_BUSINESS',
                      creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : 0,
                      paymentTerms: row.paymentTerms || 'NET_30',
                      taxId: row.taxId,
                      gstNumber: row.gstNumber,
                      notes: row.notes
                    }
                  });
                  created++;
                }
              } catch (error) {
                errors.push({
                  row: processed,
                  error: error.message,
                  data: row
                });
                skipped++;
              }
            }

            // Clean up uploaded file
            fs.unlinkSync(file.path);

            resolve({
              summary: {
                totalRows: results.length,
                processed,
                created,
                updated,
                skipped,
                errors: errors.length
              },
              errors: errors.slice(0, 100) // Limit error details to first 100
            });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error: any) => {
          reject(error);
        });
    });
  }

  /**
   * Export customers to CSV/Excel format
   */
  async exportCustomers(filters: any = {}, format: 'CSV' | 'EXCEL' | 'JSON' = 'CSV'): Promise<Buffer> {
    this.logger.log(`Exporting customers in ${format} format`);

    const where: any = { isActive: true };

    // Apply filters
    if (filters.segmentId) {
      where.segmentMemberships = {
        some: { segmentId: filters.segmentId, isActive: true }
      };
    }

    if (filters.customerType) {
      where.customerType = filters.customerType;
    }

    if (filters.dateRange) {
      where.createdAt = {
        gte: new Date(filters.dateRange.startDate),
        lte: new Date(filters.dateRange.endDate)
      };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        quotations: {
          select: { totalAmount: true, status: true }
        },
        orders: {
          select: { totalAmount: true, status: true }
        },
        lifetimeValue: true
      }
    });

    // Prepare export data
    const exportData = customers.map(customer => {
      const totalQuotations = customer.quotations.length;
      const totalOrders = customer.orders.length;
      const totalRevenue = customer.orders
        .filter(o => ['DELIVERED', 'PAID'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      return {
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        alternatePhone: customer.alternatePhone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        country: customer.country,
        postalCode: customer.postalCode,
        customerType: customer.customerType,
        creditLimit: Number(customer.creditLimit),
        paymentTerms: customer.paymentTerms,
        taxId: customer.taxId,
        gstNumber: customer.gstNumber,
        totalQuotations,
        totalOrders,
        totalRevenue,
        lifetimeValue: customer.lifetimeValue?.totalRevenue || 0,
        createdAt: customer.createdAt.toISOString(),
        notes: customer.notes
      };
    });

    // Generate export file based on format
    if (format === 'JSON') {
      return Buffer.from(JSON.stringify(exportData, null, 2));
    } else if (format === 'CSV') {
      const createCsvWriter = require('csv-writer').createObjectCsvWriter;
      const path = require('path');
      const tempFilePath = path.join('/tmp', `customers_export_${Date.now()}.csv`);

      const csvWriter = createCsvWriter({
        path: tempFilePath,
        header: Object.keys(exportData[0] || {}).map(key => ({ id: key, title: key }))
      });

      await csvWriter.writeRecords(exportData);
      const buffer = fs.readFileSync(tempFilePath);
      fs.unlinkSync(tempFilePath);
      return buffer;
    } else if (format === 'EXCEL') {
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
      
      return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}