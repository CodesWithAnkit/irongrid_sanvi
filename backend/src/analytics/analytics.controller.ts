import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get business dashboard metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics retrieved successfully' })
  async getDashboardMetrics(@Query() query: AnalyticsQueryDto) {
    return {
      success: true,
      data: await this.analyticsService.getBusinessMetrics(query),
    };
  }

  @Get('sales-performance')
  @ApiOperation({ summary: 'Get sales performance metrics' })
  @ApiResponse({ status: 200, description: 'Sales performance metrics retrieved successfully' })
  async getSalesPerformance(@Query() query: AnalyticsQueryDto) {
    return {
      success: true,
      data: await this.analyticsService.getSalesPerformance(query),
    };
  }

  @Get('customer-lifetime-value')
  @ApiOperation({ summary: 'Get customer lifetime value analytics' })
  @ApiResponse({ status: 200, description: 'Customer lifetime value metrics retrieved successfully' })
  async getCustomerLifetimeValue(@Query() query: AnalyticsQueryDto) {
    return {
      success: true,
      data: await this.analyticsService.getCustomerLifetimeValue(query),
    };
  }

  @Get('product-performance')
  @ApiOperation({ summary: 'Get product performance metrics' })
  @ApiResponse({ status: 200, description: 'Product performance metrics retrieved successfully' })
  async getProductPerformance(@Query() query: AnalyticsQueryDto) {
    return {
      success: true,
      data: await this.analyticsService.getProductPerformance(query),
    };
  }

  @Get('revenue-forecasting')
  @ApiOperation({ summary: 'Get revenue forecasting data' })
  @ApiResponse({ status: 200, description: 'Revenue forecasting data retrieved successfully' })
  async getRevenueForecasting(@Query() query: AnalyticsQueryDto) {
    return {
      success: true,
      data: await this.analyticsService.getRevenueForecasting(query),
    };
  }
}