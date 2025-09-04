import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CacheService, CacheMetrics } from './cache.service';

export interface CacheMonitoringReport {
  timestamp: Date;
  metrics: CacheMetrics;
  redisInfo: any;
  alerts: CacheAlert[];
  recommendations: string[];
}

export interface CacheAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date;
  metric?: string;
  value?: number;
  threshold?: number;
}

@Injectable()
export class CacheMonitoringService {
  private readonly logger = new Logger(CacheMonitoringService.name);
  private alerts: CacheAlert[] = [];
  private historicalMetrics: Array<{ timestamp: Date; metrics: CacheMetrics }> = [];
  
  // Thresholds for alerts
  private readonly thresholds = {
    hitRateWarning: 70, // Hit rate below 70%
    hitRateError: 50,   // Hit rate below 50%
    responseTimeWarning: 100, // Response time above 100ms
    responseTimeError: 500,   // Response time above 500ms
    memoryWarning: 80,  // Memory usage above 80%
    memoryError: 95,    // Memory usage above 95%
  };

  constructor(private cacheService: CacheService) {}

  /**
   * Monitor cache performance - runs every minute
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async monitorCachePerformance(): Promise<void> {
    try {
      const metrics = this.cacheService.getMetrics();
      const cacheInfo = await this.cacheService.getCacheInfo();
      
      // Store historical data
      this.historicalMetrics.push({
        timestamp: new Date(),
        metrics: { ...metrics },
      });

      // Keep only last 24 hours of data
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.historicalMetrics = this.historicalMetrics.filter(
        entry => entry.timestamp > oneDayAgo
      );

      // Check for alerts
      this.checkAlerts(metrics, cacheInfo);

      this.logger.debug(`Cache monitoring: Hit rate: ${metrics.hitRate.toFixed(2)}%, Avg response: ${metrics.averageResponseTime.toFixed(2)}ms`);
    } catch (error) {
      this.logger.error('Error monitoring cache performance:', error);
    }
  }

  /**
   * Generate comprehensive monitoring report
   */
  async generateReport(): Promise<CacheMonitoringReport> {
    const metrics = this.cacheService.getMetrics();
    const redisInfo = await this.cacheService.getCacheInfo();
    const recommendations = this.generateRecommendations(metrics, redisInfo);

    return {
      timestamp: new Date(),
      metrics,
      redisInfo,
      alerts: [...this.alerts],
      recommendations,
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24): CacheAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  /**
   * Get historical metrics
   */
  getHistoricalMetrics(hours: number = 24): Array<{ timestamp: Date; metrics: CacheMetrics }> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.historicalMetrics.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Get cache performance trends
   */
  getPerformanceTrends(): {
    hitRateTrend: number;
    responseTimeTrend: number;
    operationsTrend: number;
  } {
    if (this.historicalMetrics.length < 2) {
      return { hitRateTrend: 0, responseTimeTrend: 0, operationsTrend: 0 };
    }

    const recent = this.historicalMetrics.slice(-10); // Last 10 entries
    const older = this.historicalMetrics.slice(-20, -10); // Previous 10 entries

    const recentAvg = this.calculateAverageMetrics(recent);
    const olderAvg = this.calculateAverageMetrics(older);

    return {
      hitRateTrend: recentAvg.hitRate - olderAvg.hitRate,
      responseTimeTrend: recentAvg.averageResponseTime - olderAvg.averageResponseTime,
      operationsTrend: recentAvg.totalOperations - olderAvg.totalOperations,
    };
  }

  /**
   * Clear old alerts
   */
  @Cron('0 0 * * *') // Daily at midnight
  clearOldAlerts(): void {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);
    
    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      this.logger.log(`Cleared ${removedCount} old cache alerts`);
    }
  }

  /**
   * Check for performance alerts
   */
  private checkAlerts(metrics: CacheMetrics, cacheInfo: any): void {
    const now = new Date();

    // Check hit rate
    if (metrics.totalOperations > 0) {
      if (metrics.hitRate < this.thresholds.hitRateError) {
        this.addAlert({
          type: 'error',
          message: `Cache hit rate critically low: ${metrics.hitRate.toFixed(2)}%`,
          timestamp: now,
          metric: 'hitRate',
          value: metrics.hitRate,
          threshold: this.thresholds.hitRateError,
        });
      } else if (metrics.hitRate < this.thresholds.hitRateWarning) {
        this.addAlert({
          type: 'warning',
          message: `Cache hit rate below optimal: ${metrics.hitRate.toFixed(2)}%`,
          timestamp: now,
          metric: 'hitRate',
          value: metrics.hitRate,
          threshold: this.thresholds.hitRateWarning,
        });
      }
    }

    // Check response time
    if (metrics.averageResponseTime > this.thresholds.responseTimeError) {
      this.addAlert({
        type: 'error',
        message: `Cache response time critically high: ${metrics.averageResponseTime.toFixed(2)}ms`,
        timestamp: now,
        metric: 'responseTime',
        value: metrics.averageResponseTime,
        threshold: this.thresholds.responseTimeError,
      });
    } else if (metrics.averageResponseTime > this.thresholds.responseTimeWarning) {
      this.addAlert({
        type: 'warning',
        message: `Cache response time elevated: ${metrics.averageResponseTime.toFixed(2)}ms`,
        timestamp: now,
        metric: 'responseTime',
        value: metrics.averageResponseTime,
        threshold: this.thresholds.responseTimeWarning,
      });
    }

    // Check Redis memory usage if available
    if (cacheInfo?.memory) {
      const memoryInfo = this.parseRedisMemoryInfo(cacheInfo.memory);
      if (memoryInfo.usedMemoryPercentage > this.thresholds.memoryError) {
        this.addAlert({
          type: 'error',
          message: `Redis memory usage critically high: ${memoryInfo.usedMemoryPercentage.toFixed(2)}%`,
          timestamp: now,
          metric: 'memory',
          value: memoryInfo.usedMemoryPercentage,
          threshold: this.thresholds.memoryError,
        });
      } else if (memoryInfo.usedMemoryPercentage > this.thresholds.memoryWarning) {
        this.addAlert({
          type: 'warning',
          message: `Redis memory usage high: ${memoryInfo.usedMemoryPercentage.toFixed(2)}%`,
          timestamp: now,
          metric: 'memory',
          value: memoryInfo.usedMemoryPercentage,
          threshold: this.thresholds.memoryWarning,
        });
      }
    }
  }

  /**
   * Add alert (avoid duplicates)
   */
  private addAlert(alert: CacheAlert): void {
    // Check if similar alert exists in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const similarAlert = this.alerts.find(
      existing => 
        existing.type === alert.type &&
        existing.metric === alert.metric &&
        existing.timestamp > fiveMinutesAgo
    );

    if (!similarAlert) {
      this.alerts.push(alert);
      this.logger.warn(`Cache Alert [${alert.type.toUpperCase()}]: ${alert.message}`);
    }
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: CacheMetrics, cacheInfo: any): string[] {
    const recommendations: string[] = [];

    // Hit rate recommendations
    if (metrics.hitRate < 70 && metrics.totalOperations > 100) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
      recommendations.push('Review cache warming strategies for critical data');
      recommendations.push('Analyze cache miss patterns to identify optimization opportunities');
    }

    // Response time recommendations
    if (metrics.averageResponseTime > 50) {
      recommendations.push('Consider optimizing Redis configuration for better performance');
      recommendations.push('Review network latency between application and Redis server');
      recommendations.push('Consider using Redis clustering for better performance');
    }

    // Memory recommendations
    if (cacheInfo?.memory) {
      const memoryInfo = this.parseRedisMemoryInfo(cacheInfo.memory);
      if (memoryInfo.usedMemoryPercentage > 80) {
        recommendations.push('Consider increasing Redis memory allocation');
        recommendations.push('Review cache expiration policies to free up memory');
        recommendations.push('Implement cache eviction strategies for less critical data');
      }
    }

    // General recommendations
    if (metrics.totalOperations > 10000) {
      recommendations.push('Monitor cache key distribution to avoid hotspots');
      recommendations.push('Consider implementing cache compression for large values');
    }

    return recommendations;
  }

  /**
   * Parse Redis memory info
   */
  private parseRedisMemoryInfo(memoryInfo: string): {
    usedMemory: number;
    maxMemory: number;
    usedMemoryPercentage: number;
  } {
    const lines = memoryInfo.split('\n');
    let usedMemory = 0;
    let maxMemory = 0;

    for (const line of lines) {
      if (line.startsWith('used_memory:')) {
        usedMemory = parseInt(line.split(':')[1]);
      } else if (line.startsWith('maxmemory:')) {
        maxMemory = parseInt(line.split(':')[1]);
      }
    }

    const usedMemoryPercentage = maxMemory > 0 ? (usedMemory / maxMemory) * 100 : 0;

    return {
      usedMemory,
      maxMemory,
      usedMemoryPercentage,
    };
  }

  /**
   * Calculate average metrics from historical data
   */
  private calculateAverageMetrics(entries: Array<{ timestamp: Date; metrics: CacheMetrics }>): CacheMetrics {
    if (entries.length === 0) {
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalOperations: 0,
        averageResponseTime: 0,
      };
    }

    const totals = entries.reduce(
      (acc, entry) => ({
        hits: acc.hits + entry.metrics.hits,
        misses: acc.misses + entry.metrics.misses,
        hitRate: acc.hitRate + entry.metrics.hitRate,
        totalOperations: acc.totalOperations + entry.metrics.totalOperations,
        averageResponseTime: acc.averageResponseTime + entry.metrics.averageResponseTime,
      }),
      { hits: 0, misses: 0, hitRate: 0, totalOperations: 0, averageResponseTime: 0 }
    );

    return {
      hits: totals.hits / entries.length,
      misses: totals.misses / entries.length,
      hitRate: totals.hitRate / entries.length,
      totalOperations: totals.totalOperations / entries.length,
      averageResponseTime: totals.averageResponseTime / entries.length,
    };
  }
}