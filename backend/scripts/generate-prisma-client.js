#!/usr/bin/env node

/**
 * Prisma Client Generation Script for Production
 * 
 * This script generates the Prisma client for production environment
 * and verifies the database connection.
 */

const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');
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

async function generatePrismaClient() {
  try {
    log('\n🔧 Generating Prisma Client for Production', 'blue');
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

    // Step 2: Generate Prisma client
    logStep('2.', 'Generating Prisma client...');
    
    try {
      execSync('npx prisma generate', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      logSuccess('Prisma client generated successfully');
    } catch (error) {
      logError('Failed to generate Prisma client');
      throw error;
    }

    // Step 3: Verify Prisma client configuration
    logStep('3.', 'Verifying Prisma client configuration...');
    
    try {
      // Import the generated client
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      logSuccess('Prisma client imported successfully');
      
      // Check if client is properly configured
      if (prisma.$connect) {
        logSuccess('Prisma client methods are available');
      } else {
        logWarning('Prisma client may not be properly configured');
      }
      
      await prisma.$disconnect();
      
    } catch (error) {
      logError('Failed to verify Prisma client configuration');
      logError(error.message);
      throw error;
    }

    // Step 4: Test database connection
    logStep('4.', 'Testing database connection...');
    
    try {
      const prisma = new PrismaClient({
        log: ['error', 'warn'],
      });

      // Test connection
      await prisma.$connect();
      logSuccess('Database connection established');

      // Test a simple query
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      if (result && result.length > 0) {
        logSuccess('Database query test passed');
      }

      // Check database schema
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      
      if (tables && tables.length > 0) {
        logSuccess(`Found ${tables.length} tables in database schema`);
        log('Tables:', 'blue');
        tables.forEach(table => {
          log(`  - ${table.table_name}`);
        });
      } else {
        logWarning('No tables found in database schema');
        logWarning('You may need to run migrations first');
      }

      await prisma.$disconnect();
      
    } catch (error) {
      logError('Database connection test failed');
      logError(error.message);
      
      // Provide helpful error messages
      if (error.message.includes('ENOTFOUND')) {
        logError('Database host not found. Check your DATABASE_URL');
      } else if (error.message.includes('ECONNREFUSED')) {
        logError('Connection refused. Database may not be running');
      } else if (error.message.includes('authentication failed')) {
        logError('Authentication failed. Check database credentials');
      }
      
      throw error;
    }

    // Step 5: Verify Prisma schema
    logStep('5.', 'Verifying Prisma schema...');
    
    try {
      const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
      const fs = require('fs');
      
      if (fs.existsSync(schemaPath)) {
        logSuccess('Prisma schema file found');
        
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Check for essential models
        const essentialModels = ['User', 'Customer', 'Product', 'Quotation', 'Order'];
        const foundModels = [];
        
        essentialModels.forEach(model => {
          if (schemaContent.includes(`model ${model}`)) {
            foundModels.push(model);
          }
        });
        
        if (foundModels.length === essentialModels.length) {
          logSuccess('All essential models found in schema');
        } else {
          logWarning(`Found ${foundModels.length}/${essentialModels.length} essential models`);
          log(`Found: ${foundModels.join(', ')}`);
        }
        
      } else {
        logError('Prisma schema file not found');
        throw new Error('Schema file missing');
      }
      
    } catch (error) {
      logError('Schema verification failed');
      throw error;
    }

    // Success summary
    log('\n🎉 Prisma Client Generation Completed Successfully!', 'green');
    log('================================================');
    logSuccess('Prisma client generated and verified');
    logSuccess('Database connection tested');
    logSuccess('Schema validation passed');
    
    log('\n📝 Next Steps:', 'yellow');
    log('1. Run database migrations if needed: npx prisma migrate deploy');
    log('2. Seed the database: npm run db:seed');
    log('3. Start the application: npm run start:prod');
    
  } catch (error) {
    log('\n💥 Prisma Client Generation Failed!', 'red');
    log('================================================');
    logError('An error occurred during Prisma client generation');
    logError(error.message);
    
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Check DATABASE_URL environment variable');
    log('2. Ensure database is accessible');
    log('3. Verify Prisma schema syntax');
    log('4. Check network connectivity');
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generatePrismaClient();
}

module.exports = { generatePrismaClient };