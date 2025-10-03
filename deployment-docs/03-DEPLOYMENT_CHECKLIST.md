# 🚀 IronGrid Production Deployment Checklist

## Pre-Deployment Setup

### 1. Account Creation
- [x] Create Railway account at [railway.app](https://railway.app)
- [x] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Create AWS account for S3 storage (optional but recommended)
- [ ] Upgrade to Vercel Pro plan ($20/month) for better performance

### 2. Domain Setup (Using Existing GoDaddy DNS)
- [x] Domain available with GoDaddy DNS (ns41.domaincontrol.com, ns42.domaincontrol.com)
- [ ] Set up subdomains in GoDaddy:
  - `app.yourdomain.com` → Frontend (Vercel)
  - `api.yourdomain.com` → Backend (Railway)

## Backend Deployment (Railway)

### 3. Railway Project Setup
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway new irongrid-backend
cd backend
railway link
```

### 4. Add Database Services
```bash
# Add PostgreSQL database
railway add postgresql

# Add Redis cache
railway add redis
```

### 5. Environment Variables Configuration
In Railway dashboard, add these environment variables:

**Required Variables:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- [ ] `REDIS_URL=${{Redis.REDIS_URL}}`
- [ ] `JWT_ACCESS_SECRET=` (generate 32+ character secret)
- [ ] `JWT_REFRESH_SECRET=` (generate 32+ character secret)
- [ ] `ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app`
- [ ] `COOKIE_DOMAIN=your-backend-domain.railway.app`
- [ ] `COOKIE_SECURE=true`
- [ ] `SAME_SITE=none`

**Optional Variables:**
- [ ] `AWS_ACCESS_KEY_ID=` (for file uploads)
- [ ] `AWS_SECRET_ACCESS_KEY=`
- [ ] `AWS_REGION=us-east-1`
- [ ] `AWS_S3_BUCKET=your-bucket-name`
- [ ] `SENDGRID_API_KEY=` (for emails)

### 6. Deploy Backend
```bash
# Deploy to Railway
railway up
```

### 7. Database Setup
```bash
# Generate Prisma client
railway run npm run prisma:generate

# Run migrations
railway run npm run prisma:migrate

# Seed database (optional)
railway run npm run db:seed
```

### 8. Test Backend
- [ ] Visit your Railway backend URL
- [ ] Check `/api/health` endpoint
- [ ] Verify Swagger docs at `/api/docs`
- [ ] Test authentication endpoints

## Frontend Deployment (Vercel)

### 9. Vercel Project Setup
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from frontend directory
cd frontend
vercel
```

### 10. Environment Variables Configuration
In Vercel dashboard, add:
- [ ] `NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.railway.app/api`

### 11. Deploy Frontend
```bash
# Deploy to production
vercel --prod
```

### 12. Test Frontend
- [ ] Visit your Vercel frontend URL
- [ ] Test login functionality
- [ ] Verify API integration
- [ ] Check all major features

## File Storage Setup (AWS S3)

### 13. S3 Bucket Creation
- [ ] Create S3 bucket with unique name
- [ ] Configure bucket for public read access
- [ ] Set up CORS policy for your domains
- [ ] Create IAM user with S3 permissions
- [ ] Generate access keys

### 14. Update Backend File Service
- [ ] Update file upload service to use S3
- [ ] Test file upload functionality
- [ ] Verify files are accessible via S3 URLs

## CI/CD Pipeline Setup

### 15. GitHub Secrets Configuration
Add these secrets to your GitHub repository:

**Railway Secrets:**
- [ ] `RAILWAY_TOKEN` (from Railway dashboard)
- [ ] `RAILWAY_PROJECT_ID` (from Railway project settings)

**Vercel Secrets:**
- [ ] `VERCEL_TOKEN` (from Vercel dashboard)
- [ ] `VERCEL_ORG_ID` (from Vercel settings)
- [ ] `VERCEL_PROJECT_ID` (from Vercel project settings)

### 16. Test CI/CD Pipeline
- [ ] Push changes to main branch
- [ ] Verify backend deployment via GitHub Actions
- [ ] Verify frontend deployment via Vercel
- [ ] Check deployment logs for errors

## Security & Performance

### 17. Security Configuration
- [ ] Verify HTTPS is enabled on both domains
- [ ] Test CORS configuration
- [ ] Verify JWT tokens are working
- [ ] Check rate limiting is active
- [ ] Test file upload restrictions

### 18. Performance Testing
- [ ] Test API response times (<200ms target)
- [ ] Verify database queries are optimized
- [ ] Check Redis caching is working
- [ ] Test with multiple concurrent users

## Monitoring & Logging

### 19. Error Tracking Setup (Optional)
```bash
# Install Sentry
npm install @sentry/node @sentry/nextjs
```
- [ ] Configure Sentry for backend
- [ ] Configure Sentry for frontend
- [ ] Test error reporting

### 20. Monitoring Dashboard
- [ ] Set up Railway monitoring alerts
- [ ] Configure Vercel analytics
- [ ] Monitor database performance
- [ ] Set up uptime monitoring

## Final Testing

### 21. End-to-End Testing
- [ ] User registration and login
- [ ] Customer creation and management
- [ ] Product catalog functionality
- [ ] Quotation creation and PDF generation
- [ ] Email notifications
- [ ] File uploads and downloads
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### 22. Performance Benchmarks
- [ ] Page load times <3 seconds
- [ ] API response times <200ms
- [ ] Database queries optimized
- [ ] Images and assets optimized

## Go-Live Preparation

### 23. Documentation Updates
- [ ] Update README with production URLs
- [ ] Document deployment process
- [ ] Create user guides
- [ ] Update API documentation

### 24. Team Access
- [ ] Add team members to Railway project
- [ ] Add team members to Vercel project
- [ ] Share production credentials securely
- [ ] Set up monitoring alerts for team

### 25. Backup Strategy
- [ ] Configure automated database backups
- [ ] Test backup restoration process
- [ ] Document recovery procedures
- [ ] Set up monitoring for backup failures

## Post-Deployment

### 26. Launch Activities
- [ ] Announce to stakeholders
- [ ] Monitor for issues in first 24 hours
- [ ] Collect user feedback
- [ ] Plan for scaling if needed

### 27. Ongoing Maintenance
- [ ] Schedule regular security updates
- [ ] Monitor performance metrics
- [ ] Plan for feature updates
- [ ] Review and optimize costs

## Cost Monitoring

### Expected Monthly Costs:
- **Vercel Pro**: $20/month
- **Railway**: $5-20/month (usage-based)
- **AWS S3**: $1-5/month
- **Domain**: Already owned (GoDaddy)
- **Total**: ~$26-45/month

## Emergency Contacts & Resources

### Support Channels:
- Railway Support: [railway.app/help](https://railway.app/help)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- AWS Support: [aws.amazon.com/support](https://aws.amazon.com/support)

### Rollback Plan:
1. Revert to previous Railway deployment
2. Revert to previous Vercel deployment
3. Restore database from backup if needed
4. Update DNS if domain issues occur

---

## 🎉 Congratulations!

Once all items are checked, your IronGrid application will be live in production!

**Production URLs:**
- Frontend: `https://your-project.vercel.app` or `https://app.yourdomain.com`
- Backend API: `https://your-project.railway.app/api` or `https://api.yourdomain.com/api`
- API Docs: `https://your-project.railway.app/api/docs`