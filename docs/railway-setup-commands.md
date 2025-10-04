# Railway Setup Commands

## Step 1: Authentication (Manual)
```bash
railway login
# Follow the browser authentication flow
```

## Step 2: Create Project and Services
```bash
# Navigate to backend directory
cd backend

# Create new Railway project
railway init --name irongrid-backend

# Add PostgreSQL service
railway add --service postgresql

# Add Redis service  
railway add --service redis

# Verify project creation
railway status
```

## Step 3: Configure Environment Variables
```bash
# Set production environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001

# Generate and set JWT secrets (32+ characters each)
railway variables set JWT_ACCESS_SECRET="$(openssl rand -base64 32)"
railway variables set JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

# Set CORS origins (update with your actual domains)
railway variables set ALLOWED_ORIGINS="https://your-frontend.vercel.app,https://app.yourdomain.com"

# Set cookie configuration
railway variables set COOKIE_SECURE=true
railway variables set SAME_SITE=none

# Set rate limiting
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100

# Set cache configuration
railway variables set CACHE_TTL_DEFAULT=3600
railway variables set CACHE_TTL_SHORT=300
railway variables set CACHE_TTL_LONG=7200
railway variables set ENABLE_CACHE_WARMING=true

# Set performance monitoring
railway variables set ENABLE_DB_METRICS=true
railway variables set LOG_SLOW_QUERIES=true
railway variables set SLOW_QUERY_THRESHOLD=1000

# Set security features
railway variables set ENABLE_HELMET=true
railway variables set ENABLE_RATE_LIMITING=true
```

## Step 4: Deploy Backend
```bash
# Deploy the backend application
railway up

# Check deployment status
railway status

# View logs
railway logs
```

## Step 5: Verify Deployment
```bash
# Get the deployment URL
railway domain

# Test health endpoint
curl https://your-app.railway.app/api/health

# Check database connection
railway connect postgresql
```

## Verification Commands
```bash
# Check authentication
railway whoami

# Check project status
railway status

# List available services
railway services

# View environment variables
railway variables

# View deployment logs
railway logs --tail
```

## Optional: Custom Domain Setup
```bash
# Add custom domain (if you have one)
railway domain add api.yourdomain.com
```

## Troubleshooting Commands
```bash
# Restart service
railway restart

# View detailed logs
railway logs --follow

# Check service health
railway ps

# Redeploy
railway up --detach
```