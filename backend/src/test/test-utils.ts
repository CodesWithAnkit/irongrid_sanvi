import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';

export class TestUtils {
  static async createTestingModule(providers: any[] = []): Promise<TestingModule> {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...providers,
        {
          provide: PrismaService,
          useValue: TestUtils.createMockPrismaService(),
        },
      ],
    }).compile();

    return module;
  }

  static createMockPrismaService() {
    return {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      customer: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      quotation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      quotationItem: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      order: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      orderItem: {
        create: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      category: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      emailTemplate: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      emailLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
  }

  static async setupTestApp(module: TestingModule): Promise<INestApplication> {
    const app = module.createNestApplication();
    
    // Apply same middleware as main app
    app.enableCors();
    
    await app.init();
    return app;
  }

  static async cleanupTestApp(app: INestApplication): Promise<void> {
    if (app) {
      await app.close();
    }
  }

  static createAuthToken(jwtService: JwtService, userId: string, email: string): string {
    return jwtService.sign({
      sub: userId,
      email,
      iat: Math.floor(Date.now() / 1000),
    });
  }

  static async authenticatedRequest(
    app: INestApplication,
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    token?: string,
  ) {
    const req = request(app.getHttpServer())[method](url);
    
    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }
    
    return req;
  }

  static expectValidationError(response: any, field?: string) {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    
    if (field) {
      expect(response.body.message).toContain(field);
    }
  }

  static expectUnauthorizedError(response: any) {
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  }

  static expectForbiddenError(response: any) {
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message');
  }

  static expectNotFoundError(response: any) {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  }

  static expectSuccessResponse(response: any, expectedData?: any) {
    expect(response.status).toBeLessThan(400);
    
    if (expectedData) {
      expect(response.body).toMatchObject(expectedData);
    }
  }
}

export interface TestDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  cleanup(): Promise<void>;
  seed(): Promise<void>;
}

export class TestDatabaseManager implements TestDatabase {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  async connect(): Promise<void> {
    await this.prisma.$connect();
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  async cleanup(): Promise<void> {
    // Clean up in reverse order of dependencies
    await this.prisma.auditLog.deleteMany();
    await this.prisma.emailLog.deleteMany();
    await this.prisma.orderItem.deleteMany();
    await this.prisma.order.deleteMany();
    await this.prisma.quotationItem.deleteMany();
    await this.prisma.quotation.deleteMany();
    await this.prisma.customerInteraction.deleteMany();
    await this.prisma.productPricingRule.deleteMany();
    await this.prisma.product.deleteMany();
    await this.prisma.category.deleteMany();
    await this.prisma.customer.deleteMany();
    await this.prisma.userRole.deleteMany();
    await this.prisma.rolePermission.deleteMany();
    await this.prisma.user.deleteMany();
    await this.prisma.role.deleteMany();
    await this.prisma.permission.deleteMany();
    await this.prisma.emailTemplate.deleteMany();
    await this.prisma.file.deleteMany();
  }

  async seed(): Promise<void> {
    // Create basic test data
    await this.createTestRoles();
    await this.createTestUsers();
    await this.createTestCustomers();
    await this.createTestCategories();
    await this.createTestProducts();
  }

  private async createTestRoles(): Promise<void> {
    const permissions = [
      { resource: 'quotation', action: 'create' },
      { resource: 'quotation', action: 'read' },
      { resource: 'quotation', action: 'update' },
      { resource: 'quotation', action: 'delete' },
      { resource: 'customer', action: 'create' },
      { resource: 'customer', action: 'read' },
      { resource: 'customer', action: 'update' },
      { resource: 'customer', action: 'delete' },
    ];

    for (const permission of permissions) {
      await this.prisma.permission.upsert({
        where: { resource_action: permission },
        update: {},
        create: permission,
      });
    }

    const adminRole = await this.prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        description: 'Administrator role',
      },
    });

    const salesRole = await this.prisma.role.upsert({
      where: { name: 'sales' },
      update: {},
      create: {
        name: 'sales',
        description: 'Sales representative role',
      },
    });

    // Assign all permissions to admin role
    const allPermissions = await this.prisma.permission.findMany();
    for (const permission of allPermissions) {
      await this.prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      });
    }
  }

  private async createTestUsers(): Promise<void> {
    const bcrypt = require('bcryptjs');
    
    const adminUser = await this.prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Admin',
        lastName: 'User',
        emailVerified: true,
      },
    });

    const salesUser = await this.prisma.user.upsert({
      where: { email: 'sales@test.com' },
      update: {},
      create: {
        email: 'sales@test.com',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Sales',
        lastName: 'User',
        emailVerified: true,
      },
    });

    // Assign roles
    const adminRole = await this.prisma.role.findUnique({ where: { name: 'admin' } });
    const salesRole = await this.prisma.role.findUnique({ where: { name: 'sales' } });

    if (adminRole) {
      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
        update: {},
        create: { userId: adminUser.id, roleId: adminRole.id },
      });
    }

    if (salesRole) {
      await this.prisma.userRole.upsert({
        where: { userId_roleId: { userId: salesUser.id, roleId: salesRole.id } },
        update: {},
        create: { userId: salesUser.id, roleId: salesRole.id },
      });
    }
  }

  private async createTestCustomers(): Promise<void> {
    await this.prisma.customer.upsert({
      where: { email: 'customer1@test.com' },
      update: {},
      create: {
        companyName: 'Test Company 1',
        contactPerson: 'John Doe',
        email: 'customer1@test.com',
        phone: '+91-9876543210',
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        customerType: 'SMALL_BUSINESS',
        creditLimit: 100000,
      },
    });

    await this.prisma.customer.upsert({
      where: { email: 'customer2@test.com' },
      update: {},
      create: {
        companyName: 'Test Enterprise 2',
        contactPerson: 'Jane Smith',
        email: 'customer2@test.com',
        phone: '+91-9876543211',
        address: '456 Enterprise Avenue',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        customerType: 'ENTERPRISE',
        creditLimit: 500000,
      },
    });
  }

  private async createTestCategories(): Promise<void> {
    await this.prisma.category.upsert({
      where: { name: 'Industrial Machinery' },
      update: {},
      create: {
        name: 'Industrial Machinery',
        description: 'Heavy industrial machinery and equipment',
      },
    });

    await this.prisma.category.upsert({
      where: { name: 'Construction Equipment' },
      update: {},
      create: {
        name: 'Construction Equipment',
        description: 'Construction and building equipment',
      },
    });
  }

  private async createTestProducts(): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { name: 'Industrial Machinery' },
    });

    if (category) {
      await this.prisma.product.upsert({
        where: { sku: 'PROD-001' },
        update: {},
        create: {
          sku: 'PROD-001',
          name: 'Industrial Lathe Machine',
          description: 'High precision industrial lathe machine',
          categoryId: category.id,
          basePrice: 250000,
          specifications: {
            power: '5HP',
            weight: '2000kg',
            dimensions: '3m x 2m x 1.5m',
          },
          inventoryCount: 10,
        },
      });

      await this.prisma.product.upsert({
        where: { sku: 'PROD-002' },
        update: {},
        create: {
          sku: 'PROD-002',
          name: 'CNC Milling Machine',
          description: 'Computer controlled milling machine',
          categoryId: category.id,
          basePrice: 500000,
          specifications: {
            power: '10HP',
            weight: '3000kg',
            axes: '3-axis',
          },
          inventoryCount: 5,
        },
      });
    }
  }
}