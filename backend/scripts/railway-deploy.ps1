# Railway Deployment Script for IronGrid Backend (PowerShell)
# This script automates the Railway deployment process

param(
    [string]$JwtAccessSecret = "",
    [string]$JwtRefreshSecret = "",
    [string]$AllowedOrigins = "https://your-frontend.vercel.app"
)

Write-Host "🚀 Starting Railway deployment for IronGrid Backend..." -ForegroundColor Green

# Check if Railway CLI is installed
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI is not installed. Installing..." -ForegroundColor Red
    npm install -g @railway/cli
}

# Check if user is authenticated
try {
    railway whoami | Out-Null
    Write-Host "✅ Authenticated with Railway" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Railway. Please run 'railway login' first." -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $scriptPath "..")

# Check if project is already linked
try {
    railway status | Out-Null
    Write-Host "✅ Already linked to Railway project" -ForegroundColor Green
} catch {
    Write-Host "🔗 Linking to Railway project..." -ForegroundColor Yellow
    railway init --name irongrid-backend
    
    Write-Host "📦 Adding PostgreSQL service..." -ForegroundColor Yellow
    railway add --service postgresql
    
    Write-Host "📦 Adding Redis service..." -ForegroundColor Yellow
    railway add --service redis
    
    Write-Host "✅ Services added successfully" -ForegroundColor Green
}

# Generate JWT secrets if not provided
if ([string]::IsNullOrEmpty($JwtAccessSecret)) {
    $JwtAccessSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    Write-Host "🔑 Generated JWT access secret" -ForegroundColor Yellow
}

if ([string]::IsNullOrEmpty($JwtRefreshSecret)) {
    $JwtRefreshSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
    Write-Host "🔑 Generated JWT refresh secret" -ForegroundColor Yellow
}

# Set environment variables
Write-Host "⚙️ Setting environment variables..." -ForegroundColor Yellow

$envVars = @{
    "NODE_ENV" = "production"
    "PORT" = "3001"
    "JWT_ACCESS_SECRET" = $JwtAccessSecret
    "JWT_REFRESH_SECRET" = $JwtRefreshSecret
    "ALLOWED_ORIGINS" = $AllowedOrigins
    "COOKIE_SECURE" = "true"
    "SAME_SITE" = "none"
    "RATE_LIMIT_WINDOW_MS" = "900000"
    "RATE_LIMIT_MAX_REQUESTS" = "100"
    "CACHE_TTL_DEFAULT" = "3600"
    "CACHE_TTL_SHORT" = "300"
    "CACHE_TTL_LONG" = "7200"
    "ENABLE_CACHE_WARMING" = "true"
    "ENABLE_DB_METRICS" = "true"
    "LOG_SLOW_QUERIES" = "true"
    "SLOW_QUERY_THRESHOLD" = "1000"
    "ENABLE_HELMET" = "true"
    "ENABLE_RATE_LIMITING" = "true"
}

foreach ($var in $envVars.GetEnumerator()) {
    railway variables set "$($var.Key)=$($var.Value)"
}

Write-Host "✅ Environment variables set" -ForegroundColor Green

# Deploy the application
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Green
railway up --detach

Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check deployment status
Write-Host "📊 Checking deployment status..." -ForegroundColor Yellow
railway status

# Get the deployment URL
try {
    $railwayUrl = railway domain 2>$null
    if ($railwayUrl) {
        Write-Host "🌐 Application deployed at: $railwayUrl" -ForegroundColor Green
        Write-Host "🏥 Health check: $railwayUrl/api/health" -ForegroundColor Cyan
        Write-Host "📚 API Documentation: $railwayUrl/api/docs" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ No custom domain configured. Use Railway dashboard to get the deployment URL." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not retrieve domain. Check Railway dashboard for deployment URL." -ForegroundColor Yellow
}

Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check the Railway dashboard for your deployment URL"
Write-Host "2. Test the health endpoint: Invoke-RestMethod <your-url>/api/health"
Write-Host "3. Configure custom domain if needed: railway domain add api.yourdomain.com"
Write-Host "4. Update CORS origins with your actual frontend URL"