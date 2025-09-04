import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomerSegmentationService } from '../services/customer-segmentation.service';
import {
  CustomerSegmentationRuleDto,
  CustomerSegmentDto,
  SegmentAnalyticsDto,
  SegmentPricingRuleDto,
  BulkSegmentationDto,
} from '../dto/customer-segmentation.dto';

interface SegmentPerformanceData {
  segmentId: string;
  name: string;
  customerCount: number;
  totalRevenue: number;
  averageLifetimeValue: number;
  conversionRate: number;
  revenuePerCustomer: number;
  revenueRank?: number;
  conversionRank?: number;
  customerCountRank?: number;
}

@ApiTags('Customer Segmentation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers/segmentation')
export class CustomerSegmentationController {
  constructor(private readonly segmentationService: CustomerSegmentationService) {}

  @Post('rules')
  @ApiOperation({ summary: 'Create a new segmentation rule' })
  @ApiResponse({ status: 201, description: 'Segmentation rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createSegmentationRule(@Body() createRuleDto: CustomerSegmentationRuleDto) {
    return this.segmentationService.createSegmentationRule(createRuleDto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get all active segmentation rules' })
  @ApiResponse({ status: 200, description: 'Segmentation rules retrieved successfully' })
  async getSegmentationRules() {
    return this.segmentationService.getSegmentationRules();
  }

  @Get('segments/business-type')
  @ApiOperation({ summary: 'Segment customers by business type' })
  @ApiResponse({ 
    status: 200, 
    description: 'Business type segments retrieved successfully', 
    type: [CustomerSegmentDto] 
  })
  async segmentByBusinessType(): Promise<CustomerSegmentDto[]> {
    return this.segmentationService.segmentByBusinessType();
  }

  @Get('segments/volume')
  @ApiOperation({ summary: 'Segment customers by purchase volume' })
  @ApiResponse({ 
    status: 200, 
    description: 'Volume segments retrieved successfully', 
    type: [CustomerSegmentDto] 
  })
  async segmentByVolume(): Promise<CustomerSegmentDto[]> {
    return this.segmentationService.segmentByVolume();
  }

  @Get('segments/location')
  @ApiOperation({ summary: 'Segment customers by geographic location' })
  @ApiResponse({ 
    status: 200, 
    description: 'Location segments retrieved successfully', 
    type: [CustomerSegmentDto] 
  })
  async segmentByLocation(): Promise<CustomerSegmentDto[]> {
    return this.segmentationService.segmentByLocation();
  }

  @Get('segments/engagement')
  @ApiOperation({ summary: 'Segment customers by engagement level' })
  @ApiResponse({ 
    status: 200, 
    description: 'Engagement segments retrieved successfully', 
    type: [CustomerSegmentDto] 
  })
  async segmentByEngagement(): Promise<CustomerSegmentDto[]> {
    return this.segmentationService.segmentByEngagement();
  }

  @Post('customers/:customerId/categorize')
  @ApiOperation({ summary: 'Categorize a specific customer' })
  @ApiResponse({ status: 200, description: 'Customer categorized successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async categorizeCustomer(@Param('customerId') customerId: string): Promise<string[]> {
    return this.segmentationService.categorizeCustomer(customerId);
  }

  @Post('customers/bulk-categorize')
  @ApiOperation({ summary: 'Categorize multiple customers' })
  @ApiResponse({ status: 200, description: 'Customers categorized successfully' })
  async bulkCategorizeCustomers(@Body() bulkDto: BulkSegmentationDto) {
    const results = [];
    
    for (const customerId of bulkDto.customerIds) {
      try {
        const categories = await this.segmentationService.categorizeCustomer(customerId);
        results.push({ customerId, categories, success: true });
      } catch (error) {
        results.push({ customerId, error: error.message, success: false });
      }
    }

    return {
      totalProcessed: bulkDto.customerIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  @Get('segments/:segmentId/analytics')
  @ApiOperation({ summary: 'Get analytics for a specific segment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Segment analytics retrieved successfully', 
    type: SegmentAnalyticsDto 
  })
  @ApiResponse({ status: 404, description: 'Segment not found' })
  async getSegmentAnalytics(@Param('segmentId') segmentId: string): Promise<SegmentAnalyticsDto> {
    return this.segmentationService.getSegmentAnalytics(segmentId);
  }

  @Post('segments/:segmentId/pricing-rules')
  @ApiOperation({ summary: 'Create segment-based pricing rule' })
  @ApiResponse({ status: 201, description: 'Pricing rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createSegmentPricingRule(
    @Param('segmentId') segmentId: string,
    @Body() pricingRuleDto: Omit<SegmentPricingRuleDto, 'segmentId'>
  ) {
    const fullDto = { ...pricingRuleDto, segmentId };
    return this.segmentationService.createSegmentPricingRule(fullDto);
  }

  @Get('segments/:segmentId/pricing-rules')
  @ApiOperation({ summary: 'Get pricing rules for a segment' })
  @ApiResponse({ status: 200, description: 'Pricing rules retrieved successfully' })
  async getSegmentPricingRules(@Param('segmentId') segmentId: string) {
    return this.segmentationService.getSegmentPricingRules(segmentId);
  }

  @Get('segments/all')
  @ApiOperation({ summary: 'Get all customer segments' })
  @ApiResponse({ status: 200, description: 'All segments retrieved successfully' })
  @ApiQuery({ name: 'type', required: false, type: String, description: 'Filter by segment type' })
  async getAllSegments(@Query('type') type?: string) {
    const segments = [];

    if (!type || type === 'business_type') {
      const businessTypeSegments = await this.segmentationService.segmentByBusinessType();
      segments.push(...businessTypeSegments);
    }

    if (!type || type === 'volume') {
      const volumeSegments = await this.segmentationService.segmentByVolume();
      segments.push(...volumeSegments);
    }

    if (!type || type === 'location') {
      const locationSegments = await this.segmentationService.segmentByLocation();
      segments.push(...locationSegments);
    }

    if (!type || type === 'engagement') {
      const engagementSegments = await this.segmentationService.segmentByEngagement();
      segments.push(...engagementSegments);
    }

    return {
      totalSegments: segments.length,
      segments: segments.sort((a, b) => b.customerCount - a.customerCount)
    };
  }

  @Get('segments/performance-comparison')
  @ApiOperation({ summary: 'Compare performance across all segments' })
  @ApiResponse({ status: 200, description: 'Segment performance comparison retrieved successfully' })
  async getSegmentPerformanceComparison() {
    const allSegments = await this.getAllSegments();
    const performanceData: SegmentPerformanceData[] = [];

    for (const segment of allSegments.segments) {
      try {
        const analytics = await this.segmentationService.getSegmentAnalytics(segment.segmentId);
        if (analytics) {
          performanceData.push({
            segmentId: segment.segmentId,
            name: segment.name,
            customerCount: segment.customerCount,
            totalRevenue: analytics.totalRevenue,
            averageLifetimeValue: analytics.averageLifetimeValue,
            conversionRate: analytics.conversionRate,
            revenuePerCustomer: segment.customerCount > 0 ? analytics.totalRevenue / segment.customerCount : 0
          });
        }
      } catch (error) {
        // Skip segments that can't be analyzed
        continue;
      }
    }

    // Sort by total revenue descending
    performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Add rankings
    performanceData.forEach((segment, index) => {
      segment.revenueRank = index + 1;
    });

    // Sort by conversion rate and add ranking
    const sortedByConversion = [...performanceData].sort((a, b) => b.conversionRate - a.conversionRate);
    sortedByConversion.forEach((segment, index) => {
      const originalSegment = performanceData.find(s => s.segmentId === segment.segmentId);
      if (originalSegment) {
        originalSegment.conversionRank = index + 1;
      }
    });

    // Sort by customer count and add ranking
    const sortedByCustomerCount = [...performanceData].sort((a, b) => b.customerCount - a.customerCount);
    sortedByCustomerCount.forEach((segment, index) => {
      const originalSegment = performanceData.find(s => s.segmentId === segment.segmentId);
      if (originalSegment) {
        originalSegment.customerCountRank = index + 1;
      }
    });

    return {
      totalSegments: performanceData.length,
      topPerformers: {
        byRevenue: performanceData.slice(0, 5),
        byConversion: sortedByConversion.slice(0, 5),
        byCustomerCount: sortedByCustomerCount.slice(0, 5)
      },
      allSegments: performanceData
    };
  }
}