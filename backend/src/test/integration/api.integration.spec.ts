import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { DatabaseModule } from '@faker-js/faker/.';

describe('API Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let authToken: string;
  let testCustomerId: string;
  let testProductId: string;
  let testQuotationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    await app.init();

    // Create test user and get auth token
    const testUser = await prisma.user.upsert({
      where: { email: 'test@sanvi-machinery.com' },
      update: {},
      create: {
        email: 'test@sanvi-machinery.com',
        password: '$2b$10$test.hash.for.integration.tests',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
      },
    });

    authToken = jwtService.sign({ sub: testUser.id, email: testUser.email });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testQuotationId) {
      await prisma.quotationItem.deleteMany({
        where: { quotationId: testQuotationId },
      });
      await prisma.quotation.delete({
        where: { id: testQuotationId },
      });
    }
    if (testCustomerId) {
      await prisma.customer.delete({
        where: { id: testCustomerId },
      });
    }
    if (testProductId) {
      await prisma.product.delete({
        where: { id: testProductId },
      });
    }

    await prisma.$disconnect();
    await app.close();
  });

  describe('Authentication Endpoints', () => {
    it('/auth/login (POST) - should authenticate user', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@sanvi-machinery.com',
          password: 'TestPassword@123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@sanvi-machinery.com');
    });

    it('/auth/login (POST) - should reject invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'test@sanvi-machinery.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'AUTHENTICATION_ERROR');
    });

    it('/auth/profile (GET) - should return user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('email', 'test@sanvi-machinery.com');
    });

    it('/auth/profile (GET) - should reject unauthenticated request', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('Customer Management Endpoints', () => {
    it('/customers (POST) - should create a new customer', async () => {
      const customerData = {
        companyName: 'Test Integration Company',
        contactPerson: 'John Integration Test',
        email: 'john@integrationtest.com',
        phone: '+91-9876543210',
        address: '123 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        customerType: 'LARGE_ENTERPRISE',
        creditLimit: 500000,
        paymentTerms: 'NET_30',
      };

      const response = await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(customerData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.companyName).toBe(customerData.companyName);
      expect(response.body.data.email).toBe(customerData.email);

      testCustomerId = response.body.data.id;
    });

    it('/customers (POST) - should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyName: 'Test Company',
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(response.body.error.details).toBeInstanceOf(Array);
    });

    it('/customers (GET) - should list customers with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
    });

    it('/customers/:id (GET) - should get customer details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testCustomerId);
      expect(response.body.data).toHaveProperty('companyName');
    });

    it('/customers/:id (PATCH) - should update customer', async () => {
      const updateData = {
        creditLimit: 750000,
        notes: 'Updated credit limit for integration test',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/customers/${testCustomerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.creditLimit).toBe(updateData.creditLimit);
      expect(response.body.data.notes).toBe(updateData.notes);
    });

    it('/customers (GET) - should search customers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers?search=Integration&customerType=LARGE_ENTERPRISE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Product Management Endpoints', () => {
    it('/products (POST) - should create a new product', async () => {
      const productData = {
        sku: 'INT-TEST-001',
        name: 'Integration Test Product',
        description: 'Product created for integration testing',
        basePrice: 100000,
        currency: 'INR',
        specifications: {
          testSpec: 'Integration Test Value',
          power: '10 KW',
        },
        inventoryCount: 10,
        minOrderQty: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.sku).toBe(productData.sku);
      expect(response.body.data.name).toBe(productData.name);

      testProductId = response.body.data.id;
    });

    it('/products (POST) - should reject duplicate SKU', async () => {
      const productData = {
        sku: 'INT-TEST-001', // Same SKU as above
        name: 'Duplicate SKU Product',
        basePrice: 50000,
      };

      const response = await request(app.getHttpServer())
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error.message).toContain('SKU already exists');
    });

    it('/products (GET) - should list products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('pagination');
    });

    it('/products/search (GET) - should search products', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/products/search?q=Integration Test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('/products/:id (GET) - should get product details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testProductId);
      expect(response.body.data).toHaveProperty('sku', 'INT-TEST-001');
    });
  });

  describe('Quotation Management Endpoints', () => {
    it('/quotations (POST) - should create a new quotation', async () => {
      const quotationData = {
        customerId: testCustomerId,
        items: [
          {
            productId: testProductId,
            quantity: 2,
            unitPrice: 100000,
            discount: 5000,
          },
        ],
        validUntil: '2024-12-31T23:59:59Z',
        termsConditions: 'Integration test terms',
        notes: 'Created for integration testing',
      };

      const response = await request(app.getHttpServer())
        .post('/api/quotations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(quotationData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('quotationNumber');
      expect(response.body.data.quotationNumber).toMatch(/^QUO-\d{4}-\d{6}$/);
      expect(response.body.data.customerId).toBe(testCustomerId);
      expect(response.body.data.items).toHaveLength(1);

      testQuotationId = response.body.data.id;
    });

    it('/quotations (POST) - should validate quotation data', async () => {
      const invalidData = {
        customerId: 'invalid-customer-id',
        items: [], // Empty items array
      };

      const response = await request(app.getHttpServer())
        .post('/api/quotations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('/quotations (GET) - should list quotations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/quotations?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('pagination');
    });

    it('/quotations/:id (GET) - should get quotation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/quotations/${testQuotationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', testQuotationId);
      expect(response.body.data).toHaveProperty('customer');
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items).toHaveLength(1);
    });

    it('/quotations/:id (PATCH) - should update quotation', async () => {
      const updateData = {
        status: 'SENT',
        notes: 'Updated for integration test',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/quotations/${testQuotationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.status).toBe('SENT');
      expect(response.body.data.notes).toBe(updateData.notes);
    });

    it('/quotations/:id/duplicate (POST) - should duplicate quotation', async () => {
      const duplicateData = {
        resetStatus: true,
        notes: 'Duplicated for integration test',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/quotations/${testQuotationId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(duplicateData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).not.toBe(testQuotationId);
      expect(response.body.data.status).toBe('DRAFT');

      // Cleanup the duplicated quotation
      const duplicateId = response.body.data.id;
      await prisma.quotationItem.deleteMany({
        where: { quotationId: duplicateId },
      });
      await prisma.quotation.delete({
        where: { id: duplicateId },
      });
    });

    it('/quotations/:id/pdf (POST) - should generate PDF', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/quotations/${testQuotationId}/pdf`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('downloadUrl');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent resources', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'RESOURCE_NOT_FOUND');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'AUTHENTICATION_ERROR');
    });

    it('should return 400 for invalid request data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invalidField: 'invalid data',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to endpoints', async () => {
      // Make multiple rapid requests to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/api/customers')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);

      // Check if rate limiting headers are present
      const firstResponse = responses[0];
      expect(firstResponse.headers).toHaveProperty('x-ratelimit-limit');
      expect(firstResponse.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('Response Format Consistency', () => {
    it('should have consistent success response format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should have consistent error response format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });
  });

  describe('Pagination', () => {
    it('should handle pagination parameters correctly', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers?page=1&limit=5&sortBy=companyName&sortOrder=asc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
      expect(response.body.pagination).toHaveProperty('hasNext');
      expect(response.body.pagination).toHaveProperty('hasPrev');
    });

    it('should validate pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers?page=0&limit=101') // Invalid values
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    });
  });
});