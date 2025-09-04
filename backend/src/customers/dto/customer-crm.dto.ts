import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum InteractionType {
  EMAIL = 'EMAIL',
  CALL = 'CALL',
  MEETING = 'MEETING',
  NOTE = 'NOTE',
  FOLLOW_UP = 'FOLLOW_UP'
}

export enum InteractionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum InteractionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export class CreateInteractionDto {
  @ApiProperty({
    description: 'Customer ID for the interaction',
    example: 'cm1cust123abc456def789'
  })
  @IsString()
  customerId: string;

  @ApiProperty({
    description: 'Type of interaction',
    enum: InteractionType,
    example: InteractionType.EMAIL
  })
  @IsEnum(InteractionType)
  type: InteractionType;

  @ApiPropertyOptional({
    description: 'Subject or title of the interaction',
    example: 'Follow-up on quotation QUO-2024-000123'
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the interaction',
    example: 'Discussed pricing options and delivery timeline with customer'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Scheduled date and time for the interaction',
    example: '2024-02-15T14:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Completion date and time of the interaction',
    example: '2024-02-15T15:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the interaction',
    enum: InteractionPriority,
    example: InteractionPriority.MEDIUM
  })
  @IsOptional()
  @IsEnum(InteractionPriority)
  priority?: InteractionPriority;

  @ApiPropertyOptional({
    description: 'Current status of the interaction',
    enum: InteractionStatus,
    example: InteractionStatus.PENDING
  })
  @IsOptional()
  @IsEnum(InteractionStatus)
  status?: InteractionStatus;

  @ApiPropertyOptional({
    description: 'Outcome or result of the interaction',
    example: 'Customer agreed to revised pricing, will respond by Friday'
  })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({
    description: 'Whether a follow-up is required',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Date for follow-up if required',
    example: '2024-02-20T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing the interaction',
    type: [String],
    example: ['pricing', 'urgent', 'quotation']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'File attachments related to the interaction',
    type: [String],
    example: ['file1.pdf', 'file2.docx']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class UpdateInteractionDto {
  @ApiPropertyOptional({
    description: 'Type of interaction',
    enum: InteractionType,
    example: InteractionType.EMAIL
  })
  @IsOptional()
  @IsEnum(InteractionType)
  type?: InteractionType;

  @ApiPropertyOptional({
    description: 'Subject or title of the interaction',
    example: 'Follow-up on quotation QUO-2024-000123'
  })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the interaction',
    example: 'Discussed pricing options and delivery timeline with customer'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Scheduled date and time for the interaction',
    example: '2024-02-15T14:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Completion date and time of the interaction',
    example: '2024-02-15T15:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the interaction',
    enum: InteractionPriority,
    example: InteractionPriority.MEDIUM
  })
  @IsOptional()
  @IsEnum(InteractionPriority)
  priority?: InteractionPriority;

  @ApiPropertyOptional({
    description: 'Current status of the interaction',
    enum: InteractionStatus,
    example: InteractionStatus.COMPLETED
  })
  @IsOptional()
  @IsEnum(InteractionStatus)
  status?: InteractionStatus;

  @ApiPropertyOptional({
    description: 'Outcome or result of the interaction',
    example: 'Customer agreed to revised pricing, will respond by Friday'
  })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({
    description: 'Whether a follow-up is required',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @ApiPropertyOptional({
    description: 'Date for follow-up if required',
    example: '2024-02-20T10:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorizing the interaction',
    type: [String],
    example: ['pricing', 'urgent', 'quotation']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'File attachments related to the interaction',
    type: [String],
    example: ['file1.pdf', 'file2.docx']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class CreateFollowUpDto {
  @ApiProperty({
    description: 'Customer ID for the follow-up task',
    example: 'cm1cust123abc456def789'
  })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({
    description: 'Related interaction ID',
    example: 'cm1int123abc456def789'
  })
  @IsOptional()
  @IsString()
  interactionId?: string;

  @ApiPropertyOptional({
    description: 'User ID to assign the task to',
    example: 'cm1user123abc456def789'
  })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;

  @ApiPropertyOptional({
    description: 'Title of the follow-up task',
    example: 'Follow up on pricing discussion'
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Description of the follow-up task',
    example: 'Contact customer to finalize pricing and get purchase decision'
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Due date for the follow-up task',
    example: '2024-02-20T10:00:00Z'
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Priority level of the follow-up task',
    enum: InteractionPriority,
    example: InteractionPriority.HIGH
  })
  @IsOptional()
  @IsEnum(InteractionPriority)
  priority?: InteractionPriority;
}

export class CustomerTimelineEventDto {
  @ApiProperty({
    description: 'Event ID',
    example: 'cm1event123abc456def789'
  })
  id: string;

  @ApiProperty({
    description: 'Type of timeline event',
    enum: ['INTERACTION', 'QUOTATION', 'ORDER'],
    example: 'INTERACTION'
  })
  type: 'INTERACTION' | 'QUOTATION' | 'ORDER';

  @ApiProperty({
    description: 'Subtype providing more detail',
    example: 'EMAIL'
  })
  subType: string;

  @ApiProperty({
    description: 'Event title',
    example: 'Email sent regarding quotation'
  })
  title: string;

  @ApiProperty({
    description: 'Event description',
    example: 'Sent quotation QUO-2024-000123 via email'
  })
  description: string;

  @ApiProperty({
    description: 'Event date and time',
    example: '2024-02-15T14:30:00Z'
  })
  date: Date;

  @ApiPropertyOptional({
    description: 'Event status',
    example: 'COMPLETED'
  })
  status?: string;

  @ApiPropertyOptional({
    description: 'Event priority',
    example: 'MEDIUM'
  })
  priority?: string;

  @ApiPropertyOptional({
    description: 'User associated with the event',
    type: 'object'
  })
  user?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };

  @ApiPropertyOptional({
    description: 'Additional event metadata',
    type: 'object'
  })
  metadata?: any;
}

export class CustomerTimelineDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'cm1cust123abc456def789'
  })
  customerId: string;

  @ApiProperty({
    description: 'Customer basic information',
    type: 'object'
  })
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  };

  @ApiProperty({
    description: 'Timeline events',
    type: [CustomerTimelineEventDto]
  })
  events: CustomerTimelineEventDto[];

  @ApiProperty({
    description: 'Timeline summary statistics',
    type: 'object'
  })
  summary: {
    totalEvents: number;
    totalInteractions: number;
    totalQuotations: number;
    totalOrders: number;
    lastActivityAt?: Date;
    interactionSummary: any;
  };
}

export class CustomerRelationshipScoreDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'cm1cust123abc456def789'
  })
  customerId: string;

  @ApiProperty({
    description: 'Overall relationship score (0-100)',
    example: 75
  })
  overallScore: number;

  @ApiProperty({
    description: 'Breakdown of score components',
    type: 'object'
  })
  scoreBreakdown: {
    interactionScore: number;
    responseScore: number;
    purchaseScore: number;
    loyaltyScore: number;
    engagementScore: number;
  };

  @ApiProperty({
    description: 'Score category',
    enum: ['CHAMPION', 'LOYAL', 'POTENTIAL', 'NEW', 'AT_RISK'],
    example: 'LOYAL'
  })
  scoreCategory: string;

  @ApiProperty({
    description: 'Recommendations based on score',
    type: [String],
    example: ['Schedule regular check-ins', 'Explore upselling opportunities']
  })
  recommendations: string[];

  @ApiProperty({
    description: 'Last calculation timestamp',
    example: '2024-02-15T14:30:00Z'
  })
  lastCalculatedAt: Date;
}

