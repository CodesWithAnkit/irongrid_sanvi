### 🔒 **Security Implementation (Modern & Secure)**

#### **Secure Authentication Flow**
```typescript
// JWT Strategy with httpOnly cookies
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({# Sanvi Machinery - Separate Backend & Frontend Architecture Plan

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Backend Architecture (PERN Stack)](#backend-architecture-pern-stack)
3. [Frontend Architecture (Next.js)](#frontend-architecture-nextjs)
4. [Communication Layer](#communication-layer)
5. [Development Workflow](#development-workflow)
6. [Project Structure](#project-structure)
7. [Technology Specifications](#technology-specifications)
8. [Phase-wise Implementation](#phase-wise-implementation)
9. [Deployment Strategy](#deployment-strategy)
10. [Team Structure & Responsibilities](#team-structure--responsibilities)

---

## Architecture Overview

### 🏗️ **High-Level System Design**
```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Next.js Frontend Applications                              │
│  ├─ Public Website (sanvi-machinery.com)                   │
│  ├─ Admin Panel (admin.sanvi-machinery.com)                │
│  ├─ Customer Portal (portal.sanvi-machinery.com)           │
│  └─ Mobile Web App (m.sanvi-machinery.com)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                    ┌───────┼───────┐
                    │   HTTP/HTTPS  │
                    │   REST APIs   │
                    └───────┼───────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer + Rate Limiting + Authentication            │
│  ├─ Route: /api/v1/auth/*                                   │
│  ├─ Route: /api/v1/quotations/*                            │
│  ├─ Route: /api/v1/products/*                              │
│  ├─ Route: /api/v1/customers/*                             │
│  └─ Route: /api/v1/orders/*                                │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                Backend Services Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express.js + PostgreSQL + Redis                 │
│  ├─ Authentication Service                                  │
│  ├─ Quotation Management Service                           │
│  ├─ Product Catalog Service                                │
│  ├─ Customer Management Service (CRM)                      │
│  ├─ Order Processing Service                               │
│  ├─ Email Service                                          │
│  └─ File Upload Service                                    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ├─ PostgreSQL (Primary Database)                          │
│  ├─ Redis (Caching + Sessions)                             │
│  ├─ AWS S3 (File Storage)                                  │
│  └─ External APIs (Payment, Email, SMS)                    │
└─────────────────────────────────────────────────────────────┘
```

### 🎯 **Core Principles**
- **Complete Separation**: Backend and Frontend are independent applications
- **API-First Design**: Backend exposes RESTful APIs, Frontend consumes them
- **Stateless Architecture**: Backend is stateless, state managed in database/cache
- **Scalable Design**: Each layer can be scaled independently
- **Traditional Approach**: Proven architecture pattern with clear boundaries

---

## Backend Architecture (PERN Stack)

### 🔧 **Technology Stack (Updated)**
```
Backend Technology Stack (Modern):
├── Runtime: Node.js 18+
├── Framework: NestJS 10+ (Enterprise-grade)
├── Database: PostgreSQL 15+
├── ORM: Prisma 5+ (TypeScript-first)
├── Cache & Jobs: Redis 7.x + BullMQ
├── Authentication: JWT (httpOnly cookies) + Refresh tokens
├── Validation: class-validator + class-transformer
├── File Upload: Pre-signed URLs (AWS S3 direct)
├── Email: Queue-based processing (BullMQ + SendGrid)
├── Testing: Jest + Supertest
├── Documentation: OpenAPI/Swagger (auto-generated)
└── Process Manager: Docker containers (no PM2)
```

### 🏗️ **Backend Project Structure (NestJS)**
```
sanvi-backend/
├── src/
│   ├── app.module.ts           # Main application module
│   │
│   ├── auth/                   # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   ├── refresh-token.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   └── decorators/
│   │       ├── current-user.decorator.ts
│   │       └── roles.decorator.ts
│   │
│   ├── quotations/             # Quotations module
│   │   ├── quotations.module.ts
│   │   ├── quotations.controller.ts
│   │   ├── quotations.service.ts
│   │   ├── dto/
│   │   │   ├── create-quotation.dto.ts
│   │   │   ├── update-quotation.dto.ts
│   │   │   └── send-quotation.dto.ts
│   │   ├── entities/
│   │   │   ├── quotation.entity.ts
│   │   │   └── quotation-item.entity.ts
│   │   └── processors/
│   │       ├── pdf-generation.processor.ts
│   │       └── email-notification.processor.ts
│   │
│   ├── customers/              # Customers module
│   │   ├── customers.module.ts
│   │   ├── customers.controller.ts
│   │   ├── customers.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── products/               # Products module
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── orders/                 # Orders module
│   │   ├── orders.module.ts
│   │   ├── orders.controller.ts
│   │   ├── orders.service.ts
│   │   ├── dto/
│   │   └── entities/
│   │
│   ├── users/                  # Users & RBAC module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── role.entity.ts
│   │   │   └── permission.entity.ts
│   │   └── rbac/
│   │       ├── rbac.service.ts
│   │       └── rbac.guard.ts
│   │
│   ├── files/                  # File upload module
│   │   ├── files.module.ts
│   │   ├── files.controller.ts
│   │   ├── files.service.ts
│   │   └── s3-presigned.service.ts
│   │
│   ├── notifications/          # Notification system
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts
│   │   ├── email/
│   │   │   ├── email.processor.ts
│   │   │   └── templates/
│   │   └── pdf/
│   │       ├── pdf.processor.ts
│   │       └── templates/
│   │
│   ├── common/                 # Shared utilities
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── pipes/
│   │   ├── guards/
│   │   └── utils/
│   │
│   ├── config/                 # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   └── aws.config.ts
│   │
│   └── prisma/                 # Prisma setup
│       ├── schema.prisma
│       ├── migrations/
│       └── seed.ts
│
├── test/                       # E2E tests
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
├── docs/
└── package.json
```

### 🎯 **Backend Core Services (Modern Architecture)**

#### **1. Authentication Service (Secure Implementation)**
```typescript
// Secure cookie-based authentication
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, response: Response) {
    const user = await this.validateUser(loginDto.email, loginDto.password)
    
    // Generate tokens
    const tokens = await this.generateTokens(user)
    
    // Set secure httpOnly cookies
    response.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    })
    
    response.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })
    
    return { user: this.sanitizeUser(user) }
  }
}

// Dynamic RBAC System
@Injectable()
export class RbacService {
  async hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
    const userPermissions = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        }
      }
    })
    
    return userPermissions.some(userRole => 
      userRole.role.rolePermissions.some(rp => 
        rp.permission.resource === resource && rp.permission.action === action
      )
    )
  }
}
```

#### **2. Quotation Management Service (Queue-Based Processing)**
```typescript
// Quotation service with background processing
@Injectable()
export class QuotationService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationQueue: Queue,
    @InjectQueue('pdf-generation') private pdfQueue: Queue,
  ) {}

  async create(createQuotationDto: CreateQuotationDto): Promise<Quotation> {
    const quotation = await this.prisma.quotation.create({
      data: {
        ...createQuotationDto,
        quotationNumber: await this.generateQuotationNumber(),
        status: QuotationStatus.DRAFT,
      },
      include: {
        items: true,
        customer: true,
      },
    })

    return quotation
  }

  async sendQuotation(id: number, sendDto: SendQuotationDto): Promise<void> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true },
    })

    // Add PDF generation to queue
    await this.pdfQueue.add('generate-quotation-pdf', {
      quotationId: id,
      template: 'professional',
    })

    // Add email notification to queue
    await this.notificationQueue.add('send-quotation-email', {
      quotationId: id,
      emailData: sendDto,
    })

    // Update quotation status
    await this.prisma.quotation.update({
      where: { id },
      data: { 
        status: QuotationStatus.SENT,
        sentAt: new Date(),
      },
    })
  }
}

// Background job processors
@Processor('pdf-generation')
export class PdfProcessor {
  @Process('generate-quotation-pdf')
  async generateQuotationPdf(job: Job) {
    const { quotationId, template } = job.data
    // Generate PDF using Puppeteer
    // Upload to S3
    // Update quotation with PDF URL
  }
}

@Processor('notifications')
export class NotificationProcessor {
  @Process('send-quotation-email')
  async sendQuotationEmail(job: Job) {
    const { quotationId, emailData } = job.data
    // Send email using SendGrid
    // Log email activity
  }
}
```

#### **3. File Upload Service (Direct S3 Upload)**
```typescript
@Injectable()
export class FilesService {
  constructor(
    private configService: ConfigService,
    private s3Service: S3Service,
  ) {}

  // Generate pre-signed URL for direct upload
  async generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    userId: number,
  ): Promise<PresignedUploadResponse> {
    const key = `uploads/${userId}/${Date.now()}-${fileName}`
    
    const presignedUrl = await this.s3Service.getSignedUrl('putObject', {
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
      ContentType: fileType,
      Expires: 300, // 5 minutes
    })

    return {
      uploadUrl: presignedUrl,
      key,
      downloadUrl: `https://${this.configService.get('AWS_S3_BUCKET')}.s3.amazonaws.com/${key}`,
    }
  }

  // Confirm upload completion
  async confirmUpload(key: string, userId: number): Promise<FileEntity> {
    // Verify file exists in S3
    const fileExists = await this.s3Service.headObject({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: key,
    }).promise()

    // Save file record in database
    return this.prisma.file.create({
      data: {
        key,
        originalName: key.split('/').pop(),
        mimeType: fileExists.ContentType,
        size: fileExists.ContentLength,
        uploadedBy: userId,
      },
    })
  }
}
```

### 🗄️ **Database Design (Prisma Schema)**

#### **Modern Database Schema**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  firstName String   @map("first_name")
  lastName  String   @map("last_name")
  isActive  Boolean  @default(true) @map("is_active")
  lastLogin DateTime? @map("last_login")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // RBAC relationships
  userRoles UserRole[]
  
  // Activity relationships
  createdQuotations Quotation[] @relation("CreatedBy")
  createdOrders     Order[]     @relation("CreatedBy")

  @@map("users")
}

model Role {
  id          Int    @id @default(autoincrement())
  name        String @unique
  description String?
  isActive    Boolean @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  userRoles       UserRole[]
  rolePermissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          Int    @id @default(autoincrement())
  resource    String // 'quotations', 'customers', etc.
  action      String // 'create', 'read', 'update', 'delete'
  description String?
  createdAt   DateTime @default(now()) @map("created_at")

  rolePermissions RolePermission[]

  @@unique([resource, action])
  @@map("permissions")
}

model UserRole {
  id     Int @id @default(autoincrement())
  userId Int @map("user_id")
  roleId Int @map("role_id")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role Role @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
}

model RolePermission {
  id           Int @id @default(autoincrement())
  roleId       Int @map("role_id")
  permissionId Int @map("permission_id")
  
  role       Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@map("role_permissions")
}

model Customer {
  id             Int      @id @default(autoincrement())
  customerNumber String   @unique @map("customer_number")
  companyName    String?  @map("company_name")
  contactPerson  String   @map("contact_person")
  email          String
  phone          String
  customerType   CustomerType @default(RETAIL) @map("customer_type")
  creditLimit    Decimal  @default(0) @map("credit_limit") @db.Decimal(15,2)
  paymentTerms   String   @default("Net 30") @map("payment_terms")
  gstNumber      String?  @map("gst_number")
  billingAddress Json?    @map("billing_address")
  shippingAddress Json?   @map("shipping_address")
  assignedToId   Int?     @map("assigned_to")
  status         CustomerStatus @default(ACTIVE)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  assignedTo User? @relation("AssignedCustomers", fields: [assignedToId], references: [id])
  quotations Quotation[]
  orders     Order[]

  @@map("customers")
}

model Product {
  id            Int      @id @default(autoincrement())
  name          String
  sku           String   @unique
  description   String?
  category      String?
  subcategory   String?
  brand         String?
  model         String?
  basePrice     Decimal  @map("base_price") @db.Decimal(12,2)
  costPrice     Decimal? @map("cost_price") @db.Decimal(12,2)
  specifications Json?
  images        Json?
  documents     Json?
  isActive      Boolean  @default(true) @map("is_active")
  isCustomizable Boolean @default(false) @map("is_customizable")
  leadTime      String?  @map("lead_time")
  warrantyTerms String?  @map("warranty_terms")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  quotationItems QuotationItem[]
  orderItems     OrderItem[]
  inventory      ProductInventory[]

  @@map("products")
}

model Quotation {
  id             Int      @id @default(autoincrement())
  quotationNumber String  @unique @map("quotation_number")
  customerId     Int?     @map("customer_id")
  customerInfo   Json     @map("customer_info")
  subtotal       Decimal  @db.Decimal(15,2)
  discountAmount Decimal  @default(0) @map("discount_amount") @db.Decimal(15,2)
  taxAmount      Decimal  @map("tax_amount") @db.Decimal(15,2)
  totalAmount    Decimal  @map("total_amount") @db.Decimal(15,2)
  validUntil     DateTime @map("valid_until")
  status         QuotationStatus @default(DRAFT)
  termsConditions String[] @map("terms_conditions")
  notes          String?
  publicToken    String?  @unique @map("public_token")
  pdfUrl         String?  @map("pdf_url")
  createdById    Int      @map("created_by")
  sentAt         DateTime? @map("sent_at")
  viewedAt       DateTime? @map("viewed_at")
  respondedAt    DateTime? @map("responded_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  customer  Customer? @relation(fields: [customerId], references: [id])
  createdBy User      @relation("CreatedBy", fields: [createdById], references: [id])
  items     QuotationItem[]
  order     Order?

  @@map("quotations")
}

model QuotationItem {
  id             Int      @id @default(autoincrement())
  quotationId    Int      @map("quotation_id")
  productId      Int      @map("product_id")
  productName    String   @map("product_name")
  productSku     String   @map("product_sku")
  specifications Json?
  quantity       Int
  unitPrice      Decimal  @map("unit_price") @db.Decimal(12,2)
  discount       Decimal  @default(0) @db.Decimal(12,2)
  lineTotal      Decimal  @map("line_total") @db.Decimal(15,2)
  deliveryTime   String?  @map("delivery_time")
  notes          String?
  createdAt      DateTime @default(now()) @map("created_at")

  quotation Quotation @relation(fields: [quotationId], references: [id], onDelete: Cascade)
  product   Product   @relation(fields: [productId], references: [id])

  @@map("quotation_items")
}

enum CustomerType {
  RETAIL
  WHOLESALE
  DISTRIBUTOR
  GOVERNMENT
}

enum CustomerStatus {
  ACTIVE
  INACTIVE
  BLOCKED
}

enum QuotationStatus {
  DRAFT
  SENT
  VIEWED
  APPROVED
  REJECTED
  EXPIRED
  CONVERTED
}
```

### 🔒 **Security Implementation (Modern & Secure)**

#### **Secure Authentication Flow**
```typescript
// JWT Strategy with httpOnly cookies
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: (req) => {
        // Extract JWT from httpOnly cookie instead of Authorization header
        return req?.cookies?.accessToken || null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    return { 
      id: payload.sub, 
      email: payload.email, 
      roles: payload.roles 
    };
  }
}

// Refresh Token Strategy
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: (req) => {
        return req?.cookies?.refreshToken || null;
      },
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refreshToken;
    return { ...payload, refreshToken };
  }
}

// Auth Controller with secure cookie handling
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto);
    
    // Set secure httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      domain: process.env.COOKIE_DOMAIN,
    };

    response.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    response.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      user: result.user,
      message: 'Login successful',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshTokens(@Req() req: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.refreshTokens(req.user['sub'], req.user['refreshToken']);
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      domain: process.env.COOKIE_DOMAIN,
    };

    response.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    response.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { message: 'Tokens refreshed successfully' };
  }
}
```

#### **Dynamic RBAC Implementation**
```typescript
// Advanced Role-Based Access Control
@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Check if user has required permissions
    for (const permission of requiredPermissions) {
      const hasPermission = await this.rbacService.hasPermission(
        user.id,
        permission.resource,
        permission.action,
      );

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }
}

// Permission decorator
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata('permissions', permissions);

// Usage in controllers
@Controller('quotations')
export class QuotationsController {
  @Get()
  @RequirePermissions({ resource: 'quotations', action: 'read' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  findAll() {
    // Only users with 'quotations:read' permission can access
  }

  @Post()
  @RequirePermissions({ resource: 'quotations', action: 'create' })
  @UseGuards(JwtAuthGuard, RbacGuard)
  create(@Body() createQuotationDto: CreateQuotationDto) {
    // Only users with 'quotations:create' permission can access
  }
}
```

### 📊 **API Design Standards (Modern)**

#### **GraphQL Alternative (tRPC)**
```typescript
// Consider tRPC for better type safety and developer experience
// trpc/router.ts
import { z } from 'zod';
import { router, procedure } from './trpc';

export const quotationRouter = router({
  getAll: procedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.enum(['draft', 'sent', 'approved']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const quotations = await ctx.prisma.quotation.findMany({
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        where: input.status ? { status: input.status } : undefined,
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      return {
        quotations,
        totalPages: Math.ceil(await ctx.prisma.quotation.count() / input.limit),
      };
    }),

  create: procedure
    .input(createQuotationSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.quotationService.create(input);
    }),

  sendToCustomer: procedure
    .input(z.object({
      id: z.number(),
      emailData: sendQuotationSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      return await ctx.quotationService.sendQuotation(input.id, input.emailData);
    }),
});

export type QuotationRouter = typeof quotationRouter;
```

#### **Enhanced API Response Format**
```typescript
// Standardized API responses with better error handling
export class ApiResponseDto<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data?: T;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  errors?: ValidationError[];

  @ApiProperty()
  meta?: {
    pagination?: PaginationMeta;
    timestamp: Date;
    version: string;
  };
}

// Global exception filter for consistent error responses
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || message;
        errors = (exceptionResponse as any).errors || [];
      }
    }

    const errorResponse: ApiResponseDto<null> = {
      success: false,
      message,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        timestamp: new Date(),
        version: process.env.API_VERSION || '1.0.0',
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

### ⚛️ **Frontend Architecture (Updated)**

#### **Secure Authentication Management (No localStorage)**
```typescript
// lib/store/authStore.ts - Secure authentication without localStorage
import { create } from 'zustand'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    set({ isLoading: true })
    try {
      // Login request - cookies are set automatically by server
      const response = await authAPI.login(credentials)
      
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  logout: async () => {
    try {
      await authAPI.logout() // Server clears cookies
      set({
        user: null,
        isAuthenticated: false,
      })
    } catch (error) {
      // Force logout even if API call fails
      set({
        user: null,
        isAuthenticated: false,
      })
    }
  },

  refreshToken: async () => {
    try {
      const response = await authAPI.refresh()
      set({ 
        user: response.data.user,
        isAuthenticated: true,
      })
    } catch (error) {
      // If refresh fails, user needs to login again
      set({
        user: null,
        isAuthenticated: false,
      })
      throw error
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      // Check if user is authenticated via API call
      const response = await authAPI.me()
      set({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },
}))
```

#### **Unified Application Structure (Single Next.js App)**
```typescript
// Single Next.js app with proper routing structure
// app/layout.tsx - Root layout with authentication check
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ReactQueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

// components/providers/AuthProvider.tsx
'use client'
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return <LoadingSpinner />
  }

  return <>{children}</>
}

// app/(public)/layout.tsx - Public pages layout
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  )
}

// app/admin/layout.tsx - Admin layout with protection
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRoles={['admin', 'sales']}>
      <div className="admin-layout">
        <AdminHeader />
        <AdminSidebar />
        <main className="admin-main">{children}</main>
      </div>
    </ProtectedRoute>
  )
}

// app/customer/layout.tsx - Customer portal layout
export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRoles={['customer']}>
      <div className="customer-layout">
        <CustomerHeader />
        <main className="customer-main">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
```

#### **Enhanced API Client with Automatic Token Refresh**
```typescript
// lib/api/client.ts - Enhanced API client with cookie-based auth
import axios, { AxiosResponse } from 'axios'
import { useAuthStore } from '@/lib/store/authStore'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  withCredentials: true, // Important: Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor with automatic token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Attempt to refresh token
        await apiClient.post('/auth/refresh')
        
        // Retry original request
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, redirect to login
        useAuthStore.getState().logout()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
```

### 🚀 **Deployment Strategy (Modern Container-based)**

#### **Docker Configuration (No PM2)**
```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/

# Dependencies
FROM base AS deps
RUN npm ci --only=production && npm cache clean --force

# Build
FROM base AS build
COPY . .
RUN npm ci
RUN npx prisma generate
RUN npm run build

# Production
FROM node:18-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nestjs:nodejs /app/package.json ./

USER nestjs
EXPOSE 3000

ENV NODE_ENV=production

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml - Production setup
version: '3.8'

services:
  api:
    build: 
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl:ro
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

#### **Updated Phase Timeline (Realistic Estimates)**

### **Phase 1: Foundation & Core Features (Weeks 1-14)**

#### **Backend Implementation (Weeks 1-8)**
```bash
Week 1-2: Modern Project Setup
- [ ] Initialize NestJS project with TypeScript
- [ ] Setup Prisma with PostgreSQL
- [ ] Configure Redis and BullMQ
- [ ] Docker containerization setup
- [ ] CI/CD pipeline basic configuration

Week 3-4: Authentication & RBAC
- [ ] Secure cookie-based JWT authentication
- [ ] Dynamic RBAC system implementation
- [ ] Password reset with email tokens
- [ ] Session management with Redis
- [ ] Security middleware (helmet, rate limiting)

Week 5-6: Core Models & APIs
- [ ] Prisma schema design and migrations
- [ ] Customer management APIs
- [ ] Product catalog APIs
- [ ] User management with RBAC
- [ ] File upload with S3 pre-signed URLs

Week 7-8: Quotation System Backend
- [ ] Quotation CRUD with complex business logic
- [ ] Queue-based PDF generation
- [ ] Email notification system
- [ ] Quotation workflow (send, approve, convert)
- [ ] Public quotation access with tokens
```

#### **Frontend Implementation (Weeks 6-14)**
```bash
Week 6-7: Modern Frontend Setup
- [ ] Next.js 13+ with App Router
- [ ] Secure authentication (no localStorage)
- [ ] React Query + Zustand state management
- [ ] Tailwind CSS with design system
- [ ] TypeScript strict configuration

Week 8-9: Core UI Components
- [ ] Design system components library
- [ ] Form handling with React Hook Form + Zod
- [ ] Data tables with sorting/filtering
- [ ] Modal, toast, and notification systems
- [ ] Responsive layout components

Week 10-12: Application Pages
- [ ] Unified app structure (public/admin/customer routes)
- [ ] Customer management interface
- [ ] Product catalog management
- [ ] User management with role assignment
- [ ] Dashboard with analytics widgets

Week 13-14: Quotation System Frontend
- [ ] Quotation builder with drag-and-drop
- [ ] PDF preview and generation
- [ ] Email composition interface
- [ ] Customer quotation portal
- [ ] Quotation approval workflow
```

### **Phase 2: Advanced Features (Weeks 15-22)**
```bash
Week 15-16: Order Processing
- [ ] Quote-to-order conversion
- [ ] Payment gateway integration (Razorpay)
- [ ] Order management workflow
- [ ] Invoice generation system

Week 17-18: Analytics & Reporting
- [ ] Business intelligence dashboard
- [ ] Custom report builder
- [ ] Data visualization components
- [ ] Export functionality (PDF, Excel)

Week 19-20: Performance & Security
- [ ] Database query optimization
- [ ] Redis caching implementation
- [ ] Security audit and hardening
- [ ] Performance monitoring setup

Week 21-22: Testing & Quality Assurance
- [ ] Comprehensive unit testing (90%+ coverage)
- [ ] Integration testing with test database
- [ ] E2E testing with Playwright
- [ ] Security penetration testing
```

### **Phase 3: Production & Optimization (Weeks 23-28)**
```bash
Week 23-24: Production Deployment
- [ ] Production infrastructure setup
- [ ] Database migration and seeding
- [ ] SSL certificates and domain setup
- [ ] Monitoring and alerting configuration

Week 25-26: Mobile Optimization
- [ ] Progressive Web App features
- [ ] Mobile-first responsive design
- [ ] Offline functionality
- [ ] Push notifications

Week 27-28: Documentation & Training
- [ ] API documentation completion
- [ ] User manual creation
- [ ] Admin training materials
- [ ] Team knowledge transfer
```

This updated plan addresses all the critical improvements:

1. ✅ **Modern Backend**: NestJS + Prisma instead of Express + Sequelize
2. ✅ **Secure Auth**: httpOnly cookies instead of localStorage
3. ✅ **Queue-based Processing**: BullMQ for emails/PDFs
4. ✅ **Dynamic RBAC**: Database-driven permissions
5. ✅ **Direct S3 Uploads**: Pre-signed URLs instead of Multer
6. ✅ **Container-based Deployment**: Docker without PM2
7. ✅ **Realistic Timeline**: 28 weeks instead of 18-24
8. ✅ **Single Frontend App**: Unified structure with proper routing

The architecture is now production-ready, secure, and follows modern best practices while maintaining the separation of concerns you wanted.

### 📊 **API Design Standards**

#### **RESTful API Structure**
```javascript
// Authentication Endpoints
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

// Quotation Endpoints
GET    /api/v1/quotations
POST   /api/v1/quotations
GET    /api/v1/quotations/:id
PUT    /api/v1/quotations/:id
DELETE /api/v1/quotations/:id
POST   /api/v1/quotations/:id/send
POST   /api/v1/quotations/:id/duplicate
GET    /api/v1/quotations/public/:token
POST   /api/v1/quotations/:id/convert-to-order

// Customer Endpoints
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PUT    /api/v1/customers/:id
DELETE /api/v1/customers/:id
GET    /api/v1/customers/:id/quotations
GET    /api/v1/customers/:id/orders
POST   /api/v1/customers/import
GET    /api/v1/customers/export

// Product Endpoints
GET    /api/v1/products
POST   /api/v1/products
GET    /api/v1/products/:id
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
GET    /api/v1/products/search
POST   /api/v1/products/bulk-update
GET    /api/v1/products/categories

// Order Endpoints
GET    /api/v1/orders
POST   /api/v1/orders
GET    /api/v1/orders/:id
PUT    /api/v1/orders/:id
DELETE /api/v1/orders/:id
POST   /api/v1/orders/:id/cancel
GET    /api/v1/orders/:id/invoice
POST   /api/v1/orders/:id/payment
```

#### **Standard API Response Format**
```javascript
// Success Response
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "pagination": {  // For list endpoints
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## Frontend Architecture (Next.js)

### ⚛️ **Technology Stack**
```
Frontend Technology Stack:
├── Framework: Next.js 13+ (App Router)
├── Language: TypeScript 5+
├── UI Library: React 18+
├── Styling: Tailwind CSS 3+
├── State Management: Zustand + React Query
├── Forms: React Hook Form + Zod
├── HTTP Client: Axios
├── UI Components: Headless UI + Custom
├── Icons: Lucide React
├── Date/Time: Date-fns
├── Charts: Chart.js / Recharts
├── PDF Viewer: React-PDF
├── Testing: Jest + React Testing Library
├── E2E Testing: Playwright
└── Build Tool: Next.js built-in
```

### 🏗️ **Frontend Project Structure**
```
sanvi-frontend/
├── src/
│   ├── app/                    # Next.js 13+ App Router
│   │   ├── (public)/          # Public website routes
│   │   │   ├── page.tsx       # Homepage
│   │   │   ├── products/      # Product catalog
│   │   │   ├── about/         # About page
│   │   │   └── contact/       # Contact page
│   │   │
│   │   ├── admin/             # Admin panel routes
│   │   │   ├── layout.tsx     # Admin layout
│   │   │   ├── page.tsx       # Admin dashboard
│   │   │   ├── quotations/    # Quotation management
│   │   │   ├── customers/     # Customer management
│   │   │   ├── products/      # Product management
│   │   │   ├── orders/        # Order management
│   │   │   └── settings/      # Admin settings
│   │   │
│   │   ├── customer/          # Customer portal routes
│   │   │   ├── layout.tsx     # Customer layout
│   │   │   ├── page.tsx       # Customer dashboard
│   │   │   ├── quotations/    # View quotations
│   │   │   ├── orders/        # View orders
│   │   │   └── profile/       # Customer profile
│   │   │
│   │   ├── auth/              # Authentication pages
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   │
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── loading.tsx        # Global loading UI
│   │
│   ├── components/            # Reusable components
│   │   ├── ui/               # Basic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── forms/            # Form components
│   │   │   ├── QuotationForm.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   └── LoginForm.tsx
│   │   │
│   │   ├── layout/           # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   │
│   │   ├── business/         # Business logic components
│   │   │   ├── QuotationBuilder.tsx
│   │   │   ├── ProductCatalog.tsx
│   │   │   ├── CustomerManager.tsx
│   │   │   └── OrderTracker.tsx
│   │   │
│   │   └── common/           # Common components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── SearchBox.tsx
│   │       └── Pagination.tsx
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── api/              # API client setup
│   │   │   ├── client.ts     # Axios configuration
│   │   │   ├── auth.ts       # Auth API calls
│   │   │   ├── quotations.ts # Quotation API calls
│   │   │   ├── customers.ts  # Customer API calls
│   │   │   ├── products.ts   # Product API calls
│   │   │   └── orders.ts     # Order API calls
│   │   │
│   │   ├── hooks/            # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useQuotations.ts
│   │   │   ├── useCustomers.ts
│   │   │   ├── useProducts.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── store/            # State management
│   │   │   ├── authStore.ts  # Authentication state
│   │   │   ├── quotationStore.ts
│   │   │   ├── customerStore.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/            # Utility functions
│   │   │   ├── format.ts     # Formatting utilities
│   │   │   ├── validation.ts # Zod schemas
│   │   │   ├── constants.ts  # App constants
│   │   │   ├── helpers.ts    # Helper functions
│   │   │   └── types.ts      # TypeScript types
│   │   │
│   │   └── config/           # Configuration files
│   │       ├── api.ts        # API configuration
│   │       ├── constants.ts  # App constants
│   │       └── env.ts        # Environment variables
│   │
│   ├── styles/               # Styling files
│   │   ├── globals.css       # Global styles
│   │   ├── components.css    # Component styles
│   │   └── tailwind.config.js
│   │
│   └── types/                # TypeScript definitions
│       ├── api.ts            # API response types
│       ├── auth.ts           # Authentication types
│       ├── quotation.ts      # Quotation types
│       ├── customer.ts       # Customer types
│       ├── product.ts        # Product types
│       └── common.ts         # Common types
│
├── public/                   # Static assets
│   ├── images/
│   ├── icons/
│   ├── documents/
│   └── favicon.ico
│
├── tests/                    # Test files
│   ├── __mocks__/
│   ├── components/
│   ├── pages/
│   └── utils/
│
├── docs/                     # Documentation
├── .env.local.example
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

### 🎯 **Frontend Core Features**

#### **1. Multi-Application Architecture**
```typescript
// Public Website
- Homepage with company information
- Product catalog with search and filtering
- Contact forms and inquiry submission
- About us, services, and company information
- SEO optimized pages for search engines

// Admin Panel
- Dashboard with business analytics
- Quotation management (create, edit, send, track)
- Customer relationship management (CRM)
- Product catalog management
- Order processing and tracking
- User management and permissions
- Reports and analytics

// Customer Portal
- Customer dashboard with order history
- Quotation viewing and approval
- Profile management
- Order tracking
- Document downloads (invoices, quotations)
```

#### **2. State Management Strategy**
```typescript
// Authentication State (Zustand)
interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

// API State (React Query)
- Automatic caching of API responses
- Background refetching for fresh data
- Optimistic updates for better UX
- Error handling and retry logic
- Loading states management

// Local State (React Hooks)
- Form state management
- UI state (modals, dropdowns)
- Component-specific state
```

#### **3. Form Management**
```typescript
// Quotation Form Example
const QuotationForm = () => {
  const form = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      customerId: '',
      items: [],
      validDays: 30,
      notes: ''
    }
  })

  const createQuotation = useMutation({
    mutationFn: quotationAPI.create,
    onSuccess: () => {
      toast.success('Quotation created successfully')
      router.push('/admin/quotations')
    }
  })

  return (
    <form onSubmit={form.handleSubmit(createQuotation.mutate)}>
      {/* Form fields */}
    </form>
  )
}
```

### 📱 **Responsive Design Strategy**

#### **Mobile-First Approach**
```css
/* Tailwind CSS Responsive Classes */
.quotation-card {
  @apply 
    w-full                    /* Mobile: Full width */
    md:w-1/2                 /* Tablet: Half width */
    lg:w-1/3                 /* Desktop: Third width */
    xl:w-1/4                 /* Large: Quarter width */
    p-4                      /* Mobile: Small padding */
    md:p-6                   /* Tablet: Medium padding */
    lg:p-8;                  /* Desktop: Large padding */
}

