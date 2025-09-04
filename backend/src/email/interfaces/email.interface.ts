export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: any;
  attachments?: EmailAttachment[];
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  cid?: string; // Content-ID for inline attachments
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: TemplateVariable[];
  category: EmailCategory;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  description?: string;
  required: boolean;
  defaultValue?: any;
}

export enum EmailCategory {
  QUOTATION = 'QUOTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  REMINDER = 'REMINDER',
  WELCOME = 'WELCOME',
  NOTIFICATION = 'NOTIFICATION',
  MARKETING = 'MARKETING',
}

export enum EmailStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  FAILED = 'FAILED',
  COMPLAINED = 'COMPLAINED',
}

export interface EmailDeliveryStatus {
  messageId: string;
  status: EmailStatus;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
}

export interface EmailJobData {
  options: EmailOptions;
  provider: 'sendgrid' | 'ses';
  retryCount?: number;
  maxRetries?: number;
}

export interface EmailAutomationRule {
  id: string;
  name: string;
  trigger: EmailTrigger;
  templateId: string;
  delay?: number; // in minutes
  conditions?: EmailCondition[];
  isActive: boolean;
}

export interface EmailTrigger {
  event: 'quotation_sent' | 'quotation_viewed' | 'quotation_expired' | 'customer_created';
  filters?: Record<string, any>;
}

export interface EmailCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  recipients: string[];
  scheduledAt?: Date;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused';
  stats: EmailCampaignStats;
}

export interface EmailCampaignStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}