import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PdfService } from './pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

// Mock Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
      close: jest.fn(),
    }),
    close: jest.fn(),
  }),
}));

// Mock fs
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('PdfService', () => {
  let service: PdfService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockQuotation = {
    id: 'quotation-1',
    quotationNumber: 'QUO-2024-000001',
    customerId: 'customer-1',
    status: 'SENT',
    subtotal: { toNumber: () => 10000 },
    taxAmount: { toNumber: () => 1800 },
    discountAmount: { toNumber: () => 500 },
    totalAmount: { toNumber: () => 11300 },
    termsConditions: 'Payment within 30 days',
    notes: 'Special handling required',
    validUntil: new Date('2024-12-31'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    pdfUrl: null,
    emailSentAt: null,
    customerViewedAt: null,
    customerRespondedAt: null,
    createdByUserId: 'user-1',
    customer: {
      id: 'customer-1',
      companyName: 'Test Company Ltd',
      contactPerson: 'John Doe',
      email: 'john@testcompany.com',
      phone: '+1234567890',
      alternatePhone: null,
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      postalCode: '12345',
      country: 'Test Country',
      customerType: 'SMALL_BUSINESS',
      creditLimit: { toNumber: () => 50000 },
      paymentTerms: 'NET_30',
      taxId: null,
      gstNumber: null,
      notes: null,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    items: [
      {
        id: 'item-1',
        quotationId: 'quotation-1',
        productId: 'product-1',
        quantity: 2,
        unitPrice: { toNumber: () => 5000 },
        discountPercentage: { toNumber: () => 5 },
        discountAmount: { toNumber: () => 250 },
        lineTotal: { toNumber: () => 9750 },
        customSpecifications: { specs: 'Custom specs' },
        deliveryTimeline: '2 weeks',
        product: {
          id: 'product-1',
          sku: 'PROD-001',
          name: 'Test Product',
          description: 'Test product description',
          categoryId: 'cat-1',
          basePrice: { toNumber: () => 5000 },
          currency: 'INR',
          specifications: null,
          images: [],
          inventoryCount: 100,
          minOrderQty: 1,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      },
    ],
    createdBy: {
      id: 'user-1',
      email: 'admin@sanvi.com',
      passwordHash: 'hash',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      lastLoginAt: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      emailVerified: true,
      emailVerificationToken: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  };

  const mockPrismaService = {
    quotation: {
      findUnique: jest.fn(),
    },
    file: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        COMPANY_NAME: 'Sanvi Machinery',
        COMPANY_PHONE: '+91-1234567890',
        COMPANY_EMAIL: 'info@sanvi.com',
        COMPANY_ADDRESS_STREET: '123 Industrial Area',
        COMPANY_ADDRESS_CITY: 'Mumbai',
        COMPANY_ADDRESS_STATE: 'Maharashtra',
        COMPANY_ADDRESS_POSTAL_CODE: '400001',
        COMPANY_ADDRESS_COUNTRY: 'India',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PdfService>(PdfService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('generateQuotationPdf', () => {
    it('should generate PDF for valid quotation', async () => {
      // Arrange
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);

      // Act
      const result = await service.generateQuotationPdf('quotation-1');

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
      expect(mockPrismaService.quotation.findUnique).toHaveBeenCalledWith({
        where: { id: 'quotation-1' },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          createdBy: true,
        },
      });
    });

    it('should throw error for non-existent quotation', async () => {
      // Arrange
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.generateQuotationPdf('invalid-id')).rejects.toThrow(
        'Failed to generate PDF',
      );
    });
  });

  describe('generatePdf', () => {
    it('should generate PDF with custom options', async () => {
      // Arrange
      const options = {
        template: '<html><body><h1>{{title}}</h1></body></html>',
        data: { title: 'Test Document' },
        format: 'A4' as const,
        orientation: 'portrait' as const,
      };

      // Act
      const result = await service.generatePdf(options);

      // Assert
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-pdf-content');
    });

    it('should handle template compilation errors', async () => {
      // Arrange
      const options = {
        template: '<html><body><h1>{{invalid.nested.property}}</h1></body></html>',
        data: {},
      };

      // Act & Assert
      // Note: Handlebars handles missing properties gracefully, so this should still work
      const result = await service.generatePdf(options);
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('storePdf', () => {
    it('should store PDF and return storage result', async () => {
      // Arrange
      const pdfBuffer = Buffer.from('test-pdf-content');
      const filename = 'test.pdf';
      const quotationId = 'quotation-1';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();

      const mockFileRecord = {
        id: 'file-1',
        key: 'timestamp-test.pdf',
        originalName: filename,
        size: pdfBuffer.length,
        mimeType: 'application/pdf',
        createdAt: new Date(),
      };

      mockPrismaService.file.create.mockResolvedValue(mockFileRecord);

      // Act
      const result = await service.storePdf(pdfBuffer, filename, quotationId);

      // Assert
      expect(result).toEqual({
        url: '/api/files/file-1',
        key: 'file-1',
        size: pdfBuffer.length,
        contentType: 'application/pdf',
      });
      expect(mockPrismaService.file.create).toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      // Arrange
      const pdfBuffer = Buffer.from('test-pdf-content');
      const filename = 'test.pdf';

      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();

      mockPrismaService.file.create.mockResolvedValue({
        id: 'file-1',
        key: 'timestamp-test.pdf',
        originalName: filename,
        size: pdfBuffer.length,
        mimeType: 'application/pdf',
        createdAt: new Date(),
      });

      // Act
      await service.storePdf(pdfBuffer, filename);

      // Assert
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('uploads\\pdfs'),
        { recursive: true },
      );
    });
  });

  describe('getStoredPdf', () => {
    it('should retrieve stored PDF', async () => {
      // Arrange
      const fileId = 'file-1';
      const mockFileRecord = {
        id: fileId,
        key: 'test.pdf',
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        createdAt: new Date(),
      };
      const mockPdfContent = Buffer.from('stored-pdf-content');

      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(mockPdfContent);

      // Act
      const result = await service.getStoredPdf(fileId);

      // Assert
      expect(result).toEqual(mockPdfContent);
      expect(mockPrismaService.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
      });
    });

    it('should throw error for non-existent file record', async () => {
      // Arrange
      mockPrismaService.file.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStoredPdf('invalid-id')).rejects.toThrow(
        'Failed to retrieve PDF',
      );
    });

    it('should throw error for non-existent file on disk', async () => {
      // Arrange
      const mockFileRecord = {
        id: 'file-1',
        key: 'nonexistent.pdf',
        originalName: 'nonexistent.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        createdAt: new Date(),
      };

      mockPrismaService.file.findUnique.mockResolvedValue(mockFileRecord);
      mockFs.existsSync.mockReturnValue(false);

      // Act & Assert
      await expect(service.getStoredPdf('file-1')).rejects.toThrow(
        'Failed to retrieve PDF',
      );
    });
  });

  describe('optimizePdf', () => {
    it('should return optimized PDF buffer', async () => {
      // Arrange
      const inputBuffer = Buffer.from('input-pdf-content');

      // Act
      const result = await service.optimizePdf(inputBuffer);

      // Assert
      expect(result).toEqual(inputBuffer);
    });
  });
});