/* Responsive Navigation */
.navigation {
  @apply
    flex flex-col            /* Mobile: Vertical stack */
    md:flex-row              /* Tablet+: Horizontal layout */
    space-y-2                /* Mobile: Vertical spacing */
    md:space-y-0             /* Tablet+: No vertical spacing */
    md:space-x-4;            /* Tablet+: Horizontal spacing */
}
```

#### **Device-Specific Features**
```typescript
// Mobile Optimizations
- Touch-friendly button sizes (min 44px)
- Swipe gestures for navigation
- Pull-to-refresh functionality
- Optimized image loading
- Reduced data usage

// Tablet Optimizations
- Split-screen layouts
- Enhanced form layouts
- Better use of screen space
- Touch and keyboard support

// Desktop Optimizations
- Keyboard shortcuts
- Advanced filtering and search
- Multi-column layouts
- Hover states and tooltips
- Right-click context menus
```

---

## Communication Layer

### 🔗 **API Communication Strategy**

#### **HTTP Client Configuration**
```typescript
// lib/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for authentication
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)
```

#### **API Service Layer**
```typescript
// lib/api/quotations.ts
export const quotationAPI = {
  // Get all quotations with pagination
  getAll: (params: QuotationListParams): Promise<ApiResponse<Quotation[]>> =>
    apiClient.get('/quotations', { params }),

  // Get single quotation
  getById: (id: string): Promise<ApiResponse<Quotation>> =>
    apiClient.get(`/quotations/${id}`),

  // Create new quotation
  create: (data: CreateQuotationRequest): Promise<ApiResponse<Quotation>> =>
    apiClient.post('/quotations', data),

  // Update quotation
  update: (id: string, data: UpdateQuotationRequest): Promise<ApiResponse<Quotation>> =>
    apiClient.put(`/quotations/${id}`, data),

  // Delete quotation
  delete: (id: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/quotations/${id}`),

  // Send quotation to customer
  send: (id: string, emailData: SendQuotationRequest): Promise<ApiResponse<void>> =>
    apiClient.post(`/quotations/${id}/send`, emailData),

  // Convert quotation to order
  convertToOrder: (id: string): Promise<ApiResponse<Order>> =>
    apiClient.post(`/quotations/${id}/convert-to-order`),

  // Get public quotation (no auth required)
  getPublic: (token: string): Promise<ApiResponse<Quotation>> =>
    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/quotations/public/${token}`)
}
```

#### **React Query Integration**
```typescript
// lib/hooks/useQuotations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export const useQuotations = (params: QuotationListParams) => {
  return useQuery({
    queryKey: ['quotations', params],
    queryFn: () => quotationAPI.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useQuotation = (id: string) => {
  return useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationAPI.getById(id),
    enabled: !!id,
  })
}

