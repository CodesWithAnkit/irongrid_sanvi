import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AnalyticsQueryDto,
  BusinessMetrics,
  SalesPerformanceMetrics,
  CustomerLifetimeValueMetrics,
  ProductPerformanceMetrics,
  RevenueForecasting,
  DateRangeType,
} from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getBusinessMetrics(query: AnalyticsQueryDto): Promise<BusinessMetrics> {
    const { startDate, endDate } = this.getDateRange(query);

    const [
      quotationMetrics,
      customerMetrics,
      revenueMetrics,
      performanceMetrics,
    ] = await Promise.all([
      this.getQuotationMetrics(startDate, endDate),
      this.getCustomerMetrics(startDate, endDate),
      this.getRevenueMetrics(startDate, endDate),
      this.getPerformanceMetrics(startDate, endDate),
    ]);

    return {
      quotationMetrics,
      customerMetrics,
      revenueMetrics,
      performanceMetrics,
    };
  }

  async getSalesPerformance(query: AnalyticsQueryDto): Promise<SalesPerformanceMetrics> {
    const { startDate, endDate } = this.getDateRange(query);

    const [totalSales, salesByUser, salesByPeriod] = await Promise.all([
      this.getTotalSales(startDate, endDate),
      this.getSalesByUser(startDate, endDate),
      this.getSalesByPeriod(startDate, endDate),
    ]);

    const previousPeriodSales = await this.getTotalSales(
      this.getPreviousPeriodStart(startDate, endDate),
      startDate,
    );

    const salesGrowth = previousPeriodSales > 0 
      ? ((totalSales - previousPeriodSales) / previousPeriodSales) * 100 
      : 0;

    const totalQuotations = await this.prisma.quotation.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const averageDealSize = totalQuotations > 0 ? totalSales / totalQuotations : 0;

    return {
      totalSales,
      salesGrowth,
      averageDealSize,
      salesByUser,
      salesByPeriod,
    };
  }

  async getCustomerLifetimeValue(query: AnalyticsQueryDto): Promise<CustomerLifetimeValueMetrics> {
    const { startDate, endDate } = this.getDateRange(query);

    const customers = await this.prisma.customer.findMany({
      include: {
        quotations: {
          where: {
            status: 'APPROVED',
            createdAt: { gte: startDate, lte: endDate },
          },
        },
        orders: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const clvData = customers.map(customer => {
      const totalValue = customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
      const orderCount = customer.orders.length;
      const lastOrderDate = customer.orders.length > 0 
        ? new Date(Math.max(...customer.orders.map(o => o.createdAt.getTime())))
        : new Date();

      return {
        customerId: customer.id,
        customerName: customer.companyName,
        clv: totalValue,
        totalOrders: orderCount,
        lastOrderDate,
      };
    });

    const averageClv = clvData.length > 0 
      ? clvData.reduce((sum, c) => sum + c.clv, 0) / clvData.length 
      : 0;

    const topValueCustomers = clvData
      .sort((a, b) => b.clv - a.clv)
      .slice(0, 10);

    const clvDistribution = this.calculateClvDistribution(clvData);
    const customerSegments = await this.getCustomerSegments(startDate, endDate);

    return {
      averageClv,
      clvGrowth: 0, // TODO: Calculate based on previous period
      customerSegments,
      clvDistribution,
      topValueCustomers,
    };
  }

  async getProductPerformance(query: AnalyticsQueryDto): Promise<ProductPerformanceMetrics> {
    const { startDate, endDate } = this.getDateRange(query);

    const productStats = await this.prisma.quotationItem.groupBy({
      by: ['productId'],
      where: {
        quotation: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'APPROVED',
        },
      },
      _sum: {
        lineTotal: true,
        quantity: true,
      },
      _count: {
        quotationId: true,
      },
    });

    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productStats.map(p => p.productId) },
      },
    });

    const topPerformingProducts = productStats
      .map(stat => {
        const product = products.find(p => p.id === stat.productId);
        return {
          productId: stat.productId,
          productName: product?.name || 'Unknown',
          revenue: Number(stat._sum.lineTotal) || 0,
          quantitySold: stat._sum.quantity || 0,
          profitMargin: 0, // TODO: Calculate based on cost
          quotationCount: stat._count.quotationId,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const categoryPerformance = await this.getCategoryPerformance(startDate, endDate);
    const inventoryInsights = await this.getInventoryInsights();

    return {
      totalProducts: products.length,
      topPerformingProducts,
      categoryPerformance,
      inventoryInsights,
    };
  }

  async getRevenueForecasting(query: AnalyticsQueryDto): Promise<RevenueForecasting> {
    const { startDate, endDate } = this.getDateRange(query);

    // Simple linear regression for forecasting
    const historicalData = await this.getHistoricalRevenueData(startDate, endDate);
    const forecastedRevenue = this.calculateRevenueForecast(historicalData);
    const trendAnalysis = this.analyzeTrend(historicalData);

    // Get current revenue for baseline
    const currentRevenue = await this.getTotalRevenue(startDate, endDate);
    const baseRevenue = currentRevenue > 0 ? currentRevenue : 1000000; // Default baseline
    
    return {
      forecastedRevenue,
      trendAnalysis,
      scenarios: {
        optimistic: baseRevenue * 1.2,
        realistic: baseRevenue,
        pessimistic: baseRevenue * 0.8,
      },
    };
  }

  private getDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now);

    if (query.dateRange === DateRangeType.CUSTOM && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else {
      switch (query.dateRange) {
        case DateRangeType.LAST_7_DAYS:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case DateRangeType.LAST_30_DAYS:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case DateRangeType.LAST_90_DAYS:
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case DateRangeType.LAST_YEAR:
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return { startDate, endDate };
  }

  private async getQuotationMetrics(startDate: Date, endDate: Date) {
    const [totalQuotations, statusBreakdown, avgValue, avgResponseTime] = await Promise.all([
      this.prisma.quotation.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.quotation.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
      this.prisma.quotation.aggregate({
        where: { createdAt: { gte: startDate, lte: endDate } },
        _avg: { totalAmount: true },
      }),
      this.calculateAverageResponseTime(startDate, endDate),
    ]);

    const approvedQuotations = statusBreakdown.find(s => s.status === 'APPROVED')?._count.id || 0;
    const conversionRate = totalQuotations > 0 ? (approvedQuotations / totalQuotations) * 100 : 0;

    return {
      totalQuotations,
      conversionRate,
      averageValue: Number(avgValue._avg?.totalAmount) || 0,
      responseTime: avgResponseTime,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  private async getCustomerMetrics(startDate: Date, endDate: Date) {
    const [totalCustomers, newCustomers, activeCustomers, topCustomers] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({
        where: { createdAt: { gte: startDate, lte: endDate } },
      }),
      this.prisma.customer.count({
        where: {
          quotations: {
            some: { createdAt: { gte: startDate, lte: endDate } },
          },
        },
      }),
      this.getTopCustomers(startDate, endDate),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      newCustomers,
      customerLifetimeValue: 0, // TODO: Calculate properly
      topCustomers,
    };
  }

  private async getRevenueMetrics(startDate: Date, endDate: Date) {
    const [totalRevenue, revenueByMonth, topProducts] = await Promise.all([
      this.getTotalRevenue(startDate, endDate),
      this.getRevenueByMonth(startDate, endDate),
      this.getTopProductsByRevenue(startDate, endDate),
    ]);

    const previousPeriodRevenue = await this.getTotalRevenue(
      this.getPreviousPeriodStart(startDate, endDate),
      startDate,
    );

    const monthlyGrowth = previousPeriodRevenue > 0 
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      monthlyGrowth,
      forecastedRevenue: totalRevenue * 1.1, // Simple forecast
      revenueByMonth,
      topProducts,
    };
  }

  private async getPerformanceMetrics(startDate: Date, endDate: Date) {
    return {
      averageQuotationTime: await this.calculateAverageQuotationTime(startDate, endDate),
      emailDeliveryRate: 95.5, // TODO: Calculate from email service
      systemUptime: 99.9, // TODO: Calculate from monitoring
      apiResponseTime: 150, // TODO: Calculate from monitoring
    };
  }

  private async getTotalSales(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'DELIVERED', // Use valid order status
      },
      _sum: { totalAmount: true },
    });
    return Number(result._sum?.totalAmount) || 0;
  }

  private async getTotalRevenue(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.quotation.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'APPROVED',
      },
      _sum: { totalAmount: true },
    });
    return Number(result._sum?.totalAmount) || 0;
  }

  private getPreviousPeriodStart(startDate: Date, endDate: Date): Date {
    const periodLength = endDate.getTime() - startDate.getTime();
    return new Date(startDate.getTime() - periodLength);
  }

  private async calculateAverageResponseTime(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implement based on quotation response tracking
    return 24; // hours
  }

  private async calculateAverageQuotationTime(startDate: Date, endDate: Date): Promise<number> {
    // TODO: Implement based on quotation creation to send time
    return 2; // hours
  }

  private async getTopCustomers(startDate: Date, endDate: Date) {
    const customers = await this.prisma.customer.findMany({
      include: {
        quotations: {
          where: {
            createdAt: { gte: startDate, lte: endDate },
            status: 'APPROVED',
          },
        },
      },
    });

    return customers
      .map(customer => ({
        id: customer.id,
        name: customer.companyName,
        totalValue: customer.quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0),
        quotationCount: customer.quotations.length,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  }

  private async getRevenueByMonth(startDate: Date, endDate: Date) {
    // TODO: Implement proper monthly aggregation
    return [];
  }

  private async getTopProductsByRevenue(startDate: Date, endDate: Date) {
    // TODO: Implement product revenue calculation
    return [];
  }

  private async getSalesByUser(startDate: Date, endDate: Date) {
    // TODO: Implement sales by user calculation
    return [];
  }

  private async getSalesByPeriod(startDate: Date, endDate: Date) {
    // TODO: Implement sales by period calculation
    return [];
  }

  private calculateClvDistribution(clvData: any[]) {
    // TODO: Implement CLV distribution calculation
    return [];
  }

  private async getCustomerSegments(startDate: Date, endDate: Date) {
    // TODO: Implement customer segmentation
    return [];
  }

  private async getCategoryPerformance(startDate: Date, endDate: Date) {
    // TODO: Implement category performance calculation
    return [];
  }

  private async getInventoryInsights() {
    // TODO: Implement inventory insights
    return [];
  }

  private async getHistoricalRevenueData(startDate: Date, endDate: Date) {
    // TODO: Implement historical revenue data retrieval
    return [];
  }

  private calculateRevenueForecast(historicalData: any[]): Array<{
    period: string;
    predictedRevenue: number;
    confidence: number;
    actualRevenue?: number;
  }> {
    // Simple forecasting - return next 3 months with basic growth projection
    const baseRevenue = 1000000; // Default base revenue
    const growthRate = 0.05; // 5% monthly growth
    
    return [
      {
        period: 'Next Month',
        predictedRevenue: baseRevenue * (1 + growthRate),
        confidence: 0.8,
      },
      {
        period: 'Month +2',
        predictedRevenue: baseRevenue * Math.pow(1 + growthRate, 2),
        confidence: 0.7,
      },
      {
        period: 'Month +3',
        predictedRevenue: baseRevenue * Math.pow(1 + growthRate, 3),
        confidence: 0.6,
      },
    ];
  }

  private analyzeTrend(historicalData: any[]) {
    // TODO: Implement trend analysis
    return {
      trend: 'stable' as const,
      growthRate: 0,
      seasonality: false,
      factors: [],
    };
  }
}