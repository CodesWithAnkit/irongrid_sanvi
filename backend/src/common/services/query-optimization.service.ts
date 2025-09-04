import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

export interface QueryOptimizationReport {
  timestamp: Date;
  slowQueries: SlowQuery[];
  indexRecommendations: IndexRecommendation[];
  queryPatterns: QueryPattern[];
  optimizationSuggestions: string[];
}

export interface SlowQuery {
  query: string;
  calls: number;
  totalTime: number;
  meanTime: number;
  maxTime: number;
  recommendation: string;
}

export interface IndexRecommendation {
  tableName: string;
  columnNames: string[];
  reason: string;
  estimatedImpact: 'high' | 'medium' | 'low';
  sequentialScanRatio: number;
}

export interface QueryPattern {
  pattern: string;
  frequency: number;
  averageTime: number;
  optimization: string;
}

@Injectable()
export class QueryOptimizationService {
  private readonly logger = new Logger(QueryOptimizationService.name);
  private queryLog: Array<{ query: string; duration: number; timestamp: Date }> = [];
  private slowQueryThreshold: number;

  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
  ) {
    this.slowQueryThreshold = this.configService.get<number>(
      'database.queryOptimization.slowQueryThreshold',
      1000
    );
  }

  /**
   * Log query execution for analysis
   */
  logQuery(query: string, duration: number): void {
    this.queryLog.push({
      query: this.sanitizeQuery(query),
      duration,
      timestamp: new Date(),
    });

    // Keep only last 1000 queries
    if (this.queryLog.length > 1000) {
      this.queryLog = this.queryLog.slice(-1000);
    }

    // Log slow queries immediately
    if (duration > this.slowQueryThreshold) {
      this.logger.warn(`Slow query detected (${duration}ms): ${query.substring(0, 100)}...`);
    }
  }

  /**
   * Analyze query performance and generate optimization report
   */
  async generateOptimizationReport(): Promise<QueryOptimizationReport> {
    const [slowQueries, indexRecommendations, queryPatterns] = await Promise.all([
      this.analyzeSlowQueries(),
      this.generateIndexRecommendations(),
      this.analyzeQueryPatterns(),
    ]);

    const optimizationSuggestions = this.generateOptimizationSuggestions(
      slowQueries,
      indexRecommendations,
      queryPatterns
    );

    return {
      timestamp: new Date(),
      slowQueries,
      indexRecommendations,
      queryPatterns,
      optimizationSuggestions,
    };
  }

  /**
   * Analyze slow queries from pg_stat_statements
   */
  private async analyzeSlowQueries(): Promise<SlowQuery[]> {
    try {
      const result = await this.prismaService.$queryRaw<any[]>`
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as mean_time,
          max_exec_time as max_time,
          stddev_exec_time as stddev_time
        FROM pg_stat_statements 
        WHERE mean_exec_time > ${this.slowQueryThreshold}
        AND query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%information_schema%'
        ORDER BY mean_exec_time DESC 
        LIMIT 20
      `;

      return result.map(row => ({
        query: this.sanitizeQuery(row.query),
        calls: parseInt(row.calls),
        totalTime: parseFloat(row.total_time),
        meanTime: parseFloat(row.mean_time),
        maxTime: parseFloat(row.max_time),
        recommendation: this.generateQueryRecommendation(row.query, parseFloat(row.mean_time)),
      }));
    } catch (error) {
      this.logger.warn('pg_stat_statements not available, using query log');
      return this.analyzeSlowQueriesFromLog();
    }
  }

  /**
   * Analyze slow queries from internal log when pg_stat_statements is not available
   */
  private analyzeSlowQueriesFromLog(): SlowQuery[] {
    const queryStats = new Map<string, { calls: number; totalTime: number; maxTime: number }>();

    this.queryLog.forEach(entry => {
      const pattern = this.extractQueryPattern(entry.query);
      const existing = queryStats.get(pattern) || { calls: 0, totalTime: 0, maxTime: 0 };
      
      queryStats.set(pattern, {
        calls: existing.calls + 1,
        totalTime: existing.totalTime + entry.duration,
        maxTime: Math.max(existing.maxTime, entry.duration),
      });
    });

    return Array.from(queryStats.entries())
      .filter(([_, stats]) => stats.totalTime / stats.calls > this.slowQueryThreshold)
      .map(([query, stats]) => ({
        query,
        calls: stats.calls,
        totalTime: stats.totalTime,
        meanTime: stats.totalTime / stats.calls,
        maxTime: stats.maxTime,
        recommendation: this.generateQueryRecommendation(query, stats.totalTime / stats.calls),
      }))
      .sort((a, b) => b.meanTime - a.meanTime)
      .slice(0, 20);
  }

  /**
   * Generate index recommendations based on query patterns and table statistics
   */
  private async generateIndexRecommendations(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];

    try {
      // Find tables with high sequential scan ratios
      const tableStats = await this.prismaService.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins + n_tup_upd + n_tup_del as total_operations,
          CASE 
            WHEN seq_scan + idx_scan > 0 
            THEN ROUND((seq_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
            ELSE 0 
          END as seq_scan_ratio
        FROM pg_stat_user_tables 
        WHERE seq_scan + idx_scan > 50
        ORDER BY seq_scan_ratio DESC, total_operations DESC
      `;

      for (const table of tableStats) {
        if (table.seq_scan_ratio > 70) {
          const columns = await this.identifyIndexCandidates(table.tablename);
          
          if (columns.length > 0) {
            recommendations.push({
              tableName: table.tablename,
              columnNames: columns,
              reason: `High sequential scan ratio (${table.seq_scan_ratio}%)`,
              estimatedImpact: table.seq_scan_ratio > 90 ? 'high' : 'medium',
              sequentialScanRatio: table.seq_scan_ratio,
            });
          }
        }
      }

      // Analyze query patterns for additional index recommendations
      const queryRecommendations = await this.analyzeQueryPatternsForIndexes();
      recommendations.push(...queryRecommendations);

    } catch (error) {
      this.logger.warn('Failed to generate index recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Identify potential index candidates for a table
   */
  private async identifyIndexCandidates(tableName: string): Promise<string[]> {
    try {
      // Get column information
      const columns = await this.prismaService.$queryRaw<any[]>`
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name = ${tableName}
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;

      // Common patterns for index candidates
      const candidates = columns
        .filter(col => {
          const name = col.column_name.toLowerCase();
          return (
            name.includes('id') ||
            name.includes('email') ||
            name.includes('status') ||
            name.includes('type') ||
            name.includes('created_at') ||
            name.includes('updated_at') ||
            name.includes('date') ||
            col.data_type === 'uuid'
          );
        })
        .map(col => col.column_name);

      return candidates.slice(0, 3); // Limit to top 3 candidates
    } catch (error) {
      this.logger.warn(`Failed to identify index candidates for ${tableName}:`, error);
      return [];
    }
  }

  /**
   * Analyze query patterns for index recommendations
   */
  private async analyzeQueryPatternsForIndexes(): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];
    
    // Analyze WHERE clause patterns from query log
    const wherePatterns = new Map<string, number>();
    
    this.queryLog.forEach(entry => {
      const whereColumns = this.extractWhereColumns(entry.query);
      whereColumns.forEach(column => {
        wherePatterns.set(column, (wherePatterns.get(column) || 0) + 1);
      });
    });

    // Generate recommendations for frequently used WHERE columns
    for (const [column, frequency] of wherePatterns.entries()) {
      if (frequency > 10) { // Column used in WHERE clause more than 10 times
        const [tableName, columnName] = column.split('.');
        if (tableName && columnName) {
          recommendations.push({
            tableName,
            columnNames: [columnName],
            reason: `Frequently used in WHERE clauses (${frequency} times)`,
            estimatedImpact: frequency > 50 ? 'high' : 'medium',
            sequentialScanRatio: 0,
          });
        }
      }
    }

    return recommendations;
  }

  /**
   * Analyze query patterns for optimization opportunities
   */
  private analyzeQueryPatterns(): QueryPattern[] {
    const patterns = new Map<string, { count: number; totalTime: number }>();

    this.queryLog.forEach(entry => {
      const pattern = this.extractQueryPattern(entry.query);
      const existing = patterns.get(pattern) || { count: 0, totalTime: 0 };
      
      patterns.set(pattern, {
        count: existing.count + 1,
        totalTime: existing.totalTime + entry.duration,
      });
    });

    return Array.from(patterns.entries())
      .map(([pattern, stats]) => ({
        pattern,
        frequency: stats.count,
        averageTime: stats.totalTime / stats.count,
        optimization: this.generatePatternOptimization(pattern, stats.count, stats.totalTime / stats.count),
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Generate optimization suggestions based on analysis
   */
  private generateOptimizationSuggestions(
    slowQueries: SlowQuery[],
    indexRecommendations: IndexRecommendation[],
    queryPatterns: QueryPattern[]
  ): string[] {
    const suggestions: string[] = [];

    // Slow query suggestions
    if (slowQueries.length > 0) {
      suggestions.push(`Found ${slowQueries.length} slow queries. Consider optimizing the top performers.`);
      
      const avgSlowTime = slowQueries.reduce((sum, q) => sum + q.meanTime, 0) / slowQueries.length;
      if (avgSlowTime > 5000) {
        suggestions.push('Average slow query time is very high. Consider database server optimization.');
      }
    }

    // Index suggestions
    if (indexRecommendations.length > 0) {
      const highImpact = indexRecommendations.filter(r => r.estimatedImpact === 'high');
      if (highImpact.length > 0) {
        suggestions.push(`${highImpact.length} high-impact index recommendations available.`);
      }
      
      suggestions.push(`Consider adding indexes to improve query performance on ${indexRecommendations.length} tables.`);
    }

    // Query pattern suggestions
    const frequentPatterns = queryPatterns.filter(p => p.frequency > 100);
    if (frequentPatterns.length > 0) {
      suggestions.push(`${frequentPatterns.length} query patterns are executed very frequently. Consider caching results.`);
    }

    // Connection pool suggestions
    suggestions.push('Monitor connection pool usage and adjust pool size if needed.');
    suggestions.push('Consider implementing query result caching for frequently accessed data.');

    return suggestions;
  }

  /**
   * Generate recommendation for a specific query
   */
  private generateQueryRecommendation(query: string, meanTime: number): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('select *')) {
      return 'Avoid SELECT * - specify only needed columns';
    }

    if (lowerQuery.includes('like \'%') && lowerQuery.includes('%\'')) {
      return 'Leading wildcard LIKE queries cannot use indexes efficiently';
    }

    if (lowerQuery.includes('order by') && !lowerQuery.includes('limit')) {
      return 'Consider adding LIMIT to ORDER BY queries';
    }

    if (lowerQuery.includes('join') && meanTime > 2000) {
      return 'Complex JOIN query - consider adding indexes on join columns';
    }

    if (meanTime > 5000) {
      return 'Very slow query - consider breaking into smaller operations or adding indexes';
    }

    return 'Consider adding appropriate indexes or optimizing WHERE conditions';
  }

  /**
   * Generate optimization suggestion for query pattern
   */
  private generatePatternOptimization(pattern: string, frequency: number, avgTime: number): string {
    if (frequency > 100 && avgTime < 100) {
      return 'High frequency, low latency - good candidate for caching';
    }

    if (frequency > 50 && avgTime > 500) {
      return 'Frequent slow query - high priority for optimization';
    }

    if (pattern.toLowerCase().includes('count(*)')) {
      return 'COUNT(*) queries can be expensive - consider caching or approximation';
    }

    return 'Monitor performance and consider optimization if needed';
  }

  /**
   * Extract query pattern by removing specific values
   */
  private extractQueryPattern(query: string): string {
    return query
      .replace(/\$\d+/g, '?') // Replace parameter placeholders
      .replace(/\b\d+\b/g, '?') // Replace numbers
      .replace(/'[^']*'/g, '?') // Replace string literals
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Extract WHERE clause columns from query
   */
  private extractWhereColumns(query: string): string[] {
    const columns: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Simple pattern matching for WHERE clauses
    const whereMatch = lowerQuery.match(/where\s+(.+?)(?:\s+order\s+by|\s+group\s+by|\s+limit|\s*$)/);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      
      // Extract column references (simplified)
      const columnMatches = whereClause.match(/(\w+\.\w+|\w+)\s*[=<>!]/g);
      if (columnMatches) {
        columnMatches.forEach(match => {
          const column = match.replace(/\s*[=<>!].*/, '').trim();
          if (column && !columns.includes(column)) {
            columns.push(column);
          }
        });
      }
    }
    
    return columns;
  }

  /**
   * Sanitize query for logging (remove sensitive data)
   */
  private sanitizeQuery(query: string): string {
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password = '[REDACTED]'")
      .replace(/email\s*=\s*'[^']*'/gi, "email = '[REDACTED]'")
      .substring(0, 500); // Limit length
  }

  /**
   * Scheduled query analysis - runs daily
   */
  @Cron('0 2 * * *') // Daily at 2 AM
  async scheduledAnalysis(): Promise<void> {
    if (!this.configService.get<boolean>('database.monitoring.enableMetrics')) {
      return;
    }

    this.logger.log('Starting scheduled query optimization analysis');

    try {
      const report = await this.generateOptimizationReport();
      
      this.logger.log('Query Optimization Analysis Results:', {
        slowQueriesCount: report.slowQueries.length,
        indexRecommendationsCount: report.indexRecommendations.length,
        queryPatternsCount: report.queryPatterns.length,
        suggestionsCount: report.optimizationSuggestions.length,
      });

      // Log high-priority recommendations
      const highPriorityIndexes = report.indexRecommendations.filter(r => r.estimatedImpact === 'high');
      if (highPriorityIndexes.length > 0) {
        this.logger.warn('High-priority index recommendations:', highPriorityIndexes);
      }

      const criticalSlowQueries = report.slowQueries.filter(q => q.meanTime > 5000);
      if (criticalSlowQueries.length > 0) {
        this.logger.warn('Critical slow queries detected:', criticalSlowQueries.slice(0, 3));
      }

    } catch (error) {
      this.logger.error('Failed to perform scheduled query analysis:', error);
    }
  }

  /**
   * Get current query statistics
   */
  getQueryStatistics(): {
    totalQueries: number;
    slowQueries: number;
    averageQueryTime: number;
    queryLogSize: number;
  } {
    const totalQueries = this.queryLog.length;
    const slowQueries = this.queryLog.filter(q => q.duration > this.slowQueryThreshold).length;
    const averageQueryTime = totalQueries > 0 
      ? this.queryLog.reduce((sum, q) => sum + q.duration, 0) / totalQueries 
      : 0;

    return {
      totalQueries,
      slowQueries,
      averageQueryTime,
      queryLogSize: this.queryLog.length,
    };
  }

  /**
   * Clear query log
   */
  clearQueryLog(): void {
    this.queryLog = [];
    this.logger.log('Query log cleared');
  }
}