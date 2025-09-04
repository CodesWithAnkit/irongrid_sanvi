import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as Handlebars from 'handlebars';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailTemplate, EmailCategory } from '../interfaces/email.interface';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);
  private templateCache = new Map<string, EmailTemplate>();

  constructor(private prisma: PrismaService) {
    this.registerHelpers();
  }

  async getTemplate(templateId: string): Promise<EmailTemplate> {
    try {
      // Check cache first
      if (this.templateCache.has(templateId)) {
        return this.templateCache.get(templateId)!;
      }

      // Try to get from database
      const template = await this.prisma.emailTemplate.findUnique({
        where: { id: templateId },
      });

      if (template) {
        const emailTemplate: EmailTemplate = {
          id: template.id,
          name: template.name,
          subject: template.subject,
          htmlContent: template.htmlContent,
          textContent: template.textContent || undefined,
          variables: template.variables as any[] || [],
          category: template.category as EmailCategory,
          isActive: template.isActive,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
        };

        // Cache the template
        this.templateCache.set(templateId, emailTemplate);
        return emailTemplate;
      }

      // Return default template if not found
      return this.getDefaultTemplate(templateId);
    } catch (error) {
      this.logger.error(`Failed to get template ${templateId}`, error);
      throw new BadRequestException('Template not found');
    }
  }

  async compileTemplate(templateContent: string, data: any): Promise<string> {
    try {
      const template = Handlebars.compile(templateContent);
      return template(data);
    } catch (error) {
      this.logger.error('Failed to compile template', error);
      throw new BadRequestException('Failed to compile template');
    }
  }

  async createTemplate(templateData: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const template = await this.prisma.emailTemplate.create({
        data: {
          name: templateData.name!,
          subject: templateData.subject!,
          htmlContent: templateData.htmlContent!,
          textContent: templateData.textContent,
          variables: templateData.variables as any || [],
          category: templateData.category || EmailCategory.NOTIFICATION,
          isActive: templateData.isActive !== false,
        },
      });

      const emailTemplate: EmailTemplate = {
        id: template.id,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || undefined,
        variables: template.variables as any[] || [],
        category: template.category as EmailCategory,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };

      // Update cache
      this.templateCache.set(template.id, emailTemplate);

      return emailTemplate;
    } catch (error) {
      this.logger.error('Failed to create template', error);
      throw new BadRequestException('Failed to create template');
    }
  }

  async updateTemplate(templateId: string, updateData: Partial<EmailTemplate>): Promise<EmailTemplate> {
    try {
      const template = await this.prisma.emailTemplate.update({
        where: { id: templateId },
        data: {
          name: updateData.name,
          subject: updateData.subject,
          htmlContent: updateData.htmlContent,
          textContent: updateData.textContent,
          variables: updateData.variables as any,
          category: updateData.category,
          isActive: updateData.isActive,
        },
      });

      const emailTemplate: EmailTemplate = {
        id: template.id,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || undefined,
        variables: template.variables as any[] || [],
        category: template.category as EmailCategory,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };

      // Update cache
      this.templateCache.set(templateId, emailTemplate);

      return emailTemplate;
    } catch (error) {
      this.logger.error(`Failed to update template ${templateId}`, error);
      throw new BadRequestException('Failed to update template');
    }
  }

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await this.prisma.emailTemplate.delete({
        where: { id: templateId },
      });

      // Remove from cache
      this.templateCache.delete(templateId);
    } catch (error) {
      this.logger.error(`Failed to delete template ${templateId}`, error);
      throw new BadRequestException('Failed to delete template');
    }
  }

  async listTemplates(category?: EmailCategory): Promise<EmailTemplate[]> {
    try {
      const templates = await this.prisma.emailTemplate.findMany({
        where: category ? { category } : undefined,
        orderBy: { name: 'asc' },
      });

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || undefined,
        variables: template.variables as any[] || [],
        category: template.category as EmailCategory,
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      }));
    } catch (error) {
      this.logger.error('Failed to list templates', error);
      throw new BadRequestException('Failed to list templates');
    }
  }

  private registerHelpers(): void {
    // Register custom Handlebars helpers
    Handlebars.registerHelper('formatCurrency', (amount: number, currency = 'INR') => {
      const symbol = currency === 'INR' ? '₹' : '$';
      return `${symbol}${amount.toLocaleString()}`;
    });

    Handlebars.registerHelper('formatDate', (date: string | Date) => {
      const d = new Date(date);
      return d.toLocaleDateString('en-IN');
    });

    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
  }

  private getDefaultTemplate(templateId: string): EmailTemplate {
    const defaultTemplates: Record<string, EmailTemplate> = {
      'quotation-email': {
        id: 'quotation-email',
        name: 'Quotation Email',
        subject: 'Quotation {{quotation.quotationNumber}} from {{company.name}}',
        htmlContent: this.getQuotationEmailTemplate(),
        textContent: this.getQuotationEmailTextTemplate(),
        variables: [],
        category: EmailCategory.QUOTATION,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      'quotation-follow-up': {
        id: 'quotation-follow-up',
        name: 'Quotation Follow-up',
        subject: 'Follow-up: Quotation {{quotation.quotationNumber}}',
        htmlContent: this.getFollowUpEmailTemplate(),
        textContent: this.getFollowUpEmailTextTemplate(),
        variables: [],
        category: EmailCategory.FOLLOW_UP,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      'quotation-expiry-reminder': {
        id: 'quotation-expiry-reminder',
        name: 'Quotation Expiry Reminder',
        subject: 'Reminder: Quotation {{quotation.quotationNumber}} expires soon',
        htmlContent: this.getExpiryReminderTemplate(),
        textContent: this.getExpiryReminderTextTemplate(),
        variables: [],
        category: EmailCategory.REMINDER,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    return defaultTemplates[templateId] || defaultTemplates['quotation-email'];
  }

  private getQuotationEmailTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation from {{company.name}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2c3e50; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f8f9fa; }
        .quotation-details { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{company.name}}</h1>
            <h2>Quotation {{quotation.quotationNumber}}</h2>
        </div>
        
        <div class="content">
            <p>Dear {{customer.contactPerson}},</p>
            
            <p>Thank you for your interest in our products. Please find attached your quotation details:</p>
            
            <div class="quotation-details">
                <h3>Quotation Summary</h3>
                <p><strong>Quotation Number:</strong> {{quotation.quotationNumber}}</p>
                <p><strong>Total Amount:</strong> {{formatCurrency quotation.totalAmount}}</p>
                <p><strong>Valid Until:</strong> {{formatDate quotation.validUntil}}</p>
            </div>
            
            {{#if quotation.viewUrl}}
            <p>
                <a href="{{quotation.viewUrl}}" class="button">View Quotation Online</a>
            </p>
            {{/if}}
            
            <p>If you have any questions or need clarification, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            {{company.name}}<br>
            Phone: {{company.phone}}<br>
            Email: {{company.email}}</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by {{company.name}}. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getQuotationEmailTextTemplate(): string {
    return `
Dear {{customer.contactPerson}},

Thank you for your interest in our products. Please find your quotation details below:

Quotation Number: {{quotation.quotationNumber}}
Total Amount: {{formatCurrency quotation.totalAmount}}
Valid Until: {{formatDate quotation.validUntil}}

{{#if quotation.viewUrl}}
View online: {{quotation.viewUrl}}
{{/if}}

If you have any questions or need clarification, please don't hesitate to contact us.

Best regards,
{{company.name}}
Phone: {{company.phone}}
Email: {{company.email}}

---
This email was sent by {{company.name}}.
    `;
  }

  private getFollowUpEmailTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Follow-up: Quotation {{quotation.quotationNumber}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #27ae60; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f8f9fa; }
        .button { display: inline-block; background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Follow-up on Your Quotation</h1>
            <h2>{{quotation.quotationNumber}}</h2>
        </div>
        
        <div class="content">
            <p>Dear {{customer.contactPerson}},</p>
            
            <p>We wanted to follow up on the quotation we sent you recently. We hope you've had a chance to review it.</p>
            
            <p><strong>Quotation Details:</strong></p>
            <ul>
                <li>Quotation Number: {{quotation.quotationNumber}}</li>
                <li>Total Amount: {{formatCurrency quotation.totalAmount}}</li>
                <li>Valid Until: {{formatDate quotation.validUntil}}</li>
            </ul>
            
            <p>If you have any questions about the quotation or would like to discuss the details, please feel free to reach out to us.</p>
            
            <p>We look forward to hearing from you soon!</p>
            
            <p>Best regards,<br>
            {{company.name}}</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by {{company.name}}.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getFollowUpEmailTextTemplate(): string {
    return `
Dear {{customer.contactPerson}},

We wanted to follow up on the quotation we sent you recently. We hope you've had a chance to review it.

Quotation Details:
- Quotation Number: {{quotation.quotationNumber}}
- Total Amount: {{formatCurrency quotation.totalAmount}}
- Valid Until: {{formatDate quotation.validUntil}}

If you have any questions about the quotation or would like to discuss the details, please feel free to reach out to us.

We look forward to hearing from you soon!

Best regards,
{{company.name}}
    `;
  }

  private getExpiryReminderTemplate(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation Expiry Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #e74c3c; color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background-color: #f8f9fa; }
        .urgent { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .button { display: inline-block; background-color: #e74c3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚠️ Quotation Expiry Reminder</h1>
            <h2>{{quotation.quotationNumber}}</h2>
        </div>
        
        <div class="content">
            <p>Dear {{customer.contactPerson}},</p>
            
            <div class="urgent">
                <p><strong>Important:</strong> Your quotation {{quotation.quotationNumber}} is expiring soon!</p>
                <p><strong>Expiry Date:</strong> {{formatDate quotation.validUntil}}</p>
            </div>
            
            <p>We wanted to remind you that your quotation for {{formatCurrency quotation.totalAmount}} will expire on {{formatDate quotation.validUntil}}.</p>
            
            <p>To avoid missing out on this offer, please contact us as soon as possible if you would like to proceed with the order or need an extension.</p>
            
            <p>We're here to help and answer any questions you may have.</p>
            
            <p>Best regards,<br>
            {{company.name}}</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by {{company.name}}.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private getExpiryReminderTextTemplate(): string {
    return `
Dear {{customer.contactPerson}},

⚠️ IMPORTANT: Your quotation {{quotation.quotationNumber}} is expiring soon!

Expiry Date: {{formatDate quotation.validUntil}}
Total Amount: {{formatCurrency quotation.totalAmount}}

We wanted to remind you that your quotation will expire on {{formatDate quotation.validUntil}}.

To avoid missing out on this offer, please contact us as soon as possible if you would like to proceed with the order or need an extension.

We're here to help and answer any questions you may have.

Best regards,
{{company.name}}
    `;
  }
}