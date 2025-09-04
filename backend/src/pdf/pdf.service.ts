import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../prisma/prisma.service';
import {
  PdfGenerationOptions,
  QuotationPdfData,
  PdfStorageResult,
  PdfTemplate,
} from './interfaces/pdf.interface';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private browser: puppeteer.Browser;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.initializeBrowser();
  }

  private async initializeBrowser() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      this.logger.log('Puppeteer browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer browser', error);
    }
  }

  async generateQuotationPdf(quotationId: string): Promise<Buffer> {
    try {
      // Fetch quotation data from database
      const quotationData = await this.getQuotationData(quotationId);
      
      // Get the quotation template
      const template = await this.getTemplate('quotation');
      
      // Generate PDF
      const pdfBuffer = await this.generatePdf({
        template: template.htmlContent,
        data: quotationData,
        format: 'A4',
        orientation: 'portrait',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
      });

      return pdfBuffer;
    } catch (error) {
      this.logger.error(`Failed to generate PDF for quotation ${quotationId}`, error);
      throw new BadRequestException('Failed to generate PDF');
    }
  }

  async generatePdf(options: PdfGenerationOptions): Promise<Buffer> {
    if (!this.browser) {
      await this.initializeBrowser();
    }

    const page = await this.browser.newPage();

    try {
      // Compile Handlebars template
      const template = Handlebars.compile(options.template);
      const html = template(options.data);

      // Set content and generate PDF
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        margin: options.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  async storePdf(
    pdfBuffer: Buffer,
    filename: string,
    quotationId?: string,
  ): Promise<PdfStorageResult> {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${filename}`;
      const filePath = path.join(uploadsDir, uniqueFilename);

      // Write file to disk
      fs.writeFileSync(filePath, pdfBuffer);

      // Store file metadata in database
      const fileRecord = await this.prisma.file.create({
        data: {
          key: uniqueFilename,
          originalName: filename,
          mimeType: 'application/pdf',
          size: pdfBuffer.length,
        },
      });

      // Store file path separately (not in schema, so we'll use a simple approach)
      // In production, you might want to add a path field to the File model
      
      return {
        url: `/api/files/${fileRecord.id}`,
        key: fileRecord.id,
        size: pdfBuffer.length,
        contentType: 'application/pdf',
      };
    } catch (error) {
      this.logger.error('Failed to store PDF', error);
      throw new BadRequestException('Failed to store PDF');
    }
  }

  async getStoredPdf(fileId: string): Promise<Buffer> {
    try {
      const fileRecord = await this.prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!fileRecord) {
        throw new BadRequestException('File not found');
      }

      // Construct file path from key
      const filePath = path.join(process.cwd(), 'uploads', 'pdfs', fileRecord.key);

      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('File not found on disk');
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      this.logger.error(`Failed to retrieve PDF ${fileId}`, error);
      throw new BadRequestException('Failed to retrieve PDF');
    }
  }

  async optimizePdf(pdfBuffer: Buffer): Promise<Buffer> {
    // Basic PDF optimization - in production, you might want to use a more sophisticated library
    // For now, we'll return the buffer as-is, but this is where you'd implement compression
    return pdfBuffer;
  }

  private async getQuotationData(quotationId: string): Promise<QuotationPdfData> {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
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

    if (!quotation) {
      throw new BadRequestException('Quotation not found');
    }

    // Transform data for PDF template
    return {
      quotation: {
        quotationNumber: quotation.quotationNumber,
        date: quotation.createdAt.toISOString().split('T')[0],
        validUntil: quotation.validUntil?.toISOString().split('T')[0] || '',
        status: quotation.status,
        subtotal: Number(quotation.subtotal),
        taxAmount: Number(quotation.taxAmount),
        discountAmount: Number(quotation.discountAmount),
        totalAmount: Number(quotation.totalAmount),
        termsConditions: quotation.termsConditions || '',
        notes: quotation.notes || undefined,
      },
      customer: {
        companyName: quotation.customer.companyName,
        contactPerson: quotation.customer.contactPerson,
        email: quotation.customer.email,
        phone: quotation.customer.phone || '',
        address: {
          street: quotation.customer.address || '',
          city: quotation.customer.city || '',
          state: quotation.customer.state || '',
          postalCode: quotation.customer.postalCode || '',
          country: quotation.customer.country || '',
        },
      },
      company: {
        name: this.configService.get('COMPANY_NAME', 'Sanvi Machinery'),
        logo: this.configService.get('COMPANY_LOGO_URL'),
        address: {
          street: this.configService.get('COMPANY_ADDRESS_STREET', ''),
          city: this.configService.get('COMPANY_ADDRESS_CITY', ''),
          state: this.configService.get('COMPANY_ADDRESS_STATE', ''),
          postalCode: this.configService.get('COMPANY_ADDRESS_POSTAL_CODE', ''),
          country: this.configService.get('COMPANY_ADDRESS_COUNTRY', ''),
        },
        phone: this.configService.get('COMPANY_PHONE', ''),
        email: this.configService.get('COMPANY_EMAIL', ''),
        website: this.configService.get('COMPANY_WEBSITE', ''),
        taxId: this.configService.get('COMPANY_TAX_ID', ''),
      },
      items: quotation.items.map((item: any) => ({
        productName: item.product.name,
        description: item.product.description || '',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discountAmount),
        lineTotal: Number(item.lineTotal),
        specifications: item.customSpecifications ? JSON.stringify(item.customSpecifications) : undefined,
      })),
    };
  }

  private async getTemplate(templateName: string): Promise<PdfTemplate> {
    // For now, return a default template. In production, this would fetch from database
    return {
      id: 'default-quotation',
      name: 'Default Quotation Template',
      htmlContent: this.getDefaultQuotationTemplate(),
      variables: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private getDefaultQuotationTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quotation - {{quotation.quotationNumber}}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.6;
        }
        .header {
            background-color: #2c3e50;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .company-logo {
            max-height: 60px;
            margin-bottom: 10px;
        }
        .company-name {
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .document-title {
            font-size: 24px;
            margin: 20px 0 10px 0;
        }
        .quotation-number {
            font-size: 18px;
            margin: 0;
        }
        .content {
            padding: 30px;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .info-block {
            width: 48%;
        }
        .info-block h3 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .table th,
        .table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        .table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #2c3e50;
        }
        .table tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-section {
            margin-top: 30px;
            float: right;
            width: 300px;
        }
        .totals-table {
            width: 100%;
            border-collapse: collapse;
        }
        .totals-table td {
            padding: 8px 12px;
            border-bottom: 1px solid #ddd;
        }
        .totals-table .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: #2c3e50;
            color: white;
        }
        .terms-section {
            clear: both;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #3498db;
        }
        .footer {
            margin-top: 50px;
            padding: 20px;
            background-color: #f8f9fa;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
        .currency {
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        {{#if company.logo}}
        <img src="{{company.logo}}" alt="{{company.name}}" class="company-logo">
        {{/if}}
        <h1 class="company-name">{{company.name}}</h1>
        <h2 class="document-title">QUOTATION</h2>
        <p class="quotation-number">{{quotation.quotationNumber}}</p>
    </div>

    <div class="content">
        <div class="info-section">
            <div class="info-block">
                <h3>Company Information</h3>
                <p><strong>{{company.name}}</strong></p>
                <p>{{company.address.street}}</p>
                <p>{{company.address.city}}, {{company.address.state}} {{company.address.postalCode}}</p>
                <p>{{company.address.country}}</p>
                <p>Phone: {{company.phone}}</p>
                <p>Email: {{company.email}}</p>
                {{#if company.website}}
                <p>Website: {{company.website}}</p>
                {{/if}}
                {{#if company.taxId}}
                <p>Tax ID: {{company.taxId}}</p>
                {{/if}}
            </div>
            
            <div class="info-block">
                <h3>Customer Information</h3>
                <p><strong>{{customer.companyName}}</strong></p>
                <p>Attention: {{customer.contactPerson}}</p>
                <p>{{customer.address.street}}</p>
                <p>{{customer.address.city}}, {{customer.address.state}} {{customer.address.postalCode}}</p>
                <p>{{customer.address.country}}</p>
                <p>Phone: {{customer.phone}}</p>
                <p>Email: {{customer.email}}</p>
            </div>
        </div>

        <div class="info-section">
            <div class="info-block">
                <h3>Quotation Details</h3>
                <p><strong>Date:</strong> {{quotation.date}}</p>
                <p><strong>Valid Until:</strong> {{quotation.validUntil}}</p>
                <p><strong>Status:</strong> {{quotation.status}}</p>
            </div>
        </div>

        <h3>Items</h3>
        <table class="table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Description</th>
                    <th class="text-center">Quantity</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Discount</th>
                    <th class="text-right">Line Total</th>
                </tr>
            </thead>
            <tbody>
                {{#each items}}
                <tr>
                    <td><strong>{{productName}}</strong></td>
                    <td>
                        {{description}}
                        {{#if specifications}}
                        <br><small><em>Specifications: {{specifications}}</em></small>
                        {{/if}}
                    </td>
                    <td class="text-center">{{quantity}}</td>
                    <td class="text-right currency">₹{{unitPrice}}</td>
                    <td class="text-right currency">₹{{discount}}</td>
                    <td class="text-right currency">₹{{lineTotal}}</td>
                </tr>
                {{/each}}
            </tbody>
        </table>

        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>Subtotal:</td>
                    <td class="text-right currency">₹{{quotation.subtotal}}</td>
                </tr>
                {{#if quotation.discountAmount}}
                <tr>
                    <td>Discount:</td>
                    <td class="text-right currency">-₹{{quotation.discountAmount}}</td>
                </tr>
                {{/if}}
                <tr>
                    <td>Tax:</td>
                    <td class="text-right currency">₹{{quotation.taxAmount}}</td>
                </tr>
                <tr class="total-row">
                    <td>Total:</td>
                    <td class="text-right currency">₹{{quotation.totalAmount}}</td>
                </tr>
            </table>
        </div>

        <div class="terms-section">
            <h3>Terms and Conditions</h3>
            <p>{{quotation.termsConditions}}</p>
            
            {{#if quotation.notes}}
            <h3>Notes</h3>
            <p>{{quotation.notes}}</p>
            {{/if}}
        </div>
    </div>

    <div class="footer">
        <p>This quotation is valid until {{quotation.validUntil}}. Please contact us for any questions or clarifications.</p>
        <p>Thank you for your business!</p>
    </div>
</body>
</html>
    `;
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}