import { faker } from '@faker-js/faker';
import { Decimal } from 'decimal.js';
import {
  User,
  Customer,
  Product,
  Quotation,
  QuotationItem,
  Order,
  OrderItem,
  Category,
  CustomerType,
  PaymentTerms,
  QuotationStatus,
  OrderStatus,
  Currency,
} from '@prisma/client';

export class TestDataFactory {
  static createUser(overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      email: faker.internet.email(),
      passwordHash: '$2b$10$hashedpassword', // Mock hashed password
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      isActive: true,
      lastLoginAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerified: true,
      emailVerificationToken: null,
      ...overrides,
    };
  }

  static createCustomer(overrides: Partial<Customer> = {}): Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      companyName: faker.company.name(),
      contactPerson: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      alternatePhone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: 'India',
      postalCode: faker.location.zipCode(),
      customerType: faker.helpers.enumValue(CustomerType),
      creditLimit: new Decimal(overrides.creditLimit ?? faker.number.float({ min: 10000, max: 1000000, fractionDigits: 2 })),
      paymentTerms: faker.helpers.enumValue(PaymentTerms),
      taxId: faker.string.alphanumeric(10),
      gstNumber: faker.string.alphanumeric(15),
      notes: faker.lorem.sentence(),
      isActive: true,
      ...overrides,
    };
  }

  static createCategory(overrides: Partial<Category> = {}): Omit<Category, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: faker.commerce.department(),
      description: faker.lorem.sentence(),
      parentId: null,
      isActive: true,
      ...overrides,
    };
  }

  static createProduct(overrides: Partial<Product> = {}): Omit<Product, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      sku: faker.string.alphanumeric(8).toUpperCase(),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      categoryId: null,
      basePrice: new Decimal(overrides.basePrice ?? faker.number.float({ min: 1000, max: 1000000, fractionDigits: 2 })),
      currency: Currency.INR,
      specifications: {
        weight: `${faker.number.int({ min: 10, max: 5000 })}kg`,
        power: `${faker.number.int({ min: 1, max: 50 })}HP`,
        dimensions: `${faker.number.int({ min: 1, max: 10 })}m x ${faker.number.int({ min: 1, max: 10 })}m`,
      },
      images: [faker.image.url(), faker.image.url()],
      inventoryCount: faker.number.int({ min: 0, max: 100 }),
      minOrderQty: 1,
      isActive: true,
      ...overrides,
    };
  }

  static createQuotation(overrides: Partial<Quotation> = {}): Omit<Quotation, 'id' | 'createdAt' | 'updatedAt'> {
    const subtotal = new Decimal(overrides.subtotal ?? faker.number.float({ min: 10000, max: 1000000, fractionDigits: 2 }));
    const discountAmount = new Decimal(overrides.discountAmount ?? faker.number.float({ min: 0, max: 100000, fractionDigits: 2 }));
    const taxAmount = new Decimal(overrides.taxAmount ?? faker.number.float({ min: 0, max: 180000, fractionDigits: 2 }));
    const totalAmount = new Decimal(overrides.totalAmount ?? subtotal.minus(discountAmount).plus(taxAmount));

    return {
      quotationNumber: `QUO-${faker.date.recent().getFullYear()}-${faker.string.numeric(6)}`,
      customerId: faker.string.uuid(),
      status: faker.helpers.enumValue(QuotationStatus),
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      validUntil: faker.date.future(),
      termsConditions: faker.lorem.paragraph(),
      notes: faker.lorem.sentence(),
      pdfUrl: null,
      emailSentAt: null,
      customerViewedAt: null,
      customerRespondedAt: null,
      createdByUserId: null,
      ...overrides,
    };
  }

  static createQuotationItem(overrides: Partial<QuotationItem> = {}): Omit<QuotationItem, 'id'> {
    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = new Decimal(overrides.unitPrice ?? faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }));
    const discountPercentage = new Decimal(overrides.discountPercentage ?? faker.number.float({ min: 0, max: 20, fractionDigits: 2 }));
    const discountAmount = new Decimal(overrides.discountAmount ?? unitPrice.times(quantity).times(discountPercentage).dividedBy(100));
    const lineTotal = new Decimal(overrides.lineTotal ?? unitPrice.times(quantity).minus(discountAmount));

    return {
      quotationId: faker.string.uuid(),
      productId: faker.string.uuid(),
      quantity,
      unitPrice,
      discountPercentage,
      discountAmount,
      lineTotal,
      customSpecifications: {
        color: faker.color.human(),
        customFeature: faker.lorem.word(),
      },
      deliveryTimeline: `${faker.number.int({ min: 1, max: 30 })} days`,
      ...overrides,
    };
  }

  static createOrder(overrides: Partial<Order> = {}): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> {
    const subtotal = new Decimal(overrides.subtotal ?? faker.number.float({ min: 10000, max: 1000000, fractionDigits: 2 }));
    const discountAmount = new Decimal(overrides.discountAmount ?? faker.number.float({ min: 0, max: 100000, fractionDigits: 2 }));
    const taxAmount = new Decimal(overrides.taxAmount ?? faker.number.float({ min: 0, max: 180000, fractionDigits: 2 }));
    const totalAmount = new Decimal(overrides.totalAmount ?? subtotal.minus(discountAmount).plus(taxAmount));

    return {
      orderNumber: `ORD-${faker.date.recent().getFullYear()}-${faker.string.numeric(6)}`,
      quotationId: null,
      customerId: faker.string.uuid(),
      status: faker.helpers.enumValue(OrderStatus),
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      paymentStatus: 'PENDING',
      paymentId: null,
      shippingAddress: faker.location.streetAddress({ useFullAddress: true }),
      expectedDelivery: faker.date.future(),
      createdByUserId: null,
      ...overrides,
    };
  }

  static createOrderItem(overrides: Partial<OrderItem> = {}): Omit<OrderItem, 'id'> {
    const quantity = faker.number.int({ min: 1, max: 10 });
    const unitPrice = new Decimal(overrides.unitPrice ?? faker.number.float({ min: 1000, max: 100000, fractionDigits: 2 }));
    const discountAmount = new Decimal(overrides.discountAmount ?? unitPrice.times(quantity).times(10).dividedBy(100));
    const lineTotal = new Decimal(overrides.lineTotal ?? unitPrice.times(quantity).minus(discountAmount));

    return {
      orderId: faker.string.uuid(),
      productId: faker.string.uuid(),
      quantity,
      unitPrice,
      discountAmount,
      lineTotal,
      ...overrides,
    };
  }

  static createEmailTemplate(overrides: any = {}) {
    return {
      name: faker.lorem.words(3),
      subject: faker.lorem.sentence(),
      htmlContent: `<html><body><h1>${faker.lorem.sentence()}</h1><p>${faker.lorem.paragraph()}</p></body></html>`,
      textContent: faker.lorem.paragraph(),
      variables: ['customerName', 'quotationNumber', 'totalAmount'],
      category: faker.helpers.arrayElement(['QUOTATION', 'FOLLOW_UP', 'REMINDER', 'WELCOME']),
      isActive: true,
      ...overrides,
    };
  }

  static createEmailLog(overrides: any = {}) {
    return {
      recipientEmail: faker.internet.email(),
      subject: faker.lorem.sentence(),
      templateId: faker.string.uuid(),
      quotationId: faker.string.uuid(),
      status: faker.helpers.arrayElement(['SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'FAILED']),
      messageId: faker.string.uuid(),
      errorMessage: null,
      sentAt: faker.date.recent(),
      deliveredAt: null,
      openedAt: null,
      clickedAt: null,
      ...overrides,
    };
  }

  static createAuditLog(overrides: any = {}) {
    return {
      userId: faker.string.uuid(),
      action: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT']),
      resource: faker.helpers.arrayElement(['USER', 'CUSTOMER', 'QUOTATION', 'ORDER', 'PRODUCT']),
      resourceId: faker.string.uuid(),
      oldValues: { field: 'oldValue' },
      newValues: { field: 'newValue' },
      ipAddress: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      ...overrides,
    };
  }

  // Helper methods for creating related data
  static createQuotationWithItems(itemCount: number = 3, overrides: any = {}) {
    const quotation = this.createQuotation(overrides.quotation || {});
    const items = Array.from({ length: itemCount }, () =>
      this.createQuotationItem({
        quotationId: 'quotation-id', // Will be replaced with actual ID
        ...overrides.item,
      })
    );

    return { quotation, items };
  }

  static createOrderWithItems(itemCount: number = 3, overrides: any = {}) {
    const order = this.createOrder(overrides.order || {});
    const items = Array.from({ length: itemCount }, () =>
      this.createOrderItem({
        orderId: 'order-id', // Will be replaced with actual ID
        ...overrides.item,
      })
    );

    return { order, items };
  }

  static createCustomerWithQuotations(quotationCount: number = 2, overrides: any = {}) {
    const customer = this.createCustomer(overrides.customer || {});
    const quotations = Array.from({ length: quotationCount }, () =>
      this.createQuotation({
        customerId: 'customer-id', // Will be replaced with actual ID
        ...overrides.quotation,
      })
    );

    return { customer, quotations };
  }

  // Mock API responses
  static createApiResponse<T>(data: T, success: boolean = true) {
    return {
      success,
      data,
      message: success ? 'Operation successful' : 'Operation failed',
      timestamp: new Date().toISOString(),
    };
  }

  static createPaginatedResponse<T>(
    data: T[],
    page: number = 1,
    limit: number = 10,
    total: number = data.length
  ) {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }

  static createErrorResponse(message: string, code: string = 'GENERIC_ERROR') {
    return {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// Install faker if not already installed
// npm install --save-dev @faker-js/faker