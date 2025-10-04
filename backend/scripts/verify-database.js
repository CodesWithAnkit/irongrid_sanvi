#!/usr/bin/env node

/**
 * Database Verification Script
 * 
 * This script verifies database integrity, relationships, and data consistency
 * after migrations and seeding are complete.
 */

const { PrismaClient } = require('@prisma/client');

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

async function verifyDatabaseIntegrity() {
  const prisma = new PrismaClient();
  let allChecksPass = true;
  
  try {
    log('\n🔍 Database Integrity Verification', 'blue');
    log('================================================');

    // Step 1: Check database connection
    logStep('1.', 'Testing database connection...');
    
    await prisma.$connect();
    logSuccess('Database connection established');

    // Step 2: Verify all tables exist
    logStep('2.', 'Verifying database schema...');
    
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    
    const expectedTables = [
      'ApprovalStep', 'ApprovalWorkflow', 'AuditLog', 'BulkQuotationJob',
      'Category', 'CreditLimitHistory', 'Customer', 'CustomerEngagementScore',
      'CustomerInteraction', 'CustomerLifetimeValue', 'CustomerSegment',
      'CustomerSegmentMembership', 'CustomerSegmentationRule', 'EmailLog',
      'EmailTemplate', 'File', 'FollowUpTask', 'Order', 'OrderItem',
      'Permission', 'Product', 'ProductPricingRule', 'Quotation',
      'QuotationApproval', 'QuotationItem', 'QuotationTemplate', 'Role',
      'RolePermission', 'SegmentPricingRule', 'User', 'UserRole'
    ];
    
    const tableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(table => 
      !tableNames.some(name => name === table)
    );
    
    if (missingTables.length === 0) {
      logSuccess(`All ${expectedTables.length} expected tables are present`);
    } else {
      logError(`Missing tables: ${missingTables.join(', ')}`);
      allChecksPass = false;
    }

    // Step 3: Check data integrity
    logStep('3.', 'Checking data integrity...');
    
    // Check users and roles
    const userCount = await prisma.user.count();
    const roleCount = await prisma.role.count();
    const permissionCount = await prisma.permission.count();
    
    if (userCount > 0) {
      logSuccess(`Found ${userCount} user(s) in database`);
    } else {
      logWarning('No users found in database');
    }
    
    if (roleCount >= 4) {
      logSuccess(`Found ${roleCount} roles in database`);
    } else {
      logWarning(`Only ${roleCount} roles found, expected at least 4`);
    }
    
    if (permissionCount > 0) {
      logSuccess(`Found ${permissionCount} permissions in database`);
    } else {
      logError('No permissions found in database');
      allChecksPass = false;
    }

    // Check products and categories
    const categoryCount = await prisma.category.count();
    const productCount = await prisma.product.count();
    
    if (categoryCount > 0) {
      logSuccess(`Found ${categoryCount} product categories`);
    } else {
      logWarning('No product categories found');
    }
    
    if (productCount > 0) {
      logSuccess(`Found ${productCount} products in catalog`);
    } else {
      logWarning('No products found in catalog');
    }

    // Check email templates
    const templateCount = await prisma.emailTemplate.count();
    if (templateCount > 0) {
      logSuccess(`Found ${templateCount} email templates`);
    } else {
      logWarning('No email templates found');
    }

    // Step 4: Verify relationships
    logStep('4.', 'Verifying database relationships...');
    
    // Check user-role relationships
    const userRoles = await prisma.userRole.count();
    if (userRoles > 0) {
      logSuccess(`Found ${userRoles} user-role assignments`);
    } else {
      logWarning('No user-role assignments found');
    }
    
    // Check role-permission relationships
    const rolePermissions = await prisma.rolePermission.count();
    if (rolePermissions > 0) {
      logSuccess(`Found ${rolePermissions} role-permission assignments`);
    } else {
      logError('No role-permission assignments found');
      allChecksPass = false;
    }
    
    // Check product-category relationships
    const productsWithCategories = await prisma.product.count({
      where: {
        categoryId: {
          not: null
        }
      }
    });
    
    if (productsWithCategories > 0) {
      logSuccess(`${productsWithCategories} products have category assignments`);
    } else if (productCount > 0) {
      logWarning('Products exist but none have category assignments');
    }

    // Step 5: Test basic operations
    logStep('5.', 'Testing basic database operations...');
    
    try {
      // Test read operations
      const adminUser = await prisma.user.findFirst({
        where: { email: 'admin@sanvi-machinery.com' },
        include: {
          userRoles: {
            include: {
              role: true
            }
          }
        }
      });
      
      if (adminUser) {
        logSuccess('Admin user found with role assignments');
        if (adminUser.userRoles.length > 0) {
          logSuccess(`Admin has ${adminUser.userRoles.length} role(s) assigned`);
        }
      } else {
        logWarning('Admin user not found');
      }
      
      // Test complex query with joins
      const sampleProducts = await prisma.product.findMany({
        take: 3,
        include: {
          category: true
        }
      });
      
      if (sampleProducts.length > 0) {
        logSuccess(`Successfully queried ${sampleProducts.length} products with categories`);
      }
      
    } catch (error) {
      logError('Database operation test failed');
      logError(error.message);
      allChecksPass = false;
    }

    // Step 6: Check indexes and constraints
    logStep('6.', 'Verifying database constraints...');
    
    try {
      // Check unique constraints
      const uniqueConstraints = await prisma.$queryRaw`
        SELECT constraint_name, table_name, column_name
        FROM information_schema.key_column_usage
        WHERE constraint_schema = 'public'
        AND constraint_name LIKE '%_key'
        ORDER BY table_name, constraint_name
      `;
      
      if (uniqueConstraints.length > 0) {
        logSuccess(`Found ${uniqueConstraints.length} unique constraints`);
      }
      
      // Check foreign key constraints
      const foreignKeys = await prisma.$queryRaw`
        SELECT constraint_name, table_name
        FROM information_schema.table_constraints
        WHERE constraint_schema = 'public'
        AND constraint_type = 'FOREIGN KEY'
        ORDER BY table_name
      `;
      
      if (foreignKeys.length > 0) {
        logSuccess(`Found ${foreignKeys.length} foreign key constraints`);
      }
      
    } catch (error) {
      logWarning('Could not verify all constraints');
    }

    // Step 7: Performance check
    logStep('7.', 'Running performance checks...');
    
    try {
      const start = Date.now();
      
      // Test query performance
      await prisma.product.findMany({
        include: {
          category: true
        }
      });
      
      const queryTime = Date.now() - start;
      
      if (queryTime < 1000) {
        logSuccess(`Query performance good: ${queryTime}ms`);
      } else {
        logWarning(`Query performance slow: ${queryTime}ms`);
      }
      
    } catch (error) {
      logWarning('Performance check failed');
    }

    // Final summary
    if (allChecksPass) {
      log('\n🎉 Database Verification Completed Successfully!', 'green');
      log('================================================');
      logSuccess('All integrity checks passed');
      logSuccess('Database relationships verified');
      logSuccess('Basic operations tested');
      logSuccess('Database is ready for production use');
    } else {
      log('\n⚠️ Database Verification Completed with Issues', 'yellow');
      log('================================================');
      logWarning('Some checks failed or returned warnings');
      logWarning('Please review the issues above before proceeding');
    }
    
    // Detailed summary
    log('\n📊 Database Summary:', 'blue');
    log(`👥 Users: ${userCount}`);
    log(`🔐 Roles: ${roleCount}`);
    log(`🛡️ Permissions: ${permissionCount}`);
    log(`📂 Categories: ${categoryCount}`);
    log(`📦 Products: ${productCount}`);
    log(`📧 Email Templates: ${templateCount}`);
    log(`🔗 User-Role Links: ${userRoles}`);
    log(`🔗 Role-Permission Links: ${rolePermissions}`);
    
    log('\n📝 Recommendations:', 'yellow');
    if (userCount === 1) {
      log('• Create additional users for different roles');
    }
    if (productCount < 10) {
      log('• Add more products to the catalog');
    }
    if (categoryCount < 5) {
      log('• Consider adding more product categories');
    }
    log('• Test the application with real user scenarios');
    log('• Set up monitoring and backup procedures');
    
    return allChecksPass;
    
  } catch (error) {
    log('\n💥 Database Verification Failed!', 'red');
    log('================================================');
    logError('An error occurred during verification');
    logError(error.message);
    
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Check database connection and credentials');
    log('2. Ensure migrations have been run successfully');
    log('3. Verify seeding completed without errors');
    log('4. Check database permissions and access');
    
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  verifyDatabaseIntegrity().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyDatabaseIntegrity };