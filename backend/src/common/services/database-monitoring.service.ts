import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface DatabaseMetrics {
  connectionPool: {
    active: number;
    idle: number;
    total: number;
    waiting: number;
  };
  queryPerformance: {
    slowQueries: number;
    averageQueryTime: number;
    totalQueries: number;
  };
  tableStats: {
    tableName: string;
    rowCount: number;
    tableSize: string;
    indexSize: string;
  }[];
}

@Injectable()
export class DatabaseMonitoringService {
  private readonly logger = new Logger(DatabaseMonitoringService.name);
  private metrics: DatabaseMetrics = {
    connectionPool: { active: 0, idle: 0, total: 0, waiting: 0 },
    queryPerformance: { slowQueries: 0, averageQueryTime: 0, totalQueries: 0 },
    tableStats: [],
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics(): Promise<void> {
    if (!this.configService.get<boolean>('database.monitoring.enableMetrics')) {
      return;
    }

    try {
      await this.collectConnectionPoolMetrics();
      await this.collectQueryPerformanceMetrics();
      await this.collectTableStatistics();
      
      this.logMetrics();
    } catch (error) {
      this.logger.error('Failed to collect database metrics', error);
    }
  }

  private async collectConnectionPoolMetrics(): Promise<void> {
    try {
      // Get connection pool statistics from PostgreSQL
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections,
          count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      if (result.length > 0) {
        const stats = result[0];
        this.metrics.connectionPool = {
          total: parseInt(stats.total_connections),
          active: parseInt(stats.active_connections),
          idle: parseInt(stats.idle_connections),
          waiting: parseInt(stats.idle_in_transaction),
        };
      }
    } catch (error) {
      this.logger.warn('Failed to collect connection pool metrics', error);
    }
  }

  private async collectQueryPerformanceMetrics(): Promise<void> {
    try {
      // Get query performance statistics
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          calls as total_queries,
          mean_exec_time as avg_time,
          stddev_exec_time as stddev_time
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY calls DESC 
        LIMIT 1
      `;

      if (result.length > 0) {
        const stats = result[0];
        this.metrics.queryPerformance = {
          totalQueries: parseInt(stats.total_queries),
          averageQueryTime: parseFloat(stats.avg_time),
          slowQueries: 0, // This would need additional tracking
        };
      }
    } catch (error) {
      // pg_stat_statements extension might not be enabled
      this.logger.debug('pg_stat_statements not available for query performance metrics');
    }
  }

  private async collectTableStatistics(): Promise<void> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins + n_tup_upd + n_tup_del as total_operations,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          seq_scan as sequential_scans,
          seq_tup_read as sequential_reads,
          idx_scan as index_scans,
          idx_tup_fetch as index_reads
        FROM pg_stat_user_tables 
        ORDER BY total_operations DESC
        LIMIT 10
      `;

      // Get table sizes
      const sizeResult = await this.prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
          pg_relation_size(schemaname||'.'||tablename) as table_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY table_bytes DESC
      `;

      this.metrics.tableStats = sizeResult.map(row => ({
        tableName: row.tablename,
        rowCount: 0, // Would need separate query for exact count
        tableSize: row.table_size,
        indexSize: row.index_size,
      }));
    } catch (error) {
      this.logger.warn('Failed to collect table statistics', error);
    }
  }

  private logMetrics(): void {
    this.logger.log('Database Metrics:', {
      connectionPool: this.metrics.connectionPool,
      queryPerformance: this.metrics.queryPerformance,
      topTables: this.metrics.tableStats.slice(0, 5),
    });
  }

  async getMetrics(): Promise<DatabaseMetrics> {
    return this.metrics;
  }

  async analyzeSlowQueries(): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time,
          stddev_exec_time
        FROM pg_stat_statements 
        WHERE mean_exec_time > ${this.configService.get<number>('database.queryOptimization.slowQueryThreshold', 1000)}
        ORDER BY mean_exec_time DESC 
        LIMIT 20
      `;

      return result;
    } catch (error) {
      this.logger.warn('Failed to analyze slow queries', error);
      return [];
    }
  }

  async analyzeMissingIndexes(): Promise<any[]> {
    try {
      // Query to find tables with high sequential scan ratios
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          CASE 
            WHEN seq_scan + idx_scan > 0 
            THEN ROUND((seq_scan::numeric / (seq_scan + idx_scan)) * 100, 2)
            ELSE 0 
          END as seq_scan_ratio
        FROM pg_stat_user_tables 
        WHERE seq_scan + idx_scan > 100  -- Only tables with significant activity
        AND CASE 
          WHEN seq_scan + idx_scan > 0 
          THEN (seq_scan::numeric / (seq_scan + idx_scan)) * 100
          ELSE 0 
        END > 50  -- More than 50% sequential scans
        ORDER BY seq_scan_ratio DESC
      `;

      return result;
    } catch (error) {
      this.logger.warn('Failed to analyze missing indexes', error);
      return [];
    }
  }

  async analyzeUnusedIndexes(): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
        FROM pg_stat_user_indexes 
        WHERE idx_scan < 10  -- Less than 10 scans
        AND pg_relation_size(indexname::regclass) > 1024 * 1024  -- Larger than 1MB
        ORDER BY pg_relation_size(indexname::regclass) DESC
      `;

      return result;
    } catch (error) {
      this.logger.warn('Failed to analyze unused indexes', error);
      return [];
    }
  }

  @Cron('0 3 * * 0') // Weekly on Sunday at 3 AM
  async performWeeklyAnalysis(): Promise<void> {
    if (!this.configService.get<boolean>('database.indexing.enableIndexAnalysis')) {
      return;
    }

    this.logger.log('Starting weekly database analysis...');

    try {
      const slowQueries = await this.analyzeSlowQueries();
      const missingIndexes = await this.analyzeMissingIndexes();
      const unusedIndexes = await this.analyzeUnusedIndexes();

      this.logger.log('Weekly Database Analysis Results:', {
        slowQueriesCount: slowQueries.length,
        potentialMissingIndexes: missingIndexes.length,
        unusedIndexes: unusedIndexes.length,
      });

      // Log detailed results
      if (slowQueries.length > 0) {
        this.logger.warn('Slow queries detected:', slowQueries.slice(0, 5));
      }

      if (missingIndexes.length > 0) {
        this.logger.warn('Tables with high sequential scan ratios:', missingIndexes);
      }

      if (unusedIndexes.length > 0) {
        this.logger.warn('Potentially unused indexes:', unusedIndexes);
      }
    } catch (error) {
      this.logger.error('Failed to perform weekly database analysis', error);
    }
  }

  async getConnectionPoolStatus(): Promise<any> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          state,
          count(*) as count,
          max(now() - state_change) as max_duration
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
        ORDER BY count DESC
      `;

      return result;
    } catch (error) {
      this.logger.warn('Failed to get connection pool status', error);
      return [];
    }
  }

  async optimizeDatabase(): Promise<void> {
    this.logger.log('Starting database optimization...');

    try {
      // Analyze all tables to update statistics
      await this.prisma.$executeRaw`ANALYZE`;
      this.logger.log('Database statistics updated');

      // Vacuum analyze for better performance
      const tables = ['User', 'Customer', 'Product', 'Quotation', 'QuotationItem', 'Order', 'OrderItem'];
      
      for (const table of tables) {
        try {
          await this.prisma.$executeRawUnsafe(`VACUUM ANALYZE "${table}"`);
          this.logger.debug(`Vacuumed and analyzed table: ${table}`);
        } catch (error) {
          this.logger.warn(`Failed to vacuum table ${table}:`, error);
        }
      }

      this.logger.log('Database optimization completed');
    } catch (error) {
      this.logger.error('Failed to optimize database', error);
    }
  }
}