# Environment Management

This directory contains configuration templates for different environments in the Sanvi Machinery application.

## Environment Structure

The project uses the following environments:

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

## Secret Management

Secrets are managed through GitHub Secrets and are never committed to version control. The CI/CD pipeline injects these secrets during deployment.

### Setting up Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following repository secrets:

**Required Secrets:**
- `DATABASE_URL`: Connection string for your PostgreSQL database
- `JWT_SECRET`: Secret key for JWT token signing
- `ENCRYPTION_KEY`: 32-character key for data encryption
- `CSRF_SECRET`: Secret key for CSRF token generation
- `NEXT_PUBLIC_API_URL`: URL for the API (environment-specific)
- `SONAR_TOKEN`: Token for SonarCloud analysis

**Environment-Specific Secrets:**

For each environment (staging, production), create environment-specific secrets with the following format:
- `STAGING_DATABASE_URL`
- `PRODUCTION_DATABASE_URL`

## Environment Files

The repository includes an `env.example` template file. For local development:

1. Copy `env.example` to `.env` in both backend and frontend directories
2. Fill in the required values

## Environment Switching

The CI/CD pipeline automatically selects the appropriate environment configuration based on the deployment target. This is controlled by:

1. The branch (develop -> staging, main -> production)
2. Manual workflow dispatch with environment selection

## Security Considerations

- All secrets are managed through GitHub Secrets or environment variables
- No credentials are ever committed to the repository
- Production credentials have higher security requirements
- Secrets rotation is performed quarterly
- Access to production secrets is restricted to DevOps team
