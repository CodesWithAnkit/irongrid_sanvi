import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../../files/files.service';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class HtmlPdfService {
  constructor(private prisma: PrismaService, private files: FilesService) {}

  // Generates a quotation PDF via HTML -> PDF (Puppeteer). Falls back with an informative error if deps are missing.
  async generateQuotationPdfHtml(quotationId: number) {
    const quotation: any = await this.prisma.quotation.findUnique({
      where: { id: quotationId.toString() },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    // Dynamic requires to avoid compile-time dependency on these packages
    let handlebars: any = null;
    let puppeteer: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const req: any = eval('require');
      handlebars = req('handlebars');
      puppeteer = req('puppeteer');
    } catch (e) {
      handlebars = null;
      puppeteer = null;
    }

    if (!handlebars || !puppeteer) {
      return {
        status: 'skipped',
        reason:
          'HTML->PDF not available. Install dependencies: npm install puppeteer handlebars. Then retry with ?format=html',
      };
    }

    // Simple default HTML template; can be moved to a .hbs file if desired
    const templateHtml = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Quotation {{quotation.number}}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; color: #111; }
            .header { display:flex; justify-content: space-between; align-items:center; }
            .brand { font-size: 18px; font-weight: bold; }
            .muted { color: #666; }
            .section { margin-top: 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f8f8f8; }
            .totals { margin-top: 12px; }
            .terms { margin-top: 16px; }
            .signature { margin-top: 30px; display:flex; justify-content: space-between; }
            .signature .box { width: 45%; border-top: 1px dashed #999; padding-top: 6px; text-align: center; }
            img.logo { max-height: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">{{company.name}}</div>
            {{#if company.logoUrl}}<img class="logo" src="{{company.logoUrl}}" alt="logo" />{{/if}}
          </div>
          <div class="muted">Quotation No: {{quotation.number}} {{#if quotation.validUntil}} | Valid Until: {{quotation.validUntil}}{{/if}}</div>

          <div class="section">
            <strong>Bill To:</strong><br/>
            {{customer.name}}{{#if customer.company}} ({{customer.company}}){{/if}}<br/>
            {{#if customer.email}}Email: {{customer.email}}<br/>{{/if}}
            {{#if customer.phone}}Phone: {{customer.phone}}<br/>{{/if}}
            {{#if customer.address}}{{customer.address}}<br/>{{/if}}
          </div>

          <div class="section">
            <strong>Items</strong>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {{#each items}}
                  <tr>
                    <td>{{this.product}}</td>
                    <td>{{this.quantity}}</td>
                    <td>{{this.unitPrice}}</td>
                    <td>{{this.discount}}</td>
                    <td>{{this.total}}</td>
                  </tr>
                {{/each}}
              </tbody>
            </table>
          </div>

          <div class="totals">
            Subtotal: {{totals.subtotal}}<br/>
            Discount: {{totals.discount}}<br/>
            Tax: {{totals.tax}}<br/>
            <strong>Total: {{totals.total}}</strong>
          </div>

          <div class="terms">
            <strong>Terms & Conditions</strong>
            <ul>
              {{#each terms}}
                <li>{{this}}</li>
              {{/each}}
            </ul>
          </div>

          <div class="signature">
            <div class="box">For {{company.name}}<br/>{{#if company.signatureName}}{{company.signatureName}}{{else}}Authorized Signatory{{/if}}</div>
            <div class="box">Customer Signature</div>
          </div>
        </body>
      </html>
    `;

    const template = handlebars.compile(templateHtml);
    const data = {
      company: {
        name: 'Sanvi Machinery',
        logoUrl: process.env.COMPANY_LOGO_URL || undefined,
        signatureName: process.env.COMPANY_SIGN_NAME || undefined,
      },
      customer: {
        name: quotation.customer.name,
        company: quotation.customer.company || '',
        email: quotation.customer.email || '',
        phone: quotation.customer.phone || '',
        address: quotation.customer.address || '',
      },
      quotation: {
        number: quotation.quotationNumber,
        validUntil: quotation.validUntil ? quotation.validUntil.toISOString().slice(0, 10) : '',
      },
      items: quotation.items.map((it: any) => ({
        product: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice.toString(),
        discount: it.discount.toString(),
        total: it.total.toString(),
      })),
      totals: {
        subtotal: quotation.subtotal.toString(),
        discount: quotation.discountAmount.toString(),
        tax: quotation.taxAmount.toString(),
        total: quotation.totalAmount.toString(),
      },
      terms: [
        'Prices are valid for 30 days from the date of quotation.',
        'Delivery Time: 2-3 weeks.',
        'Payment Terms: 50% advance, balance before dispatch.',
        'Warranty: 12 months.',
        'GST and other taxes extra as applicable.',
      ],
    };

    const html = template(data);

    // Write to temp file because some environments render images better from file URLs
    const tempDir = path.join(process.cwd(), 'tmp');
    await fs.mkdir(tempDir, { recursive: true });
    const tempFile = path.join(tempDir, `quotation_${quotation.quotationNumber}.html`);
    await fs.writeFile(tempFile, html, 'utf8');

    const browser = await puppeteer.launch({ headless: 'new' as any });
    const page = await browser.newPage();
    await page.goto(`file://${tempFile}`, { waitUntil: 'load' });
    const buffer: Buffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const file = await this.files.saveBuffer(
      Buffer.from(buffer),
      `quotation_${quotation.quotationNumber}_html.pdf`,
      'application/pdf',
    );

    return file;
  }
}