export class CrmAnalyticsDto {
  @ApiProperty({
    description: 'Date range for analytics',
    type: 'object'
  })
  dateRange: {
    startDate: Date;
    endDate: Date;
  };

  @ApiProperty({
    description: 'Total interactions in period',
    example: 150
  })
  totalInteractions: number;

  @ApiProperty({
    description: 'Interactions breakdown by type',
    type: 'object',
    example: { EMAIL: 80, CALL: 45, MEETING: 25 }
  })
  interactionsByType: Record<string, number>;

  @ApiProperty({
    description: 'Task completion metrics',
    type: 'object'
  })
  taskMetrics: {
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };

  @ApiProperty({
    description: 'Average response time in hours',
    example: 24.5
  })
  averageResponseTime: number;

  @ApiProperty({
    description: 'Top performing users',
    type: 'array'
  })
  topPerformers: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    interactionCount: number;
  }>;
}

export class CreditLimitUpdateDto {
  @ApiProperty({
    description: 'New credit limit amount',
    example: 500000
  })
  @IsNumber()
  creditLimit: number;

  @ApiPropertyOptional({
    description: 'Reason for credit limit change',
    example: 'Customer demonstrated good payment history'
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Whether to send notification to customer',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  notifyCustomer?: boolean;
}

export class CreditLimitAlertDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 'cm1cust123abc456def789'
  })
  customerId: string;

  @ApiProperty({
    description: 'Current credit limit',
    example: 100000
  })
  currentLimit: number;

  @ApiProperty({
    description: 'Current outstanding amount',
    example: 85000
  })
  outstandingAmount: number;

  @ApiProperty({
    description: 'Utilization percentage',
    example: 85
  })
  utilizationPercentage: number;

  @ApiProperty({
    description: 'Alert type',
    enum: ['WARNING', 'CRITICAL', 'EXCEEDED'],
    example: 'WARNING'
  })
  alertType: 'WARNING' | 'CRITICAL' | 'EXCEEDED';

  @ApiProperty({
    description: 'Alert message',
    example: 'Customer has utilized 85% of credit limit'
  })
  message: string;

  @ApiProperty({
    description: 'Customer information',
    type: 'object'
  })
  customer: {
    id: string;
    companyName: string;
    contactPerson: string;
    email: string;
  };
}

export class CustomerImportDto {
  @ApiProperty({
    description: 'CSV file containing customer data',
    type: 'string',
    format: 'binary'
  })
  file: any;

  @ApiPropertyOptional({
    description: 'Whether to skip duplicate customers',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  skipDuplicates?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to update existing customers',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  updateExisting?: boolean;
}

export class CustomerExportDto {
  @ApiPropertyOptional({
    description: 'Customer segment to export',
    example: 'business_type_enterprise'
  })
  @IsOptional()
  @IsString()
  segmentId?: string;

  @ApiPropertyOptional({
    description: 'Customer type filter',
    enum: ['INDIVIDUAL', 'SMALL_BUSINESS', 'ENTERPRISE', 'GOVERNMENT'],
    example: 'ENTERPRISE'
  })
  @IsOptional()
  @IsString()
  customerType?: string;

  @ApiPropertyOptional({
    description: 'Export format',
    enum: ['CSV', 'EXCEL', 'JSON'],
    example: 'CSV'
  })
  @IsOptional()
  @IsEnum(['CSV', 'EXCEL', 'JSON'])
  format?: 'CSV' | 'EXCEL' | 'JSON';

  @ApiPropertyOptional({
    description: 'Fields to include in export',
    type: [String],
    example: ['companyName', 'contactPerson', 'email', 'phone', 'creditLimit']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];

  @ApiPropertyOptional({
    description: 'Date range for filtering customers',
    type: 'object'
  })
  @IsOptional()
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}