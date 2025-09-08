import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CacheService } from '../services/cache.service';
import { CacheWarmingService } from '../services/cache-warming.service';
import { CacheMonitoringService } from '../services/cache-monitoring.service';
import { QueryOptimizationService } from '../services/query-optimization.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('Cache Administration')
@Controller('admin/cache')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class CacheAdminController {
  constructor(
    private cacheService: CacheService,
    private cacheWarmingService: CacheWarmingService,
    private cacheMonitoringService: CacheMonitoringService,
    private queryOptimizationService: QueryOptimizationService,
  ) {}

  @Get('info')
  @ApiOperation({ summary: 'Get cache information and statistics' })
  @ApiResponse({ status: 200, description: 'Cache information retrieved successfully' })
  async getCacheInfo(): Promise<any> {
    const [cacheInfo, metrics, report] = await Promise.all([
      this.cacheService.getCacheInfo(),
      this.cacheService.getMetrics(),
      this.cacheMonitoringService.generateReport(),
    ]);

    return {
      cacheInfo,
      metrics,
      monitoring: {
        alerts: report.alerts,
        recommendations: report.recommendations,
        trends: this.cacheMonitoringService.getPerformanceTrends(),
      },
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get cache performance metrics' })
  @ApiResponse({ status: 200, description: 'Cache metrics retrieved successfully' })
  async getCacheMetrics(): Promise<any> {
    return this.cacheService.getMetrics();
  }

  @Get('monitoring/report')
  @ApiOperation({ summary: 'Get comprehensive cache monitoring report' })
  @ApiResponse({ status: 200, description: 'Monitoring report generated successfully' })
  async getMonitoringReport(): Promise<any> {
    return this.cacheMonitoringService.generateReport();
  }

  @Get('monitoring/alerts')
  @ApiOperation({ summary: 'Get recent cache alerts' })
  @ApiResponse({ status: 200, description: 'Cache alerts retrieved successfully' })
  async getCacheAlerts(@Query('hours') hours?: string): Promise<any> {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.cacheMonitoringService.getRecentAlerts(hoursNum);
  }

  @Get('monitoring/historical')
  @ApiOperation({ summary: 'Get historical cache metrics' })
  @ApiResponse({ status: 200, description: 'Historical metrics retrieved successfully' })
  async getHistoricalMetrics(@Query('hours') hours?: string): Promise<any> {
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    return this.cacheMonitoringService.getHistoricalMetrics(hoursNum);
  }

  @Post('warm')
  @ApiOperation({ summary: 'Warm cache with critical data' })
  @ApiResponse({ status: 200, description: 'Cache warming initiated successfully' })
  @HttpCode(HttpStatus.OK)
  async warmCache(@Body() options?: { type?: 'critical' | 'all' }): Promise<any> {
    if (options?.type === 'all') {
      await this.cacheWarmingService.warmAllCache();
    } else {
      await this.cacheWarmingService.warmCriticalCache();
    }

    return { message: 'Cache warming completed successfully' };
  }

  @Get('warming/tasks')
  @ApiOperation({ summary: 'Get cache warming tasks' })
  @ApiResponse({ status: 200, description: 'Warming tasks retrieved successfully' })
  async getWarmingTasks(): Promise<any> {
    return this.cacheWarmingService.getWarmingTasks();
  }

  @Post('warming/tasks/:taskName/toggle')
  @ApiOperation({ summary: 'Enable or disable a warming task' })
  @ApiResponse({ status: 200, description: 'Warming task toggled successfully' })
  @HttpCode(HttpStatus.OK)
  async toggleWarmingTask(
    @Param('taskName') taskName: string,
    @Body() body: { enabled: boolean },
  ): Promise<any> {
    this.cacheWarmingService.toggleWarmingTask(taskName, body.enabled);
    return { message: `Warming task ${taskName} ${body.enabled ? 'enabled' : 'disabled'}` };
  }

  @Delete('clear/:namespace')
  @ApiOperation({ summary: 'Clear cache for a specific namespace' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearNamespace(@Param('namespace') namespace: string): Promise<any> {
    await this.cacheService.clearNamespace(namespace);
    return { message: `Cache cleared for namespace: ${namespace}` };
  }

  @Delete('invalidate/tags')
  @ApiOperation({ summary: 'Invalidate cache by tags' })
  @ApiResponse({ status: 200, description: 'Cache invalidated successfully' })
  @HttpCode(HttpStatus.OK)
  async invalidateByTags(@Body() body: { tags: string[] }): Promise<any> {
    await this.cacheService.invalidateByTags(body.tags);
    return { message: `Cache invalidated for tags: ${body.tags.join(', ')}` };
  }

  @Delete('invalidate/dependencies')
  @ApiOperation({ summary: 'Invalidate cache by dependencies' })
  @ApiResponse({ status: 200, description: 'Cache invalidated successfully' })
  @HttpCode(HttpStatus.OK)
  async invalidateByDependencies(@Body() body: { dependencies: string[] }): Promise<any> {
    await this.cacheService.invalidateByDependencies(body.dependencies);
    return { message: `Cache invalidated for dependencies: ${body.dependencies.join(', ')}` };
  }

  @Post('metrics/reset')
  @ApiOperation({ summary: 'Reset cache metrics' })
  @ApiResponse({ status: 200, description: 'Cache metrics reset successfully' })
  @HttpCode(HttpStatus.OK)
  async resetMetrics(): Promise<any> {
    this.cacheService.resetMetrics();
    return { message: 'Cache metrics reset successfully' };
  }

  // Query Optimization Endpoints

  @Get('query-optimization/report')
  @ApiOperation({ summary: 'Get query optimization report' })
  @ApiResponse({ status: 200, description: 'Query optimization report generated successfully' })
  async getQueryOptimizationReport(): Promise<any> {
    return this.queryOptimizationService.generateOptimizationReport();
  }

  @Get('query-optimization/statistics')
  @ApiOperation({ summary: 'Get query statistics' })
  @ApiResponse({ status: 200, description: 'Query statistics retrieved successfully' })
  async getQueryStatistics(): Promise<any> {
    return this.queryOptimizationService.getQueryStatistics();
  }

  @Post('query-optimization/clear-log')
  @ApiOperation({ summary: 'Clear query log' })
  @ApiResponse({ status: 200, description: 'Query log cleared successfully' })
  @HttpCode(HttpStatus.OK)
  async clearQueryLog(): Promise<any> {
    this.queryOptimizationService.clearQueryLog();
    return { message: 'Query log cleared successfully' };
  }

  // Advanced Cache Operations

  @Post('set')
  @ApiOperation({ summary: 'Manually set cache entry' })
  @ApiResponse({ status: 200, description: 'Cache entry set successfully' })
  @HttpCode(HttpStatus.OK)
  async setCache(@Body() body: {
    namespace: string;
    key: string;
    value: any;
    ttl?: number;
    tags?: string[];
    dependencies?: string[];
  }): Promise<any> {
    await this.cacheService.set(
      body.namespace,
      body.key,
      body.value,
      {
        ttl: body.ttl,
        tags: body.tags,
        dependencies: body.dependencies,
      },
    );

    return { message: 'Cache entry set successfully' };
  }

  @Get('get/:namespace/:key')
  @ApiOperation({ summary: 'Get cache entry' })
  @ApiResponse({ status: 200, description: 'Cache entry retrieved successfully' })
  async getCache(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
  ): Promise<any> {
    const value = await this.cacheService.get(namespace, key);
    return {
      namespace,
      key,
      value,
      found: value !== null,
    };
  }

  @Delete('delete/:namespace/:key')
  @ApiOperation({ summary: 'Delete specific cache entry' })
  @ApiResponse({ status: 200, description: 'Cache entry deleted successfully' })
  async deleteCache(
    @Param('namespace') namespace: string,
    @Param('key') key: string,
  ): Promise<any> {
    await this.cacheService.delete(namespace, key);
    return { message: `Cache entry deleted: ${namespace}:${key}` };
  }

  @Get('health')
  @ApiOperation({ summary: 'Check cache health status' })
  @ApiResponse({ status: 200, description: 'Cache health status retrieved successfully' })
  async getCacheHealth(): Promise<any> {
    const metrics = this.cacheService.getMetrics();
    const cacheInfo = await this.cacheService.getCacheInfo();
    const trends = this.cacheMonitoringService.getPerformanceTrends();

    const health = {
      status: 'healthy',
      issues: [] as string[],
      metrics,
      trends,
    };

    // Check for health issues
    if (metrics.hitRate < 50 && metrics.totalOperations > 100) {
      health.status = 'warning';
      health.issues.push('Low cache hit rate');
    }

    if (metrics.averageResponseTime > 100) {
      health.status = 'warning';
      health.issues.push('High cache response time');
    }

    if (trends.hitRateTrend < -10) {
      health.status = 'warning';
      health.issues.push('Declining hit rate trend');
    }

    if (health.issues.length === 0) {
      health.status = 'healthy';
    }

    return health;
  }
}