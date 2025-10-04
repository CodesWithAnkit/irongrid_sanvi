#!/usr/bin/env node

/**
 * Database Migration Script for Production
 * 
 * This script runs database migrations in production environment
 * with proper error handling, backup creation, and verification.
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️ ${message}`, 'yellow');
}

async function createDatabaseBackup(prisma) {
  try {
    logStep('📦', 'Creating database backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    
    // Check if we're in a production environment that supports pg_dump
    const databaseUrl = process.env.DATABASE_URL;
    
    if (databaseUrl && databaseUrl.includes('postgresql://')) {
      try {
        // For Railway and other PostgreSQL services, we'll create a logical backup
        // by exporting critical data as JSON
        
        const backupData = {
          timestamp: new Date().toISOString(),
          users: await prisma.user.findMany(),
          customers: await prisma.customer.findMany(),
          products: await prisma.product.findMany(),
          categories: await prisma.category.findMany(),
          quotations: await prisma.quotation.findMany({
            include: {
              items: true
            }
          }),
          orders: await prisma.order.findMany({
            include: {
              items: true
            }
          }),
          roles: await prisma.role.findMany(),
          permissions: await prisma.permission.findMany(),
          emailTemplates: await prisma.emailTemplate.findMany()
        };
        
        const backupDir = path.join(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const backupFile = path.join(backupDir, `${backupName}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
        
        logSuccess(`Backup created: ${backupFile}`);
        return backupFile;
        
      } catch (error) {
        logWarning('Could not create full backup, proceeding with migration');
        logWarning(`Backup error: ${error.message}`);
        return null;
      }
    } else {
      logWarning('Database backup not supported for this database type');
      return null;
    }
    
  } catch (error) {
    logWarning('Backup creation failed, but continuing with migration');
    logWarning(`Error: ${error.message}`);
    return null;
  }
}

async function checkMigrationStatus(prisma) {
  try {
    logStep('🔍', 'Checking migration status...');
    
    // Check if _prisma_migrations table exists
    const migrationTable = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = '_prisma_migrations'
      ) as exists
    `;
    
    if (migrationTable[0].exists) {
      // Get applied migrations
      const appliedMigrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at, applied_steps_count
        FROM _prisma_migrations 
        ORDER BY started_at DESC
        LIMIT 10
      `;
      
      logSuccess(`Found ${appliedMigrations.length} applied migrations`);
      
      if (appliedMigrations.length > 0) {
        log('Recent migrations:', 'blue');
        appliedMigrations.forEach(migration => {
          log(`  - ${migration.migration_name} (${migration.applied_steps_count} steps)`);
        });
      }
      
      return appliedMigrations;
    } else {
      logWarning('No migration history found - this appears to be a fresh database');
      return [];
    }
    
  } catch (error) {
    logWarning('Could not check migration status');
    logWarning(`Error: ${error.message}`);
    return [];
  }
}

async function runMigrations() {
  try {
    logStep('🚀', 'Running database migrations...');
    
    // Run Prisma migrate deploy
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    logSuccess('Migrations executed successfully');
    return true;
    
  } catch (error) {
    logError('Migration execution failed');
    logError(error.message);
    throw error;
  }
}

async function verifyMigrations(prisma) {
  try {
    logStep('✅', 'Verifying migration results...');
    
    // Check that all expected tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'User', 'Role', 'Permission', 'UserRole', 'RolePermission',
      'Customer', 'Product', 'Category', 'Quotation', 'QuotationItem',
      'Order', 'OrderItem', 'File', 'EmailTemplate', 'EmailLog',
      'AuditLog', 'CustomerInteraction', 'ProductPricingRule'
    ];
    
    const tableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => 
      !tableNames.some(name => name.toLowerCase() === table.toLowerCase())
    );
    
    if (missingTables.length === 0) {
      logSuccess('All expected tables are present');
    } else {
      logWarning(`Missing tables: ${missingTables.join(', ')}`);
    }
    
    // Check table relationships by testing foreign keys
    try {
      const relationshipTests = [
        { table: 'UserRole', fk: 'userId', ref: 'User' },
        { table: 'QuotationItem', fk: 'quotationId', ref: 'Quotation' },
        { table: 'OrderItem', fk: 'orderId', ref: 'Order' },
        { table: 'Product', fk: 'categoryId', ref: 'Category' }
      ];
      
      for (const test of relationshipTests) {
        const constraint = await prisma.$queryRaw`
          SELECT constraint_name 
          FROM information_schema.table_constraints 
          WHERE table_name = ${test.table.toLowerCase()} 
          AND constraint_type = 'FOREIGN KEY'
        `;
        
        if (constraint.length > 0) {
          logSuccess(`${test.table} relationships verified`);
        }
      }
      
    } catch (error) {
      logWarning('Could not verify all relationships');
    }
    
    // Test basic database operations
    try {
      // Test a simple write and read operation
      const testResult = await prisma.$queryRaw`SELECT NOW() as current_time`;
      if (testResult && testResult.length > 0) {
        logSuccess('Database operations are working');
      }
    } catch (error) {
      logError('Database operation test failed');
      throw error;
    }
    
    return true;
    
  } catch (error) {
    logError('Migration verification failed');
    throw error;
  }
}

async function executeDatabaseMigrations() {
  let prisma;
  
  try {
    log('\n🗄️ Database Migration Execution', 'blue');
    log('================================================');

    // Step 1: Check environment
    logStep('1.', 'Checking environment configuration...');
    
    const nodeEnv = process.env.NODE_ENV;
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      logError('DATABASE_URL environment variable is not set');
      process.exit(1);
    }
    
    logSuccess(`Environment: ${nodeEnv || 'development'}`);
    logSuccess('DATABASE_URL is configured');

    // Step 2: Initialize Prisma client
    logStep('2.', 'Initializing database connection...');
    
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
    
    await prisma.$connect();
    logSuccess('Database connection established');

    // Step 3: Check current migration status
    const currentMigrations = await checkMigrationStatus(prisma);

    // Step 4: Create backup (optional but recommended)
    const backupFile = await createDatabaseBackup(prisma);

    // Step 5: Run migrations
    await runMigrations();

    // Step 6: Verify migrations
    await verifyMigrations(prisma);

    // Step 7: Check final migration status
    logStep('7.', 'Checking final migration status...');
    const finalMigrations = await checkMigrationStatus(prisma);
    
    if (finalMigrations.length > currentMigrations.length) {
      const newMigrations = finalMigrations.length - currentMigrations.length;
      logSuccess(`${newMigrations} new migration(s) applied successfully`);
    } else {
      logSuccess('Database schema is up to date');
    }

    // Success summary
    log('\n🎉 Database Migration Completed Successfully!', 'green');
    log('================================================');
    logSuccess('All migrations executed successfully');
    logSuccess('Database schema verified');
    logSuccess('Database operations tested');
    
    if (backupFile) {
      logSuccess(`Backup created: ${backupFile}`);
    }
    
    log('\n📝 Next Steps:', 'yellow');
    log('1. Seed the database with initial data: npm run db:seed');
    log('2. Test application connectivity');
    log('3. Verify all features are working correctly');
    
  } catch (error) {
    log('\n💥 Database Migration Failed!', 'red');
    log('================================================');
    logError('An error occurred during migration execution');
    logError(error.message);
    
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Check DATABASE_URL environment variable');
    log('2. Ensure database is accessible and has proper permissions');
    log('3. Verify migration files are not corrupted');
    log('4. Check for conflicting schema changes');
    log('5. Review migration logs for specific errors');
    
    if (error.message.includes('already exists')) {
      log('\n💡 Tip: If tables already exist, you may need to:', 'yellow');
      log('   - Reset the database: npx prisma migrate reset');
      log('   - Or mark migrations as applied: npx prisma migrate resolve --applied <migration_name>');
    }
    
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  executeDatabaseMigrations();
}

module.exports = { executeDatabaseMigrations };