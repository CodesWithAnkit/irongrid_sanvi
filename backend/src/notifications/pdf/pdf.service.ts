import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilesService } from '../../files/files.service';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { fillTerms } from '../../quotations/templates/default-template';

@Injectable()
export class PdfService {
  constructor(private prisma: PrismaService, private files: FilesService) {}

  async generateQuotationPdf(quotationId: string) {
    const quotation: any = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true, items: { include: { product: true } } },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([595.28, 841.89]); // A4
    const { width } = page.getSize();
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    let y = 800;
    const fontSizeTitle = 18;
    const fontSize = 12;

    page.drawText('Quotation', { x: 50, y, size: fontSizeTitle, font, color: rgb(0, 0, 0) });
    y -= 30;

    page.drawText(`Quotation No: ${quotation.quotationNumber}`, { x: 50, y, size: fontSize, font });
    y -= 16;
    page.drawText(`Customer: ${quotation.customer.name}`, { x: 50, y, size: fontSize, font });
    y -= 16;
    if (quotation.customer.email) {
      page.drawText(`Email: ${quotation.customer.email}`, { x: 50, y, size: fontSize, font });
      y -= 16;
    }
    if (quotation.validUntil) {
      page.drawText(`Valid Until: ${quotation.validUntil.toISOString().slice(0, 10)}`, { x: 50, y, size: fontSize, font });
      y -= 16;
    }

    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    page.drawText('Items:', { x: 50, y, size: fontSize, font });
    y -= 18;

    for (const it of quotation.items) {
      const line = `${it.quantity} x ${it.product.name} @ ${it.unitPrice.toString()} = ${it.total.toString()}`;
      page.drawText(line, { x: 60, y, size: fontSize, font });
      y -= 16;
      if (y < 80) break; // naive pagination safeguard
    }

    y -= 10;
    page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    page.drawText(`Subtotal: ${quotation.subtotal.toString()}`, { x: 50, y, size: fontSize, font });
    y -= 16;
    page.drawText(`Discount: ${quotation.discountAmount.toString()}`, { x: 50, y, size: fontSize, font });
    y -= 16;
    page.drawText(`Tax: ${quotation.taxAmount.toString()}`, { x: 50, y, size: fontSize, font });
    y -= 16;
    page.drawText(`Total: ${quotation.totalAmount.toString()}`, { x: 50, y, size: fontSize, font });

    // Terms & Conditions (dynamic defaults with placeholders)
    y -= 24;
    page.drawText('Terms & Conditions:', { x: 50, y, size: fontSize, font });
    y -= 18;
    const terms = fillTerms({
      company: { name: 'Sanvi Machinery' },
      customer: { name: quotation.customer.name },
      quotation: {
        number: quotation.quotationNumber,
        validUntil: quotation.validUntil,
        validityDays: 30,
        deliveryTime: '2-3 weeks',
        paymentTerms: '50% advance, balance before dispatch',
        warranty: '12 months',
      },
    });
    for (const t of terms) {
      page.drawText(`• ${t}`, { x: 60, y, size: fontSize, font });
      y -= 14;
      if (y < 60) break;
    }

    const pdfBytes = await pdf.save();

    const file = await this.files.saveBuffer(
      Buffer.from(pdfBytes),
      `quotation_${quotation.quotationNumber}.pdf`,
      'application/pdf',
    );

    return file;
  }
}
