# Production Database Setup Guide

This guide covers the complete database setup process for the IronGrid B2B Quotation & CRM Platform in production environments.

## Overview

The database setup process consists of four main steps:
1. **Generate Prisma Client** - Create the database client for production
2. **Run Migrations** - Apply database schema changes
3. **Seed Initial Data** - Populate with essential data
4. **Verify Integrity** - Ensure everything is working correctly

## Quick Setup

For a complete automated setup, run:

```bash
npm run db:setup:prod
```

This command will execute all four steps automatically and provide a comprehensive report.

## Individual Commands

### 1. Generate Prisma Client

```bash
npm run prisma:generate:prod
```

**What it does:**
- Generates the Prisma client for production environment
- Verifies client configuration
- Tests database connection
- Validates schema structure

**Requirements:**
- `DATABASE_URL` environment variable must be set
- Database must be accessible

### 2. Run Database Migrations

```bash
npm run prisma:migrate:prod
```

**What it does:**
- Creates database backup (JSON format)
- Runs all pending Prisma migrations
- Verifies schema creation and relationships
- Tests database operations

**Features:**
- Automatic backup creation before migrations
- Comprehensive error handling
- Migration status tracking
- Relationship verification

### 3. Seed Production Database

```bash
npm run db:seed:prod
```

**What it does:**
- Creates permissions and roles system
- Sets up default admin user
- Adds product categories for Sanvi Machinery
- Creates sample industrial products
- Configures email templates
- Sets up customer segments

**Default Data Created:**
- **Roles:** admin, manager, sales, viewer
- **Permissions:** 28 different permissions for system resources
- **Admin User:** admin@sanvi-machinery.com (password: Admin123!)
- **Categories:** 8 industrial equipment categories
- **Products:** 9 sample products with specifications
- **Email Templates:** 4 professional email templates
- **Customer Segments:** 3 business segments

### 4. Verify Database Integrity

```bash
npm run db:verify
```

**What it does:**
- Checks all expected tables exist
- Verifies data integrity and relationships
- Tests database operations
- Validates constraints and indexes
- Runs performance checks

## Environment Variables

Ensure these environment variables are set:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:port/database

# Optional (for admin user)
ADMIN_PASSWORD=YourSecurePassword123!

# Production settings
NODE_ENV=production
```

## Database Schema

The production database includes these main entities:

### Core Business Entities
- **Users** - System users with role-based access
- **Customers** - B2B customers and companies
- **Products** - Industrial equipment catalog
- **Categories** - Product categorization
- **Quotations** - Price quotations with line items
- **Orders** - Confirmed orders from quotations

### Advanced Features
- **Customer Interactions** - CRM interaction tracking
- **Email Templates** - Automated email communications
- **Audit Logs** - System activity tracking
- **File Management** - Document and image storage
- **Approval Workflows** - Multi-level quotation approvals
- **Customer Segmentation** - Advanced customer grouping

### Security & Access Control
- **Roles** - User role definitions
- **Permissions** - Granular permission system
- **User Roles** - Role assignments to users
- **Role Permissions** - Permission assignments to roles

## Sample Data

### Product Categories
1. Heavy Machinery
2. Construction Equipment
3. Manufacturing Tools
4. Agricultural Machinery
5. Mining Equipment
6. Material Handling
7. Power Generation
8. Processing Equipment

### Sample Products
- Industrial Hydraulic Press 500T (₹25,00,000)
- CNC Machining Center VMC-850 (₹35,00,000)
- Mobile Concrete Mixer 1000L (₹8,50,000)
- Tower Crane QTZ-80 (₹42,00,000)
- Industrial Lathe Machine 6ft (₹4,50,000)
- Surface Grinding Machine (₹6,50,000)
- Multi-Crop Thresher (₹3,20,000)
- Electric Forklift 3T (₹7,50,000)
- Diesel Generator 100 KVA (₹5,80,000)

### Email Templates
- **Quotation Sent** - Professional quotation delivery
- **Quotation Reminder** - Expiry reminders
- **Order Confirmation** - Order acknowledgment
- **Password Reset** - Account security

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
❌ DATABASE_URL environment variable is not set
```
**Solution:** Set the DATABASE_URL environment variable with your database connection string.

#### 2. Migration Conflicts
```bash
❌ Migration execution failed
```
**Solutions:**
- Check if tables already exist
- Verify database permissions
- Review migration logs for specific errors
- Consider resetting database if safe: `npx prisma migrate reset`

#### 3. Seeding Errors
```bash
❌ Unique constraint violation
```
**Solution:** This is normal if running seed multiple times. The script uses upsert operations to handle existing data.

#### 4. Permission Denied
```bash
❌ Database operation test failed
```
**Solutions:**
- Verify database user has necessary permissions
- Check if database allows CREATE, INSERT, UPDATE operations
- Ensure connection string includes correct credentials

### Verification Failures

If verification fails, check:
1. All migrations completed successfully
2. Seeding process finished without errors
3. Database user has read permissions
4. Network connectivity is stable

## Production Considerations

### Security
- Change default admin password immediately after setup
- Use strong, unique passwords for all accounts
- Enable SSL/TLS for database connections
- Regularly update and patch database software

### Performance
- Monitor query performance and optimize as needed
- Set up proper database indexes
- Configure connection pooling
- Implement caching strategies

### Backup & Recovery
- Set up automated database backups
- Test backup restoration procedures
- Document recovery processes
- Monitor backup success/failure

### Monitoring
- Set up database performance monitoring
- Configure alerts for critical issues
- Monitor disk space and resource usage
- Track slow queries and optimize them

## Railway-Specific Setup

When deploying to Railway:

1. **Create Services:**
   ```bash
   railway add postgresql
   railway add redis
   ```

2. **Set Environment Variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set ADMIN_PASSWORD=YourSecurePassword
   ```

3. **Run Setup:**
   ```bash
   railway run npm run db:setup:prod
   ```

4. **Verify Deployment:**
   ```bash
   railway run npm run db:verify
   ```

## Support

For additional help:
- Check Railway dashboard for database logs
- Review Prisma documentation for schema issues
- Verify environment variable configuration
- Test database connectivity independently

## Next Steps

After successful database setup:
1. Start the application and test login
2. Create additional users for your team
3. Add your specific products and inventory
4. Configure email service settings
5. Set up monitoring and alerting
6. Begin customer data entry and operations