import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create permissions
  console.log('Creating permissions...');
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
  }

  // Create roles
  console.log('Creating roles...');
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

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');
  
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

  // Create default admin user
  console.log('Creating default admin user...');
  const adminPassword = 'Admin123!';
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

  // Create sample categories
  console.log('Creating sample categories...');
  const categories = [
    { name: 'Heavy Machinery', description: 'Large industrial machinery and equipment' },
    { name: 'Construction Equipment', description: 'Equipment for construction and building' },
    { name: 'Manufacturing Tools', description: 'Tools and equipment for manufacturing processes' },
    { name: 'Agricultural Machinery', description: 'Machinery for agricultural operations' },
    { name: 'Mining Equipment', description: 'Equipment for mining and extraction operations' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // Create sample email templates
  console.log('Creating email templates...');
  const emailTemplates = [
    {
      name: 'quotation_sent',
      subject: 'Your Quotation from Sanvi Machinery - {{quotationNumber}}',
      htmlContent: `
        <h2>Dear {{customerName}},</h2>
        <p>Thank you for your interest in our products. Please find attached your quotation <strong>{{quotationNumber}}</strong>.</p>
        <p><strong>Quotation Details:</strong></p>
        <ul>
          <li>Total Amount: {{totalAmount}}</li>
          <li>Valid Until: {{validUntil}}</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Sanvi Machinery Team</p>
      `,
      textContent: `Dear {{customerName}}, Thank you for your interest in our products. Please find attached your quotation {{quotationNumber}}. Total Amount: {{totalAmount}}, Valid Until: {{validUntil}}. Best regards, Sanvi Machinery Team`,
      variables: ['customerName', 'quotationNumber', 'totalAmount', 'validUntil'],
      category: 'QUOTATION',
    },
    {
      name: 'quotation_reminder',
      subject: 'Reminder: Your Quotation {{quotationNumber}} Expires Soon',
      htmlContent: `
        <h2>Dear {{customerName}},</h2>
        <p>This is a friendly reminder that your quotation <strong>{{quotationNumber}}</strong> will expire on {{validUntil}}.</p>
        <p>To proceed with your order, please contact us as soon as possible.</p>
        <p>Best regards,<br>Sanvi Machinery Team</p>
      `,
      textContent: `Dear {{customerName}}, This is a reminder that your quotation {{quotationNumber}} expires on {{validUntil}}. Please contact us to proceed. Best regards, Sanvi Machinery Team`,
      variables: ['customerName', 'quotationNumber', 'validUntil'],
      category: 'REMINDER',
    },
    {
      name: 'password_reset',
      subject: 'Reset Your Sanvi Machinery Account Password',
      htmlContent: `
        <h2>Password Reset Request</h2>
        <p>You have requested to reset your password for your Sanvi Machinery account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="{{resetLink}}">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      textContent: `Password Reset Request. Click this link to reset your password: {{resetLink}}. This link expires in 1 hour.`,
      variables: ['resetLink'],
      category: 'SYSTEM',
    },
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: {
        ...template,
        variables: JSON.stringify(template.variables),
      },
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('Default admin user created:');
  console.log('Email: admin@sanvi-machinery.com');
  console.log('Password: Admin123!');
  console.log('');
  console.log('Roles created: admin, manager, sales, viewer');
  console.log('Permissions and role assignments completed.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });