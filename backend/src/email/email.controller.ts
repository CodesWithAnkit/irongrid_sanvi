import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { EmailTemplateService } from './services/email-template.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendEmailDto, SendQuotationEmailDto, CreateTemplateDto, UpdateTemplateDto } from './dto';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Send email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    const messageId = await this.emailService.sendEmail(sendEmailDto);
    return { success: true, messageId };
  }

  @Post('send/quotation/:quotationId')
  @ApiOperation({ summary: 'Send quotation email' })
  @ApiResponse({ status: 200, description: 'Quotation email sent successfully' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async sendQuotationEmail(
    @Param('quotationId') quotationId: string,
    @Body() sendQuotationEmailDto: SendQuotationEmailDto,
  ) {
    const messageId = await this.emailService.sendQuotationEmail(
      quotationId,
      sendQuotationEmailDto.recipientEmail,
      sendQuotationEmailDto.options,
    );
    return { success: true, messageId };
  }

  @Post('send/follow-up/:quotationId')
  @ApiOperation({ summary: 'Send follow-up email' })
  @ApiResponse({ status: 200, description: 'Follow-up email sent successfully' })
  async sendFollowUpEmail(
    @Param('quotationId') quotationId: string,
    @Body() body: { templateId: string; delay?: number },
  ) {
    const messageId = await this.emailService.sendFollowUpEmail(
      quotationId,
      body.templateId,
      body.delay,
    );
    return { success: true, messageId };
  }

  @Post('send/expiry-reminder/:quotationId')
  @ApiOperation({ summary: 'Send quotation expiry reminder' })
  @ApiResponse({ status: 200, description: 'Expiry reminder sent successfully' })
  async sendExpiryReminder(@Param('quotationId') quotationId: string) {
    const messageId = await this.emailService.sendExpiryReminder(quotationId);
    return { success: true, messageId };
  }

  @Get('track/:messageId')
  @ApiOperation({ summary: 'Track email delivery status' })
  @ApiResponse({ status: 200, description: 'Email status retrieved successfully' })
  async trackDelivery(@Param('messageId') messageId: string) {
    const status = await this.emailService.trackDelivery(messageId);
    return { success: true, data: status };
  }

  @Post('webhook/sendgrid')
  @ApiOperation({ summary: 'SendGrid webhook endpoint' })
  async handleSendGridWebhook(@Body() payload: any[]) {
    await this.emailService.handleWebhook('sendgrid', payload);
    return { success: true };
  }

  @Post('webhook/ses')
  @ApiOperation({ summary: 'AWS SES webhook endpoint' })
  async handleSESWebhook(@Body() payload: any) {
    await this.emailService.handleWebhook('ses', payload);
    return { success: true };
  }

  // Template Management Endpoints

  @Get('templates')
  @ApiOperation({ summary: 'List email templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async listTemplates(@Query('category') category?: string) {
    const templates = await this.emailTemplateService.listTemplates(category as any);
    return { success: true, data: templates };
  }

  @Get('templates/:templateId')
  @ApiOperation({ summary: 'Get email template by ID' })
  @ApiResponse({ status: 200, description: 'Template retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('templateId') templateId: string) {
    const template = await this.emailTemplateService.getTemplate(templateId);
    return { success: true, data: template };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create email template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    const template = await this.emailTemplateService.createTemplate(createTemplateDto);
    return { success: true, data: template };
  }

  @Put('templates/:templateId')
  @ApiOperation({ summary: 'Update email template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async updateTemplate(
    @Param('templateId') templateId: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    const template = await this.emailTemplateService.updateTemplate(templateId, updateTemplateDto);
    return { success: true, data: template };
  }

  @Delete('templates/:templateId')
  @ApiOperation({ summary: 'Delete email template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async deleteTemplate(@Param('templateId') templateId: string) {
    await this.emailTemplateService.deleteTemplate(templateId);
    return { success: true };
  }
}