export const useCreateQuotation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: quotationAPI.create,
    onSuccess: () => {
      // Invalidate quotations list to refresh data
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

export const useSendQuotation = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, emailData }: { id: string; emailData: SendQuotationRequest }) =>
      quotationAPI.send(id, emailData),
    onSuccess: (_, { id }) => {
      // Update specific quotation in cache
      queryClient.invalidateQueries({ queryKey: ['quotation', id] })
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
```

### 🔒 **Authentication Flow**

#### **Frontend Authentication Management**
```typescript
// lib/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true })
        try {
          const response = await authAPI.login(credentials)
          const { user, token } = response.data
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })
          
          // Set token in API client
          apiClient.defaults.headers.Authorization = `Bearer ${token}`
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        // Remove token from API client
        delete apiClient.defaults.headers.Authorization
        
        // Clear all cached data
        queryClient.clear()
      },

      refreshToken: async () => {
        try {
          const response = await authAPI.refresh()
          const { token } = response.data
          
          set({ token })
          apiClient.defaults.headers.Authorization = `Bearer ${token}`
        } catch (error) {
          // If refresh fails, logout user
          get().logout()
          throw error
        }
      },

      updateProfile: async (data) => {
        const response = await authAPI.updateProfile(data)
        set({ user: response.data })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
```

#### **Protected Routes Implementation**
```typescript
// components/auth/ProtectedRoute.tsx
interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole[]
  fallback?: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = [],
  fallback = <div>Access Denied</div>,
}) => {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole.length > 0 && !requiredRole.includes(user?.role)) {
    return fallback
  }

  return <>{children}</>
}

