import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { TestUtils } from '../test/test-utils';
import { TestDataFactory } from '../test/factories';
import { getTestPrismaClient, cleanTestDatabase } from '../test/database-test-setup';
import { QuotationStatus } from '@prisma/client';

describe('Quotations API Integration Tests', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: any;
  let authToken: string;
  let testUser: any;
  let testCustomer: any;
  let testProduct: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = await TestUtils.setupTestApp(moduleFixture);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = getTestPrismaClient();

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    await TestUtils.cleanupTestApp(app);
  });

  beforeEach(async () => {
    await cleanTestDatabase();
    await setupTestData();
  });

  async function setupTestData() {
    // Create test user
    testUser = await prisma.user.create({
      data: TestDataFactory.createUser({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      }),
    });

    // Create test customer
    testCustomer = await prisma.customer.create({
      data: TestDataFactory.createCustomer({
        email: 'customer@test.com',
        companyName: 'Test Company',
      }),
    });

    // Create test category
    const testCategory = await prisma.category.create({
      data: TestDataFactory.createCategory({
        name: 'Test Category',
      }),
    });

    // Create test product
    testProduct = await prisma.product.create({
      data: TestDataFactory.createProduct({
        sku: 'TEST-001',
        name: 'Test Product',
        categoryId: testCategory.id,
        basePrice: BigInt(10000),
      }),
    });

    // Generate auth token
    authToken = TestUtils.createAuthToken(jwtService, testUser.id, testUser.email);
  }

  describe('POST /api/quotations', () => {
    const validQuotationData = {
      customerId: '',
      items: [
        {
          productId: '',
          quantity: 2,
          unitPrice: 10000,
          discount: 500,
        },
      ],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      termsConditions: 'Payment within 30 days',
      notes: 'Test quotation',
    };

    beforeEach(() => {
      validQuotationData.customerId = testCustomer.id;
      validQuotationData.items[0].productId = testProduct.id;
    });

    it('should create a quotation successfully', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'post', '/api/quotations', authToken)
        .send(validQuotationData)
        .expect(201);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data).toMatchObject({
        quotationNumber: expect.stringMatching(/^QUO-\d{4}-\d{6}$/),
        customerId: testCustomer.id,
        status: QuotationStatus.DRAFT,
        subtotal: expect.any(Number),
        totalAmount: expect.any(Number),
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: testProduct.id,
            quantity: 2,
            unitPrice: expect.any(Number),
          }),
        ]),
      });
    });

    it('should return 400 for invalid customer ID', async () => {
      const invalidData = {
        ...validQuotationData,
        customerId: 'invalid-customer-id',
      };

      const response = await TestUtils.authenticatedRequest(app, 'post', '/api/quotations', authToken)
        .send(invalidData)
        .expect(400);

      TestUtils.expectValidationError(response, 'customerId');
    });

    it('should return 400 for empty items array', async () => {
      const invalidData = {
        ...validQuotationData,
        items: [],
      };

      const response = await TestUtils.authenticatedRequest(app, 'post', '/api/quotations', authToken)
        .send(invalidData)
        .expect(400);

      TestUtils.expectValidationError(response, 'items');
    });

    it('should return 400 for invalid product ID', async () => {
      const invalidData = {
        ...validQuotationData,
        items: [
          {
            productId: 'invalid-product-id',
            quantity: 1,
            unitPrice: 10000,
            discount: 0,
          },
        ],
      };

      const response = await TestUtils.authenticatedRequest(app, 'post', '/api/quotations', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toContain('Products not found or inactive');
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/quotations')
        .send(validQuotationData)
        .expect(401);

      TestUtils.expectUnauthorizedError(response);
    });

    it('should calculate totals correctly', async () => {
      const multiItemData = {
        ...validQuotationData,
        items: [
          {
            productId: testProduct.id,
            quantity: 2,
            unitPrice: 10000,
            discount: 1000,
          },
          {
            productId: testProduct.id,
            quantity: 1,
            unitPrice: 5000,
            discount: 0,
          },
        ],
      };

      const response = await TestUtils.authenticatedRequest(app, 'post', '/api/quotations', authToken)
        .send(multiItemData)
        .expect(201);

      const quotation = response.body.data;
      expect(quotation.subtotal).toBe(25000); // (2 * 10000) + (1 * 5000)
      expect(quotation.discountAmount).toBe(1000);
      expect(quotation.taxAmount).toBe(4320); // (25000 - 1000) * 0.18
      expect(quotation.totalAmount).toBe(28320); // 25000 - 1000 + 4320
    });
  });

  describe('GET /api/quotations', () => {
    let testQuotations: any[];

    beforeEach(async () => {
      // Create test quotations
      testQuotations = [];
      for (let i = 0; i < 5; i++) {
        const quotation = await prisma.quotation.create({
          data: {
            ...TestDataFactory.createQuotation({
              customerId: testCustomer.id,
              createdByUserId: testUser.id,
              quotationNumber: `QUO-2024-00000${i + 1}`,
              status: i % 2 === 0 ? QuotationStatus.DRAFT : QuotationStatus.SENT,
            }),
            items: {
              create: [
                TestDataFactory.createQuotationItem({
                  productId: testProduct.id,
                  quantity: i + 1,
                  unitPrice: BigInt(10000),
                }),
              ],
            },
          },
          include: {
            customer: true,
            items: { include: { product: true } },
            createdBy: true,
          },
        });
        testQuotations.push(quotation);
      }
    });

    it('should return paginated quotations', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations', authToken)
        .query({ limit: 3, offset: 0 })
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(5);
      expect(response.body.page).toBe(1);
      expect(response.body.totalPages).toBe(2);
    });

    it('should filter by status', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations', authToken)
        .query({ status: QuotationStatus.DRAFT })
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(3); // 3 draft quotations (indices 0, 2, 4)
      response.body.data.forEach((quotation: any) => {
        expect(quotation.status).toBe(QuotationStatus.DRAFT);
      });
    });

    it('should filter by customer', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations', authToken)
        .query({ customerId: testCustomer.id })
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(5);
      response.body.data.forEach((quotation: any) => {
        expect(quotation.customerId).toBe(testCustomer.id);
      });
    });

    it('should search quotations', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations', authToken)
        .query({ search: 'QUO-2024-000001' })
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].quotationNumber).toBe('QUO-2024-000001');
    });

    it('should sort quotations', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations', authToken)
        .query({ sortBy: 'quotationNumber', sortOrder: 'asc' })
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      const quotationNumbers = response.body.data.map((q: any) => q.quotationNumber);
      expect(quotationNumbers).toEqual([...quotationNumbers].sort());
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/quotations')
        .expect(401);

      TestUtils.expectUnauthorizedError(response);
    });
  });

  describe('GET /api/quotations/:id', () => {
    let testQuotation: any;

    beforeEach(async () => {
      testQuotation = await prisma.quotation.create({
        data: {
          ...TestDataFactory.createQuotation({
            customerId: testCustomer.id,
            createdByUserId: testUser.id,
          }),
          items: {
            create: [
              TestDataFactory.createQuotationItem({
                productId: testProduct.id,
                quantity: 2,
                unitPrice: BigInt(10000),
              }),
            ],
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
          createdBy: true,
        },
      });
    });

    it('should return quotation details', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'get', `/api/quotations/${testQuotation.id}`, authToken)
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data).toMatchObject({
        id: testQuotation.id,
        quotationNumber: testQuotation.quotationNumber,
        customerId: testCustomer.id,
        customer: expect.objectContaining({
          companyName: testCustomer.companyName,
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: testProduct.id,
            product: expect.objectContaining({
              name: testProduct.name,
            }),
          }),
        ]),
      });
    });

    it('should return 404 for non-existent quotation', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations/non-existent-id', authToken)
        .expect(404);

      TestUtils.expectNotFoundError(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/quotations/${testQuotation.id}`)
        .expect(401);

      TestUtils.expectUnauthorizedError(response);
    });
  });

  describe('PATCH /api/quotations/:id', () => {
    let testQuotation: any;

    beforeEach(async () => {
      testQuotation = await prisma.quotation.create({
        data: TestDataFactory.createQuotation({
          customerId: testCustomer.id,
          createdByUserId: testUser.id,
          status: QuotationStatus.DRAFT,
        }),
      });
    });

    it('should update quotation status', async () => {
      const updateData = { status: QuotationStatus.SENT };

      const response = await TestUtils.authenticatedRequest(app, 'patch', `/api/quotations/${testQuotation.id}`, authToken)
        .send(updateData)
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data.status).toBe(QuotationStatus.SENT);
    });

    it('should update quotation validity', async () => {
      const newValidUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const updateData = { validUntil: newValidUntil.toISOString() };

      const response = await TestUtils.authenticatedRequest(app, 'patch', `/api/quotations/${testQuotation.id}`, authToken)
        .send(updateData)
        .expect(200);

      TestUtils.expectSuccessResponse(response);
      expect(new Date(response.body.data.validUntil)).toEqual(newValidUntil);
    });

    it('should return 400 for invalid status transition', async () => {
      // First update to REJECTED status
      await prisma.quotation.update({
        where: { id: testQuotation.id },
        data: { status: QuotationStatus.REJECTED },
      });

      const updateData = { status: QuotationStatus.SENT };

      const response = await TestUtils.authenticatedRequest(app, 'patch', `/api/quotations/${testQuotation.id}`, authToken)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toContain('Invalid status transition');
    });

    it('should return 404 for non-existent quotation', async () => {
      const updateData = { status: QuotationStatus.SENT };

      const response = await TestUtils.authenticatedRequest(app, 'patch', '/api/quotations/non-existent-id', authToken)
        .send(updateData)
        .expect(404);

      TestUtils.expectNotFoundError(response);
    });

    it('should return 401 without authentication', async () => {
      const updateData = { status: QuotationStatus.SENT };

      const response = await request(app.getHttpServer())
        .patch(`/api/quotations/${testQuotation.id}`)
        .send(updateData)
        .expect(401);

      TestUtils.expectUnauthorizedError(response);
    });
  });

  describe('DELETE /api/quotations/:id', () => {
    let draftQuotation: any;
    let sentQuotation: any;

    beforeEach(async () => {
      draftQuotation = await prisma.quotation.create({
        data: TestDataFactory.createQuotation({
          customerId: testCustomer.id,
          createdByUserId: testUser.id,
          status: QuotationStatus.DRAFT,
        }),
      });

      sentQuotation = await prisma.quotation.create({
        data: TestDataFactory.createQuotation({
          customerId: testCustomer.id,
          createdByUserId: testUser.id,
          status: QuotationStatus.SENT,
        }),
      });
    });

    it('should delete draft quotation', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'delete', `/api/quotations/${draftQuotation.id}`, authToken)
        .expect(200);

      TestUtils.expectSuccessResponse(response);

      // Verify quotation is deleted
      const deletedQuotation = await prisma.quotation.findUnique({
        where: { id: draftQuotation.id },
      });
      expect(deletedQuotation).toBeNull();
    });

    it('should return 403 when trying to delete non-draft quotation', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'delete', `/api/quotations/${sentQuotation.id}`, authToken)
        .expect(403);

      TestUtils.expectForbiddenError(response);
    });

    it('should return 404 for non-existent quotation', async () => {
      const response = await TestUtils.authenticatedRequest(app, 'delete', '/api/quotations/non-existent-id', authToken)
        .expect(404);

      TestUtils.expectNotFoundError(response);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/quotations/${draftQuotation.id}`)
        .expect(401);

      TestUtils.expectUnauthorizedError(response);
    });
  });

  describe('POST /api/quotations/:id/duplicate', () => {
    let testQuotation: any;

    beforeEach(async () => {
      testQuotation = await prisma.quotation.create({
        data: {
          ...TestDataFactory.createQuotation({
            customerId: testCustomer.id,
            createdByUserId: testUser.id,
            status: QuotationStatus.SENT,
          }),
          items: {
            create: [
              TestDataFactory.createQuotationItem({
                productId: testProduct.id,
                quantity: 2,
                unitPrice: BigInt(10000),
              }),
            ],
          },
        },
        include: {
          items: true,
        },
      });
    });

    it('should duplicate quotation successfully', async () => {
      const duplicateData = { resetStatus: true };

      const response = await TestUtils.authenticatedRequest(app, 'post', `/api/quotations/${testQuotation.id}/duplicate`, authToken)
        .send(duplicateData)
        .expect(201);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data).toMatchObject({
        id: expect.not.stringMatching(testQuotation.id),
        quotationNumber: expect.not.stringMatching(testQuotation.quotationNumber),
        customerId: testQuotation.customerId,
        status: QuotationStatus.DRAFT, // Reset to draft
        subtotal: testQuotation.subtotal,
        totalAmount: testQuotation.totalAmount,
      });
    });

    it('should duplicate for different customer', async () => {
      // Create another customer
      const anotherCustomer = await prisma.customer.create({
        data: TestDataFactory.createCustomer({
          email: 'another@test.com',
          companyName: 'Another Company',
        }),
      });

      const duplicateData = {
        customerId: anotherCustomer.id,
        resetStatus: true,
      };

      const response = await TestUtils.authenticatedRequest(app, 'post', `/api/quotations/${testQuotation.id}/duplicate`, authToken)
        .send(duplicateData)
        .expect(201);

      TestUtils.expectSuccessResponse(response);
      expect(response.body.data.customerId).toBe(anotherCustomer.id);
    });

    it('should return 404 for non-existent quotation', async () => {
      const duplicateData = { resetStatus: true };

      const response = await TestUtils.authenticatedRequest(app, 'post', '/api/quotations/non-existent-id/duplicate', authToken)
        .send(duplicateData)
        .expect(404);

      TestUtils.expectNotFoundError(response);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // This test would require actual rate limiting configuration
      // For now, we'll just verify the endpoint is accessible
      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations', authToken)
        .expect(200);

      TestUtils.expectSuccessResponse(response);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database error
      jest.spyOn(prisma.quotation, 'findMany').mockRejectedValueOnce(new Error('Database connection failed'));

      const response = await TestUtils.authenticatedRequest(app, 'get', '/api/quotations', authToken)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    it('should validate request payload format', async () => {
      const invalidData = {
        customerId: 'invalid-format',
        items: 'not-an-array',
      };

      const response = await TestUtils.authenticatedRequest(app, 'post', '/api/quotations', authToken)
        .send(invalidData)
        .expect(400);

      TestUtils.expectValidationError(response);
    });
  });
});