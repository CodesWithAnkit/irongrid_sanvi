# Railway Database Configuration Guide

## Overview

This guide covers setting up PostgreSQL and Redis managed services on Railway for the IronGrid backend application.

## Prerequisites

- Railway CLI installed and authenticated
- Railway project created and linked

## Database Services Configuration

### 1. PostgreSQL Service

#### Add PostgreSQL Service
```bash
# Add PostgreSQL service to your Railway project
railway add --service postgresql

# Verify the service was added
railway services
```

#### Environment Variables
Railway automatically generates the following environment variables for PostgreSQL:
- `DATABASE_URL` - Complete connection string
- `PGHOST` - Database host
- `PGPORT` - Database port (default: 5432)
- `PGUSER` - Database username
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

#### Connection Configuration
The `DATABASE_URL` follows this format:
```
postgresql://username:password@host:port/database?schema=public
```

### 2. Redis Service

#### Add Redis Service
```bash
# Add Redis service to your Railway project
railway add --service redis

# Verify the service was added
railway services
```

#### Environment Variables
Railway automatically generates the following environment variables for Redis:
- `REDIS_URL` - Complete connection string
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (if authentication is enabled)

#### Connection Configuration
The `REDIS_URL` follows this format:
```
redis://username:password@host:port
```

## Database Connection Testing

### PostgreSQL Connection Test
```bash
# Connect to PostgreSQL using Railway CLI
railway connect postgresql

# Or test connection with psql
railway run psql $DATABASE_URL
```

### Redis Connection Test
```bash
# Connect to Redis using Railway CLI
railway connect redis

# Or test connection with redis-cli
railway run redis-cli -u $REDIS_URL
```

## Prisma Configuration

### 1. Database URL Configuration
The Prisma schema is already configured to use the `DATABASE_URL` environment variable:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Generate Prisma Client
```bash
# Generate Prisma client for production
railway run npx prisma generate

# Or run locally with production DATABASE_URL
DATABASE_URL=$RAILWAY_DATABASE_URL npx prisma generate
```

### 3. Database Migrations
```bash
# Run migrations in Railway environment
railway run npx prisma migrate deploy

# Or run locally against Railway database
DATABASE_URL=$RAILWAY_DATABASE_URL npx prisma migrate deploy
```

### 4. Database Seeding
```bash
# Seed the database with initial data
railway run npm run db:seed

# Or run locally against Railway database
DATABASE_URL=$RAILWAY_DATABASE_URL npm run db:seed
```

## Application Configuration

### Backend Configuration
Update your NestJS application configuration to use Railway environment variables:

```typescript
// config/database.config.ts
export const databaseConfig = {
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '5'),
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000'),
  },
};

// config/redis.config.ts
export const redisConfig = {
  url: process.env.REDIS_URL,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
};
```

## Health Checks

### Database Health Check
The application includes health checks for both PostgreSQL and Redis:

```typescript
// health/health.service.ts
async check() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check PostgreSQL connection
  try {
    await this.prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch (error) {
    health.services.database = 'disconnected';
    health.status = 'error';
  }

  // Check Redis connection
  try {
    // Add Redis health check implementation
    health.services.redis = 'connected';
  } catch (error) {
    health.services.redis = 'disconnected';
    health.status = 'error';
  }

  return health;
}
```

## Monitoring and Maintenance

### Database Monitoring
Railway provides built-in monitoring for your database services:

1. **Metrics Dashboard**: View CPU, memory, and connection metrics
2. **Query Performance**: Monitor slow queries and performance
3. **Connection Pool**: Track active connections and pool usage
4. **Storage Usage**: Monitor database size and growth

### Backup and Recovery
Railway automatically handles:
- **Automated Backups**: Daily backups with point-in-time recovery
- **High Availability**: Multi-zone deployment for reliability
- **Disaster Recovery**: Automated failover and recovery procedures

### Maintenance Windows
- Railway handles maintenance automatically
- No downtime for minor updates
- Advance notification for major updates

## Security Configuration

### SSL/TLS Configuration
Railway databases use SSL/TLS by default:

```typescript
// For production, SSL is required
const databaseConfig = {
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Required for Railway
  } : false,
};
```

### Network Security
- Databases are isolated in private networks
- Access only through Railway services
- No direct external access by default

### Authentication
- Strong passwords generated automatically
- Credentials rotated regularly
- Access controlled through Railway IAM

## Troubleshooting

### Common Issues

#### Connection Timeouts
```bash
# Check service status
railway status

# View service logs
railway logs --service postgresql
railway logs --service redis
```

#### Migration Failures
```bash
# Check migration status
railway run npx prisma migrate status

# Reset database (CAUTION: This will delete all data)
railway run npx prisma migrate reset --force
```

#### Performance Issues
```bash
# Check database metrics in Railway dashboard
# Monitor slow queries
# Review connection pool settings
```

### Support Resources
- Railway Documentation: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway
- Railway Status Page: https://status.railway.app/

## Cost Optimization

### PostgreSQL Optimization
- Use connection pooling to reduce connection overhead
- Optimize queries to reduce CPU usage
- Monitor storage usage and clean up old data

### Redis Optimization
- Use appropriate data structures
- Set TTL for cached data
- Monitor memory usage

### Scaling Considerations
- Railway auto-scales based on usage
- Monitor metrics to optimize resource allocation
- Consider read replicas for high-read workloads