import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateApprovalWorkflowDto, 
  UpdateApprovalWorkflowDto,
  RequestQuotationApprovalDto,
  ProcessApprovalStepDto,
  ApprovalWorkflowResponseDto,
  QuotationApprovalResponseDto,
  ApprovalDashboardDto,
  ApprovalStatus
} from '../dto/approval-workflow.dto';
import { Prisma, QuotationStatus } from '@prisma/client';

@Injectable()
export class ApprovalWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new approval workflow
   */
  async createWorkflow(dto: CreateApprovalWorkflowDto): Promise<ApprovalWorkflowResponseDto> {
    // Check if workflow name already exists
    const existingWorkflow = await this.prisma.approvalWorkflow.findUnique({
      where: { name: dto.name }
    });

    if (existingWorkflow) {
      throw new BadRequestException(`Workflow with name "${dto.name}" already exists`);
    }

    // Validate that all approver users exist
    const allApproverIds = dto.approvalLevels.flatMap(level => level.approverUserIds);
    const users = await this.prisma.user.findMany({
      where: { 
        id: { in: allApproverIds },
        isActive: true
      }
    });

    if (users.length !== allApproverIds.length) {
      const foundIds = users.map(u => u.id);
      const missingIds = allApproverIds.filter(id => !foundIds.includes(id));
      throw new BadRequestException(`Users not found or inactive: ${missingIds.join(', ')}`);
    }

    // Validate approval levels are sequential
    const levels = dto.approvalLevels.map(l => l.level).sort((a, b) => a - b);
    for (let i = 0; i < levels.length; i++) {
      if (levels[i] !== i + 1) {
        throw new BadRequestException('Approval levels must be sequential starting from 1');
      }
    }

    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        conditions: dto.conditions as any,
        approvalLevels: dto.approvalLevels as any,
        priority: dto.priority || 1
      }
    });

    return workflow as ApprovalWorkflowResponseDto;
  }

  /**
   * Get all approval workflows
   */
  async findAllWorkflows(): Promise<ApprovalWorkflowResponseDto[]> {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return workflows as ApprovalWorkflowResponseDto[];
  }

  /**
   * Get workflow by ID
   */
  async findWorkflow(id: string): Promise<ApprovalWorkflowResponseDto> {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id }
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return workflow as ApprovalWorkflowResponseDto;
  }

  /**
   * Update approval workflow
   */
  async updateWorkflow(id: string, dto: UpdateApprovalWorkflowDto): Promise<ApprovalWorkflowResponseDto> {
    const existingWorkflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id }
    });

    if (!existingWorkflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    // Check name uniqueness if name is being changed
    if (dto.name && dto.name !== existingWorkflow.name) {
      const nameExists = await this.prisma.approvalWorkflow.findUnique({
        where: { name: dto.name }
      });

      if (nameExists) {
        throw new BadRequestException(`Workflow with name "${dto.name}" already exists`);
      }
    }

    // Validate approver users if approval levels are being updated
    if (dto.approvalLevels) {
      const allApproverIds = dto.approvalLevels.flatMap(level => level.approverUserIds);
      const users = await this.prisma.user.findMany({
        where: { 
          id: { in: allApproverIds },
          isActive: true
        }
      });

      if (users.length !== allApproverIds.length) {
        const foundIds = users.map(u => u.id);
        const missingIds = allApproverIds.filter(id => !foundIds.includes(id));
        throw new BadRequestException(`Users not found or inactive: ${missingIds.join(', ')}`);
      }

      // Validate approval levels are sequential
      const levels = dto.approvalLevels.map(l => l.level).sort((a, b) => a - b);
      for (let i = 0; i < levels.length; i++) {
        if (levels[i] !== i + 1) {
          throw new BadRequestException('Approval levels must be sequential starting from 1');
        }
      }
    }

    const updatedWorkflow = await this.prisma.approvalWorkflow.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        conditions: dto.conditions as any,
        approvalLevels: dto.approvalLevels as any,
        priority: dto.priority,
        updatedAt: new Date()
      }
    });

    return updatedWorkflow as ApprovalWorkflowResponseDto;
  }

  /**
   * Delete approval workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    const workflow = await this.prisma.approvalWorkflow.findUnique({
      where: { id },
      include: {
        quotationApprovals: {
          where: {
            status: ApprovalStatus.PENDING
          }
        }
      }
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    if (workflow.quotationApprovals.length > 0) {
      throw new BadRequestException('Cannot delete workflow with pending approvals');
    }

    await this.prisma.approvalWorkflow.delete({
      where: { id }
    });
  }

  /**
   * Check if quotation needs approval and find matching workflow
   */
  private async findMatchingWorkflow(quotation: any): Promise<any | null> {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' }
    });

    for (const workflow of workflows) {
      const conditions = workflow.conditions as any[];
      let matches = true;

      for (const condition of conditions) {
        const fieldValue = this.getFieldValue(quotation, condition.field);
        
        if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return workflow;
      }
    }

    return null;
  }

  /**
   * Get field value from quotation object
   */
  private getFieldValue(quotation: any, field: string): any {
    const fieldParts = field.split('.');
    let value = quotation;

    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(fieldValue: any, operator: string, conditionValue: any): boolean {
    switch (operator) {
      case 'gt':
        return Number(fieldValue) > Number(conditionValue);
      case 'gte':
        return Number(fieldValue) >= Number(conditionValue);
      case 'lt':
        return Number(fieldValue) < Number(conditionValue);
      case 'lte':
        return Number(fieldValue) <= Number(conditionValue);
      case 'eq':
        return fieldValue === conditionValue;
      case 'ne':
        return fieldValue !== conditionValue;
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'nin':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Request approval for a quotation
   */
  async requestApproval(dto: RequestQuotationApprovalDto, requestedByUserId: string): Promise<QuotationApprovalResponseDto> {
    // Get quotation with full details
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: dto.quotationId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${dto.quotationId} not found`);
    }

    // Check if quotation is in a state that can be approved
    if (quotation.status !== QuotationStatus.DRAFT && quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException('Only draft or sent quotations can be submitted for approval');
    }

    // Check if there's already a pending approval for this quotation
    const existingApproval = await this.prisma.quotationApproval.findFirst({
      where: {
        quotationId: dto.quotationId,
        status: ApprovalStatus.PENDING
      }
    });

    if (existingApproval) {
      throw new BadRequestException('Quotation already has a pending approval request');
    }

    // Find matching workflow
    const workflow = await this.findMatchingWorkflow(quotation);

    if (!workflow) {
      throw new BadRequestException('No approval workflow matches this quotation');
    }

    // Create approval request
    const approval = await this.prisma.$transaction(async (tx) => {
      const newApproval = await tx.quotationApproval.create({
        data: {
          quotationId: dto.quotationId,
          workflowId: workflow.id,
          requestedByUserId
        }
      });

      // Create approval steps for the first level
      const firstLevel = (workflow.approvalLevels as any[]).find(level => level.level === 1);
      if (firstLevel) {
        await tx.approvalStep.createMany({
          data: firstLevel.approverUserIds.map((approverId: string) => ({
            approvalId: newApproval.id,
            level: 1,
            approverUserId: approverId
          }))
        });
      }

      return newApproval;
    });

    // Return full approval details
    return this.getApprovalDetails(approval.id);
  }

  /**
   * Process an approval step
   */
  async processApprovalStep(approvalId: string, stepId: string, dto: ProcessApprovalStepDto, approverId: string): Promise<QuotationApprovalResponseDto> {
    const step = await this.prisma.approvalStep.findUnique({
      where: { id: stepId },
      include: {
        approval: {
          include: {
            workflow: true,
            quotation: true
          }
        }
      }
    });

    if (!step) {
      throw new NotFoundException(`Approval step with ID ${stepId} not found`);
    }

    if (step.approvalId !== approvalId) {
      throw new BadRequestException('Step does not belong to the specified approval');
    }

    if (step.approverUserId !== approverId) {
      throw new ForbiddenException('You are not authorized to process this approval step');
    }

    if (step.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('This approval step has already been processed');
    }

    if (step.approval.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('This approval request is no longer pending');
    }

    // Update the step
    await this.prisma.approvalStep.update({
      where: { id: stepId },
      data: {
        status: dto.status,
        comments: dto.comments,
        approvedAt: dto.status === ApprovalStatus.APPROVED ? new Date() : null
      }
    });

    // Check if we need to proceed to next level or complete the approval
    await this.processApprovalLogic(approvalId);

    return this.getApprovalDetails(approvalId);
  }

  /**
   * Process approval logic after a step is completed
   */
  private async processApprovalLogic(approvalId: string): Promise<void> {
    const approval = await this.prisma.quotationApproval.findUnique({
      where: { id: approvalId },
      include: {
        workflow: true,
        steps: true,
        quotation: true
      }
    });

    if (!approval) return;

    const workflow = approval.workflow;
    const approvalLevels = workflow.approvalLevels as any[];
    const currentLevel = approval.currentLevel;
    const currentLevelConfig = approvalLevels.find(level => level.level === currentLevel);

    if (!currentLevelConfig) return;

    // Get steps for current level
    const currentLevelSteps = approval.steps.filter(step => step.level === currentLevel);
    const approvedSteps = currentLevelSteps.filter(step => step.status === ApprovalStatus.APPROVED);
    const rejectedSteps = currentLevelSteps.filter(step => step.status === ApprovalStatus.REJECTED);

    // Check if any step was rejected
    if (rejectedSteps.length > 0) {
      await this.prisma.quotationApproval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.REJECTED,
          completedAt: new Date()
        }
      });
      return;
    }

    // Check if current level is complete
    const isLevelComplete = currentLevelConfig.requireAllApprovers 
      ? approvedSteps.length === currentLevelSteps.length
      : approvedSteps.length > 0;

    if (!isLevelComplete) {
      return; // Wait for more approvals at this level
    }

    // Check if there are more levels
    const nextLevel = currentLevel + 1;
    const nextLevelConfig = approvalLevels.find(level => level.level === nextLevel);

    if (nextLevelConfig) {
      // Move to next level
      await this.prisma.$transaction(async (tx) => {
        await tx.quotationApproval.update({
          where: { id: approvalId },
          data: { currentLevel: nextLevel }
        });

        // Create steps for next level
        await tx.approvalStep.createMany({
          data: nextLevelConfig.approverUserIds.map((approverId: string) => ({
            approvalId,
            level: nextLevel,
            approverUserId: approverId
          }))
        });
      });
    } else {
      // All levels complete - approve the quotation
      await this.prisma.$transaction(async (tx) => {
        await tx.quotationApproval.update({
          where: { id: approvalId },
          data: {
            status: ApprovalStatus.APPROVED,
            completedAt: new Date()
          }
        });

        await tx.quotation.update({
          where: { id: approval.quotationId },
          data: { status: QuotationStatus.APPROVED }
        });
      });
    }
  }

  /**
   * Get approval details
   */
  async getApprovalDetails(approvalId: string): Promise<QuotationApprovalResponseDto> {
    const approval = await this.prisma.quotationApproval.findUnique({
      where: { id: approvalId },
      include: {
        quotation: {
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                contactPerson: true
              }
            }
          }
        },
        workflow: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        steps: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: [
            { level: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });

    if (!approval) {
      throw new NotFoundException(`Approval with ID ${approvalId} not found`);
    }

    return approval as any;
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovalsForUser(userId: string): Promise<QuotationApprovalResponseDto[]> {
    const approvals = await this.prisma.quotationApproval.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        steps: {
          some: {
            approverUserId: userId,
            status: ApprovalStatus.PENDING
          }
        }
      },
      include: {
        quotation: {
          include: {
            customer: {
              select: {
                id: true,
                companyName: true,
                contactPerson: true
              }
            }
          }
        },
        workflow: true,
        requestedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        steps: {
          include: {
            approver: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          },
          orderBy: [
            { level: 'asc' },
            { createdAt: 'asc' }
          ]
        }
      },
      orderBy: { requestedAt: 'asc' }
    });

    return approvals as any;
  }

  /**
   * Get approval dashboard data
   */
  async getApprovalDashboard(userId?: string): Promise<ApprovalDashboardDto> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalPending,
      userPending,
      approvedToday,
      rejectedToday,
      recentApprovals,
      workflowStats
    ] = await Promise.all([
      // Total pending approvals
      this.prisma.quotationApproval.count({
        where: { status: ApprovalStatus.PENDING }
      }),

      // User's pending approvals
      userId ? this.prisma.quotationApproval.count({
        where: {
          status: ApprovalStatus.PENDING,
          steps: {
            some: {
              approverUserId: userId,
              status: ApprovalStatus.PENDING
            }
          }
        }
      }) : 0,

      // Approved today
      this.prisma.quotationApproval.count({
        where: {
          status: ApprovalStatus.APPROVED,
          completedAt: { gte: todayStart }
        }
      }),

      // Rejected today
      this.prisma.quotationApproval.count({
        where: {
          status: ApprovalStatus.REJECTED,
          completedAt: { gte: todayStart }
        }
      }),

      // Recent approvals
      this.prisma.quotationApproval.findMany({
        where: {
          status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] }
        },
        include: {
          quotation: {
            include: {
              customer: {
                select: {
                  id: true,
                  companyName: true,
                  contactPerson: true
                }
              }
            }
          },
          workflow: true,
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          steps: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 10
      }),

      // Workflow statistics
      this.prisma.approvalWorkflow.findMany({
        where: { isActive: true },
        include: {
          quotationApprovals: {
            where: {
              status: ApprovalStatus.PENDING
            }
          }
        }
      })
    ]);

    // Calculate average approval time
    const completedApprovals = await this.prisma.quotationApproval.findMany({
      where: {
        status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] },
        completedAt: { not: null }
      },
      select: {
        requestedAt: true,
        completedAt: true
      }
    });

    const averageApprovalTime = completedApprovals.length > 0
      ? completedApprovals.reduce((sum, approval) => {
          const timeDiff = approval.completedAt!.getTime() - approval.requestedAt.getTime();
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / completedApprovals.length
      : 0;

    return {
      pendingApprovals: totalPending,
      myPendingApprovals: userPending,
      approvedToday,
      rejectedToday,
      averageApprovalTime,
      recentApprovals: recentApprovals as any,
      workflowStats: workflowStats.map(workflow => ({
        workflowId: workflow.id,
        workflowName: workflow.name,
        pendingCount: workflow.quotationApprovals.length,
        averageTime: 0 // Could calculate this per workflow if needed
      }))
    };
  }
}