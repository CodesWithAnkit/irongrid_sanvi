# Railway Deployment Guide

## Overview

This guide covers deploying the IronGrid backend to Railway platform with comprehensive setup, testing, and monitoring.

## Prerequisites

- Railway CLI installed and authenticated
- Railway project created with PostgreSQL and Redis services
- Environment variables configured
- Local development environment working

## Quick Deployment

### Automated Deployment (Recommended)
```bash
# Make script executable
chmod +x scripts/deploy-to-railway.sh

# Run deployment script
./scripts/deploy-to-railway.sh

# Or use PowerShell on Windows
.\scripts\deploy-to-railway.ps1
```

### Manual Deployment
```bash
# 1. Validate environment
npm run validate:env

# 2. Build and test
npm ci
npm run build
npm run test:ci

# 3. Deploy to Railway
railway up --detach

# 4. Run migrations
railway run npx prisma migrate deploy

# 5. Seed database (optional)
railway run npm run db:seed
```

## Deployment Process

### 1. Pre-deployment Checks

#### Environment Validation
```bash
# Validate all environment variables
npm run validate:env

# Check specific variables
railway variables | grep JWT_ACCESS_SECRET
```

#### Code Quality Checks
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build verification
npm run build
```

#### Testing
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### 2. Railway Deployment

#### Deploy Application
```bash
# Deploy with Railway CLI
railway up --detach

# Check deployment status
railway status

# View deployment logs
railway logs --tail
```

#### Database Setup
```bash
# Run Prisma migrations
railway run npx prisma migrate deploy

# Generate Prisma client
railway run npx prisma generate

# Seed initial data (optional)
railway run npm run db:seed
```

### 3. Post-deployment Verification

#### Health Checks
```bash
# Test health endpoint
curl https://your-app.railway.app/api/health

# Test API documentation
curl https://your-app.railway.app/api/docs

# Test database connectivity
railway run npm run test:db
```

#### Functional Testing
```bash
# Test authentication endpoints
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test protected endpoints
curl https://your-app.railway.app/api/customers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration Management

### Railway Configuration

#### Build Configuration
Railway uses the `railway.json` file for build configuration:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && npm ci && npm run build",
    "watchPatterns": ["backend/**"]
  },
  "deploy": {
    "startCommand": "cd backend && npm run start:prod",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Environment Variables
Critical environment variables for production:

```bash
# Core application
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# Authentication
JWT_ACCESS_SECRET=your-secure-secret
JWT_REFRESH_SECRET=your-secure-secret

# Security
ALLOWED_ORIGINS=https://your-frontend.vercel.app
COOKIE_SECURE=true
SAME_SITE=none
```

### Domain Configuration

#### Custom Domain Setup
```bash
# Add custom domain
railway domain add api.yourdomain.com

# Verify domain configuration
railway domain

# Update DNS records in your domain provider
# CNAME: api.yourdomain.com -> your-app.railway.app
```

#### SSL Certificate
Railway automatically provisions SSL certificates for custom domains.

## Monitoring and Maintenance

### Application Monitoring

#### Railway Dashboard
- View deployment status and metrics
- Monitor resource usage (CPU, memory, network)
- Check service health and uptime
- Review deployment history

#### Application Logs
```bash
# View live logs
railway logs --tail

# View specific service logs
railway logs --service backend

# Filter logs by level
railway logs --tail | grep ERROR
```

### Performance Monitoring

#### Database Performance
```bash
# Monitor database metrics
railway connect postgresql
\l  # List databases
\dt # List tables
\di # List indexes

# Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Redis Performance
```bash
# Connect to Redis
railway connect redis

# Check Redis info
INFO memory
INFO stats
INFO replication
```

### Health Monitoring

#### Automated Health Checks
Railway automatically monitors the `/api/health` endpoint.

#### Custom Monitoring
```bash
# Create monitoring script
#!/bin/bash
HEALTH_URL="https://your-app.railway.app/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "✅ Application is healthy"
else
    echo "❌ Application health check failed: $RESPONSE"
    # Send alert notification
fi
```

## Troubleshooting

### Common Issues

#### Deployment Failures
```bash
# Check deployment logs
railway logs

# Check build logs
railway logs --deployment

# Restart service
railway restart
```

#### Database Connection Issues
```bash
# Test database connectivity
railway run npm run test:db

# Check database service status
railway services

# Verify DATABASE_URL
railway variables | grep DATABASE_URL
```

#### Environment Variable Issues
```bash
# List all variables
railway variables

# Validate environment
npm run validate:env

# Set missing variables
railway variables set KEY=value
```

#### Performance Issues
```bash
# Check resource usage in Railway dashboard
# Monitor slow queries
railway run npx prisma studio

# Check Redis performance
railway connect redis
INFO stats
```

### Debugging Commands

#### Application Debugging
```bash
# View application logs
railway logs --tail

# Connect to application shell
railway shell

# Run commands in Railway environment
railway run node --version
railway run npm --version
```

#### Database Debugging
```bash
# Connect to PostgreSQL
railway connect postgresql

# Run Prisma studio
railway run npx prisma studio

# Check migration status
railway run npx prisma migrate status
```

## Scaling and Optimization

### Horizontal Scaling
Railway automatically scales based on resource usage and traffic.

### Performance Optimization

#### Database Optimization
```bash
# Add database indexes
railway run npx prisma db push

# Optimize queries
railway run npx prisma generate
```

#### Caching Optimization
```bash
# Configure Redis caching
railway variables set CACHE_TTL_DEFAULT=3600
railway variables set ENABLE_CACHE_WARMING=true
```

### Cost Optimization
- Monitor resource usage in Railway dashboard
- Optimize database queries to reduce CPU usage
- Use appropriate cache TTL values
- Clean up unused resources

## Security

### Security Best Practices
- Use strong JWT secrets (32+ characters)
- Enable HTTPS for all communications
- Configure proper CORS origins
- Use secure cookie settings
- Enable rate limiting
- Regular security updates

### Security Monitoring
```bash
# Check security headers
curl -I https://your-app.railway.app/api/health

# Monitor failed authentication attempts
railway logs | grep "authentication failed"

# Check rate limiting
railway logs | grep "rate limit"
```

## Backup and Recovery

### Database Backups
Railway automatically creates daily backups of PostgreSQL databases.

#### Manual Backup
```bash
# Create manual backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore from backup
railway run psql $DATABASE_URL < backup.sql
```

### Disaster Recovery
- Railway provides automatic failover
- Multi-region deployment available
- Point-in-time recovery for databases

## Support Resources

### Railway Documentation
- Deployment Guide: https://docs.railway.app/deploy
- Environment Variables: https://docs.railway.app/develop/variables
- Custom Domains: https://docs.railway.app/deploy/custom-domains

### Application Support
```bash
# Health check endpoint
GET /api/health

# API documentation
GET /api/docs

# Application metrics
GET /api/metrics (if implemented)
```

### Emergency Contacts
- Railway Status: https://status.railway.app/
- Railway Discord: https://discord.gg/railway
- Application logs: `railway logs --tail`