# Railway Deployment Script (PowerShell)
# Deploys the IronGrid backend to Railway with comprehensive checks

param(
    [switch]$SkipTests = $false,
    [switch]$SeedDatabase = $false,
    [switch]$Force = $false
)

Write-Host "🚀 Deploying IronGrid Backend to Railway" -ForegroundColor Green
Write-Host "=".repeat(50)

# Function to run command with status check
function Invoke-WithCheck {
    param(
        [string]$Description,
        [scriptblock]$Command
    )
    
    Write-Host "$Description..." -ForegroundColor Blue
    try {
        & $Command
        Write-Host "✅ $Description completed" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ $Description failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Pre-deployment checks
Write-Host "`n🔍 Pre-deployment Checks" -ForegroundColor Yellow

# Check Railway CLI
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI is not installed" -ForegroundColor Red
    Write-Host "Please install: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# Check authentication
try {
    railway whoami | Out-Null
    Write-Host "✅ Authenticated with Railway" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with Railway" -ForegroundColor Red
    Write-Host "Please run: railway login" -ForegroundColor Yellow
    exit 1
}

# Check if in backend directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Not in backend directory" -ForegroundColor Red
    Write-Host "Please run this script from the backend directory" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ In correct directory" -ForegroundColor Green

# Check if project is linked
try {
    railway status | Out-Null
    Write-Host "✅ Linked to Railway project" -ForegroundColor Green
} catch {
    Write-Host "❌ Not linked to Railway project" -ForegroundColor Red
    Write-Host "Please run the setup script first" -ForegroundColor Yellow
    exit 1
}

# Validate environment variables
Write-Host "`n⚙️ Validating Environment Variables" -ForegroundColor Yellow
try {
    npm run validate:env
    Write-Host "✅ Environment validation passed" -ForegroundColor Green
} catch {
    Write-Host "❌ Environment validation failed" -ForegroundColor Red
    if (-not $Force) {
        Write-Host "Use -Force to skip validation" -ForegroundColor Yellow
        exit 1
    }
}

# Build and test
Write-Host "`n🔨 Building and Testing" -ForegroundColor Yellow

$buildSuccess = $true
$buildSuccess = $buildSuccess -and (Invoke-WithCheck "Installing dependencies" { npm ci })
$buildSuccess = $buildSuccess -and (Invoke-WithCheck "Type checking" { npm run type-check })
$buildSuccess = $buildSuccess -and (Invoke-WithCheck "Linting code" { npm run lint })
$buildSuccess = $buildSuccess -and (Invoke-WithCheck "Building application" { npm run build })

if (-not $SkipTests) {
    $buildSuccess = $buildSuccess -and (Invoke-WithCheck "Running tests" { npm run test:ci })
} else {
    Write-Host "⚠️ Skipping tests" -ForegroundColor Yellow
}

if (-not $buildSuccess -and -not $Force) {
    Write-Host "❌ Build/test failures detected. Use -Force to deploy anyway" -ForegroundColor Red
    exit 1
}# D
eploy to Railway
Write-Host "`n🚀 Deploying to Railway" -ForegroundColor Yellow

if (Invoke-WithCheck "Deploying application" { railway up --detach }) {
    Write-Host "✅ Deployment initiated" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Wait for deployment
Write-Host "⏳ Waiting for deployment to complete..." -ForegroundColor Blue
Start-Sleep -Seconds 30

# Check deployment status
Write-Host "`n📊 Checking Deployment Status" -ForegroundColor Yellow

try {
    $status = railway status
    Write-Host "Deployment Status: $status" -ForegroundColor Blue
} catch {
    Write-Host "⚠️ Could not get deployment status" -ForegroundColor Yellow
}

# Get deployment URL
$deploymentUrl = ""
try {
    $deploymentUrl = railway domain
    Write-Host "Deployment URL: $deploymentUrl" -ForegroundColor Blue
} catch {
    Write-Host "⚠️ No custom domain configured" -ForegroundColor Yellow
    Write-Host "Check Railway dashboard for deployment URL" -ForegroundColor Yellow
}

# Run database migrations
Write-Host "`n🗄️ Running Database Migrations" -ForegroundColor Yellow
if (Invoke-WithCheck "Running Prisma migrations" { railway run npx prisma migrate deploy }) {
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
} else {
    Write-Host "❌ Database migrations failed" -ForegroundColor Red
}

# Seed database if requested
if ($SeedDatabase) {
    Write-Host "`n🌱 Seeding Database" -ForegroundColor Yellow
    if (Invoke-WithCheck "Seeding database" { railway run npm run db:seed }) {
        Write-Host "✅ Database seeding completed" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Database seeding failed" -ForegroundColor Yellow
    }
}

# Health checks
Write-Host "`n🏥 Running Health Checks" -ForegroundColor Yellow

if ($deploymentUrl) {
    try {
        $healthResponse = Invoke-RestMethod "$deploymentUrl/api/health" -TimeoutSec 10
        Write-Host "✅ Health endpoint is responding" -ForegroundColor Green
        
        try {
            Invoke-RestMethod "$deploymentUrl/api/docs" -TimeoutSec 10 | Out-Null
            Write-Host "✅ API documentation is accessible" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ API documentation may not be accessible" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Health endpoint is not responding" -ForegroundColor Red
        Write-Host "The application may still be starting up" -ForegroundColor Yellow
    }
}

# Test database connectivity
Write-Host "`n🔗 Testing Database Connectivity" -ForegroundColor Yellow
if (Invoke-WithCheck "Testing database connection" { railway run npm run test:db }) {
    Write-Host "✅ Database connectivity verified" -ForegroundColor Green
} else {
    Write-Host "❌ Database connectivity issues detected" -ForegroundColor Red
}

# Display summary
Write-Host "`n🎉 Deployment Summary" -ForegroundColor Green
Write-Host "=".repeat(50)

if ($deploymentUrl) {
    Write-Host "✅ Application deployed successfully" -ForegroundColor Green
    Write-Host "🌐 Application URL: $deploymentUrl" -ForegroundColor Blue
    Write-Host "🏥 Health Check: $deploymentUrl/api/health" -ForegroundColor Blue
    Write-Host "📚 API Documentation: $deploymentUrl/api/docs" -ForegroundColor Blue
} else {
    Write-Host "⚠️ Deployment completed but URL not available" -ForegroundColor Yellow
    Write-Host "Check Railway dashboard for deployment details" -ForegroundColor Yellow
}

# Next steps
Write-Host "`n📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Check Railway dashboard for detailed deployment status"
Write-Host "2. Test all API endpoints using the Swagger documentation"
Write-Host "3. Configure custom domain: railway domain add api.yourdomain.com"
Write-Host "4. Update frontend CORS origins with actual deployment URL"
Write-Host "5. Set up monitoring and alerts for production"

Write-Host "`n🛠️ Useful Commands:" -ForegroundColor Yellow
Write-Host "railway logs --tail          # View live logs"
Write-Host "railway status              # Check deployment status"
Write-Host "railway restart             # Restart the service"
Write-Host "railway variables           # View environment variables"

Write-Host "`n✅ Deployment process completed!" -ForegroundColor Green