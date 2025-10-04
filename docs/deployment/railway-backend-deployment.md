# Railway Backend Deployment Guide

This guide provides step-by-step instructions for deploying the IronGrid backend to Railway, including all commands, configurations, and troubleshooting steps.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Railway Project Configuration](#railway-project-configuration)
4. [Environment Variables Setup](#environment-variables-setup)
5. [Code Preparation](#code-preparation)
6. [Deployment Process](#deployment-process)
7. [Verification Steps](#verification-steps)
8. [Troubleshooting](#troubleshooting)
9. [Post-Deployment Tasks](#post-deployment-tasks)

## Prerequisites

### Required Tools
- Node.js 18+ installed
- Railway CLI installed
- Git repository access
- Railway account (free tier sufficient for testing)

### Install Railway CLI
```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Verify installation
railway --version
```

### Authentication
```bash
# Login to Railway
railway login

# Verify authentication
railway whoami
```

## Initial Setup

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Verify Local Build
```bash
# Install dependencies
npm ci

# Build the project locally
npm run build

# Verify build success (should exit with code 0)
echo $?
```

## Railway Project Configuration

### 1. Initialize Railway Project
```bash
# Create new Railway project
railway init

# Follow prompts:
# - Select workspace: "Your Workspace Name"
# - Project Name: "irongrid_backend"
```

### 2. Check Project Status
```bash
# Verify project creation
railway status

# Expected output:
# Project: irongrid_backend
# Environment: production
# Service: None
```

### 3. Add Database Services

#### Add PostgreSQL Database
```bash
# Add PostgreSQL service
railway add --database postgres

# Select "Database" when prompted
```

#### Add Redis Cache
```bash
# Add Redis service
railway add --database redis

# Select "Database" when prompted
```

### 4. Link to Backend Service
```bash
# Add backend application service
railway add --service backend

# Follow prompts:
# - What do you need? "Empty Service"
# - Enter service name: "backend"
# - Enter variable: (press Enter to skip)
```

### 5. Link Current Directory to Backend Service
```bash
# Link to the backend service
railway service backend
```

## Environment Variables Setup

### Core Application Variables
```bash
# Set Node.js environment
railway variables --set NODE_ENV=production

# Set application port
railway variables --set PORT=3001

# Set memory options for Node.js
railway variables --set NODE_OPTIONS="--max-old-space-size=1024"
```

### Database Configuration
```bash
# Link to PostgreSQL database
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'

# Link to Redis cache
railway variables --set 'REDIS_URL=${{Redis.REDIS_URL}}'
```

### Security Configuration
```bash
# Set JWT secrets (use strong, unique values)
railway variables --set JWT_ACCESS_SECRET=irongrid-production-access-secret-2024-secure-key-32chars

railway variables --set JWT_REFRESH_SECRET=irongrid-production-refresh-secret-2024-secure-key-32chars

# Set cookie security
railway variables --set COOKIE_SECURE=true
railway variables --set SAME_SITE=none

# Enable security features
railway variables --set ENABLE_HELMET=true
railway variables --set ENABLE_RATE_LIMITING=true
```

### Optional: Disable Puppeteer (if memory issues occur)
```bash
# Disable Puppeteer to reduce memory usage
railway variables --set DISABLE_PUPPETEER=true
railway variables --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Migration Configuration
```bash
# Enable automatic migrations
railway variables --set RUN_MIGRATIONS=true
```

### View All Variables
```bash
# Check all configured variables
railway variables
```

## Code Preparation

### 1. Fix TypeScript Issues

#### Install Missing Dependencies
```bash
# Install missing type definitions
npm install --save-dev @types/uuid
```

#### Create Missing Prisma Module
Create `backend/src/prisma/prisma.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

#### Fix S3 Service Type Issues
Update `backend/src/files/s3.service.ts`:
```typescript
// Change this line:
this.bucketName = this.configService.get('AWS_S3_BUCKET');

// To this:
this.bucketName = this.configService.get('AWS_S3_BUCKET') || '';
```

### 2. Verify Build After Fixes
```bash
# Test build locally
npm run build

# Generate Prisma client
npx prisma generate
```

## Deployment Process

### 1. Deploy to Railway
```bash
# Deploy the application
railway up
```

### 2. Monitor Deployment
```bash
# Watch deployment logs in real-time
railway logs --follow

# Check deployment status
railway status
```

### 3. Alternative Deployment Commands
```bash
# Deploy with specific service
railway up --service backend

# Deploy from specific directory
railway up --detach
```

## Verification Steps

### 1. Check Service Status
```bash
# Verify all services are running
railway status

# Expected output should show:
# - Project: irongrid_backend
# - Environment: production  
# - Service: backend (or current linked service)
```

### 2. View Application Logs
```bash
# Check recent logs
railway logs

# Follow logs in real-time
railway logs --follow

# Filter logs by service
railway logs --service backend
```

### 3. Test Database Connections
```bash
# Check PostgreSQL variables
railway service Postgres
railway variables

# Check Redis variables  
railway service Redis
railway variables
```

### 4. Access Application
```bash
# Get application URL
railway open

# Or check in Railway dashboard for the generated URL
```

## Troubleshooting

### Memory Issues During Build

#### Problem: "JavaScript heap out of memory" during deployment

**Solution 1: Increase Node.js Memory**
```bash
# Set higher memory limit
railway variables --set NODE_OPTIONS="--max-old-space-size=2048"
```

**Solution 2: Disable Heavy Dependencies**
```bash
# Temporarily disable Puppeteer
railway variables --set DISABLE_PUPPETEER=true
railway variables --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

**Solution 3: Upgrade Railway Plan**
- Consider upgrading to Railway Pro for more build resources
- Pro plan provides more memory during build process

### Build Failures

#### Problem: TypeScript compilation errors

**Check and Fix:**
```bash
# Run type checking locally
npm run type-check

# Fix any TypeScript errors before deploying
npm run build
```

#### Problem: Missing dependencies

**Solution:**
```bash
# Install missing dependencies
npm install --save-dev @types/uuid

# Update package.json and redeploy
railway up
```

### Database Connection Issues

#### Problem: Database URL not found

**Check Configuration:**
```bash
# Verify database service is linked
railway service Postgres
railway variables

# Ensure DATABASE_URL is set correctly
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
```

### Service Linking Issues

#### Problem: "No linked project found"

**Solution:**
```bash
# Re-link to project
railway link

# Select your project from the list
# Then link to correct service
railway service backend
```

### Deployment Timeout

#### Problem: Deployment takes too long or times out

**Solutions:**
```bash
# Check build logs for specific errors
railway logs

# Try deploying with detached mode
railway up --detach

# Monitor progress separately
railway logs --follow
```

## Post-Deployment Tasks

### 1. Database Setup

#### Run Migrations
```bash
# Connect to your deployed service
railway shell

# Inside the shell, run migrations
npm run prisma:migrate:deploy

# Or use the production migration script
npm run prisma:migrate:prod
```

#### Seed Database (Optional)
```bash
# Run database seeding
npm run db:seed:prod
```

### 2. Health Check

#### Test API Endpoints
```bash
# Get your application URL
railway open

# Test health endpoint
curl https://your-app-url.railway.app/api/health

# Test Swagger documentation
# Visit: https://your-app-url.railway.app/api/docs
```

### 3. Domain Configuration (Optional)

#### Add Custom Domain
```bash
# Add custom domain
railway domain add your-domain.com

# Follow DNS configuration instructions in Railway dashboard
```

### 4. Environment-Specific Configuration

#### Production-Only Variables
```bash
# Set production-specific configurations
railway variables --set ALLOWED_ORIGINS=https://your-frontend-domain.com

# Configure email service (if using SendGrid)
railway variables --set SENDGRID_API_KEY=your-sendgrid-key
railway variables --set FROM_EMAIL=noreply@your-domain.com

# Configure AWS S3 (if using file uploads)
railway variables --set AWS_ACCESS_KEY_ID=your-aws-key
railway variables --set AWS_SECRET_ACCESS_KEY=your-aws-secret
railway variables --set AWS_REGION=us-east-1
railway variables --set AWS_S3_BUCKET=your-bucket-name
```

## Useful Railway Commands Reference

### Project Management
```bash
# List all projects
railway list

# Switch between projects
railway link

# Open project dashboard
railway open

# Check project status
railway status
```

### Service Management
```bash
# List services in project
railway service

# Link to specific service
railway service <service-name>

# Add new service
railway add --service <service-name>
```

### Environment Variables
```bash
# View all variables
railway variables

# Set variable
railway variables --set KEY=value

# Remove variable
railway variables --remove KEY
```

### Logs and Monitoring
```bash
# View recent logs
railway logs

# Follow logs in real-time
railway logs --follow

# View logs for specific service
railway logs --service <service-name>

# View deployment logs
railway logs --deployment
```

### Deployment
```bash
# Deploy current directory
railway up

# Deploy specific service
railway up --service <service-name>

# Deploy in detached mode
railway up --detach
```

## Configuration Files

### railway.json (Project Root)
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

### .env.production (Backend Directory)
```bash
# Production Environment Variables Template
NODE_ENV=production
PORT=3001

# Database (Railway auto-generates)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway auto-generates)  
REDIS_URL=${{Redis.REDIS_URL}}

# JWT Secrets (Set via Railway CLI)
JWT_ACCESS_SECRET=your-secure-access-secret
JWT_REFRESH_SECRET=your-secure-refresh-secret

# Security
COOKIE_SECURE=true
SAME_SITE=none
ENABLE_HELMET=true
ENABLE_RATE_LIMITING=true

# Optional: Disable Puppeteer if memory issues
DISABLE_PUPPETEER=true
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

## Best Practices

### Security
1. Always use strong, unique JWT secrets in production
2. Enable HTTPS-only cookies (`COOKIE_SECURE=true`)
3. Configure CORS properly for your frontend domain
4. Enable security middleware (Helmet, rate limiting)

### Performance
1. Set appropriate Node.js memory limits
2. Use connection pooling for database
3. Enable Redis caching where appropriate
4. Monitor application performance via Railway metrics

### Monitoring
1. Regularly check application logs
2. Set up health check endpoints
3. Monitor database performance
4. Use Railway's built-in metrics dashboard

### Maintenance
1. Keep dependencies updated
2. Regularly backup database
3. Test deployments in staging environment first
4. Document any custom configurations

This guide should provide everything needed to successfully deploy the IronGrid backend to Railway. Keep this documentation updated as the deployment process evolves.