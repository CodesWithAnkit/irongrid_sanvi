# IronGrid Production Deployment Guide

## 🚨 Critical Issue: GitHub Pages Cannot Host Your Application

**GitHub Pages only supports static websites**. Your application requires:
- NestJS backend server
- PostgreSQL database
- Redis cache
- File upload capabilities

## ✅ Recommended Production Architecture

### Option 1: Vercel + Railway (Best for MVP - $25-40/month)
- **Frontend**: Vercel (excellent Next.js support, global CDN)
- **Backend**: Railway (easy NestJS deployment, managed databases)
- **Database**: Railway PostgreSQL
- **Redis**: Railway Redis
- **File Storage**: AWS S3 or Cloudinary

### Option 2: AWS Full Stack ($35-50/month)
- **Frontend**: AWS Amplify
- **Backend**: AWS ECS or Elastic Beanstalk
- **Database**: AWS RDS PostgreSQL
- **Redis**: AWS ElastiCache
- **File Storage**: AWS S3

### Option 3: DigitalOcean ($42/month)
- **Full Stack**: DigitalOcean App Platform
- **Database**: DigitalOcean Managed PostgreSQL
- **Redis**: DigitalOcean Managed Redis

## 🎯 Recommended: Option 1 (Vercel + Railway)

### Why This Architecture?
1. **Cost-effective**: Perfect for MVP and small-medium scale
2. **Easy deployment**: Minimal configuration required
3. **Scalable**: Can handle significant traffic
4. **Developer-friendly**: Great DX with automatic deployments
5. **Reliable**: Both platforms have excellent uptime

## 📋 Step-by-Step Implementation Plan

### Phase 1: Backend Deployment (Railway)

#### 1.1 Create Railway Account & Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new irongrid-backend
cd backend
railway link
```

#### 1.2 Add Database Services
```bash
# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis
```

#### 1.3 Configure Environment Variables
Railway will auto-generate database URLs. Add these variables in Railway dashboard:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_ACCESS_SECRET=your-super-secure-access-secret-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-here
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
COOKIE_DOMAIN=your-backend-domain.railway.app
COOKIE_SECURE=true
SAME_SITE=none
```

#### 1.4 Deploy Backend
```bash
# Deploy to Railway
railway up
```

### Phase 2: Frontend Deployment (Vercel)

#### 2.1 Create Vercel Account & Project
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy from frontend directory
cd frontend
vercel
```

#### 2.2 Configure Environment Variables
In Vercel dashboard, add:
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.railway.app/api
```

### Phase 3: File Storage Setup (AWS S3)

#### 3.1 Create S3 Bucket
1. Create AWS account
2. Create S3 bucket with public read access
3. Create IAM user with S3 permissions
4. Get Access Key and Secret Key

#### 3.2 Update Backend Configuration
Add to Railway environment variables:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

### Phase 4: CI/CD Pipeline

#### 4.1 GitHub Actions for Backend
Create `.github/workflows/backend-deploy.yml`:

```yaml
name: Deploy Backend to Railway

on:
  push:
    branches: [main]
    paths: ['backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run tests
        run: |
          cd backend
          npm run test:ci
          
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
        with:
          api-token: ${{ secrets.RAILWAY_TOKEN }}
          project-id: ${{ secrets.RAILWAY_PROJECT_ID }}
```

#### 4.2 GitHub Actions for Frontend
Vercel automatically deploys on push to main branch.

## 🔧 Required Code Changes

### 1. Backend Production Configuration

#### Update `backend/src/config/database.config.ts`:
```typescript
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService) => ({
  url: configService.get('DATABASE_URL'),
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
```

#### Update `backend/src/main.ts` CORS configuration:
```typescript
const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.enableCors({ 
  origin: origins, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 2. Frontend Production Configuration

#### Update `frontend/lib/api/client.ts`:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
});
```

### 3. File Upload Configuration

#### Update backend file upload service:
```typescript
// backend/src/files/files.service.ts
import { S3 } from 'aws-sdk';

@Injectable()
export class FilesService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const key = `uploads/${Date.now()}-${file.originalname}`;
    
    await this.s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }).promise();

    return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${key}`;
  }
}
```

## 🔒 Security Checklist

- [ ] Strong JWT secrets (use password generator)
- [ ] HTTPS only in production
- [ ] Secure cookie settings
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (Prisma handles this)
- [ ] File upload restrictions
- [ ] Environment variables secured

## 📊 Monitoring Setup

### 1. Error Tracking (Sentry)
```bash
npm install @sentry/node @sentry/nextjs
```

### 2. Performance Monitoring
- Railway provides built-in metrics
- Vercel provides analytics
- Consider adding custom metrics

## 💰 Cost Breakdown (Monthly)

### Vercel + Railway Option:
- Vercel Pro: $20/month
- Railway: $5-20/month (usage-based)
- AWS S3: $1-5/month
- **Total: $26-45/month**

### Scaling Considerations:
- Railway auto-scales based on usage
- Vercel handles global CDN automatically
- Database can be upgraded as needed

## 🚀 Go-Live Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Database migrations completed
- [ ] File uploads working
- [ ] Authentication flow tested
- [ ] All API endpoints tested
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Monitoring and alerts set up
- [ ] Backup strategy implemented

## 📞 Next Steps

1. **Choose your deployment option** (I recommend Vercel + Railway)
2. **Set up accounts** on chosen platforms
3. **Follow the step-by-step guide** above
4. **Test thoroughly** before going live
5. **Set up monitoring** and alerts

Would you like me to create the specific configuration files and help you implement any of these steps?