// Usage in layout
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute requiredRole={['admin', 'sales']}>
      <div className="admin-layout">
        <AdminHeader />
        <AdminSidebar />
        <main className="main-content">{children}</main>
      </div>
    </ProtectedRoute>
  )
}
```

---

## Development Workflow

### 🔄 **Development Process**

#### **1. Backend Development Workflow**
```bash
# Development Setup
git clone <backend-repo>
cd sanvi-backend
npm install
cp .env.example .env
# Configure environment variables

# Database Setup
npm run db:migrate
npm run db:seed

# Development Server
npm run dev          # Start development server with nodemon
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run format       # Run Prettier

# API Testing
npm run test:api     # Run API integration tests
npm run docs:serve   # Serve Swagger documentation

# Production Build
npm run build        # Build for production
npm run start        # Start production server
```

#### **2. Frontend Development Workflow**
```bash
# Development Setup
git clone <frontend-repo>
cd sanvi-frontend
npm install
cp .env.local.example .env.local
# Configure environment variables

# Development Server
npm run dev          # Start Next.js development server
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# E2E Testing
npm run test:e2e     # Run Playwright tests
npm run test:e2e:ui  # Run tests with UI

# Production Build
npm run build        # Build for production
npm run start        # Start production server
npm run export       # Export static files (if needed)
```

#### **3. Cross-Team Communication**

##### **API Contract Management**
```typescript
// Shared API Contract (OpenAPI/Swagger)
// backend/docs/api-contract.yaml
openapi: 3.0.0
info:
  title: Sanvi Machinery API
  version: 1.0.0

