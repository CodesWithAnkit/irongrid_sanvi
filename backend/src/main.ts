import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// it is giving error if not imprting like this.
import * as cookieParser from 'cookie-parser';
import * as crypto from 'crypto';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  (globalThis as any).crypto = crypto;

  const origins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: false,
    }),
  );
  app.setGlobalPrefix('api');

  // Enhanced Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Sanvi Machinery B2B Platform API')
    .setDescription(`
      Comprehensive API documentation for Sanvi Machinery B2B e-commerce platform.
      
      ## Features
      - **Authentication & Authorization**: JWT-based authentication with role-based access control
      - **Customer Management**: Complete CRM functionality for B2B customers
      - **Product Catalog**: Industrial machinery and equipment catalog management
      - **Quotation System**: Advanced quotation creation, management, and tracking
      - **Order Processing**: Complete order lifecycle management
      - **Email Automation**: Automated email communication and templates
      - **Analytics & Reporting**: Business intelligence and performance metrics
      - **File Management**: Document and image upload/management
      
      ## Authentication
      Most endpoints require authentication. Use the login endpoint to obtain a JWT token,
      then include it in the Authorization header as 'Bearer <token>'.
      
      ## Rate Limiting
      API endpoints are rate-limited to prevent abuse. Default limits:
      - 100 requests per minute for authenticated users
      - 20 requests per minute for unauthenticated users
      
      ## Error Handling
      All API responses follow a consistent format:
      - Success responses include 'success: true' and 'data' field
      - Error responses include 'success: false' and 'error' field with details
      
      ## Pagination
      List endpoints support pagination with 'limit' and 'offset' parameters.
      Responses include pagination metadata.
    `)
    .setVersion('1.0.0')
    .setContact(
      'Sanvi Machinery Support',
      'https://sanvi-machinery.com',
      'support@sanvi-machinery.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3001', 'Development Server')
    .addServer('https://api.sanvi-machinery.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth'
    )
    .addCookieAuth('accessToken', {
      type: 'apiKey',
      in: 'cookie',
      name: 'accessToken',
      description: 'JWT token stored in HTTP-only cookie'
    })
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag('Users', 'User management and profile operations')
    .addTag('Customers', 'B2B customer management and CRM functionality')
    .addTag('Products', 'Product catalog and inventory management')
    .addTag('Quotations', 'Quotation creation, management, and tracking')
    .addTag('Orders', 'Order processing and fulfillment')
    .addTag('Email', 'Email automation and template management')
    .addTag('Files', 'File upload and document management')
    .addTag('Analytics', 'Business intelligence and reporting')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Customize Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Sanvi Machinery API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1f2937; }
      .swagger-ui .scheme-container { background: #f8fafc; padding: 20px; border-radius: 8px; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
