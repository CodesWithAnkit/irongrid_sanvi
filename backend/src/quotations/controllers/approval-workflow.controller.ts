import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { ApprovalWorkflowService } from '../services/approval-workflow.service';
import { 
  CreateApprovalWorkflowDto,
  UpdateApprovalWorkflowDto,
  RequestQuotationApprovalDto,
  ProcessApprovalStepDto,
  ApprovalWorkflowResponseDto,
  QuotationApprovalResponseDto,
  ApprovalDashboardDto
} from '../dto/approval-workflow.dto';
import { 
  ApiStandardResponse, 
  ApiAuthenticatedOperation,
  ApiPaginatedResponse,
} from '../../common/decorators/api-response.decorator';

@ApiTags('Approval Workflows')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(ApprovalWorkflowResponseDto, QuotationApprovalResponseDto, ApprovalDashboardDto)
@Controller('quotations/approvals')
@UseGuards(AuthGuard('jwt'))
export class ApprovalWorkflowController {
  constructor(
    private readonly approvalService: ApprovalWorkflowService,
  ) {}

  @Post('workflows')
  @ApiAuthenticatedOperation(
    'Create Approval Workflow',
    'Create a new approval workflow with configurable conditions and multi-level authorization rules.'
  )
  @ApiBody({
    type: CreateApprovalWorkflowDto,
    description: 'Workflow creation data',
    examples: {
      highValue: {
        summary: 'High value quotation approval workflow',
        value: {
          name: 'High Value Quotation Approval',
          description: 'Approval workflow for quotations above $100,000',
          conditions: [
            {
              field: 'totalAmount',
              operator: 'gte',
              value: 100000
            }
          ],
          approvalLevels: [
            {
              level: 1,
              name: 'Manager Approval',
              approverUserIds: ['cm1user123manager', 'cm1user456manager'],
              requireAllApprovers: false
            },
            {
              level: 2,
              name: 'Director Approval',
              approverUserIds: ['cm1user789director'],
              requireAllApprovers: true,
              autoApprovalTimeoutHours: 48
            }
          ],
          priority: 1
        }
      },
      customerType: {
        summary: 'Customer type based approval',
        value: {
          name: 'Enterprise Customer Approval',
          description: 'Special approval for enterprise customers',
          conditions: [
            {
              field: 'customer.customerType',
              operator: 'eq',
              value: 'ENTERPRISE'
            },
            {
              field: 'totalAmount',
              operator: 'gte',
              value: 50000
            }
          ],
          approvalLevels: [
            {
              level: 1,
              name: 'Account Manager Approval',
              approverUserIds: ['cm1user123account'],
              requireAllApprovers: true
            }
          ],
          priority: 2
        }
      }
    }
  })
  @ApiStandardResponse(ApprovalWorkflowResponseDto, 'Workflow created successfully')
  createWorkflow(@Body() dto: CreateApprovalWorkflowDto) {
    return this.approvalService.createWorkflow(dto);
  }

  @Get('workflows')
  @ApiAuthenticatedOperation(
    'List Approval Workflows',
    'Retrieve all approval workflows ordered by priority and creation date.'
  )
  @ApiPaginatedResponse(ApprovalWorkflowResponseDto, 'Workflows retrieved successfully')
  listWorkflows() {
    return this.approvalService.findAllWorkflows();
  }