paths:
  /api/v1/quotations:
    get:
      summary: Get quotations list
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
      responses:
        200:
          description: Quotations list
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Quotation'

components:
  schemas:
    Quotation:
      type: object
      properties:
        id:
          type: integer
        quotationNumber:
          type: string
        customerInfo:
          $ref: '#/components/schemas/CustomerInfo'
```

##### **Type Sharing Strategy**
```typescript
// Option 1: Copy types from backend to frontend
// backend/src/types/api.ts -> frontend/src/types/api.ts

// Option 2: Generate types from OpenAPI spec
npm run generate-types    # Generate TypeScript types from OpenAPI

// Option 3: Shared types repository (future consideration)
// @sanvi/shared-types npm package
```

### 🧪 **Testing Strategy**

#### **Backend Testing**
```javascript
// Unit Tests
describe('QuotationService', () => {
  test('should create quotation with valid data', async () => {
    const quotationData = {
      customerId: 1,
      items: [
        { productId: 1, quantity: 2, unitPrice: 1000 }
      ]
    }
    
    const quotation = await QuotationService.create(quotationData)
    
    expect(quotation.id).toBeDefined()
    expect(quotation.total).toBe(2000)
  })
})

// Integration Tests
describe('POST /api/v1/quotations', () => {
  test('should create quotation successfully', async () => {
    const response = await request(app)
      .post('/api/v1/quotations')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(validQuotationData)
    
    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBeDefined()
  })
})
```

#### **Frontend Testing**
```typescript
// Component Tests
import { render, screen, fireEvent } from '@testing-library/react'
import { QuotationForm } from './QuotationForm'

test('should submit quotation form with valid data', async () => {
  const mockOnSubmit = jest.fn()
  
  render(<QuotationForm onSubmit={mockOnSubmit} />)
  
  // Fill form fields
  fireEvent.change(screen.getByLabelText(/customer name/i), {
    target: { value: 'Test Customer' }
  })
  
  // Submit form
  fireEvent.click(screen.getByRole('button', { name: /create quotation/i }))
  
  await waitFor(() => {
    expect(mockOnSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Test Customer'
      })
    )
  })
})

