import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  // Sends a simple quotation email. If nodemailer or SMTP config is missing, returns a 'skipped' status.
  async sendQuotationEmail(quotationId: string, to: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: true },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');

    // Pull SMTP from env
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || 'no-reply@irongrid.local';

    // Dynamic require to avoid hard dependency when not configured
    let nodemailer: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const req: any = eval('require');
      nodemailer = req('nodemailer');
    } catch (e) {
      nodemailer = null;
    }

    if (!nodemailer || !host || !port || !user || !pass) {
      return {
        status: 'skipped',
        reason: 'Email not configured. Set SMTP_* env vars and install nodemailer to enable.',
      };
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const subject = `Quotation ${quotation.quotationNumber}`;
    const text = `Dear ${quotation.customer?.contactPerson || 'Customer'},\n\nPlease find your quotation ${quotation.quotationNumber}.\nTotal: ${quotation.totalAmount.toString()}\n\nRegards,\nSanvi Machinery`;

    const info = await transport.sendMail({ from, to, subject, text });
    return { status: 'sent', messageId: info.messageId };
  }
}