  @Get('workflows/:id')
  @ApiAuthenticatedOperation(
    'Get Workflow Details',
    'Retrieve detailed information for a specific approval workflow including conditions and approval levels.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Workflow identifier',
    example: 'cm1wf123abc456def789'
  })
  @ApiStandardResponse(ApprovalWorkflowResponseDto, 'Workflow details retrieved successfully')
  getWorkflow(@Param('id') id: string) {
    return this.approvalService.findWorkflow(id);
  }

  @Patch('workflows/:id')
  @ApiAuthenticatedOperation(
    'Update Approval Workflow',
    'Update approval workflow configuration including conditions, levels, and settings.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Workflow identifier',
    example: 'cm1wf123abc456def789'
  })
  @ApiBody({
    type: UpdateApprovalWorkflowDto,
    description: 'Workflow update data',
    examples: {
      updateConditions: {
        summary: 'Update workflow conditions',
        value: {
          conditions: [
            {
              field: 'totalAmount',
              operator: 'gte',
              value: 150000
            }
          ]
        }
      },
      deactivate: {
        summary: 'Deactivate workflow',
        value: {
          isActive: false
        }
      }
    }
  })
  @ApiStandardResponse(ApprovalWorkflowResponseDto, 'Workflow updated successfully')
  updateWorkflow(@Param('id') id: string, @Body() dto: UpdateApprovalWorkflowDto) {
    return this.approvalService.updateWorkflow(id, dto);
  }

  @Delete('workflows/:id')
  @ApiAuthenticatedOperation(
    'Delete Approval Workflow',
    'Delete an approval workflow. Cannot delete workflows with pending approvals.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Workflow identifier',
    example: 'cm1wf123abc456def789'
  })
  @ApiStandardResponse(Object, 'Workflow deleted successfully')
  deleteWorkflow(@Param('id') id: string) {
    return this.approvalService.deleteWorkflow(id);
  }

  @Post('request')
  @ApiAuthenticatedOperation(
    'Request Quotation Approval',
    'Submit a quotation for approval. The system will automatically find the matching workflow based on quotation criteria.'
  )
  @ApiBody({
    type: RequestQuotationApprovalDto,
    description: 'Approval request data',
    examples: {
      basic: {
        summary: 'Request approval for quotation',
        value: {
          quotationId: 'cm1quo123abc456def789',
          comments: 'High value quotation requiring management approval'
        }
      }
    }
  })
  @ApiStandardResponse(QuotationApprovalResponseDto, 'Approval request created successfully')
  requestApproval(@Body() dto: RequestQuotationApprovalDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.approvalService.requestApproval(dto, payload?.sub);
  }

  @Post(':approvalId/steps/:stepId/process')
  @ApiAuthenticatedOperation(
    'Process Approval Step',
    'Approve or reject an approval step. Only the assigned approver can process their steps.'
  )
  @ApiParam({
    name: 'approvalId',
    type: String,
    description: 'Approval identifier',
    example: 'cm1app123abc456def789'
  })
  @ApiParam({
    name: 'stepId',
    type: String,
    description: 'Approval step identifier',
    example: 'cm1step123abc456def789'
  })
  @ApiBody({
    type: ProcessApprovalStepDto,
    description: 'Approval decision data',
    examples: {
      approve: {
        summary: 'Approve the step',
        value: {
          status: 'APPROVED',
          comments: 'Quotation looks good, approved for next level'
        }
      },
      reject: {
        summary: 'Reject the step',
        value: {
          status: 'REJECTED',
          comments: 'Pricing needs to be reviewed before approval'
        }
      }
    }
  })
  @ApiStandardResponse(QuotationApprovalResponseDto, 'Approval step processed successfully')
  processApprovalStep(
    @Param('approvalId') approvalId: string,
    @Param('stepId') stepId: string,
    @Body() dto: ProcessApprovalStepDto,
    @Req() req: any
  ) {
    const payload = req.user as { sub: string };
    return this.approvalService.processApprovalStep(approvalId, stepId, dto, payload?.sub);
  }

  @Get(':approvalId')
  @ApiAuthenticatedOperation(
    'Get Approval Details',
    'Retrieve detailed information for a specific quotation approval including all steps and current status.'
  )
  @ApiParam({
    name: 'approvalId',
    type: String,
    description: 'Approval identifier',
    example: 'cm1app123abc456def789'
  })
  @ApiStandardResponse(QuotationApprovalResponseDto, 'Approval details retrieved successfully')
  getApprovalDetails(@Param('approvalId') approvalId: string) {
    return this.approvalService.getApprovalDetails(approvalId);
  }

  @Get('pending/my')
  @ApiAuthenticatedOperation(
    'Get My Pending Approvals',
    'Retrieve all quotation approvals pending action from the current user.'
  )
  @ApiStandardResponse(QuotationApprovalResponseDto, 'Pending approvals retrieved successfully')
  getMyPendingApprovals(@Req() req: any) {
    const payload = req.user as { sub: string };
    return this.approvalService.getPendingApprovalsForUser(payload?.sub);
  }

  @Get('dashboard')
  @ApiAuthenticatedOperation(
    'Get Approval Dashboard',
    'Retrieve approval dashboard data including pending counts, recent activity, and workflow statistics.'
  )
  @ApiStandardResponse(ApprovalDashboardDto, 'Dashboard data retrieved successfully')
  getApprovalDashboard(@Req() req: any) {
    const payload = req.user as { sub: string };
    return this.approvalService.getApprovalDashboard(payload?.sub);
  }
}