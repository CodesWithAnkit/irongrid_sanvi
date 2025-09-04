import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron } from '@nestjs/schedule';

interface QueryOptimizationSuggestion {
  table: string;
  issue: string;
  suggestion: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedImpact: string;
}

@Injectable()
export class PerformanceOptimizationService {
  private readonly logger = new Logger(PerformanceOptimizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async analyzeQueryPerformance(): Promise<QueryOptimizationSuggestion[]> {
    const suggestions: QueryOptimizationSuggestion[] = [];

    try {
      // Analyze table statistics for optimization opportunities
      const tableStats = await this.getTableStatistics();
      
      for (const stat of tableStats) {
        // Check for tables with high sequential scan ratios
        if (stat.seq_scan_ratio > 80 && stat.total_scans > 1000) {
          suggestions.push({
            table: stat.tablename,
            issue: `High sequential scan ratio (${stat.seq_scan_ratio}%)`,
            suggestion: 'Consider adding indexes on frequently queried columns',
            priority: 'HIGH',
            estimatedImpact: 'Significant query performance improvement',
          });
        }

        // Check for tables with low index usage
        if (stat.idx_scan < stat.seq_scan && stat.total_scans > 500) {
          suggestions.push({
            table: stat.tablename,
            issue: 'Low index usage compared to sequential scans',
            suggestion: 'Review and optimize existing indexes or add missing ones',
            priority: 'MEDIUM',
            estimatedImpact: 'Moderate query performance improvement',
          });
        }

        // Check for tables with high update/delete activity but no recent vacuum
        if (stat.n_tup_upd + stat.n_tup_del > 10000) {
          suggestions.push({
            table: stat.tablename,
            issue: 'High update/delete activity detected',
            suggestion: 'Consider more frequent VACUUM operations',
            priority: 'MEDIUM',
            estimatedImpact: 'Better space utilization and performance',
          });
        }
      }

      // Analyze slow queries if pg_stat_statements is available
      const slowQueries = await this.getSlowQueries();
      
      if (slowQueries.length > 0) {
        suggestions.push({
          table: 'Multiple',
          issue: `${slowQueries.length} slow queries detected`,
          suggestion: 'Review and optimize slow queries, consider adding indexes',
          priority: 'HIGH',
          estimatedImpact: 'Significant overall performance improvement',
        });
      }

    } catch (error) {
      this.logger.error('Failed to analyze query performance', error);
    }

    return suggestions;
  }

  private async getTableStatistics(): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          seq_scan,
          seq_tup_read,
          idx_scan,
          idx_tup_fetch,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          n_live_tup,
          n_dead_tup,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze,
          CASE 
            WHEN seq_scan + COALESCE(idx_scan, 0) > 0 
            THEN ROUND((seq_scan::numeric / (seq_scan + COALESCE(idx_scan, 0))) * 100, 2)
            ELSE 0 
          END as seq_scan_ratio,
          seq_scan + COALESCE(idx_scan, 0) as total_scans
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        ORDER BY total_scans DESC
      `;

      return result;
    } catch (error) {
      this.logger.warn('Failed to get table statistics', error);
      return [];
    }
  }

  private async getSlowQueries(): Promise<any[]> {
    try {
      const slowQueryThreshold = this.configService.get<number>(
        'database.queryOptimization.slowQueryThreshold',
        1000
      );

      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time,
          stddev_exec_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_exec_time > ${slowQueryThreshold}
        AND query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%VACUUM%'
        AND query NOT LIKE '%ANALYZE%'
        ORDER BY mean_exec_time DESC 
        LIMIT 10
      `;

      return result;
    } catch (error) {
      // pg_stat_statements extension might not be enabled
      this.logger.debug('pg_stat_statements not available for slow query analysis');
      return [];
    }
  }

  async optimizeIndexes(): Promise<void> {
    this.logger.log('Starting index optimization...');

    try {
      // Get index usage statistics
      const indexStats = await this.getIndexStatistics();
      
      // Identify unused indexes
      const unusedIndexes = indexStats.filter(idx => 
        idx.idx_scan < 10 && idx.size_mb > 1
      );

      if (unusedIndexes.length > 0) {
        this.logger.warn(`Found ${unusedIndexes.length} potentially unused indexes:`, 
          unusedIndexes.map(idx => `${idx.indexname} (${idx.size_mb}MB)`));
      }

      // Identify duplicate indexes
      const duplicateIndexes = await this.findDuplicateIndexes();
      
      if (duplicateIndexes.length > 0) {
        this.logger.warn(`Found ${duplicateIndexes.length} potentially duplicate indexes:`, 
          duplicateIndexes);
      }

      // Reindex heavily used indexes
      const heavyIndexes = indexStats.filter(idx => 
        idx.idx_scan > 100000 && idx.size_mb > 10
      );

      for (const index of heavyIndexes) {
        try {
          await this.prisma.$executeRawUnsafe(`REINDEX INDEX CONCURRENTLY "${index.indexname}"`);
          this.logger.log(`Reindexed heavy-use index: ${index.indexname}`);
        } catch (error) {
          this.logger.warn(`Failed to reindex ${index.indexname}:`, error.message);
        }
      }

    } catch (error) {
      this.logger.error('Index optimization failed', error);
    }
  }

  private async getIndexStatistics(): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch,
          ROUND(pg_relation_size(indexname::regclass) / 1024.0 / 1024.0, 2) as size_mb
        FROM pg_stat_user_indexes 
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      `;

      return result;
    } catch (error) {
      this.logger.warn('Failed to get index statistics', error);
      return [];
    }
  }

  private async findDuplicateIndexes(): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          t.tablename,
          array_agg(t.indexname) as duplicate_indexes,
          t.column_names
        FROM (
          SELECT 
            schemaname,
            tablename,
            indexname,
            array_to_string(array_agg(attname ORDER BY attnum), ',') as column_names
          FROM pg_index i
          JOIN pg_class c ON c.oid = i.indexrelid
          JOIN pg_namespace n ON n.oid = c.relnamespace
          JOIN pg_class t ON t.oid = i.indrelid
          JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(i.indkey)
          WHERE n.nspname = 'public'
          AND c.relkind = 'i'
          GROUP BY schemaname, tablename, indexname
        ) t
        GROUP BY t.tablename, t.column_names
        HAVING count(*) > 1
      `;

      return result;
    } catch (error) {
      this.logger.warn('Failed to find duplicate indexes', error);
      return [];
    }
  }

  @Cron('0 4 * * 0') // Weekly on Sunday at 4 AM
  async performWeeklyOptimization(): Promise<void> {
    this.logger.log('Starting weekly performance optimization...');

    try {
      // Update table statistics
      await this.prisma.$executeRaw`ANALYZE`;
      this.logger.log('Updated table statistics');

      // Optimize indexes
      await this.optimizeIndexes();

      // Vacuum analyze critical tables
      const criticalTables = ['User', 'Customer', 'Quotation', 'QuotationItem', 'Product'];
      
      for (const table of criticalTables) {
        try {
          await this.prisma.$executeRawUnsafe(`VACUUM ANALYZE "${table}"`);
          this.logger.debug(`Vacuumed and analyzed: ${table}`);
        } catch (error) {
          this.logger.warn(`Failed to vacuum ${table}:`, error.message);
        }
      }

      // Generate optimization report
      const suggestions = await this.analyzeQueryPerformance();
      
      if (suggestions.length > 0) {
        this.logger.log('Performance optimization suggestions:', {
          totalSuggestions: suggestions.length,
          highPriority: suggestions.filter(s => s.priority === 'HIGH').length,
          mediumPriority: suggestions.filter(s => s.priority === 'MEDIUM').length,
          lowPriority: suggestions.filter(s => s.priority === 'LOW').length,
        });

        // Log high priority suggestions
        const highPrioritySuggestions = suggestions.filter(s => s.priority === 'HIGH');
        if (highPrioritySuggestions.length > 0) {
          this.logger.warn('High priority optimization suggestions:', 
            highPrioritySuggestions.map(s => `${s.table}: ${s.suggestion}`));
        }
      }

      this.logger.log('Weekly performance optimization completed');
    } catch (error) {
      this.logger.error('Weekly performance optimization failed', error);
    }
  }

  async getPerformanceReport(): Promise<any> {
    try {
      const [
        suggestions,
        tableStats,
        indexStats,
        slowQueries,
      ] = await Promise.all([
        this.analyzeQueryPerformance(),
        this.getTableStatistics(),
        this.getIndexStatistics(),
        this.getSlowQueries(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        suggestions: {
          total: suggestions.length,
          byPriority: {
            high: suggestions.filter(s => s.priority === 'HIGH').length,
            medium: suggestions.filter(s => s.priority === 'MEDIUM').length,
            low: suggestions.filter(s => s.priority === 'LOW').length,
          },
          items: suggestions,
        },
        tableStatistics: {
          totalTables: tableStats.length,
          tablesWithHighSeqScans: tableStats.filter(t => t.seq_scan_ratio > 50).length,
          mostActiveTable: tableStats[0]?.tablename || 'N/A',
        },
        indexStatistics: {
          totalIndexes: indexStats.length,
          unusedIndexes: indexStats.filter(i => i.idx_scan < 10).length,
          largestIndex: indexStats.reduce((max, idx) => 
            idx.size_mb > (max?.size_mb || 0) ? idx : max, null
          ),
        },
        slowQueries: {
          count: slowQueries.length,
          slowestQuery: slowQueries[0] || null,
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate performance report', error);
      return {
        timestamp: new Date().toISOString(),
        error: 'Failed to generate report',
      };
    }
  }
}