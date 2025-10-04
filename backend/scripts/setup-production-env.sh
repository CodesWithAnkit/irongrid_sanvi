#!/bin/bash

# Production Environment Variables Setup Script for Railway
# This script sets up all required environment variables for production deployment

set -e

echo "🔧 Setting up production environment variables for Railway..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to generate secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to set Railway variable with confirmation
set_railway_var() {
    local var_name=$1
    local var_value=$2
    local is_secret=${3:-false}
    
    if [ "$is_secret" = true ]; then
        echo -e "${BLUE}Setting ${var_name}${NC}: [HIDDEN]"
    else
        echo -e "${BLUE}Setting ${var_name}${NC}: ${var_value}"
    fi
    
    railway variables set "${var_name}=${var_value}"
}

# Check if Railway CLI is available and authenticated
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI is not installed. Please install it first.${NC}"
    exit 1
fi

if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with Railway. Please run 'railway login' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI is ready${NC}"

# Generate JWT secrets
echo -e "\n${YELLOW}🔑 Generating JWT secrets...${NC}"
JWT_ACCESS_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)

# Core application variables
echo -e "\n${YELLOW}⚙️ Setting core application variables...${NC}"
set_railway_var "NODE_ENV" "production"
set_railway_var "PORT" "3001"

# JWT secrets
echo -e "\n${YELLOW}🔐 Setting authentication secrets...${NC}"
set_railway_var "JWT_ACCESS_SECRET" "$JWT_ACCESS_SECRET" true
set_railway_var "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET" true

# CORS configuration
echo -e "\n${YELLOW}🌐 Setting CORS configuration...${NC}"
read -p "Enter your frontend domain (e.g., https://app.yourdomain.com): " FRONTEND_DOMAIN
if [ -z "$FRONTEND_DOMAIN" ]; then
    FRONTEND_DOMAIN="https://your-frontend.vercel.app"
    echo -e "${YELLOW}Using default: $FRONTEND_DOMAIN${NC}"
fi

set_railway_var "ALLOWED_ORIGINS" "$FRONTEND_DOMAIN"

# Cookie configuration
echo -e "\n${YELLOW}🍪 Setting cookie configuration...${NC}"
read -p "Enter your backend domain (e.g., api.yourdomain.com): " BACKEND_DOMAIN
if [ -z "$BACKEND_DOMAIN" ]; then
    BACKEND_DOMAIN="your-backend.railway.app"
    echo -e "${YELLOW}Using default: $BACKEND_DOMAIN${NC}"
fi

set_railway_var "COOKIE_DOMAIN" "$BACKEND_DOMAIN"
set_railway_var "COOKIE_SECURE" "true"
set_railway_var "SAME_SITE" "none"

# Rate limiting
echo -e "\n${YELLOW}🚦 Setting rate limiting configuration...${NC}"
set_railway_var "RATE_LIMIT_WINDOW_MS" "900000"  # 15 minutes
set_railway_var "RATE_LIMIT_MAX_REQUESTS" "100"

# Cache configuration
echo -e "\n${YELLOW}💾 Setting cache configuration...${NC}"
set_railway_var "CACHE_TTL_DEFAULT" "3600"       # 1 hour
set_railway_var "CACHE_TTL_SHORT" "300"          # 5 minutes
set_railway_var "CACHE_TTL_LONG" "7200"          # 2 hours
set_railway_var "ENABLE_CACHE_WARMING" "true"

# Performance monitoring
echo -e "\n${YELLOW}📊 Setting performance monitoring...${NC}"
set_railway_var "ENABLE_DB_METRICS" "true"
set_railway_var "LOG_SLOW_QUERIES" "true"
set_railway_var "SLOW_QUERY_THRESHOLD" "1000"   # 1 second

# Security configuration
echo -e "\n${YELLOW}🔒 Setting security configuration...${NC}"
set_railway_var "ENABLE_HELMET" "true"
set_railway_var "ENABLE_RATE_LIMITING" "true"

