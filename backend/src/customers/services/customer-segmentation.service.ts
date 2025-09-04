import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerType, PaymentTerms } from '@prisma/client';
import { 
  CustomerSegmentationRuleDto, 
  CustomerSegmentDto, 
  SegmentAnalyticsDto,
  SegmentPricingRuleDto 
} from '../dto/customer-segmentation.dto';

export interface SegmentationCriteria {
  type: 'BUSINESS_TYPE' | 'VOLUME' | 'CREDIT_RATING' | 'LOCATION' | 'PURCHASE_HISTORY' | 'ENGAGEMENT';
  rules: SegmentationRule[];
}

export interface SegmentationRule {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between' | 'in' | 'contains';
  value: any;
  weight?: number;
}

@Injectable()
export class CustomerSegmentationService {
  private readonly logger = new Logger(CustomerSegmentationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new segmentation rule
   */
  async createSegmentationRule(dto: CustomerSegmentationRuleDto): Promise<any> {
    this.logger.log(`Creating segmentation rule: ${dto.name}`);

    // Store segmentation rules in database (we'll create a table for this)
    const rule = await this.prisma.customerSegmentationRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        criteria: dto.criteria as any,
        isActive: dto.isActive ?? true,
        priority: dto.priority ?? 1
      }
    });

    return rule;
  }

  /**
   * Get all active segmentation rules
   */
  async getSegmentationRules(): Promise<any[]> {
    return this.prisma.customerSegmentationRule.findMany({
      where: { isActive: true },
      orderBy: { priority: 'asc' }
    });
  }

  /**
   * Segment customers based on business type
   */
  async segmentByBusinessType(): Promise<CustomerSegmentDto[]> {
    this.logger.log('Segmenting customers by business type');

    const segments = await this.prisma.customer.groupBy({
      by: ['customerType'],
      where: { isActive: true },
      _count: { customerType: true },
      _sum: { creditLimit: true }
    });

    const result: CustomerSegmentDto[] = [];

    for (const segment of segments) {
      // Get sample customers for this segment
      const customers = await this.prisma.customer.findMany({
        where: { 
          customerType: segment.customerType,
          isActive: true
        },
        take: 10,
        include: {
          quotations: {
            select: { totalAmount: true, status: true }
          },
          orders: {
            select: { totalAmount: true, status: true }
          }
        }
      });

      // Calculate segment metrics
      const totalRevenue = await this.calculateSegmentRevenue(segment.customerType);
      const avgLifetimeValue = customers.length > 0 ? totalRevenue / customers.length : 0;

      result.push({
        segmentId: `business_type_${segment.customerType.toLowerCase()}`,
        name: this.getBusinessTypeDisplayName(segment.customerType),
        description: `Customers categorized as ${segment.customerType}`,
        criteria: {
          type: 'BUSINESS_TYPE',
          rules: [{ field: 'customerType', operator: 'equals', value: segment.customerType }]
        },
        customerCount: segment._count.customerType,
        totalValue: Number(segment._sum.creditLimit || 0),
        averageValue: segment._count.customerType > 0 ? Number(segment._sum.creditLimit || 0) / segment._count.customerType : 0,
        averageLifetimeValue: avgLifetimeValue,
        customers: customers.map(c => this.enrichCustomerData(c)),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return result;
  }

  /**
   * Segment customers by purchase volume
   */
  async segmentByVolume(): Promise<CustomerSegmentDto[]> {
    this.logger.log('Segmenting customers by purchase volume');

    const volumeSegments = [
      { name: 'High Volume', min: 500000, max: null, description: 'Customers with orders above ₹5L' },
      { name: 'Medium Volume', min: 100000, max: 499999, description: 'Customers with orders between ₹1L-₹5L' },
      { name: 'Low Volume', min: 0, max: 99999, description: 'Customers with orders below ₹1L' }
    ];

    const result: CustomerSegmentDto[] = [];

    for (const volumeSegment of volumeSegments) {
      // Get customers based on their total order value
      const customerIds = await this.getCustomerIdsByOrderVolume(volumeSegment.min, volumeSegment.max || undefined);
      
      const customers = await this.prisma.customer.findMany({
        where: { 
          id: { in: customerIds },
          isActive: true
        },
        take: 10,
        include: {
          quotations: {
            select: { totalAmount: true, status: true }
          },
          orders: {
            select: { totalAmount: true, status: true }
          }
        }
      });

      const totalValue = await this.calculateSegmentValueByIds(customerIds);
      const avgLifetimeValue = customers.length > 0 ? totalValue / customers.length : 0;

      result.push({
        segmentId: `volume_${volumeSegment.name.toLowerCase().replace(' ', '_')}`,
        name: volumeSegment.name,
        description: volumeSegment.description,
        criteria: {
          type: 'VOLUME',
          rules: [
            { field: 'orderValue', operator: 'greater_than', value: volumeSegment.min },
            ...(volumeSegment.max ? [{ field: 'orderValue', operator: 'less_than', value: volumeSegment.max }] : [])
          ]
        },
        customerCount: customers.length,
        totalValue,
        averageValue: customers.length > 0 ? totalValue / customers.length : 0,
        averageLifetimeValue: avgLifetimeValue,
        customers: customers.map(c => this.enrichCustomerData(c)),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return result;
  }

  /**
   * Segment customers by geographic location
   */
  async segmentByLocation(): Promise<CustomerSegmentDto[]> {
    this.logger.log('Segmenting customers by location');

    const locationSegments = await this.prisma.customer.groupBy({
      by: ['state'],
      where: { 
        isActive: true,
        state: { not: null }
      },
      _count: { state: true },
      _sum: { creditLimit: true }
    });

    const result: CustomerSegmentDto[] = [];

    for (const segment of locationSegments) {
      if (!segment.state) continue;

      const customers = await this.prisma.customer.findMany({
        where: { 
          state: segment.state,
          isActive: true
        },
        take: 10,
        include: {
          quotations: {
            select: { totalAmount: true, status: true }
          },
          orders: {
            select: { totalAmount: true, status: true }
          }
        }
      });

      const totalRevenue = await this.calculateSegmentRevenueByLocation(segment.state);
      const avgLifetimeValue = customers.length > 0 ? totalRevenue / customers.length : 0;

      result.push({
        segmentId: `location_${segment.state.toLowerCase().replace(/\s+/g, '_')}`,
        name: `${segment.state} Region`,
        description: `Customers located in ${segment.state}`,
        criteria: {
          type: 'LOCATION',
          rules: [{ field: 'state', operator: 'equals', value: segment.state }]
        },
        customerCount: segment._count.state,
        totalValue: Number(segment._sum.creditLimit || 0),
        averageValue: segment._count.state > 0 ? Number(segment._sum.creditLimit || 0) / segment._count.state : 0,
        averageLifetimeValue: avgLifetimeValue,
        customers: customers.map(c => this.enrichCustomerData(c)),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return result.sort((a, b) => b.customerCount - a.customerCount);
  }

  /**
   * Segment customers by engagement level
   */
  async segmentByEngagement(): Promise<CustomerSegmentDto[]> {
    this.logger.log('Segmenting customers by engagement level');

    const engagementSegments = [
      { name: 'Highly Engaged', minInteractions: 10, description: 'Customers with 10+ interactions' },
      { name: 'Moderately Engaged', minInteractions: 5, maxInteractions: 9, description: 'Customers with 5-9 interactions' },
      { name: 'Low Engagement', maxInteractions: 4, description: 'Customers with less than 5 interactions' }
    ];

    const result: CustomerSegmentDto[] = [];

    for (const engagementSegment of engagementSegments) {
      const customerIds = await this.getCustomerIdsByEngagement(
        engagementSegment.minInteractions, 
        engagementSegment.maxInteractions
      );

      const customers = await this.prisma.customer.findMany({
        where: { 
          id: { in: customerIds },
          isActive: true
        },
        take: 10,
        include: {
          quotations: {
            select: { totalAmount: true, status: true }
          },
          orders: {
            select: { totalAmount: true, status: true }
          },
          interactions: {
            select: { id: true, createdAt: true }
          }
        }
      });

      const totalValue = await this.calculateSegmentValueByIds(customerIds);
      const avgLifetimeValue = customers.length > 0 ? totalValue / customers.length : 0;

      result.push({
        segmentId: `engagement_${engagementSegment.name.toLowerCase().replace(' ', '_')}`,
        name: engagementSegment.name,
        description: engagementSegment.description,
        criteria: {
          type: 'ENGAGEMENT',
          rules: [
            ...(engagementSegment.minInteractions ? [{ field: 'interactionCount', operator: 'greater_than', value: engagementSegment.minInteractions - 1 }] : []),
            ...(engagementSegment.maxInteractions ? [{ field: 'interactionCount', operator: 'less_than', value: engagementSegment.maxInteractions + 1 }] : [])
          ]
        },
        customerCount: customers.length,
        totalValue,
        averageValue: customers.length > 0 ? totalValue / customers.length : 0,
        averageLifetimeValue: avgLifetimeValue,
        customers: customers.map(c => this.enrichCustomerData(c)),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return result;
  }

  /**
   * Apply automated customer categorization
   */
  async categorizeCustomer(customerId: string): Promise<string[]> {
    this.logger.log(`Categorizing customer: ${customerId}`);

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        quotations: {
          select: { totalAmount: true, status: true }
        },
        orders: {
          select: { totalAmount: true, status: true }
        },
        interactions: {
          select: { id: true }
        }
      }
    });

    if (!customer) {
      throw new Error(`Customer ${customerId} not found`);
    }

    const categories: string[] = [];

    // Business type category
    categories.push(`business_type_${customer.customerType.toLowerCase()}`);

    // Volume category
    const totalOrderValue = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    if (totalOrderValue >= 500000) {
      categories.push('volume_high_volume');
    } else if (totalOrderValue >= 100000) {
      categories.push('volume_medium_volume');
    } else {
      categories.push('volume_low_volume');
    }

    // Location category
    if (customer.state) {
      categories.push(`location_${customer.state.toLowerCase().replace(/\s+/g, '_')}`);
    }

    // Engagement category
    const interactionCount = customer.interactions.length;
    if (interactionCount >= 10) {
      categories.push('engagement_highly_engaged');
    } else if (interactionCount >= 5) {
      categories.push('engagement_moderately_engaged');
    } else {
      categories.push('engagement_low_engagement');
    }

    return categories;
  }

  /**
   * Get segment analytics
   */
  async getSegmentAnalytics(segmentId: string): Promise<SegmentAnalyticsDto> {
    this.logger.log(`Getting analytics for segment: ${segmentId}`);

    // This would typically query a segments table, but for now we'll calculate on-the-fly
    const [type, ...nameParts] = segmentId.split('_');
    const segmentName = nameParts.join('_');

    let customers: any[] = [];
    let totalRevenue = 0;

    switch (type) {
      case 'business':
        const businessType = segmentName.toUpperCase() as CustomerType;
        customers = await this.prisma.customer.findMany({
          where: { customerType: businessType, isActive: true },
          include: {
            quotations: { select: { totalAmount: true, status: true, createdAt: true } },
            orders: { select: { totalAmount: true, status: true, createdAt: true } }
          }
        });
        totalRevenue = await this.calculateSegmentRevenue(businessType);
        break;

      case 'location':
        const state = segmentName.replace(/_/g, ' ');
        customers = await this.prisma.customer.findMany({
          where: { state: { contains: state, mode: 'insensitive' }, isActive: true },
          include: {
            quotations: { select: { totalAmount: true, status: true, createdAt: true } },
            orders: { select: { totalAmount: true, status: true, createdAt: true } }
          }
        });
        totalRevenue = await this.calculateSegmentRevenueByLocation(state);
        break;

      default:
        throw new Error(`Unsupported segment type: ${type}`);
    }

    // Calculate metrics
    const totalQuotations = customers.reduce((sum, c) => sum + c.quotations.length, 0);
    const totalOrders = customers.reduce((sum, c) => sum + c.orders.length, 0);
    const conversionRate = totalQuotations > 0 ? (totalOrders / totalQuotations) * 100 : 0;

    // Generate monthly trends (last 12 months)
    const monthlyTrends = await this.generateMonthlyTrends(customers);

    return {
      segmentId,
      customerCount: customers.length,
      totalRevenue,
      averageLifetimeValue: customers.length > 0 ? totalRevenue / customers.length : 0,
      totalQuotations,
      totalOrders,
      conversionRate,
      monthlyTrends,
      topCustomers: customers
        .sort((a, b) => {
          const aValue = a.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
          const bValue = b.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
          return bValue - aValue;
        })
        .slice(0, 5)
        .map(c => this.enrichCustomerData(c))
    };
  }

  /**
   * Create segment-based pricing rule
   */
  async createSegmentPricingRule(dto: SegmentPricingRuleDto): Promise<any> {
    this.logger.log(`Creating pricing rule for segment: ${dto.segmentId}`);

    return this.prisma.segmentPricingRule.create({
      data: {
        segmentId: dto.segmentId,
        productId: dto.productId,
        discountPercentage: dto.discountPercentage,
        fixedPrice: dto.fixedPrice,
        minQuantity: dto.minQuantity ?? 1,
        maxQuantity: dto.maxQuantity,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : new Date(),
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        isActive: dto.isActive ?? true
      }
    });
  }

  /**
   * Get pricing rules for a customer segment
   */
  async getSegmentPricingRules(segmentId: string): Promise<any[]> {
    return this.prisma.segmentPricingRule.findMany({
      where: { 
        segmentId,
        isActive: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, basePrice: true }
        }
      }
    });
  }

  // Helper methods

  private async getCustomerIdsByOrderVolume(minValue: number, maxValue?: number): Promise<string[]> {
    const orderAggregates = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: {
        status: { in: ['DELIVERED', 'PAID'] }
      },
      _sum: { totalAmount: true },
      having: {
        totalAmount: {
          _sum: {
            gte: minValue,
            ...(maxValue ? { lte: maxValue } : {})
          }
        }
      }
    });

    return orderAggregates.map(agg => agg.customerId);
  }

  private async getCustomerIdsByEngagement(minInteractions?: number, maxInteractions?: number): Promise<string[]> {
    const interactionAggregates = await this.prisma.customerInteraction.groupBy({
      by: ['customerId'],
      _count: { customerId: true },
      having: {
        customerId: {
          _count: {
            ...(minInteractions ? { gte: minInteractions } : {}),
            ...(maxInteractions ? { lte: maxInteractions } : {})
          }
        }
      }
    });

    return interactionAggregates.map(agg => agg.customerId);
  }

  private async calculateSegmentRevenue(customerType: CustomerType): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        customer: { customerType },
        status: { in: ['DELIVERED', 'PAID'] }
      },
      _sum: { totalAmount: true }
    });

    return Number(result._sum.totalAmount || 0);
  }

  private async calculateSegmentRevenueByLocation(state: string): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        customer: { state: { contains: state, mode: 'insensitive' } },
        status: { in: ['DELIVERED', 'PAID'] }
      },
      _sum: { totalAmount: true }
    });

    return Number(result._sum.totalAmount || 0);
  }

  private async calculateSegmentValueByIds(customerIds: string[]): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        customerId: { in: customerIds },
        status: { in: ['DELIVERED', 'PAID'] }
      },
      _sum: { totalAmount: true }
    });

    return Number(result._sum.totalAmount || 0);
  }

  private async generateMonthlyTrends(customers: any[]): Promise<any[]> {
    const trends = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyQuotations = customers.reduce((sum, customer) => {
        return sum + customer.quotations.filter((q: any) => {
          const qDate = new Date(q.createdAt);
          return qDate >= monthStart && qDate <= monthEnd;
        }).length;
      }, 0);

      const monthlyOrders = customers.reduce((sum, customer) => {
        return sum + customer.orders.filter((o: any) => {
          const oDate = new Date(o.createdAt);
          return oDate >= monthStart && oDate <= monthEnd;
        }).length;
      }, 0);

      const monthlyRevenue = customers.reduce((sum, customer) => {
        return sum + customer.orders
          .filter((o: any) => {
            const oDate = new Date(o.createdAt);
            return oDate >= monthStart && oDate <= monthEnd && ['DELIVERED', 'PAID'].includes(o.status);
          })
          .reduce((orderSum: number, o: any) => orderSum + Number(o.totalAmount), 0);
      }, 0);

      trends.push({
        month: date.toISOString().substring(0, 7),
        quotations: monthlyQuotations,
        orders: monthlyOrders,
        revenue: monthlyRevenue,
        conversionRate: monthlyQuotations > 0 ? (monthlyOrders / monthlyQuotations) * 100 : 0
      });
    }

    return trends;
  }

  private getBusinessTypeDisplayName(type: CustomerType): string {
    const displayNames = {
      [CustomerType.INDIVIDUAL]: 'Individual Customers',
      [CustomerType.SMALL_BUSINESS]: 'Small Business',
      [CustomerType.ENTERPRISE]: 'Enterprise',
      [CustomerType.GOVERNMENT]: 'Government'
    };

    return displayNames[type] || type;
  }

  private enrichCustomerData(customer: any): any {
    return {
      ...customer,
      totalQuotations: customer.quotations?.length || 0,
      totalOrders: customer.orders?.length || 0,
      lifetimeValue: customer.orders?.reduce((sum: number, order: any) => 
        sum + (order.status === 'DELIVERED' || order.status === 'PAID' ? Number(order.totalAmount) : 0), 0) || 0
    };
  }
}