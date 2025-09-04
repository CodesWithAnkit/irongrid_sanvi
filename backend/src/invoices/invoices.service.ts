import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  lineTotal: number;
}

export interface TaxCalculation {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  taxCalculation: TaxCalculation;
  totalAmount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  termsAndConditions?: string;
  paymentInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  htmlTemplate: string;
  isDefault: boolean;
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    gstNumber?: string;
    panNumber?: string;
  };
  styling: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    logoUrl?: string;
  };
}

export interface CreateInvoiceRequest {
  orderId: string;
  templateId?: string;
  dueDate?: Date;
  notes?: string;
  termsAndConditions?: string;
  paymentInstructions?: string;
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);
  private readonly defaultTaxRate: number;
  private readonly companyGstNumber: string;
  private readonly companyState: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTaxRate = this.configService.get<number>('DEFAULT_TAX_RATE') || 0.18;
    this.companyGstNumber = this.configService.get<string>('COMPANY_GST_NUMBER') || '';
    this.companyState = this.configService.get<string>('COMPANY_STATE') || 'Haryana';
  }

  /**
   * Generate invoice from order
   */
  async generateInvoiceFromOrder(request: CreateInvoiceRequest): Promise<InvoiceData> {
    const { orderId, templateId, dueDate, notes, termsAndConditions, paymentInstructions } = request;

    // Get order with all related data
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          }
        },
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Check if order is paid
    if (order.paymentStatus !== 'PAID') {
      throw new BadRequestException('Can only generate invoices for paid orders');
    }

    // Check if invoice already exists for this order
    const existingInvoice = await this.findInvoiceByOrderId(orderId);
    if (existingInvoice) {
      throw new BadRequestException('Invoice already exists for this order');
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate tax based on customer location
    const taxCalculation = this.calculateTax(
      Number(order.subtotal),
      Number(order.discountAmount),
      order.customer.state || 'Unknown'
    );

    // Create invoice items from order items
    const invoiceItems: InvoiceItem[] = order.items.map(item => ({
      description: `${item.product.name} (${item.product.sku})`,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      discountAmount: Number(item.discountAmount),
      taxRate: this.defaultTaxRate,
      lineTotal: Number(item.lineTotal),
    }));

    // Create invoice data
    const invoiceData: InvoiceData = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      orderId: order.id,
      customerId: order.customerId,
      issueDate: new Date(),
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: invoiceItems,
      subtotal: Number(order.subtotal),
      discountAmount: Number(order.discountAmount),
      taxCalculation,
      totalAmount: Number(order.totalAmount),
      status: 'DRAFT',
      notes,
      termsAndConditions: termsAndConditions || this.getDefaultTermsAndConditions(),
      paymentInstructions: paymentInstructions || this.getDefaultPaymentInstructions(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // In a real implementation, this would be stored in the database
    this.logger.log(`Invoice generated for order ${orderId}: ${invoiceNumber}`);

    return invoiceData;
  }

  /**
   * Calculate GST tax based on customer state
   */
  private calculateTax(subtotal: number, discountAmount: number, customerState: string): TaxCalculation {
    const taxableAmount = subtotal - discountAmount;
    const totalTaxRate = this.defaultTaxRate;
    const totalTax = taxableAmount * totalTaxRate;

    // Determine if it's intra-state or inter-state
    const isIntraState = customerState.toLowerCase() === this.companyState.toLowerCase();

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
      // Intra-state: CGST + SGST
      cgst = totalTax / 2;
      sgst = totalTax / 2;
    } else {
      // Inter-state: IGST
      igst = totalTax;
    }

    return {
      taxableAmount,
      cgst,
      sgst,
      igst,
      totalTax,
    };
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    // In a real implementation, this would query the database for the last invoice number
    const sequence = Math.floor(Math.random() * 1000) + 1;
    const paddedSequence = String(sequence).padStart(4, '0');
    
    return `INV-${year}${month}-${paddedSequence}`;
  }

  /**
   * Find invoice by order ID
   */
  private async findInvoiceByOrderId(orderId: string): Promise<InvoiceData | null> {
    // In a real implementation, this would query the database
    // For now, we'll return null (no existing invoice)
    return null;
  }

  /**
   * Generate invoice PDF
   */
  async generateInvoicePDF(invoiceId: string, templateId?: string): Promise<Buffer> {
    // Get invoice data
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Get template
    const template = await this.getInvoiceTemplate(templateId);

    // Generate PDF using the template and invoice data
    const pdfBuffer = await this.renderInvoicePDF(invoice, template);

    this.logger.log(`PDF generated for invoice ${invoice.invoiceNumber}`);
    return pdfBuffer;
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(invoiceId: string): Promise<InvoiceData | null> {
    // In a real implementation, this would query the database
    // For now, we'll return a mock invoice
    return {
      id: invoiceId,
      invoiceNumber: 'INV-202412-0001',
      orderId: 'order-1',
      customerId: 'customer-1',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: [
        {
          description: 'Industrial Machine (SKU001)',
          quantity: 2,
          unitPrice: 50000,
          discountAmount: 0,
          taxRate: 0.18,
          lineTotal: 100000,
        }
      ],
      subtotal: 100000,
      discountAmount: 0,
      taxCalculation: {
        taxableAmount: 100000,
        cgst: 9000,
        sgst: 9000,
        igst: 0,
        totalTax: 18000,
      },
      totalAmount: 118000,
      status: 'DRAFT',
      notes: 'Thank you for your business',
      termsAndConditions: this.getDefaultTermsAndConditions(),
      paymentInstructions: this.getDefaultPaymentInstructions(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get invoice template
   */
  private async getInvoiceTemplate(templateId?: string): Promise<InvoiceTemplate> {
    // In a real implementation, this would query the database
    // For now, we'll return a default template
    return {
      id: templateId || 'default',
      name: 'Default Invoice Template',
      htmlTemplate: this.getDefaultHtmlTemplate(),
      isDefault: true,
      companyInfo: {
        name: 'Sanvi Machinery',
        address: 'Industrial Area, Sector 5, Gurgaon, Haryana 122001',
        phone: '+91-9999999999',
        email: 'info@sanvimachinery.com',
        website: 'www.sanvimachinery.com',
        gstNumber: this.companyGstNumber,
        panNumber: 'ABCDE1234F',
      },
      styling: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        fontFamily: 'Arial, sans-serif',
        logoUrl: '/assets/logo.png',
      },
    };
  }

  /**
   * Render invoice PDF
   */
  private async renderInvoicePDF(invoice: InvoiceData, template: InvoiceTemplate): Promise<Buffer> {
    // In a real implementation, this would use a PDF generation library like Puppeteer
    // For now, we'll return a mock PDF buffer
    const mockPdfContent = `
      Invoice: ${invoice.invoiceNumber}
      Date: ${invoice.issueDate.toDateString()}
      Total: ₹${invoice.totalAmount.toLocaleString('en-IN')}
      
      This is a mock PDF buffer for testing purposes.
    `;

    return Buffer.from(mockPdfContent, 'utf-8');
  }

  /**
   * Get default HTML template
   */
  private getDefaultHtmlTemplate(): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice {{invoiceNumber}}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info { float: left; }
          .invoice-info { float: right; text-align: right; }
          .customer-info { margin: 30px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .items-table th { background-color: #f8f9fa; }
          .totals { float: right; margin-top: 20px; }
          .tax-breakdown { margin: 20px 0; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; }
          .clearfix::after { content: ""; display: table; clear: both; }
        </style>
      </head>
      <body>
        <div class="header clearfix">
          <div class="company-info">
            <h1>{{companyName}}</h1>
            <p>{{companyAddress}}</p>
            <p>Phone: {{companyPhone}}</p>
            <p>Email: {{companyEmail}}</p>
            <p>GST: {{companyGstNumber}}</p>
          </div>
          <div class="invoice-info">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> {{invoiceNumber}}</p>
            <p><strong>Date:</strong> {{issueDate}}</p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
          </div>
        </div>

        <div class="customer-info">
          <h3>Bill To:</h3>
          <p>{{customerName}}</p>
          <p>{{customerAddress}}</p>
          <p>{{customerPhone}}</p>
          <p>{{customerEmail}}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {{#each items}}
            <tr>
              <td>{{description}}</td>
              <td>{{quantity}}</td>
              <td>₹{{unitPrice}}</td>
              <td>₹{{discountAmount}}</td>
              <td>₹{{lineTotal}}</td>
            </tr>
            {{/each}}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal:</strong> ₹{{subtotal}}</p>
          <p><strong>Discount:</strong> ₹{{discountAmount}}</p>
          <div class="tax-breakdown">
            {{#if taxCalculation.cgst}}
            <p>CGST ({{taxRate}}%)): ₹{{taxCalculation.cgst}}</p>
            <p>SGST ({{taxRate}}%)): ₹{{taxCalculation.sgst}}</p>
            {{/if}}
            {{#if taxCalculation.igst}}
            <p>IGST ({{taxRate}}%)): ₹{{taxCalculation.igst}}</p>
            {{/if}}
          </div>
          <h3><strong>Total Amount: ₹{{totalAmount}}</strong></h3>
        </div>

        <div class="footer">
          <h4>Terms and Conditions:</h4>
          <p>{{termsAndConditions}}</p>
          
          <h4>Payment Instructions:</h4>
          <p>{{paymentInstructions}}</p>
          
          {{#if notes}}
          <h4>Notes:</h4>
          <p>{{notes}}</p>
          {{/if}}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get default terms and conditions
   */
  private getDefaultTermsAndConditions(): string {
    return `
      1. Payment is due within 30 days of invoice date.
      2. Late payments may incur additional charges.
      3. All disputes must be raised within 7 days of invoice receipt.
      4. Goods once sold will not be taken back.
      5. Subject to Gurgaon jurisdiction only.
    `.trim();
  }

  /**
   * Get default payment instructions
   */
  private getDefaultPaymentInstructions(): string {
    return `
      Please make payment to:
      Bank: HDFC Bank
      Account Name: Sanvi Machinery
      Account Number: 1234567890
      IFSC Code: HDFC0001234
      
      Or pay online using the payment link provided.
    `.trim();
  }

  /**
   * Update invoice status
   */
  async updateInvoiceStatus(invoiceId: string, status: InvoiceData['status']): Promise<InvoiceData> {
    // In a real implementation, this would update the database
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    invoice.status = status;
    invoice.updatedAt = new Date();

    this.logger.log(`Invoice ${invoice.invoiceNumber} status updated to ${status}`);
    return invoice;
  }

  /**
   * Get invoice analytics
   */
  async getInvoiceAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    overdueAmount: number;
    averageAmount: number;
    statusBreakdown: Record<string, number>;
    monthlyTrends: Array<{
      month: string;
      count: number;
      amount: number;
    }>;
  }> {
    // In a real implementation, this would query the database
    // For now, we'll return mock analytics
    return {
      totalInvoices: 125,
      totalAmount: 2500000,
      paidAmount: 2100000,
      pendingAmount: 300000,
      overdueAmount: 100000,
      averageAmount: 20000,
      statusBreakdown: {
        PAID: 105,
        SENT: 15,
        OVERDUE: 5,
      },
      monthlyTrends: [
        { month: '2024-01', count: 45, amount: 900000 },
        { month: '2024-02', count: 38, amount: 760000 },
        { month: '2024-03', count: 42, amount: 840000 },
      ],
    };
  }

  /**
   * Send invoice via email
   */
  async sendInvoiceEmail(invoiceId: string, recipientEmail?: string): Promise<void> {
    const invoice = await this.getInvoiceById(invoiceId);
    
    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    // Generate PDF
    const pdfBuffer = await this.generateInvoicePDF(invoiceId);

    // In a real implementation, this would integrate with the email service
    this.logger.log(`Invoice ${invoice.invoiceNumber} sent via email to ${recipientEmail || 'customer'}`);

    // Update invoice status to SENT
    await this.updateInvoiceStatus(invoiceId, 'SENT');
  }
}