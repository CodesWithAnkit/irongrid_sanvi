import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsBoolean, 
  IsEnum, 
  IsNotEmpty, 
  IsNumber, 
  IsObject, 
  IsOptional, 
  IsString, 
  MaxLength, 
  Min, 
  ValidateNested 
} from 'class-validator';

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export class ApprovalConditionDto {
  @ApiProperty({
    description: 'Field to check (e.g., totalAmount, customerType)',
    example: 'totalAmount'
  })
  @IsString()
  @IsNotEmpty()
  field!: string;

  @ApiProperty({
    description: 'Operator for comparison (gt, gte, lt, lte, eq, ne, in, nin)',
    example: 'gte'
  })
  @IsString()
  @IsNotEmpty()
  operator!: string;

  @ApiProperty({
    description: 'Value to compare against',
    example: 100000
  })
  value!: any;
}

export class ApprovalLevelDto {
  @ApiProperty({
    description: 'Level number (1, 2, 3, etc.)',
    example: 1,
    minimum: 1
  })
  @IsNumber()
  @Min(1)
  level!: number;

  @ApiProperty({
    description: 'Name/description of this approval level',
    example: 'Manager Approval'
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    description: 'Array of user IDs who can approve at this level',
    example: ['cm1user123', 'cm1user456']
  })
  @IsArray()
  @IsString({ each: true })
  approverUserIds!: string[];

  @ApiPropertyOptional({
    description: 'Whether all approvers must approve (true) or just one (false)',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  requireAllApprovers?: boolean = false;

  @ApiPropertyOptional({
    description: 'Auto-approval timeout in hours',
    example: 24,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  autoApprovalTimeoutHours?: number;
}

export class CreateApprovalWorkflowDto {
  @ApiProperty({
    description: 'Workflow name',
    example: 'High Value Quotation Approval',
    maxLength: 100
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({
    description: 'Workflow description',
    example: 'Approval workflow for quotations above $100,000',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Conditions that trigger this workflow',
    type: [ApprovalConditionDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalConditionDto)
  conditions!: ApprovalConditionDto[];

  @ApiProperty({
    description: 'Approval levels and their configurations',
    type: [ApprovalLevelDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalLevelDto)
  approvalLevels!: ApprovalLevelDto[];

  @ApiPropertyOptional({
    description: 'Workflow priority (higher number = higher priority)',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number = 1;
}

export class UpdateApprovalWorkflowDto {
  @ApiPropertyOptional({
    description: 'Workflow name',
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Workflow description',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether this workflow is active'
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Conditions that trigger this workflow',
    type: [ApprovalConditionDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalConditionDto)
  conditions?: ApprovalConditionDto[];

  @ApiPropertyOptional({
    description: 'Approval levels and their configurations',
    type: [ApprovalLevelDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalLevelDto)
  approvalLevels?: ApprovalLevelDto[];

  @ApiPropertyOptional({
    description: 'Workflow priority',
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  priority?: number;
}

export class RequestQuotationApprovalDto {
  @ApiProperty({
    description: 'Quotation ID to request approval for',
    example: 'cm1quo123abc456def789'
  })
  @IsString()
  @IsNotEmpty()
  quotationId!: string;

  @ApiPropertyOptional({
    description: 'Additional comments for the approval request',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}

export class ProcessApprovalStepDto {
  @ApiProperty({
    description: 'Approval decision',
    enum: ApprovalStatus,
    example: ApprovalStatus.APPROVED
  })
  @IsEnum(ApprovalStatus)
  status!: ApprovalStatus;

  @ApiPropertyOptional({
    description: 'Comments for the approval decision',
    maxLength: 1000
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comments?: string;
}

export class ApprovalWorkflowResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  conditions!: any;

  @ApiProperty()
  approvalLevels!: any;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  priority!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ApprovalStepResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  level!: number;

  @ApiProperty()
  approver!: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };

  @ApiProperty({ enum: ApprovalStatus })
  status!: ApprovalStatus;

  @ApiPropertyOptional()
  comments?: string;

  @ApiPropertyOptional()
  approvedAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class QuotationApprovalResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quotation!: {
    id: string;
    quotationNumber: string;
    totalAmount: number;
    customer: {
      id: string;
      companyName: string;
      contactPerson: string;
    };
  };

  @ApiProperty()
  workflow!: ApprovalWorkflowResponseDto;

  @ApiProperty()
  currentLevel!: number;

  @ApiProperty({ enum: ApprovalStatus })
  status!: ApprovalStatus;

  @ApiProperty()
  requestedAt!: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  requestedBy?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };

  @ApiProperty({ type: [ApprovalStepResponseDto] })
  steps!: ApprovalStepResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class ApprovalDashboardDto {
  @ApiProperty()
  pendingApprovals!: number;

  @ApiProperty()
  myPendingApprovals!: number;

  @ApiProperty()
  approvedToday!: number;

  @ApiProperty()
  rejectedToday!: number;

  @ApiProperty()
  averageApprovalTime!: number; // in hours

  @ApiProperty()
  recentApprovals!: QuotationApprovalResponseDto[];

  @ApiProperty()
  workflowStats!: {
    workflowId: string;
    workflowName: string;
    pendingCount: number;
    averageTime: number;
  }[];
}