// E2E Tests (Playwright)
test('complete quotation creation flow', async ({ page }) => {
  // Login
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'admin@sanvi.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')
  
  // Navigate to quotation creation
  await page.goto('/admin/quotations/create')
  
  // Fill quotation form
  await page.fill('[name="customerName"]', 'Test Customer')
  await page.click('[data-testid="add-product"]')
  await page.selectOption('[name="productId"]', '1')
  
  // Submit form
  await page.click('button[type="submit"]')
  
  // Verify success
  await expect(page.locator('.success-message')).toBeVisible()
})
```

---

## Phase-wise Implementation

### 🚀 **Phase 1: Foundation & Core Features (Weeks 1-10)**

#### **Backend Implementation (Weeks 1-6)**

##### **Week 1-2: Project Setup & Database**
```bash
Backend Tasks:
- [ ] Initialize Express.js project with TypeScript
- [ ] Setup PostgreSQL database and Sequelize ORM
- [ ] Configure Redis for caching and sessions
- [ ] Setup basic project structure and configuration
- [ ] Create database migrations for core tables
- [ ] Setup environment configuration management
- [ ] Configure logging with Winston
- [ ] Setup basic error handling middleware
```

##### **Week 3-4: Authentication & Core APIs**
```bash
Backend Tasks:
- [ ] Implement JWT authentication system
- [ ] Create User model and authentication endpoints
- [ ] Setup role-based access control middleware
- [ ] Create Customer model and CRUD APIs
- [ ] Create Product model and CRUD APIs
- [ ] Implement API validation with Joi/Yup
- [ ] Setup API documentation with Swagger
- [ ] Create database seeders for test data
```

##### **Week 5-6: Quotation System Backend**
```bash
Backend Tasks:
- [ ] Create Quotation and QuotationItem models
- [ ] Implement quotation CRUD endpoints
- [ ] Build quotation calculation logic
- [ ] Create PDF generation service with Puppeteer
- [ ] Implement email service with NodeMailer
- [ ] Create quotation workflow endpoints (send, approve)
- [ ] Setup file upload service for attachments
- [ ] Implement quotation analytics endpoints
```

#### **Frontend Implementation (Weeks 4-10)**

##### **Week 4-5: Project Setup & Authentication**
```bash
Frontend Tasks:
- [ ] Initialize Next.js project with TypeScript
- [ ] Setup Tailwind CSS and basic styling
- [ ] Configure React Query for API state management
- [ ] Create authentication store with Zustand
- [ ] Build login/logout functionality
- [ ] Create protected route components
- [ ] Setup API client with Axios
- [ ] Create basic layout components (Header, Sidebar, Footer)
```

##### **Week 6-7: Admin Panel Foundation**
```bash
Frontend Tasks:
- [ ] Create admin dashboard layout
- [ ] Build customer management interface
- [ ] Create product management interface
- [ ] Implement data tables with sorting and pagination
- [ ] Create form components with React Hook Form
- [ ] Setup validation with Zod schemas
- [ ] Create reusable UI components (Button, Input, Modal)
- [ ] Implement error handling and loading states
```

##### **Week 8-10: Quotation System Frontend**
```bash
Frontend Tasks:
- [ ] Build quotation builder interface
- [ ] Create quotation list and detail views
- [ ] Implement PDF preview functionality
- [ ] Build email composition interface
- [ ] Create customer quotation portal
- [ ] Implement quotation approval workflow
- [ ] Build quotation analytics dashboard
- [ ] Create responsive mobile layouts
```

### 🎯 **Phase 2: Advanced Features (Weeks 11-18)**

#### **Week 11-12: Enhanced Customer Management**
```bash
Backend Tasks:
- [ ] Implement advanced customer search and filtering
- [ ] Create customer segmentation logic
- [ ] Build credit management system
- [ ] Implement communication history tracking
- [ ] Create customer analytics endpoints

Frontend Tasks:
- [ ] Build advanced customer management UI
- [ ] Create customer profile management
- [ ] Implement customer timeline view
- [ ] Build customer analytics dashboard
- [ ] Create customer import/export functionality
```

#### **Week 13-14: Product & Inventory Management**
```bash
Backend Tasks:
- [ ] Implement multi-location inventory system
- [ ] Create product specification management
- [ ] Build pricing rules engine
- [ ] Implement product search with Elasticsearch
- [ ] Create product analytics endpoints

Frontend Tasks:
- [ ] Build advanced product catalog interface
- [ ] Create inventory management UI
- [ ] Implement product specification editor
- [ ] Build pricing configuration interface
- [ ] Create product analytics dashboard
```

#### **Week 15-16: Order Processing System**
```bash
Backend Tasks:
- [ ] Create Order and OrderItem models
- [ ] Implement quote-to-order conversion
- [ ] Build order processing workflow
- [ ] Integrate payment gateway (Razorpay)
- [ ] Create invoice generation system
- [ ] Implement order tracking system

Frontend Tasks:
- [ ] Build order management interface
- [ ] Create order processing workflow UI
- [ ] Implement payment integration
- [ ] Build invoice management system
- [ ] Create order tracking interface
```

#### **Week 17-18: Analytics & Reporting**
```bash
Backend Tasks:
- [ ] Create comprehensive analytics system
- [ ] Build business intelligence endpoints
- [ ] Implement data aggregation and reporting
- [ ] Create export functionality for reports
- [ ] Setup automated report generation

Frontend Tasks:
- [ ] Build comprehensive analytics dashboard
- [ ] Create interactive charts and graphs
- [ ] Implement report generation interface
- [ ] Build data export functionality
- [ ] Create automated report scheduling
```

### 🚀 **Phase 3: Optimization & Mobile (Weeks 19-24)**

#### **Week 19-20: Performance Optimization**
```bash
Backend Tasks:
- [ ] Implement advanced caching strategies
- [ ] Optimize database queries and indexing
- [ ] Setup API rate limiting and throttling
- [ ] Implement background job processing
- [ ] Performance monitoring and optimization

Frontend Tasks:
- [ ] Implement code splitting and lazy loading
- [ ] Optimize bundle size and loading times
- [ ] Add Progressive Web App features
- [ ] Implement offline functionality
- [ ] Performance monitoring and optimization
```

#### **Week 21-22: Mobile Optimization**
```bash
Frontend Tasks:
- [ ] Create fully responsive mobile layouts
- [ ] Implement touch-friendly interfaces
- [ ] Add mobile-specific features (swipe, pull-to-refresh)
- [ ] Optimize for mobile performance
- [ ] Create mobile app-like experience (PWA)
- [ ] Test across different devices and browsers
```

#### **Week 23-24: Testing & Deployment**
```bash
Backend Tasks:
- [ ] Comprehensive API testing
- [ ] Performance and load testing
- [ ] Security testing and hardening
- [ ] Production deployment setup
- [ ] Monitoring and alerting setup

