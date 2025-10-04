# Railway Backend Deployment Checklist

Use this checklist to ensure a smooth deployment process every time.

## Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Railway account created and authenticated (`railway login`)
- [ ] Node.js 18+ installed locally
- [ ] Git repository is up to date

### ✅ Code Preparation
- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] All tests passing (`npm test`)
- [ ] Dependencies are up to date (`npm audit`)
- [ ] Environment variables documented
- [ ] Database schema is finalized
- [ ] API endpoints tested locally

### ✅ Required Files
- [ ] `railway.json` exists in project root
- [ ] `.env.example` updated with all required variables
- [ ] `package.json` has correct scripts
- [ ] Prisma schema is ready
- [ ] Health check endpoint implemented

## Railway Project Setup

### ✅ Project Initialization
- [ ] Railway project created (`railway init`)
- [ ] Project name set appropriately
- [ ] Correct workspace selected

### ✅ Services Configuration
- [ ] PostgreSQL database added (`railway add --database postgres`)
- [ ] Redis cache added (`railway add --database redis`)
- [ ] Backend service created (`railway add --service backend`)
- [ ] Linked to backend service (`railway service backend`)

### ✅ Environment Variables
Copy and execute these commands:

```bash
# Core application settings
railway variables --set NODE_ENV=production
railway variables --set PORT=3001
railway variables --set NODE_OPTIONS="--max-old-space-size=1024"

# Database connections
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
railway variables --set 'REDIS_URL=${{Redis.REDIS_URL}}'

# Security settings (update secrets!)
railway variables --set JWT_ACCESS_SECRET=your-unique-access-secret-32-chars-minimum
railway variables --set JWT_REFRESH_SECRET=your-unique-refresh-secret-32-chars-minimum
railway variables --set COOKIE_SECURE=true
railway variables --set SAME_SITE=none
railway variables --set ENABLE_HELMET=true
railway variables --set ENABLE_RATE_LIMITING=true

# Optional: Memory optimization
railway variables --set DISABLE_PUPPETEER=true
railway variables --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

- [ ] All environment variables set
- [ ] JWT secrets are unique and secure (32+ characters)
- [ ] Database URLs properly referenced
- [ ] Security settings enabled

## Deployment Process

### ✅ Pre-Deployment Verification
- [ ] Local build successful (`npm run build`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] No TypeScript errors
- [ ] All required modules exist

### ✅ Deployment Execution
- [ ] Deploy command executed (`railway up`)
- [ ] Deployment logs monitored (`railway logs --follow`)
- [ ] No build errors in logs
- [ ] Application started successfully

### ✅ Post-Deployment Verification
- [ ] Application status checked (`railway status`)
- [ ] Health endpoint accessible (`/api/health`)
- [ ] Database connection verified
- [ ] Redis connection verified
- [ ] API documentation accessible (`/api/docs`)

## Database Setup

### ✅ Migration Execution
- [ ] Database migrations run (`railway shell` → `npm run prisma:migrate:deploy`)
- [ ] Migration status verified
- [ ] Database schema matches expectations

### ✅ Data Seeding (Optional)
- [ ] Seed data script executed if needed
- [ ] Initial data verified in database
- [ ] Test user accounts created if required

## Testing & Validation

### ✅ API Testing
- [ ] Health check endpoint responds (`GET /api/health`)
- [ ] Authentication endpoints work
- [ ] Core API endpoints functional
- [ ] Error handling works correctly
- [ ] Rate limiting active (if enabled)

### ✅ Database Testing
- [ ] Database queries execute successfully
- [ ] Connection pooling working
- [ ] Data persistence verified
- [ ] Backup strategy confirmed

### ✅ Performance Testing
- [ ] Application startup time acceptable
- [ ] Memory usage within limits
- [ ] Response times acceptable
- [ ] No memory leaks detected

## Security Verification

### ✅ Security Settings
- [ ] HTTPS enforced
- [ ] CORS configured correctly
- [ ] Security headers present (Helmet)
- [ ] Rate limiting active
- [ ] JWT tokens secure

### ✅ Environment Security
- [ ] No sensitive data in logs
- [ ] Environment variables properly secured
- [ ] Database access restricted
- [ ] API keys not exposed

## Monitoring Setup

### ✅ Logging
- [ ] Application logs accessible (`railway logs`)
- [ ] Error logging configured
- [ ] Log levels appropriate for production
- [ ] No sensitive data in logs

### ✅ Health Monitoring
- [ ] Health check endpoint configured
- [ ] Uptime monitoring setup (optional)
- [ ] Error alerting configured (optional)
- [ ] Performance metrics available

## Documentation

### ✅ Deployment Documentation
- [ ] Deployment process documented
- [ ] Environment variables documented
- [ ] Troubleshooting guide available
- [ ] API documentation updated

### ✅ Access Information
- [ ] Application URL documented
- [ ] Database connection details secured
- [ ] Admin access credentials secured
- [ ] Team access configured

## Rollback Plan

### ✅ Rollback Preparation
- [ ] Previous deployment version noted
- [ ] Rollback procedure documented
- [ ] Database backup available
- [ ] Rollback tested in staging

## Post-Deployment Tasks

### ✅ Team Communication
- [ ] Deployment completion communicated
- [ ] New features documented
- [ ] Known issues documented
- [ ] Next steps planned

### ✅ Monitoring
- [ ] Application performance monitored for 24 hours
- [ ] Error rates checked
- [ ] User feedback collected
- [ ] Performance metrics reviewed

## Troubleshooting Quick Reference

### Common Issues Checklist
- [ ] Memory errors → Increase Node.js memory limit
- [ ] Build failures → Check TypeScript errors locally
- [ ] Database errors → Verify connection strings
- [ ] Service linking → Re-run `railway link`
- [ ] Environment variables → Check `railway variables`

### Emergency Commands
```bash
# Check status
railway status

# View logs
railway logs --follow

# Re-deploy
railway up

# Access shell
railway shell

# Check variables
railway variables
```

## Success Criteria

### ✅ Deployment Successful When:
- [ ] Application accessible via Railway URL
- [ ] Health check returns 200 OK
- [ ] Database queries work
- [ ] API endpoints respond correctly
- [ ] No critical errors in logs
- [ ] Performance meets requirements

## Sign-off

### Deployment Completed By:
- **Name:** ________________
- **Date:** ________________
- **Deployment Version:** ________________
- **Railway Project URL:** ________________

### Verified By:
- **Name:** ________________
- **Date:** ________________
- **Notes:** ________________

---

## Notes Section

Use this space for deployment-specific notes, issues encountered, or special configurations:

```
Deployment Notes:
- 
- 
- 

Issues Resolved:
- 
- 
- 

Special Configurations:
- 
- 
- 
```

---

**Keep this checklist updated as your deployment process evolves!**