# Optional AWS S3 configuration
echo -e "\n${YELLOW}☁️ AWS S3 Configuration (Optional)${NC}"
read -p "Do you want to configure AWS S3 for file storage? (y/N): " configure_s3
if [[ $configure_s3 =~ ^[Yy]$ ]]; then
    read -p "Enter AWS Access Key ID: " AWS_ACCESS_KEY_ID
    read -s -p "Enter AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
    echo
    read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    read -p "Enter S3 Bucket Name: " AWS_S3_BUCKET
    
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ] && [ -n "$AWS_S3_BUCKET" ]; then
        set_railway_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" true
        set_railway_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" true
        set_railway_var "AWS_REGION" "$AWS_REGION"
        set_railway_var "AWS_S3_BUCKET" "$AWS_S3_BUCKET"
        echo -e "${GREEN}✅ AWS S3 configuration set${NC}"
    else
        echo -e "${YELLOW}⚠️ Skipping AWS S3 configuration - missing required values${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Skipping AWS S3 configuration${NC}"
fi

# Optional SendGrid configuration
echo -e "\n${YELLOW}📧 SendGrid Email Configuration (Optional)${NC}"
read -p "Do you want to configure SendGrid for email? (y/N): " configure_sendgrid
if [[ $configure_sendgrid =~ ^[Yy]$ ]]; then
    read -s -p "Enter SendGrid API Key: " SENDGRID_API_KEY
    echo
    read -p "Enter From Email Address: " FROM_EMAIL
    
    if [ -n "$SENDGRID_API_KEY" ] && [ -n "$FROM_EMAIL" ]; then
        set_railway_var "SENDGRID_API_KEY" "$SENDGRID_API_KEY" true
        set_railway_var "FROM_EMAIL" "$FROM_EMAIL"
        echo -e "${GREEN}✅ SendGrid configuration set${NC}"
    else
        echo -e "${YELLOW}⚠️ Skipping SendGrid configuration - missing required values${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Skipping SendGrid configuration${NC}"
fi

# Optional Sentry configuration
echo -e "\n${YELLOW}🐛 Sentry Error Tracking Configuration (Optional)${NC}"
read -p "Do you want to configure Sentry for error tracking? (y/N): " configure_sentry
if [[ $configure_sentry =~ ^[Yy]$ ]]; then
    read -p "Enter Sentry DSN: " SENTRY_DSN
    
    if [ -n "$SENTRY_DSN" ]; then
        set_railway_var "SENTRY_DSN" "$SENTRY_DSN"
        echo -e "${GREEN}✅ Sentry configuration set${NC}"
    else
        echo -e "${YELLOW}⚠️ Skipping Sentry configuration - missing DSN${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Skipping Sentry configuration${NC}"
fi

# Display summary
echo -e "\n${GREEN}✅ Environment variables setup completed!${NC}"
echo -e "\n${BLUE}📋 Summary of configured variables:${NC}"

# List all variables (without showing secret values)
echo -e "${BLUE}Core Application:${NC}"
echo "  - NODE_ENV: production"
echo "  - PORT: 3001"
echo "  - JWT_ACCESS_SECRET: [CONFIGURED]"
echo "  - JWT_REFRESH_SECRET: [CONFIGURED]"

echo -e "${BLUE}Network & Security:${NC}"
echo "  - ALLOWED_ORIGINS: $FRONTEND_DOMAIN"
echo "  - COOKIE_DOMAIN: $BACKEND_DOMAIN"
echo "  - COOKIE_SECURE: true"
echo "  - SAME_SITE: none"

echo -e "${BLUE}Performance & Monitoring:${NC}"
echo "  - RATE_LIMIT_WINDOW_MS: 900000"
echo "  - RATE_LIMIT_MAX_REQUESTS: 100"
echo "  - CACHE_TTL_DEFAULT: 3600"
echo "  - ENABLE_DB_METRICS: true"

# Show next steps
echo -e "\n${YELLOW}📝 Next Steps:${NC}"
echo "1. Verify all variables are set: railway variables"
echo "2. Deploy your application: railway up"
echo "3. Check deployment status: railway status"
echo "4. Test the health endpoint: curl <your-url>/api/health"
echo "5. Update CORS origins with your actual domain after deployment"

echo -e "\n${GREEN}🎉 Production environment is ready for deployment!${NC}"