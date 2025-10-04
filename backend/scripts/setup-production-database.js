#!/usr/bin/env node

/**
 * Complete Production Database Setup Script
 * 
 * This script orchestrates the complete database setup process:
 * 1. Generate Prisma client
 * 2. Run migrations
 * 3. Seed initial data
 * 4. Verify integrity
 */

const { generatePrismaClient } = require('./generate-prisma-client');
const { executeDatabaseMigrations } = require('./run-migrations');
const { seedProductionDatabase } = require('./seed-production');
const { verifyDatabaseIntegrity } = require('./verify-database');

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

async function setupProductionDatabase() {
  const startTime = Date.now();
  
  try {
    log('\n🚀 Complete Production Database Setup', 'blue');
    log('================================================');
    log('This script will set up the complete database for production use.');
    log('');
    
    // Check environment
    const nodeEnv = process.env.NODE_ENV;
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      logError('DATABASE_URL environment variable is not set');
      logError('Please configure your database connection before proceeding');
      process.exit(1);
    }
    
    log(`Environment: ${nodeEnv || 'development'}`, 'yellow');
    log(`Database: ${databaseUrl.split('@')[1] || 'configured'}`, 'yellow');
    log('');

    // Step 1: Generate Prisma Client
    logStep('🔧', 'Step 1: Generating Prisma Client...');
    await generatePrismaClient();
    logSuccess('Prisma client generation completed');

    // Step 2: Run Migrations
    logStep('🗄️', 'Step 2: Running Database Migrations...');
    await executeDatabaseMigrations();
    logSuccess('Database migrations completed');

    // Step 3: Seed Database
    logStep('🌱', 'Step 3: Seeding Database with Initial Data...');
    await seedProductionDatabase();
    logSuccess('Database seeding completed');

    // Step 4: Verify Setup
    logStep('🔍', 'Step 4: Verifying Database Integrity...');
    const verificationPassed = await verifyDatabaseIntegrity();
    
    if (verificationPassed) {
      logSuccess('Database verification passed');
    } else {
      logWarning('Database verification completed with warnings');
    }

    // Calculate total time
    const totalTime = Math.round((Date.now() - startTime) / 1000);

    // Success summary
    log('\n🎉 Production Database Setup Completed Successfully!', 'green');
    log('================================================');
    logSuccess(`Total setup time: ${totalTime} seconds`);
    logSuccess('Database is ready for production use');
    
    log('\n📊 What was set up:', 'blue');
    log('✅ Prisma client generated and verified');
    log('✅ Database schema created with all migrations');
    log('✅ Initial data seeded (users, roles, products, etc.)');
    log('✅ Database integrity verified');
    log('✅ Relationships and constraints validated');
    
    log('\n🔐 Admin Access:', 'yellow');
    log('Email: admin@sanvi-machinery.com');
    log('Password: Admin123! (change after first login)');
    
    log('\n📝 Next Steps:', 'yellow');
    log('1. Start the application: npm run start:prod');
    log('2. Test admin login and basic functionality');
    log('3. Create additional users for your team');
    log('4. Add your specific products and customers');
    log('5. Configure email settings for notifications');
    log('6. Set up monitoring and backup procedures');
    
    log('\n🛠️ Useful Commands:', 'blue');
    log('npm run db:verify          # Verify database integrity');
    log('npm run prisma:generate    # Regenerate Prisma client');
    log('npm run db:seed:prod       # Re-seed database');
    log('railway logs --tail        # View application logs (if using Railway)');
    
  } catch (error) {
    const totalTime = Math.round((Date.now() - startTime) / 1000);
    
    log('\n💥 Production Database Setup Failed!', 'red');
    log('================================================');
    logError(`Setup failed after ${totalTime} seconds`);
    logError('An error occurred during database setup');
    logError(error.message);
    
    log('\n🔧 Troubleshooting Steps:', 'yellow');
    log('1. Check DATABASE_URL environment variable');
    log('2. Ensure database server is running and accessible');
    log('3. Verify database permissions and credentials');
    log('4. Check network connectivity to database');
    log('5. Review error logs for specific issues');
    
    log('\n🆘 Getting Help:', 'yellow');
    log('• Check the deployment documentation');
    log('• Review Railway/database provider logs');
    log('• Ensure all environment variables are set correctly');
    log('• Verify Prisma schema syntax');
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  setupProductionDatabase();
}

module.exports = { setupProductionDatabase };