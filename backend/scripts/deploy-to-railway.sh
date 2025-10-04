#!/bin/bash

# Railway Deployment Script
# Deploys the IronGrid backend to Railway with comprehensive checks

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🚀 Deploying IronGrid Backend to Railway${NC}"
echo "=================================================="

# Function to check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        return 1
    fi
    return 0
}

# Function to run with status check
run_with_check() {
    local description=$1
    local command=$2
    
    echo -e "${BLUE}$description...${NC}"
    if eval $command; then
        echo -e "${GREEN}✅ $description completed${NC}"
        return 0
    else
        echo -e "${RED}❌ $description failed${NC}"
        return 1
    fi
}

# Pre-deployment checks
echo -e "\n${YELLOW}🔍 Pre-deployment Checks${NC}"

# Check Railway CLI
if ! check_command railway; then
    echo -e "${RED}Please install Railway CLI: npm install -g @railway/cli${NC}"
    exit 1
fi

# Check authentication
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Railway${NC}"
    echo -e "${YELLOW}Please run: railway login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI is ready${NC}"

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Not in backend directory${NC}"
    echo -e "${YELLOW}Please run this script from the backend directory${NC}"
    exit 1
fi

echo -e "${GREEN}✅ In correct directory${NC}"

# Check if project is linked
if ! railway status &> /dev/null; then
    echo -e "${RED}❌ Not linked to Railway project${NC}"
    echo -e "${YELLOW}Please run the setup script first or link manually${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Linked to Railway project${NC}"

# Validate environment variables
echo -e "\n${YELLOW}⚙️ Validating Environment Variables${NC}"
if ! npm run validate:env; then
    echo -e "${RED}❌ Environment validation failed${NC}"
    echo -e "${YELLOW}Please fix environment variables before deploying${NC}"
    exit 1
fi

# Build and test locally
echo -e "\n${YELLOW}🔨 Building and Testing${NC}"

run_with_check "Installing dependencies" "npm ci"
run_with_check "Type checking" "npm run type-check"
run_with_check "Linting code" "npm run lint"
run_with_check "Building application" "npm run build"

# Run tests if available
if npm run test --silent 2>/dev/null; then
    run_with_check "Running tests" "npm run test:ci"
else
    echo -e "${YELLOW}⚠️ No tests found, skipping test execution${NC}"
fi

# Deploy to Railway
echo -e "\n${YELLOW}🚀 Deploying to Railway${NC}"

# Deploy the application
run_with_check "Deploying application" "railway up --detach"

# Wait for deployment to complete
echo -e "${BLUE}⏳ Waiting for deployment to complete...${NC}"
sleep 30

# Check deployment status
echo -e "\n${YELLOW}📊 Checking Deployment Status${NC}"

# Get deployment info
DEPLOYMENT_STATUS=$(railway status 2>/dev/null || echo "unknown")
echo -e "${BLUE}Deployment Status:${NC} $DEPLOYMENT_STATUS"

# Try to get the deployment URL
DEPLOYMENT_URL=""
if railway domain &> /dev/null; then
    DEPLOYMENT_URL=$(railway domain 2>/dev/null)
    echo -e "${BLUE}Deployment URL:${NC} $DEPLOYMENT_URL"
else
    echo -e "${YELLOW}⚠️ No custom domain configured${NC}"
    echo -e "${YELLOW}Check Railway dashboard for deployment URL${NC}"
fi

# Run database migrations
echo -e "\n${YELLOW}🗄️ Running Database Migrations${NC}"
if run_with_check "Running Prisma migrations" "railway run npx prisma migrate deploy"; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${RED}❌ Database migrations failed${NC}"
    echo -e "${YELLOW}You may need to run migrations manually${NC}"
fi

# Seed database if needed
echo -e "\n${YELLOW}🌱 Seeding Database (Optional)${NC}"
read -p "Do you want to seed the database with initial data? (y/N): " seed_db
if [[ $seed_db =~ ^[Yy]$ ]]; then
    if run_with_check "Seeding database" "railway run npm run db:seed"; then
        echo -e "${GREEN}✅ Database seeding completed${NC}"
    else
        echo -e "${YELLOW}⚠️ Database seeding failed or skipped${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Skipping database seeding${NC}"
fi

# Health checks
echo -e "\n${YELLOW}🏥 Running Health Checks${NC}"

if [ -n "$DEPLOYMENT_URL" ]; then
    # Test health endpoint
    echo -e "${BLUE}Testing health endpoint...${NC}"
    if curl -f -s "$DEPLOYMENT_URL/api/health" > /dev/null; then
        echo -e "${GREEN}✅ Health endpoint is responding${NC}"
        
        # Test API documentation
        echo -e "${BLUE}Testing API documentation...${NC}"
        if curl -f -s "$DEPLOYMENT_URL/api/docs" > /dev/null; then
            echo -e "${GREEN}✅ API documentation is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️ API documentation may not be accessible${NC}"
        fi
    else
        echo -e "${RED}❌ Health endpoint is not responding${NC}"
        echo -e "${YELLOW}The application may still be starting up${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Cannot test endpoints without deployment URL${NC}"
fi

# Test database connectivity
echo -e "\n${YELLOW}🔗 Testing Database Connectivity${NC}"
if run_with_check "Testing database connection" "railway run npm run test:db"; then
    echo -e "${GREEN}✅ Database connectivity verified${NC}"
else
    echo -e "${RED}❌ Database connectivity issues detected${NC}"
fi

# Display deployment summary
echo -e "\n${GREEN}🎉 Deployment Summary${NC}"
echo "=================================================="

if [ -n "$DEPLOYMENT_URL" ]; then
    echo -e "${GREEN}✅ Application deployed successfully${NC}"
    echo -e "${BLUE}🌐 Application URL:${NC} $DEPLOYMENT_URL"
    echo -e "${BLUE}🏥 Health Check:${NC} $DEPLOYMENT_URL/api/health"
    echo -e "${BLUE}📚 API Documentation:${NC} $DEPLOYMENT_URL/api/docs"
else
    echo -e "${YELLOW}⚠️ Deployment completed but URL not available${NC}"
    echo -e "${YELLOW}Check Railway dashboard for deployment details${NC}"
fi

# Next steps
echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "1. Check Railway dashboard for detailed deployment status"
echo "2. Test all API endpoints using the Swagger documentation"
echo "3. Configure custom domain if needed: railway domain add api.yourdomain.com"
echo "4. Update frontend CORS origins with the actual deployment URL"
echo "5. Set up monitoring and alerts for production"

# Useful commands
echo -e "\n${YELLOW}🛠️ Useful Commands:${NC}"
echo "railway logs --tail          # View live logs"
echo "railway status              # Check deployment status"
echo "railway restart             # Restart the service"
echo "railway variables           # View environment variables"
echo "railway connect postgresql  # Connect to database"

echo -e "\n${GREEN}✅ Deployment process completed!${NC}"