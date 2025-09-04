import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailService } from '../email.service';
import { EmailJobData } from '../interfaces/email.interface';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJobData>) {
    const { options, provider, retryCount = 0, maxRetries = 3 } = job.data;

    try {
      this.logger.log(`Processing email job ${job.id} with ${provider} provider`);

      let messageId: string;

      if (provider === 'sendgrid') {
        messageId = await this.emailService.sendWithSendGrid(options);
      } else if (provider === 'ses') {
        messageId = await this.emailService.sendWithSES(options);
      } else {
        throw new Error(`Unknown email provider: ${provider}`);
      }

      this.logger.log(`Email sent successfully with message ID: ${messageId}`);
      return { messageId, provider };
    } catch (error) {
      this.logger.error(`Failed to send email with ${provider}`, error);

      // Try fallback provider if primary fails
      if (provider === 'sendgrid' && retryCount < maxRetries) {
        this.logger.log('Attempting fallback to AWS SES');
        
        try {
          const messageId = await this.emailService.sendWithSES(options);
          this.logger.log(`Email sent successfully with SES fallback: ${messageId}`);
          return { messageId, provider: 'ses' };
        } catch (sesError) {
          this.logger.error('SES fallback also failed', sesError);
        }
      }

      // If we've exhausted retries or fallback failed, throw the error
      if (retryCount >= maxRetries) {
        this.logger.error(`Email job ${job.id} failed after ${maxRetries} retries`);
        throw error;
      }

      // Retry with exponential backoff
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...
      throw new Error(`Retry attempt ${retryCount + 1}/${maxRetries} after ${delay}ms`);
    }
  }

  @Process('send-bulk-email')
  async handleBulkEmail(job: Job<{ emails: EmailJobData[] }>) {
    const { emails } = job.data;
    const results = [];

    this.logger.log(`Processing bulk email job ${job.id} with ${emails.length} emails`);

    for (const emailData of emails) {
      try {
        const result = await this.handleSendEmail({ data: emailData } as Job<EmailJobData>);
        results.push({ success: true, ...result });
      } catch (error) {
        this.logger.error('Failed to send email in bulk job', error);
        results.push({ success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    this.logger.log(`Bulk email job ${job.id} completed: ${successCount}/${emails.length} successful`);

    return results;
  }

  @Process('schedule-follow-up')
  async handleScheduleFollowUp(job: Job<{ quotationId: string; templateId: string; delay: number }>) {
    const { quotationId, templateId, delay } = job.data;

    try {
      this.logger.log(`Scheduling follow-up email for quotation ${quotationId}`);
      
      const messageId = await this.emailService.sendFollowUpEmail(quotationId, templateId, delay);
      
      this.logger.log(`Follow-up email scheduled with message ID: ${messageId}`);
      return { messageId };
    } catch (error) {
      this.logger.error(`Failed to schedule follow-up for quotation ${quotationId}`, error);
      throw error;
    }
  }
}