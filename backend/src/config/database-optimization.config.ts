import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  // Connection Pool Configuration
  connectionPool: {
    // Maximum number of connections in the pool
    max: parseInt(process.env.DB_POOL_MAX || '20', 10),
    
    // Minimum number of connections in the pool
    min: parseInt(process.env.DB_POOL_MIN || '5', 10),
    
    // Maximum time (in milliseconds) that a connection can remain idle
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    
    // Maximum time (in milliseconds) to wait for a connection
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
    
    // How often to run eviction checks (in milliseconds)
    evictionRunIntervalMillis: parseInt(process.env.DB_EVICTION_INTERVAL || '10000', 10),
    
    // Number of connections to check during eviction
    numTestsPerEvictionRun: parseInt(process.env.DB_TESTS_PER_EVICTION || '3', 10),
  },

  // Query Optimization Settings
  queryOptimization: {
    // Enable query logging for slow queries
    logSlowQueries: process.env.LOG_SLOW_QUERIES === 'true',
    
    // Threshold for slow query logging (in milliseconds)
    slowQueryThreshold: parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000', 10),
    
    // Enable query result caching
    enableQueryCache: process.env.ENABLE_QUERY_CACHE !== 'false',
    
    // Query cache TTL (in seconds)
    queryCacheTtl: parseInt(process.env.QUERY_CACHE_TTL || '300', 10),
    
    // Maximum number of cached queries
    maxCachedQueries: parseInt(process.env.MAX_CACHED_QUERIES || '1000', 10),
  },

  // Performance Monitoring
  monitoring: {
    // Enable performance metrics collection
    enableMetrics: process.env.ENABLE_DB_METRICS !== 'false',
    
    // Metrics collection interval (in milliseconds)
    metricsInterval: parseInt(process.env.DB_METRICS_INTERVAL || '60000', 10),
    
    // Enable connection pool monitoring
    monitorConnectionPool: process.env.MONITOR_CONNECTION_POOL !== 'false',
    
    // Enable query performance monitoring
    monitorQueryPerformance: process.env.MONITOR_QUERY_PERFORMANCE !== 'false',
  },

  // Backup and Recovery
  backup: {
    // Enable automated backups
    enableAutomatedBackup: process.env.ENABLE_AUTOMATED_BACKUP === 'true',
    
    // Backup schedule (cron expression)
    backupSchedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
    
    // Backup retention period (in days)
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10),
    
    // Backup storage location
    backupLocation: process.env.BACKUP_LOCATION || './backups',
    
    // Enable point-in-time recovery
    enablePitr: process.env.ENABLE_PITR === 'true',
  },

  // Index Management
  indexing: {
    // Enable automatic index analysis
    enableIndexAnalysis: process.env.ENABLE_INDEX_ANALYSIS === 'true',
    
    // Index analysis schedule (cron expression)
    analysisSchedule: process.env.INDEX_ANALYSIS_SCHEDULE || '0 3 * * 0', // Weekly on Sunday at 3 AM
    
    // Enable missing index detection
    detectMissingIndexes: process.env.DETECT_MISSING_INDEXES === 'true',
    
    // Enable unused index detection
    detectUnusedIndexes: process.env.DETECT_UNUSED_INDEXES === 'true',
  },
}));