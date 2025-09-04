import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';
import { DatabaseModule } from '@faker-js/faker/.';

describe('API Documentation Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Swagger Documentation', () => {
    it('should serve Swagger UI at /api/docs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs')
        .expect(200);

      expect(response.text).toContain('Swagger UI');
      expect(response.text).toContain('Sanvi Machinery B2B Platform API');
    });

    it('should serve OpenAPI JSON specification', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      expect(spec).toHaveProperty('openapi');
      expect(spec).toHaveProperty('info');
      expect(spec.info).toHaveProperty('title', 'Sanvi Machinery B2B Platform API');
      expect(spec.info).toHaveProperty('version', '1.0.0');
      expect(spec).toHaveProperty('paths');
      expect(spec).toHaveProperty('components');
    });

    it('should include authentication configuration', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      expect(spec.components).toHaveProperty('securitySchemes');
      expect(spec.components.securitySchemes).toHaveProperty('JWT-auth');
      expect(spec.components.securitySchemes['JWT-auth']).toHaveProperty('type', 'http');
      expect(spec.components.securitySchemes['JWT-auth']).toHaveProperty('scheme', 'bearer');
    });

    it('should include all major API endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      const paths = Object.keys(spec.paths);

      // Check for major endpoint categories
      expect(paths.some(path => path.includes('/auth/'))).toBe(true);
      expect(paths.some(path => path.includes('/customers'))).toBe(true);
      expect(paths.some(path => path.includes('/products'))).toBe(true);
      expect(paths.some(path => path.includes('/quotations'))).toBe(true);
    });

    it('should include proper response schemas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      
      // Check for response schemas
      expect(spec.components).toHaveProperty('schemas');
      
      // Check for common response DTOs
      const schemas = Object.keys(spec.components.schemas);
      expect(schemas.some(schema => schema.includes('Response'))).toBe(true);
    });

    it('should include proper error response documentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      
      // Check that endpoints have error responses documented
      const quotationsPath = spec.paths['/quotations'];
      if (quotationsPath && quotationsPath.get) {
        const responses = quotationsPath.get.responses;
        expect(responses).toHaveProperty('400'); // Bad Request
        expect(responses).toHaveProperty('401'); // Unauthorized
        expect(responses).toHaveProperty('500'); // Internal Server Error
      }
    });
  });

  describe('API Validation', () => {
    it('should validate request data and return proper error format', async () => {
      // Test with invalid data to check validation
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'invalid-email', // Invalid email format
          password: '123' // Too short password
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
    });

    it('should return consistent response format for successful requests', async () => {
      // Test a public endpoint that doesn't require auth
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      // This endpoint returns the OpenAPI spec directly, not our standard format
      // But we can verify it's a valid JSON response
      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');
    });

    it('should handle CORS properly', async () => {
      const response = await request(app.getHttpServer())
        .options('/api/docs')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs');

      // Check for security headers (helmet middleware)
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('API Versioning', () => {
    it('should serve API under /api prefix', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      const paths = Object.keys(spec.paths);
      
      // All paths should be under /api prefix (which is handled by global prefix)
      paths.forEach(path => {
        // The paths in the spec don't include the global prefix
        expect(path).toMatch(/^\/[a-z]/); // Should start with a path segment
      });
    });

    it('should include server information', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      expect(spec).toHaveProperty('servers');
      expect(Array.isArray(spec.servers)).toBe(true);
      expect(spec.servers.length).toBeGreaterThan(0);
    });
  });

  describe('Request/Response Examples', () => {
    it('should include request examples in documentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      
      // Check if any endpoints have examples
      let hasExamples = false;
      Object.values(spec.paths).forEach((pathItem: any) => {
        Object.values(pathItem).forEach((operation: any) => {
          if (operation.requestBody?.content?.['application/json']?.examples) {
            hasExamples = true;
          }
        });
      });

      // We expect at least some endpoints to have examples
      expect(hasExamples).toBe(true);
    });

    it('should include response examples in documentation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/docs-json')
        .expect(200);

      const spec = response.body;
      
      // Check if responses have proper schema definitions
      let hasResponseSchemas = false;
      Object.values(spec.paths).forEach((pathItem: any) => {
        Object.values(pathItem).forEach((operation: any) => {
          if (operation.responses) {
            Object.values(operation.responses).forEach((response: any) => {
              if (response.content?.['application/json']?.schema) {
                hasResponseSchemas = true;
              }
            });
          }
        });
      });

      expect(hasResponseSchemas).toBe(true);
    });
  });
});