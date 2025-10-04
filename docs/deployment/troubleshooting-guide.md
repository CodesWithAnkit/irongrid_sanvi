# Railway Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Memory Issues

#### Issue: "JavaScript heap out of memory" during build
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

**Solutions (try in order):**

1. **Increase Node.js memory limit:**
```bash
railway variables --set NODE_OPTIONS="--max-old-space-size=2048"
```

2. **Disable Puppeteer temporarily:**
```bash
railway variables --set DISABLE_PUPPETEER=true
railway variables --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

3. **Remove heavy dependencies from package.json temporarily:**
```bash
# Comment out puppeteer in package.json
# "puppeteer": "^24.17.0",
```

4. **Upgrade Railway plan:**
   - Railway Hobby plan has limited build resources
   - Consider upgrading to Pro for more memory during builds

### 2. TypeScript Compilation Errors

#### Issue: Module not found errors
```
error TS2307: Cannot find module '@types/uuid'
```

**Solution:**
```bash
# Install missing type definitions
npm install --save-dev @types/uuid

# Verify build works locally
npm run build
```

#### Issue: Type errors in services
```
error TS2322: Type 'string | undefined' is not assignable to type 'string'
```

**Solution:**
```bash
# Fix type issues by providing default values
# Example: this.bucketName = this.configService.get('AWS_S3_BUCKET') || '';
```

### 3. Database Connection Issues

#### Issue: "Database URL not found"
```
Error: Environment variable not found: DATABASE_URL
```

**Solutions:**

1. **Check service linking:**
```bash
railway service Postgres
railway variables
```

2. **Re-set database URL:**
```bash
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
```

3. **Verify PostgreSQL service exists:**
```bash
railway add --database postgres
```

### 4. Service Linking Problems

#### Issue: "No linked project found"
```
No linked project found. Run railway link to connect to a project
```

**Solution:**
```bash
# Re-link to your project
railway link

# Select your project from the list
# Then link to the correct service
railway service backend
```

#### Issue: Wrong service selected
```bash
# Check current service
railway status

# Switch to correct service
railway service backend
```

### 5. Build Failures

#### Issue: npm install fails
```
npm ERR! code ENOTFOUND
```

**Solutions:**

1. **Check package.json for invalid dependencies:**
```bash
# Verify all dependencies exist
npm ci
```

2. **Clear npm cache:**
```bash
npm cache clean --force
```

3. **Use specific npm version:**
```bash
railway variables --set NPM_VERSION=8.19.2
```

#### Issue: Build command not found
```
/bin/sh: nest: not found
```

**Solution:**
```bash
# Ensure build script uses npx
# In package.json:
"build": "npx nest build"
```

### 6. Runtime Errors

#### Issue: Application crashes on startup
```
Error: Cannot find module './dist/main'
```

**Solutions:**

1. **Check build output:**
```bash
# Verify dist folder is created during build
npm run build
ls -la dist/
```

2. **Update start command:**
```bash
# In railway.json or Railway dashboard
"startCommand": "cd backend && npm run start:prod"
```

#### Issue: Port binding errors
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Ensure PORT environment variable is set
railway variables --set PORT=3001

# Check your main.ts uses process.env.PORT
const port = process.env.PORT || 3001;
```

### 7. Environment Variable Issues

#### Issue: Variables not loading
```bash
# Check if variables are set
railway variables

# Re-set critical variables
railway variables --set NODE_ENV=production
```

#### Issue: Service references not working
```bash
# Ensure correct syntax for service references
railway variables --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}'
# Note: Use single quotes to prevent shell expansion
```

### 8. Deployment Timeout

#### Issue: Deployment hangs or times out

**Solutions:**

1. **Deploy in detached mode:**
```bash
railway up --detach
```

2. **Monitor logs separately:**
```bash
railway logs --follow
```

3. **Check for infinite loops in startup code:**
   - Review application initialization
   - Check database connection logic
   - Verify no blocking operations in startup

### 9. Health Check Failures

#### Issue: Health check endpoint not responding

**Solutions:**

1. **Verify health endpoint exists:**
```typescript
// In your controller
@Get('health')
health() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

2. **Update railway.json:**
```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100
  }
}
```

3. **Check application is binding to correct port:**
```typescript
// In main.ts
const port = process.env.PORT || 3001;
await app.listen(port, '0.0.0.0');
```

### 10. Database Migration Issues

#### Issue: Migrations fail during deployment

**Solutions:**

1. **Run migrations manually:**
```bash
railway shell
npm run prisma:migrate:deploy
```

2. **Check migration files:**
```bash
# Ensure migration files are committed
git status prisma/migrations/
```

3. **Reset database if needed:**
```bash
railway shell
npm run prisma:migrate:reset
```

## Debugging Commands

### Check Application Status
```bash
# Overall project status
railway status

# View recent logs
railway logs

# Follow logs in real-time
railway logs --follow

# Check specific service logs
railway logs --service backend
```

### Verify Configuration
```bash
# Check all environment variables
railway variables

# Check specific service variables
railway service Postgres
railway variables

railway service Redis  
railway variables
```

### Test Connectivity
```bash
# Open application in browser
railway open

# Connect to application shell
railway shell

# Test database connection from shell
railway shell
node -e "console.log(process.env.DATABASE_URL)"
```

### Reset and Retry
```bash
# Re-link project
railway link

# Re-deploy
railway up

# Force rebuild
railway up --detach
```

## Prevention Tips

### Before Deployment
1. **Always test build locally:**
```bash
npm ci
npm run build
npm run start:prod
```

2. **Check TypeScript compilation:**
```bash
npm run type-check
```

3. **Verify environment variables:**
```bash
# Create .env.test with Railway variables
# Test locally with production-like config
```

### During Development
1. **Keep dependencies minimal**
2. **Use optional dependencies for heavy packages**
3. **Implement proper error handling**
4. **Add health check endpoints**

### After Deployment
1. **Monitor logs regularly**
2. **Set up alerts for errors**
3. **Test all API endpoints**
4. **Verify database connectivity**

## Getting Help

### Railway Support Channels
- Railway Discord: https://discord.gg/railway
- Railway Documentation: https://docs.railway.app/
- Railway Status Page: https://status.railway.app/

### Useful Railway Commands for Support
```bash
# Get project information for support
railway status
railway variables
railway logs --tail 100

# Generate deployment report
railway logs > deployment-logs.txt
```

### Information to Include in Support Requests
1. Project ID (from `railway status`)
2. Error messages (from `railway logs`)
3. Environment variables (sanitized)
4. Build configuration (railway.json)
5. Package.json dependencies
6. Steps to reproduce the issue