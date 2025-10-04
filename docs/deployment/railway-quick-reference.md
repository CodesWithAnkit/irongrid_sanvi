# Railway Deployment Quick Reference

## Essential Commands Cheat Sheet

### Initial Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to backend directory
cd backend

# Initialize new project
railway init
```

### Project Configuration
```bash
# Add PostgreSQL database
railway add --database postgres

# Add Redis cache
railway add --database redis

# Add backend service
railway add --service backend

# Link to backend service
railway service backend
```

### Environment Variables (Copy & Paste Ready)
```bash
# Core variables
railway variables --set NODE_ENV=production
railway variables --set PORT=3001
railway variables --set NODE_OPTIONS="--max-old-space-size=1024"

# Database connections
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
railway variables --set 'REDIS_URL=${{Redis.REDIS_URL}}'

# Security (replace with your own secrets)
railway variables --set JWT_ACCESS_SECRET=irongrid-production-access-secret-2024-secure-key-32chars
railway variables --set JWT_REFRESH_SECRET=irongrid-production-refresh-secret-2024-secure-key-32chars
railway variables --set COOKIE_SECURE=true
railway variables --set SAME_SITE=none
railway variables --set ENABLE_HELMET=true
railway variables --set ENABLE_RATE_LIMITING=true

# Optional: Memory optimization
railway variables --set DISABLE_PUPPETEER=true
railway variables --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Deployment
```bash
# Deploy application
railway up

# Monitor deployment
railway logs --follow

# Check status
railway status
```

### Troubleshooting
```bash
# View logs
railway logs

# Check variables
railway variables

# Re-link project
railway link

# Open dashboard
railway open
```

## Pre-Deployment Checklist

- [ ] Railway CLI installed and authenticated
- [ ] Backend builds locally (`npm run build`)
- [ ] All TypeScript errors fixed
- [ ] Missing dependencies installed
- [ ] Environment variables configured
- [ ] Database services added (PostgreSQL, Redis)

## Common Issues & Quick Fixes

### Memory Error During Build
```bash
railway variables --set NODE_OPTIONS="--max-old-space-size=2048"
railway variables --set DISABLE_PUPPETEER=true
```

### TypeScript Errors
```bash
npm install --save-dev @types/uuid
npm run build  # Verify locally first
```

### Database Connection Issues
```bash
railway service Postgres
railway variables  # Check DATABASE_URL is set
```

### Service Not Found
```bash
railway link  # Re-link to project
railway service backend  # Link to correct service
```

## File Locations

- Main deployment guide: `docs/deployment/railway-backend-deployment.md`
- Railway config: `railway.json` (project root)
- Environment template: `backend/.env.production`
- Prisma module: `backend/src/prisma/prisma.module.ts`

## Support Resources

- Railway Documentation: https://docs.railway.app/
- Railway CLI Help: `railway --help`
- Project Dashboard: `railway open`
- Community Support: Railway Discord