Frontend Tasks:
- [ ] Comprehensive component testing
- [ ] End-to-end testing with Playwright
- [ ] Cross-browser compatibility testing
- [ ] Production deployment setup
- [ ] Performance monitoring setup
```

---

## Deployment Strategy

### 🌐 **Production Infrastructure**

#### **Backend Deployment**
```yaml
# Docker Configuration
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]

# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sanvi_production
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### **Frontend Deployment**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    domains: ['api.sanvi-machinery.com', 's3.amazonaws.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/v1/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
```

#### **Deployment Environments**

##### **Development Environment**
```bash
Backend: http://localhost:3001
Frontend: http://localhost:3000
Database: PostgreSQL on localhost
Cache: Redis on localhost
```

##### **Staging Environment**
```bash
Backend: https://api-staging.sanvi-machinery.com
Frontend: https://staging.sanvi-machinery.com
Database: Managed PostgreSQL (DigitalOcean/AWS)
Cache: Managed Redis
```

##### **Production Environment**
```bash
Backend: https://api.sanvi-machinery.com
Frontend: https://sanvi-machinery.com
Admin Panel: https://admin.sanvi-machinery.com
Customer Portal: https://portal.sanvi-machinery.com
Database: Managed PostgreSQL with replicas
Cache: Redis cluster
CDN: CloudFlare for static assets
```

### 🚀 **CI/CD Pipeline**

#### **Backend CI/CD**
```yaml
# .github/workflows/backend-deploy.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: ./backend

      - name: Run tests
        run: npm test
        working-directory: ./backend
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /app/sanvi-backend
            git pull origin main
            npm ci --only=production
            npm run build
            npm run migrate
            pm2 restart sanvi-api
```

#### **Frontend CI/CD**
```yaml
# .github/workflows/frontend-deploy.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: ./frontend

      - name: Run tests
        run: npm test
        working-directory: ./frontend

      - name: Build application
        run: npm run build
        working-directory: ./frontend
        env:
          NEXT_PUBLIC_API_URL: https://api.sanvi-machinery.com

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/vercel-action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

---

## Team Structure & Responsibilities

### 👥 **Team Organization**

#### **Backend Team (2-3 Developers)**
```typescript
Backend Team Responsibilities:
├── Lead Backend Developer
│   ├── Architecture decisions
│   ├── Database design and optimization
│   ├── API design and documentation
│   ├── Security implementation
│   └── Performance optimization
│
├── Backend Developer
│   ├── API endpoint implementation
│   ├── Business logic development
│   ├── Database queries and operations
│   ├── Integration with external services
│   └── Unit and integration testing
│
└── DevOps Engineer (Shared)
    ├── Deployment pipeline setup
    ├── Infrastructure management
    ├── Monitoring and alerting
    ├── Database management
    └── Security hardening
```

#### **Frontend Team (2-3 Developers)**
```typescript
Frontend Team Responsibilities:
├── Lead Frontend Developer
│   ├── Architecture decisions
│   ├── Component library design
│   ├── State management strategy
│   ├── Performance optimization
│   └── UI/UX implementation standards
│
├── Frontend Developer
│   ├── Component development
│   ├── Page and layout implementation
│   ├── API integration
│   ├── Responsive design implementation
│   └── Testing implementation
│
└── UI/UX Designer (Shared)
    ├── User interface design
    ├── User experience optimization
    ├── Responsive design guidelines
    ├── Design system maintenance
    └── Usability testing
```

### 🤝 **Communication & Collaboration**

#### **Daily Workflow**
```bash
Daily Standup (9:00 AM):
- Each team reports progress and blockers
- Cross-team dependencies discussed
- API contract changes communicated

Weekly Planning (Monday):
- Sprint planning with both teams
- API contract reviews
- Integration testing planning

Monthly Reviews:
- Architecture review
- Performance analysis
- Security assessment
- Team feedback and improvements
```

#### **Documentation & Knowledge Sharing**
```typescript
Documentation Strategy:
├── Backend Team
│   ├── API documentation (Swagger)
│   ├── Database schema documentation
│   ├── Deployment guides
│   └── Troubleshooting guides
│
├── Frontend Team
│   ├── Component library documentation
│   ├── State management guides
│   ├── Design system documentation
│   └── Testing guidelines
│
└── Shared Documentation
    ├── Project architecture overview
    ├── Development workflow guides
    ├── Environment setup instructions
    └── Troubleshooting guides
```

### 📋 **Success Metrics & KPIs**

#### **Development Metrics**
```typescript
Team Performance Metrics:
├── Development Velocity
│   ├── Story points completed per sprint
│   ├── Feature delivery timeline adherence
│   └── Bug resolution time
│
├── Code Quality
│   ├── Test coverage (>90%)
│   ├── Code review completion rate
│   └── Technical debt ratio
│
├── Collaboration
│   ├── Cross-team communication frequency
│   ├── API contract compliance
│   └── Integration issue resolution time
│
└── Business Impact
    ├── Feature adoption rate
    ├── User satisfaction scores
    └── Performance improvement metrics
```

#### **Technical Performance Targets**
```typescript
Performance Benchmarks:
├── Backend Performance
│   ├── API response time < 200ms
│   ├── Database query time < 50ms
│   ├── System uptime > 99.9%
│   └── Error rate < 0.1%
│
├── Frontend Performance
│   ├── Page load time < 2 seconds
│   ├── First contentful paint < 1 second
│   ├── Core Web Vitals scores > 90
│   └── Bundle size < 500KB gzipped
│
└── Integration Performance
    ├── End-to-end test success rate > 95%
    ├── API integration error rate < 0.5%
    └── Data synchronization accuracy > 99.9%
```

---

## Conclusion

This comprehensive separate backend and frontend architecture plan provides a robust, scalable, and maintainable foundation for the Sanvi Machinery platform. The traditional API-first approach ensures:

### ✅ **Key Benefits**
- **Clear Separation of Concerns**: Backend and frontend teams can work independently
- **Technology Flexibility**: Each layer can evolve independently
- **Scalability**: Individual components can be scaled based on demand
- **Maintainability**: Easier to maintain and debug separate codebases
- **Team Specialization**: Teams can focus on their areas of expertise

### 🎯 **Expected Outcomes**
- **Development Speed**: 20-30% faster development after initial setup
- **Code Quality**: Higher quality through specialized focus
- **Scalability**: Ready for future growth and expansion
- **Maintenance**: Easier long-term maintenance and updates
- **Team Productivity**: Higher team satisfaction and productivity

### 📈 **Business Impact**
- **Faster Time to Market**: Parallel development capabilities
- **Lower Technical Debt**: Clean architecture from the start
- **Better User Experience**: Specialized frontend optimization
- **Higher Reliability**: Robust backend architecture
- **Future-Ready**: Prepared for mobile apps, integrations, and scaling

This architecture supports the core business goal of transforming Sanvi Machinery into a leading B2B e-commerce platform with the quotation system as the primary differentiator, while maintaining the flexibility to evolve and scale as the business grows.