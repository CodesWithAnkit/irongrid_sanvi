# Production Environment Variables Setup Script for Railway (PowerShell)
# This script sets up all required environment variables for production deployment

param(
    [string]$FrontendDomain = "",
    [string]$BackendDomain = "",
    [switch]$ConfigureS3 = $false,
    [switch]$ConfigureSendGrid = $false,
    [switch]$ConfigureSentry = $false
)

Write-Host "🔧 Setting up production environment variables for Railway..." -ForegroundColor Green

# Function to generate secure random string
function Generate-Secret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes).Replace("=", "").Replace("+", "").Replace("/", "").Substring(0, 32)
}

# Function to set Railway variable with confirmation
function Set-RailwayVar {
    param(
        [string]$VarName,
        [string]$VarValue,
        [bool]$IsSecret = $false
    )
    
    if ($IsSecret) {
        Write-Host "Setting $VarName" -ForegroundColor Blue -NoNewline
        Write-Host ": [HIDDEN]" -ForegroundColor Gray
    } else {
        Write-Host "Setting $VarName" -ForegroundColor Blue -NoNewline
        Write-Host ": $VarValue" -ForegroundColor White
    }
    
    railway variables set "$VarName=$VarValue"
}

# Check Railway CLI and authentication
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI is not installed. Please install it first." -ForegroundColor Red
    exit 1
}

try {
    railway whoami | Out-Null
    Write-Host "✅ Authenticated with Railway" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Railway. Please run 'railway login' first." -ForegroundColor Red
    exit 1
}# 
Generate JWT secrets
Write-Host "`n🔑 Generating JWT secrets..." -ForegroundColor Yellow
$JwtAccessSecret = Generate-Secret
$JwtRefreshSecret = Generate-Secret

# Core application variables
Write-Host "`n⚙️ Setting core application variables..." -ForegroundColor Yellow
Set-RailwayVar "NODE_ENV" "production"
Set-RailwayVar "PORT" "3001"

# JWT secrets
Write-Host "`n🔐 Setting authentication secrets..." -ForegroundColor Yellow
Set-RailwayVar "JWT_ACCESS_SECRET" $JwtAccessSecret $true
Set-RailwayVar "JWT_REFRESH_SECRET" $JwtRefreshSecret $true

# CORS configuration
Write-Host "`n🌐 Setting CORS configuration..." -ForegroundColor Yellow
if ([string]::IsNullOrEmpty($FrontendDomain)) {
    $FrontendDomain = Read-Host "Enter your frontend domain (e.g., https://app.yourdomain.com)"
    if ([string]::IsNullOrEmpty($FrontendDomain)) {
        $FrontendDomain = "https://your-frontend.vercel.app"
        Write-Host "Using default: $FrontendDomain" -ForegroundColor Yellow
    }
}

Set-RailwayVar "ALLOWED_ORIGINS" $FrontendDomain

# Cookie configuration
Write-Host "`n🍪 Setting cookie configuration..." -ForegroundColor Yellow
if ([string]::IsNullOrEmpty($BackendDomain)) {
    $BackendDomain = Read-Host "Enter your backend domain (e.g., api.yourdomain.com)"
    if ([string]::IsNullOrEmpty($BackendDomain)) {
        $BackendDomain = "your-backend.railway.app"
        Write-Host "Using default: $BackendDomain" -ForegroundColor Yellow
    }
}

Set-RailwayVar "COOKIE_DOMAIN" $BackendDomain
Set-RailwayVar "COOKIE_SECURE" "true"
Set-RailwayVar "SAME_SITE" "none"

# Rate limiting and performance
Write-Host "`n🚦 Setting rate limiting and performance..." -ForegroundColor Yellow
Set-RailwayVar "RATE_LIMIT_WINDOW_MS" "900000"
Set-RailwayVar "RATE_LIMIT_MAX_REQUESTS" "100"
Set-RailwayVar "CACHE_TTL_DEFAULT" "3600"
Set-RailwayVar "CACHE_TTL_SHORT" "300"
Set-RailwayVar "CACHE_TTL_LONG" "7200"
Set-RailwayVar "ENABLE_CACHE_WARMING" "true"
Set-RailwayVar "ENABLE_DB_METRICS" "true"
Set-RailwayVar "LOG_SLOW_QUERIES" "true"
Set-RailwayVar "SLOW_QUERY_THRESHOLD" "1000"
Set-RailwayVar "ENABLE_HELMET" "true"
Set-RailwayVar "ENABLE_RATE_LIMITING" "true"# Opti
onal configurations
if ($ConfigureS3) {
    Write-Host "`n☁️ AWS S3 Configuration..." -ForegroundColor Yellow
    $AwsAccessKeyId = Read-Host "Enter AWS Access Key ID"
    $AwsSecretAccessKey = Read-Host "Enter AWS Secret Access Key" -AsSecureString
    $AwsSecretAccessKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($AwsSecretAccessKey))
    $AwsRegion = Read-Host "Enter AWS Region (default: us-east-1)"
    if ([string]::IsNullOrEmpty($AwsRegion)) { $AwsRegion = "us-east-1" }
    $AwsS3Bucket = Read-Host "Enter S3 Bucket Name"
    
    if ($AwsAccessKeyId -and $AwsSecretAccessKeyPlain -and $AwsS3Bucket) {
        Set-RailwayVar "AWS_ACCESS_KEY_ID" $AwsAccessKeyId $true
        Set-RailwayVar "AWS_SECRET_ACCESS_KEY" $AwsSecretAccessKeyPlain $true
        Set-RailwayVar "AWS_REGION" $AwsRegion
        Set-RailwayVar "AWS_S3_BUCKET" $AwsS3Bucket
        Write-Host "✅ AWS S3 configuration set" -ForegroundColor Green
    }
}

if ($ConfigureSendGrid) {
    Write-Host "`n📧 SendGrid Email Configuration..." -ForegroundColor Yellow
    $SendGridApiKey = Read-Host "Enter SendGrid API Key" -AsSecureString
    $SendGridApiKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($SendGridApiKey))
    $FromEmail = Read-Host "Enter From Email Address"
    
    if ($SendGridApiKeyPlain -and $FromEmail) {
        Set-RailwayVar "SENDGRID_API_KEY" $SendGridApiKeyPlain $true
        Set-RailwayVar "FROM_EMAIL" $FromEmail
        Write-Host "✅ SendGrid configuration set" -ForegroundColor Green
    }
}

if ($ConfigureSentry) {
    Write-Host "`n🐛 Sentry Error Tracking Configuration..." -ForegroundColor Yellow
    $SentryDsn = Read-Host "Enter Sentry DSN"
    
    if ($SentryDsn) {
        Set-RailwayVar "SENTRY_DSN" $SentryDsn
        Write-Host "✅ Sentry configuration set" -ForegroundColor Green
    }
}

# Display summary
Write-Host "`n✅ Environment variables setup completed!" -ForegroundColor Green
Write-Host "`n📋 Summary of configured variables:" -ForegroundColor Blue
Write-Host "Core Application: NODE_ENV, PORT, JWT secrets" -ForegroundColor White
Write-Host "Network & Security: CORS, cookies, rate limiting" -ForegroundColor White
Write-Host "Performance: Caching, monitoring, security headers" -ForegroundColor White

Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Verify variables: railway variables"
Write-Host "2. Deploy application: railway up"
Write-Host "3. Check status: railway status"
Write-Host "4. Test health: Invoke-RestMethod <your-url>/api/health"

Write-Host "`n🎉 Production environment is ready!" -ForegroundColor Green