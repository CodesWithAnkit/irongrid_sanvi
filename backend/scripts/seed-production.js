#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * 
 * This script seeds the production database with initial data including:
 * - Default admin user and roles
 * - Sample products and categories for Sanvi Machinery
 * - Email templates
 * - Basic configurations
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

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

async function seedProductionDatabase() {
  const prisma = new PrismaClient();
  
  try {
    log('\n🌱 Seeding Production Database for Sanvi Machinery', 'blue');
    log('================================================');

    // Step 1: Create permissions
    logStep('1.', 'Creating permissions...');
    
    const permissions = [
      // User management
      { resource: 'users', action: 'create', description: 'Create new users' },
      { resource: 'users', action: 'read', description: 'View users' },
      { resource: 'users', action: 'update', description: 'Update user information' },
      { resource: 'users', action: 'delete', description: 'Delete users' },
      
      // Customer management
      { resource: 'customers', action: 'create', description: 'Create new customers' },
      { resource: 'customers', action: 'read', description: 'View customers' },
      { resource: 'customers', action: 'update', description: 'Update customer information' },
      { resource: 'customers', action: 'delete', description: 'Delete customers' },
      
      // Product management
      { resource: 'products', action: 'create', description: 'Create new products' },
      { resource: 'products', action: 'read', description: 'View products' },
      { resource: 'products', action: 'update', description: 'Update product information' },
      { resource: 'products', action: 'delete', description: 'Delete products' },
      
      // Quotation management
      { resource: 'quotations', action: 'create', description: 'Create new quotations' },
      { resource: 'quotations', action: 'read', description: 'View quotations' },
      { resource: 'quotations', action: 'update', description: 'Update quotations' },
      { resource: 'quotations', action: 'delete', description: 'Delete quotations' },
      { resource: 'quotations', action: 'send', description: 'Send quotations to customers' },
      { resource: 'quotations', action: 'approve', description: 'Approve quotations' },
      
      // Order management
      { resource: 'orders', action: 'create', description: 'Create new orders' },
      { resource: 'orders', action: 'read', description: 'View orders' },
      { resource: 'orders', action: 'update', description: 'Update orders' },
      { resource: 'orders', action: 'delete', description: 'Delete orders' },
      { resource: 'orders', action: 'process', description: 'Process orders' },
      
      // Analytics and reporting
      { resource: 'analytics', action: 'read', description: 'View analytics and reports' },
      { resource: 'reports', action: 'create', description: 'Generate reports' },
      { resource: 'reports', action: 'export', description: 'Export reports' },
      
      // System administration
      { resource: 'system', action: 'configure', description: 'Configure system settings' },
      { resource: 'audit', action: 'read', description: 'View audit logs' },
    ];

    let permissionCount = 0;
    for (const permission of permissions) {
      await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: permission.resource,
            action: permission.action,
          },
        },
        update: {},
        create: permission,
      });
      permissionCount++;
    }
    
    logSuccess(`Created ${permissionCount} permissions`);

    // Step 2: Create roles
    logStep('2.', 'Creating roles...');
    
    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'System administrator with full access',
      },
    });

    const managerRole = await prisma.role.upsert({
      where: { name: 'manager' },
      update: {},
      create: {
        name: 'manager',
        description: 'Manager with access to business operations',
      },
    });

    const salesRole = await prisma.role.upsert({
      where: { name: 'sales' },
      update: {},
      create: {
        name: 'sales',
        description: 'Sales representative with quotation and customer access',
      },
    });

    const viewerRole = await prisma.role.upsert({
      where: { name: 'viewer' },
      update: {},
      create: {
        name: 'viewer',
        description: 'Read-only access to system data',
      },
    });

    logSuccess('Created 4 roles: admin, manager, sales, viewer');

    // Step 3: Assign permissions to roles
    logStep('3.', 'Assigning permissions to roles...');
    
    // Admin gets all permissions
    const allPermissions = await prisma.permission.findMany();
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Manager permissions (business operations)
    const managerPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: 'customers' },
          { resource: 'products' },
          { resource: 'quotations' },
          { resource: 'orders' },
          { resource: 'analytics' },
          { resource: 'reports' },
        ],
      },
    });

    for (const permission of managerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: managerRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Sales permissions (quotations and customers)
    const salesPermissions = await prisma.permission.findMany({
      where: {
        OR: [
          { resource: 'customers' },
          { resource: 'products', action: 'read' },
          { resource: 'quotations' },
          { resource: 'orders', action: { in: ['create', 'read', 'update'] } },
        ],
      },
    });

    for (const permission of salesPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: salesRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: salesRole.id,
          permissionId: permission.id,
        },
      });
    }

    // Viewer permissions (read-only)
    const viewerPermissions = await prisma.permission.findMany({
      where: {
        action: 'read',
      },
    });

    for (const permission of viewerPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: viewerRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: viewerRole.id,
          permissionId: permission.id,
        },
      });
    }

    logSuccess('Assigned permissions to all roles');

    // Step 4: Create default admin user
    logStep('4.', 'Creating default admin user...');
    
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@sanvi-machinery.com' },
      update: {},
      create: {
        email: 'admin@sanvi-machinery.com',
        passwordHash: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        isActive: true,
        emailVerified: true,
      },
    });

    // Assign admin role to admin user
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    logSuccess('Created default admin user: admin@sanvi-machinery.com');

    // Step 5: Create categories for Sanvi Machinery
    logStep('5.', 'Creating product categories...');
    
    const categories = [
      { 
        name: 'Heavy Machinery', 
        description: 'Large industrial machinery and equipment for heavy-duty operations' 
      },
      { 
        name: 'Construction Equipment', 
        description: 'Equipment for construction, building, and infrastructure projects' 
      },
      { 
        name: 'Manufacturing Tools', 
        description: 'Tools and equipment for manufacturing and production processes' 
      },
      { 
        name: 'Agricultural Machinery', 
        description: 'Machinery for agricultural operations and farming' 
      },
      { 
        name: 'Mining Equipment', 
        description: 'Equipment for mining, extraction, and mineral processing operations' 
      },
      { 
        name: 'Material Handling', 
        description: 'Equipment for material handling, lifting, and transportation' 
      },
      { 
        name: 'Power Generation', 
        description: 'Equipment for power generation and electrical systems' 
      },
      { 
        name: 'Processing Equipment', 
        description: 'Equipment for industrial processing and manufacturing' 
      }
    ];

    const createdCategories = {};
    for (const category of categories) {
      const created = await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
      createdCategories[category.name] = created;
    }

    logSuccess(`Created ${categories.length} product categories`);

    // Step 6: Create sample products for Sanvi Machinery
    logStep('6.', 'Creating sample products...');
    
    const products = [
      // Heavy Machinery
      {
        sku: 'HM-001',
        name: 'Industrial Hydraulic Press 500T',
        description: 'Heavy-duty hydraulic press with 500-ton capacity for industrial applications',
        categoryId: createdCategories['Heavy Machinery'].id,
        basePrice: 2500000.00, // ₹25,00,000
        specifications: {
          capacity: '500 tons',
          power: '75 kW',
          dimensions: '4000x2000x3000 mm',
          weight: '15000 kg',
          features: ['Automatic operation', 'Safety systems', 'Digital controls']
        },
        minOrderQty: 1,
      },
      {
        sku: 'HM-002',
        name: 'CNC Machining Center VMC-850',
        description: 'Vertical machining center with advanced CNC controls for precision manufacturing',
        categoryId: createdCategories['Heavy Machinery'].id,
        basePrice: 3500000.00, // ₹35,00,000
        specifications: {
          workTable: '850x450 mm',
          spindle: '12000 RPM',
          toolChanger: '24 tools',
          accuracy: '±0.005 mm',
          features: ['High-speed machining', 'Automatic tool changer', 'Coolant system']
        },
        minOrderQty: 1,
      },
      
      // Construction Equipment
      {
        sku: 'CE-001',
        name: 'Mobile Concrete Mixer 1000L',
        description: 'Self-loading mobile concrete mixer with 1000-liter capacity',
        categoryId: createdCategories['Construction Equipment'].id,
        basePrice: 850000.00, // ₹8,50,000
        specifications: {
          capacity: '1000 liters',
          engine: '75 HP diesel',
          mobility: 'Self-propelled',
          features: ['Self-loading', 'Hydraulic discharge', 'All-terrain capability']
        },
        minOrderQty: 1,
      },
      {
        sku: 'CE-002',
        name: 'Tower Crane QTZ-80',
        description: 'Tower crane with 8-ton lifting capacity for construction projects',
        categoryId: createdCategories['Construction Equipment'].id,
        basePrice: 4200000.00, // ₹42,00,000
        specifications: {
          maxLoad: '8 tons',
          jibLength: '60 meters',
          height: '150 meters',
          features: ['Remote control', 'Safety systems', 'Weather protection']
        },
        minOrderQty: 1,
      },
      
      // Manufacturing Tools
      {
        sku: 'MT-001',
        name: 'Industrial Lathe Machine 6ft',
        description: 'Heavy-duty lathe machine for precision turning operations',
        categoryId: createdCategories['Manufacturing Tools'].id,
        basePrice: 450000.00, // ₹4,50,000
        specifications: {
          swingDiameter: '400 mm',
          centerDistance: '1800 mm',
          spindleSpeed: '2000 RPM',
          features: ['Digital readout', 'Variable speed', 'Precision chuck']
        },
        minOrderQty: 1,
      },
      {
        sku: 'MT-002',
        name: 'Surface Grinding Machine',
        description: 'Precision surface grinding machine for finishing operations',
        categoryId: createdCategories['Manufacturing Tools'].id,
        basePrice: 650000.00, // ₹6,50,000
        specifications: {
          tableSize: '600x300 mm',
          wheelSize: '350 mm',
          accuracy: '±0.002 mm',
          features: ['Automatic feed', 'Coolant system', 'Digital controls']
        },
        minOrderQty: 1,
      },
      
      // Agricultural Machinery
      {
        sku: 'AM-001',
        name: 'Multi-Crop Thresher',
        description: 'Versatile threshing machine for multiple crop types',
        categoryId: createdCategories['Agricultural Machinery'].id,
        basePrice: 320000.00, // ₹3,20,000
        specifications: {
          capacity: '1000 kg/hour',
          power: '25 HP',
          crops: 'Wheat, Rice, Barley, Maize',
          features: ['Multi-crop capability', 'Easy cleaning', 'Portable design']
        },
        minOrderQty: 1,
      },
      
      // Material Handling
      {
        sku: 'MH-001',
        name: 'Electric Forklift 3T',
        description: 'Electric forklift with 3-ton lifting capacity for warehouse operations',
        categoryId: createdCategories['Material Handling'].id,
        basePrice: 750000.00, // ₹7,50,000
        specifications: {
          capacity: '3000 kg',
          liftHeight: '4500 mm',
          battery: '48V lithium-ion',
          features: ['Zero emissions', 'Low noise', 'Fast charging']
        },
        minOrderQty: 1,
      },
      
      // Power Generation
      {
        sku: 'PG-001',
        name: 'Diesel Generator 100 KVA',
        description: 'Industrial diesel generator with 100 KVA power output',
        categoryId: createdCategories['Power Generation'].id,
        basePrice: 580000.00, // ₹5,80,000
        specifications: {
          power: '100 KVA / 80 KW',
          fuel: 'Diesel',
          fuelTank: '200 liters',
          features: ['Auto start', 'Digital control panel', 'Weather protection']
        },
        minOrderQty: 1,
      }
    ];

    let productCount = 0;
    for (const product of products) {
      await prisma.product.upsert({
        where: { sku: product.sku },
        update: {},
        create: {
          ...product,
          specifications: JSON.stringify(product.specifications),
        },
      });
      productCount++;
    }

    logSuccess(`Created ${productCount} sample products`);

    // Step 7: Create email templates
    logStep('7.', 'Creating email templates...');
    
    const emailTemplates = [
      {
        name: 'quotation_sent',
        subject: 'Your Quotation from Sanvi Machinery - {{quotationNumber}}',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
              <h1>Sanvi Machinery</h1>
              <p>Industrial Equipment Solutions</p>
            </div>
            <div style="padding: 20px;">
              <h2>Dear {{customerName}},</h2>
              <p>Thank you for your interest in our industrial equipment. Please find attached your quotation <strong>{{quotationNumber}}</strong>.</p>
              
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Quotation Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Quotation Number:</strong> {{quotationNumber}}</li>
                  <li><strong>Total Amount:</strong> ₹{{totalAmount}}</li>
                  <li><strong>Valid Until:</strong> {{validUntil}}</li>
                </ul>
              </div>
              
              <p>Our quotation includes:</p>
              <ul>
                <li>Competitive pricing for industrial equipment</li>
                <li>Comprehensive warranty coverage</li>
                <li>Installation and commissioning support</li>
                <li>After-sales service and maintenance</li>
              </ul>
              
              <p>If you have any questions or need clarification on any aspect of the quotation, please don't hesitate to contact us.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p>Best regards,<br>
                <strong>Sanvi Machinery Team</strong><br>
                Email: info@sanvi-machinery.com<br>
                Phone: +91-XXXXXXXXXX</p>
              </div>
            </div>
          </div>
        `,
        textContent: `Dear {{customerName}}, Thank you for your interest in our industrial equipment. Please find attached your quotation {{quotationNumber}}. Total Amount: ₹{{totalAmount}}, Valid Until: {{validUntil}}. Best regards, Sanvi Machinery Team`,
        variables: ['customerName', 'quotationNumber', 'totalAmount', 'validUntil'],
        category: 'QUOTATION',
      },
      {
        name: 'quotation_reminder',
        subject: 'Reminder: Your Quotation {{quotationNumber}} Expires Soon',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
              <h1>Quotation Expiry Reminder</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Dear {{customerName}},</h2>
              <p>This is a friendly reminder that your quotation <strong>{{quotationNumber}}</strong> will expire on <strong>{{validUntil}}</strong>.</p>
              
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>Don't miss out!</strong> To secure the current pricing and proceed with your order, please contact us as soon as possible.</p>
              </div>
              
              <p>We're here to help you with any questions and make the ordering process as smooth as possible.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p>Best regards,<br>
                <strong>Sanvi Machinery Team</strong><br>
                Email: info@sanvi-machinery.com<br>
                Phone: +91-XXXXXXXXXX</p>
              </div>
            </div>
          </div>
        `,
        textContent: `Dear {{customerName}}, This is a reminder that your quotation {{quotationNumber}} expires on {{validUntil}}. Please contact us to proceed. Best regards, Sanvi Machinery Team`,
        variables: ['customerName', 'quotationNumber', 'validUntil'],
        category: 'REMINDER',
      },
      {
        name: 'order_confirmation',
        subject: 'Order Confirmation - {{orderNumber}} from Sanvi Machinery',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; color: white; padding: 20px; text-align: center;">
              <h1>Order Confirmed!</h1>
            </div>
            <div style="padding: 20px;">
              <h2>Dear {{customerName}},</h2>
              <p>Thank you for your order! We're pleased to confirm that we have received your order <strong>{{orderNumber}}</strong>.</p>
              
              <div style="background-color: #ecfdf5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>Order Details:</h3>
                <ul style="list-style: none; padding: 0;">
                  <li><strong>Order Number:</strong> {{orderNumber}}</li>
                  <li><strong>Order Amount:</strong> ₹{{totalAmount}}</li>
                  <li><strong>Expected Delivery:</strong> {{expectedDelivery}}</li>
                </ul>
              </div>
              
              <p>What happens next:</p>
              <ol>
                <li>Our team will begin processing your order</li>
                <li>We'll keep you updated on the manufacturing progress</li>
                <li>Installation and commissioning will be scheduled</li>
                <li>Our service team will provide ongoing support</li>
              </ol>
              
              <p>We appreciate your business and look forward to serving you!</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p>Best regards,<br>
                <strong>Sanvi Machinery Team</strong><br>
                Email: info@sanvi-machinery.com<br>
                Phone: +91-XXXXXXXXXX</p>
              </div>
            </div>
          </div>
        `,
        textContent: `Dear {{customerName}}, Thank you for your order {{orderNumber}}! Order Amount: ₹{{totalAmount}}, Expected Delivery: {{expectedDelivery}}. Best regards, Sanvi Machinery Team`,
        variables: ['customerName', 'orderNumber', 'totalAmount', 'expectedDelivery'],
        category: 'ORDER',
      },
      {
        name: 'password_reset',
        subject: 'Reset Your Sanvi Machinery Account Password',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1f2937; color: white; padding: 20px; text-align: center;">
              <h1>Password Reset Request</h1>
            </div>
            <div style="padding: 20px;">
              <p>You have requested to reset your password for your Sanvi Machinery account.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="{{resetLink}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              
              <p><strong>This link will expire in 1 hour.</strong></p>
              
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p>Best regards,<br>
                <strong>Sanvi Machinery Team</strong></p>
              </div>
            </div>
          </div>
        `,
        textContent: `Password Reset Request. Click this link to reset your password: {{resetLink}}. This link expires in 1 hour. If you didn't request this, please ignore this email.`,
        variables: ['resetLink'],
        category: 'SYSTEM',
      },
    ];

    let templateCount = 0;
    for (const template of emailTemplates) {
      await prisma.emailTemplate.upsert({
        where: { name: template.name },
        update: {},
        create: {
          ...template,
          variables: JSON.stringify(template.variables),
        },
      });
      templateCount++;
    }

    logSuccess(`Created ${templateCount} email templates`);

    // Step 8: Create sample customer segments
    logStep('8.', 'Creating customer segments...');
    
    const segments = [
      {
        segmentId: 'enterprise-customers',
        name: 'Enterprise Customers',
        description: 'Large enterprises with high-volume orders',
        criteria: {
          customerType: 'ENTERPRISE',
          minOrderValue: 1000000,
          features: ['Volume discounts', 'Priority support', 'Extended warranty']
        }
      },
      {
        segmentId: 'small-business',
        name: 'Small Business',
        description: 'Small and medium businesses',
        criteria: {
          customerType: 'SMALL_BUSINESS',
          maxOrderValue: 500000,
          features: ['Flexible payment terms', 'Basic support']
        }
      },
      {
        segmentId: 'government-sector',
        name: 'Government Sector',
        description: 'Government organizations and public sector',
        criteria: {
          customerType: 'GOVERNMENT',
          features: ['Government pricing', 'Compliance documentation', 'Extended payment terms']
        }
      }
    ];

    let segmentCount = 0;
    for (const segment of segments) {
      await prisma.customerSegment.upsert({
        where: { segmentId: segment.segmentId },
        update: {},
        create: {
          ...segment,
          criteria: JSON.stringify(segment.criteria),
        },
      });
      segmentCount++;
    }

    logSuccess(`Created ${segmentCount} customer segments`);

    // Success summary
    log('\n🎉 Production Database Seeding Completed Successfully!', 'green');
    log('================================================');
    logSuccess('Permissions and roles configured');
    logSuccess('Default admin user created');
    logSuccess('Product categories and sample products added');
    logSuccess('Email templates configured');
    logSuccess('Customer segments created');
    
    log('\n📊 Seeding Summary:', 'blue');
    log(`✅ ${permissionCount} permissions created`);
    log(`✅ 4 roles created with proper permissions`);
    log(`✅ 1 admin user created`);
    log(`✅ ${categories.length} product categories created`);
    log(`✅ ${productCount} sample products created`);
    log(`✅ ${templateCount} email templates created`);
    log(`✅ ${segmentCount} customer segments created`);
    
    log('\n🔐 Admin Credentials:', 'yellow');
    log('Email: admin@sanvi-machinery.com');
    log(`Password: ${adminPassword}`);
    log('⚠️  Please change the admin password after first login!');
    
    log('\n📝 Next Steps:', 'yellow');
    log('1. Start the application and test login');
    log('2. Create additional users as needed');
    log('3. Add more products specific to your inventory');
    log('4. Configure email settings for notifications');
    log('5. Set up customer data and begin operations');
    
  } catch (error) {
    log('\n💥 Database Seeding Failed!', 'red');
    log('================================================');
    logError('An error occurred during database seeding');
    logError(error.message);
    
    if (error.code === 'P2002') {
      logWarning('Unique constraint violation - some data may already exist');
      logWarning('This is normal if running the seed script multiple times');
    }
    
    log('\n🔧 Troubleshooting:', 'yellow');
    log('1. Check database connection');
    log('2. Ensure migrations have been run');
    log('3. Verify database permissions');
    log('4. Check for existing data conflicts');
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  seedProductionDatabase();
}

module.exports = { seedProductionDatabase };