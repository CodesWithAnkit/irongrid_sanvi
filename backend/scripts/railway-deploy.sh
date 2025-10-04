#!/bin/bash

# Railway Deployment Script for IronGrid Backend
# This script automates the Railway deployment process

set -e

echo "🚀 Starting Railway deployment for IronGrid Backend..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed. Installing..."
    npm install -g @railway/cli
fi

# Check if user is authenticated
if ! railway whoami &> /dev/null; then
    echo "❌ Not authenticated with Railway. Please run 'railway login' first."
    exit 1
fi

echo "✅ Railway CLI is installed and authenticated"

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Check if project is already linked
if ! railway status &> /dev/null; then
    echo "🔗 Linking to Railway project..."
    railway init --name irongrid-backend
    
    echo "📦 Adding PostgreSQL service..."
    railway add --service postgresql
    
    echo "📦 Adding Redis service..."
    railway add --service redis
    
    echo "✅ Services added successfully"
else
    echo "✅ Already linked to Railway project"
fi

# Generate JWT secrets if not provided
if [ -z "$JWT_ACCESS_SECRET" ]; then
    JWT_ACCESS_SECRET=$(openssl rand -base64 32)
    echo "🔑 Generated JWT access secret"
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    echo "🔑 Generated JWT refresh secret"
fi

# Set environment variables
echo "⚙️ Setting environment variables..."

railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_ACCESS_SECRET="$JWT_ACCESS_SECRET"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
railway variables set ALLOWED_ORIGINS="https://your-frontend.vercel.app"
railway variables set COOKIE_SECURE=true
railway variables set SAME_SITE=none
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100
railway variables set CACHE_TTL_DEFAULT=3600
railway variables set CACHE_TTL_SHORT=300
railway variables set CACHE_TTL_LONG=7200
railway variables set ENABLE_CACHE_WARMING=true
railway variables set ENABLE_DB_METRICS=true
railway variables set LOG_SLOW_QUERIES=true
railway variables set SLOW_QUERY_THRESHOLD=1000
railway variables set ENABLE_HELMET=true
railway variables set ENABLE_RATE_LIMITING=true

echo "✅ Environment variables set"

# Deploy the application
echo "🚀 Deploying to Railway..."
railway up --detach

echo "⏳ Waiting for deployment to complete..."
sleep 30

# Check deployment status
echo "📊 Checking deployment status..."
railway status

# Get the deployment URL
RAILWAY_URL=$(railway domain 2>/dev/null || echo "No domain configured")
if [ "$RAILWAY_URL" != "No domain configured" ]; then
    echo "🌐 Application deployed at: $RAILWAY_URL"
    echo "🏥 Health check: $RAILWAY_URL/api/health"
    echo "📚 API Documentation: $RAILWAY_URL/api/docs"
else
    echo "⚠️ No custom domain configured. Use Railway dashboard to get the deployment URL."
fi

echo "✅ Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. Check the Railway dashboard for your deployment URL"
echo "2. Test the health endpoint: curl <your-url>/api/health"
echo "3. Configure custom domain if needed: railway domain add api.yourdomain.com"
echo "4. Update CORS origins with your actual frontend URL"