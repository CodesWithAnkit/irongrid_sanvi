import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as AWS from 'aws-sdk';
import { PrismaService } from '../prisma/prisma.service';
import {
  EmailOptions,
  EmailDeliveryStatus,
  EmailStatus,
  EmailJobData,
  EmailAutomationRule,
} from './interfaces/email.interface';
import { EmailTemplateService } from './services/email-template.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private ses: AWS.SES;

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailTemplateService: EmailTemplateService,
  ) {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize SendGrid
    const sendGridApiKey = this.configService.get('SENDGRID_API_KEY');
    if (sendGridApiKey) {
      sgMail.setApiKey(sendGridApiKey);
      this.logger.log('SendGrid initialized successfully');
    }

    // Initialize AWS SES
    const awsRegion = this.configService.get('AWS_REGION');
    const awsAccessKey = this.configService.get('AWS_ACCESS_KEY_ID');
    const awsSecretKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

    if (awsRegion && awsAccessKey && awsSecretKey) {
      this.ses = new AWS.SES({
        region: awsRegion,
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
      });
      this.logger.log('AWS SES initialized successfully');
    }
  }

  async sendEmail(options: EmailOptions): Promise<string> {
    try {
      // Process template if templateId is provided
      if (options.templateId) {
        const processedOptions = await this.processTemplate(options);
        options = { ...options, ...processedOptions };
      }

      // Add to queue for reliable delivery
      const job = await this.emailQueue.add('send-email', {
        options,
        provider: 'sendgrid', // Primary provider
        retryCount: 0,
        maxRetries: 3,
      } as EmailJobData);

      // Log email attempt
      await this.logEmailAttempt(options, job.id.toString());

      return job.id.toString();
    } catch (error) {
      this.logger.error('Failed to queue email', error);
      throw new BadRequestException('Failed to send email');
    }
  }

  async sendQuotationEmail(
    quotationId: string,
    recipientEmail: string,
    options?: Partial<EmailOptions>,
  ): Promise<string> {
    try {
      // Get quotation data
      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!quotation) {
        throw new BadRequestException('Quotation not found');
      }

      // Prepare email options
      const emailOptions: EmailOptions = {
        to: recipientEmail,
        subject: `Quotation ${quotation.quotationNumber} from ${this.configService.get('COMPANY_NAME', 'Sanvi Machinery')}`,
        templateId: 'quotation-email',
        templateData: {
          quotation: {
            quotationNumber: quotation.quotationNumber,
            totalAmount: Number(quotation.totalAmount),
            validUntil: quotation.validUntil?.toISOString().split('T')[0],
            viewUrl: `${this.configService.get('FRONTEND_URL')}/quotations/view/${quotation.id}`,
          },
          customer: {
            companyName: quotation.customer.companyName,
            contactPerson: quotation.customer.contactPerson,
          },
          company: {
            name: this.configService.get('COMPANY_NAME', 'Sanvi Machinery'),
            phone: this.configService.get('COMPANY_PHONE', ''),
            email: this.configService.get('COMPANY_EMAIL', ''),
          },
        },
        trackOpens: true,
        trackClicks: true,
        ...options,
      };

      const messageId = await this.sendEmail(emailOptions);

      // Update quotation with email sent timestamp
      await this.prisma.quotation.update({
        where: { id: quotationId },
        data: { emailSentAt: new Date() },
      });

      return messageId;
    } catch (error) {
      this.logger.error(`Failed to send quotation email for ${quotationId}`, error);
      throw new BadRequestException('Failed to send quotation email');
    }
  }

  async sendFollowUpEmail(
    quotationId: string,
    templateId: string,
    delay?: number,
  ): Promise<string> {
    try {
      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
        include: { customer: true },
      });

      if (!quotation) {
        throw new BadRequestException('Quotation not found');
      }

      const emailOptions: EmailOptions = {
        to: quotation.customer.email,
        subject: `Follow-up: Quotation ${quotation.quotationNumber}`,
        templateId,
        templateData: {
          quotation: {
            quotationNumber: quotation.quotationNumber,
            totalAmount: Number(quotation.totalAmount),
            validUntil: quotation.validUntil?.toISOString().split('T')[0],
          },
          customer: {
            companyName: quotation.customer.companyName,
            contactPerson: quotation.customer.contactPerson,
          },
        },
        scheduledAt: delay ? new Date(Date.now() + delay * 60 * 1000) : undefined,
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      this.logger.error(`Failed to send follow-up email for ${quotationId}`, error);
      throw new BadRequestException('Failed to send follow-up email');
    }
  }

  async sendExpiryReminder(quotationId: string): Promise<string> {
    return this.sendFollowUpEmail(quotationId, 'quotation-expiry-reminder');
  }

  async scheduleEmail(options: EmailOptions, delay: number): Promise<string> {
    const scheduledAt = new Date(Date.now() + delay * 60 * 1000);
    
    const job = await this.emailQueue.add(
      'send-email',
      {
        options: { ...options, scheduledAt },
        provider: 'sendgrid',
        retryCount: 0,
        maxRetries: 3,
      } as EmailJobData,
      {
        delay: delay * 60 * 1000, // Convert minutes to milliseconds
      },
    );

    return job.id.toString();
  }

  async trackDelivery(messageId: string): Promise<EmailDeliveryStatus> {
    try {
      const emailLog = await this.prisma.emailLog.findFirst({
        where: { messageId },
        orderBy: { sentAt: 'desc' },
      });

      if (!emailLog) {
        throw new BadRequestException('Email not found');
      }

      return {
        messageId,
        status: emailLog.status as EmailStatus,
        deliveredAt: emailLog.deliveredAt || undefined,
        openedAt: emailLog.openedAt || undefined,
        clickedAt: emailLog.clickedAt || undefined,
        bouncedAt: emailLog.sentAt, // Placeholder - would be updated by webhooks
        errorMessage: emailLog.errorMessage || undefined,
      };
    } catch (error) {
      this.logger.error(`Failed to track delivery for ${messageId}`, error);
      throw new BadRequestException('Failed to track email delivery');
    }
  }

  async handleWebhook(provider: 'sendgrid' | 'ses', payload: any): Promise<void> {
    try {
      if (provider === 'sendgrid') {
        await this.handleSendGridWebhook(payload);
      } else if (provider === 'ses') {
        await this.handleSESWebhook(payload);
      }
    } catch (error) {
      this.logger.error(`Failed to handle ${provider} webhook`, error);
    }
  }

  async sendWithSendGrid(options: EmailOptions): Promise<string> {
    try {
      const msg: any = {
        to: Array.isArray(options.to) ? options.to : [options.to],
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        from: this.configService.get('SENDGRID_FROM_EMAIL'),
        subject: options.subject,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' ? att.content : att.content.toString('base64'),
          type: att.contentType,
          contentId: att.cid,
        })),
        trackingSettings: {
          clickTracking: {
            enable: options.trackClicks || false,
          },
          openTracking: {
            enable: options.trackOpens || false,
          },
        },
      };

      // Add content based on what's available
      if (options.html && options.text) {
        msg.content = [
          { type: 'text/plain', value: options.text },
          { type: 'text/html', value: options.html },
        ];
      } else if (options.html) {
        msg.html = options.html;
      } else if (options.text) {
        msg.text = options.text;
      }

      const response = await sgMail.send(msg);
      return response[0].headers['x-message-id'];
    } catch (error) {
      this.logger.error('SendGrid send failed', error);
      throw error;
    }
  }

  async sendWithSES(options: EmailOptions): Promise<string> {
    try {
      const params = {
        Source: this.configService.get('AWS_SES_FROM_EMAIL'),
        Destination: {
          ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
          CcAddresses: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
          BccAddresses: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
        },
        Message: {
          Subject: {
            Data: options.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: options.html ? {
              Data: options.html,
              Charset: 'UTF-8',
            } : undefined,
            Text: options.text ? {
              Data: options.text,
              Charset: 'UTF-8',
            } : undefined,
          },
        },
      };

      const result = await this.ses.sendEmail(params).promise();
      return result.MessageId;
    } catch (error) {
      this.logger.error('AWS SES send failed', error);
      throw error;
    }
  }

  private async processTemplate(options: EmailOptions): Promise<Partial<EmailOptions>> {
    if (!options.templateId) {
      return {};
    }

    const template = await this.emailTemplateService.getTemplate(options.templateId);
    const compiledHtml = await this.emailTemplateService.compileTemplate(
      template.htmlContent,
      options.templateData || {},
    );
    const compiledText = template.textContent
      ? await this.emailTemplateService.compileTemplate(template.textContent, options.templateData || {})
      : undefined;

    return {
      subject: options.subject || template.subject,
      html: compiledHtml,
      text: compiledText,
    };
  }

  private async logEmailAttempt(options: EmailOptions, messageId: string): Promise<void> {
    try {
      await this.prisma.emailLog.create({
        data: {
          recipientEmail: Array.isArray(options.to) ? options.to[0] : options.to,
          subject: options.subject,
          templateId: options.templateId,
          status: 'QUEUED',
          messageId,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log email attempt', error);
    }
  }

  private async handleSendGridWebhook(events: any[]): Promise<void> {
    for (const event of events) {
      try {
        await this.updateEmailStatus(event.sg_message_id, event.event, event);
      } catch (error) {
        this.logger.error('Failed to process SendGrid webhook event', error);
      }
    }
  }

  private async handleSESWebhook(payload: any): Promise<void> {
    try {
      const message = JSON.parse(payload.Message);
      const messageId = message.mail?.messageId;
      
      if (messageId) {
        await this.updateEmailStatus(messageId, message.eventType, message);
      }
    } catch (error) {
      this.logger.error('Failed to process SES webhook', error);
    }
  }

  private async updateEmailStatus(messageId: string, eventType: string, eventData: any): Promise<void> {
    try {
      const statusMap: Record<string, EmailStatus> = {
        delivered: EmailStatus.DELIVERED,
        open: EmailStatus.OPENED,
        click: EmailStatus.CLICKED,
        bounce: EmailStatus.BOUNCED,
        dropped: EmailStatus.FAILED,
        spamreport: EmailStatus.COMPLAINED,
      };

      const status = statusMap[eventType] || EmailStatus.SENT;
      const updateData: any = { status };

      // Set specific timestamps based on event type
      switch (status) {
        case EmailStatus.DELIVERED:
          updateData.deliveredAt = new Date();
          break;
        case EmailStatus.OPENED:
          updateData.openedAt = new Date();
          break;
        case EmailStatus.CLICKED:
          updateData.clickedAt = new Date();
          break;
        case EmailStatus.FAILED:
          updateData.errorMessage = eventData.reason || 'Email failed';
          break;
      }

      await this.prisma.emailLog.updateMany({
        where: { messageId },
        data: updateData,
      });
    } catch (error) {
      this.logger.error('Failed to update email status', error);
    }
  }
}