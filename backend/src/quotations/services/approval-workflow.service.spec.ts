import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApprovalWorkflowService } from './approval-workflow.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApprovalWorkflowDto, ApprovalStatus } from '../dto/approval-workflow.dto';
import { QuotationStatus } from '@prisma/client';

describe('ApprovalWorkflowService', () => {
  let service: ApprovalWorkflowService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    approvalWorkflow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    quotation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    quotationApproval: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    approvalStep: {
      findUnique: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovalWorkflowService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ApprovalWorkflowService>(ApprovalWorkflowService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkflow', () => {
    const createWorkflowDto: CreateApprovalWorkflowDto = {
      name: 'High Value Approval',
      description: 'Approval for high value quotations',
      conditions: [
        {
          field: 'totalAmount',
          operator: 'gte',
          value: 100000,
        },
      ],
      approvalLevels: [
        {
          level: 1,
          name: 'Manager Approval',
          approverUserIds: ['user-1', 'user-2'],
          requireAllApprovers: false,
        },
        {
          level: 2,
          name: 'Director Approval',
          approverUserIds: ['user-3'],
          requireAllApprovers: true,
        },
      ],
      priority: 1,
    };

    const mockUsers = [
      { id: 'user-1', email: 'user1@example.com', isActive: true },
      { id: 'user-2', email: 'user2@example.com', isActive: true },
      { id: 'user-3', email: 'user3@example.com', isActive: true },
    ];

    const mockCreatedWorkflow = {
      id: 'workflow-1',
      name: 'High Value Approval',
      description: 'Approval for high value quotations',
      conditions: createWorkflowDto.conditions,
      approvalLevels: createWorkflowDto.approvalLevels,
      isActive: true,
      priority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create workflow successfully', async () => {
      mockPrismaService.approvalWorkflow.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.approvalWorkflow.create.mockResolvedValue(mockCreatedWorkflow);

      const result = await service.createWorkflow(createWorkflowDto);

      expect(result).toEqual(mockCreatedWorkflow);
      expect(mockPrismaService.approvalWorkflow.findUnique).toHaveBeenCalledWith({
        where: { name: 'High Value Approval' },
      });
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['user-1', 'user-2', 'user-3'] },
          isActive: true,
        },
      });
      expect(mockPrismaService.approvalWorkflow.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if workflow name already exists', async () => {
      mockPrismaService.approvalWorkflow.findUnique.mockResolvedValue({
        id: 'existing-workflow',
        name: 'High Value Approval',
      });

      await expect(service.createWorkflow(createWorkflowDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if some users not found', async () => {
      mockPrismaService.approvalWorkflow.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findMany.mockResolvedValue([mockUsers[0], mockUsers[1]]); // Missing user-3

      await expect(service.createWorkflow(createWorkflowDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if approval levels are not sequential', async () => {
      const invalidDto = {
        ...createWorkflowDto,
        approvalLevels: [
          {
            level: 1,
            name: 'Manager Approval',
            approverUserIds: ['user-1'],
            requireAllApprovers: false,
          },
          {
            level: 3, // Should be 2
            name: 'Director Approval',
            approverUserIds: ['user-3'],
            requireAllApprovers: true,
          },
        ],
      };

      mockPrismaService.approvalWorkflow.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await expect(service.createWorkflow(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('requestApproval', () => {
    const mockQuotation = {
      id: 'quotation-1',
      quotationNumber: 'QUO-2024-000001',
      status: QuotationStatus.DRAFT,
      totalAmount: 150000,
      customer: {
        id: 'customer-1',
        companyName: 'Test Company',
        customerType: 'ENTERPRISE',
      },
      items: [],
    };

    const mockWorkflow = {
      id: 'workflow-1',
      name: 'High Value Approval',
      conditions: [
        {
          field: 'totalAmount',
          operator: 'gte',
          value: 100000,
        },
      ],
      approvalLevels: [
        {
          level: 1,
          name: 'Manager Approval',
          approverUserIds: ['user-1', 'user-2'],
          requireAllApprovers: false,
        },
      ],
      isActive: true,
      priority: 1,
    };

    const mockCreatedApproval = {
      id: 'approval-1',
      quotationId: 'quotation-1',
      workflowId: 'workflow-1',
      currentLevel: 1,
      status: ApprovalStatus.PENDING,
      requestedByUserId: 'user-1',
    };

    it('should request approval successfully', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.quotationApproval.findFirst.mockResolvedValue(null);
      mockPrismaService.approvalWorkflow.findMany.mockResolvedValue([mockWorkflow]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          quotationApproval: {
            create: jest.fn().mockResolvedValue(mockCreatedApproval),
          },
          approvalStep: {
            createMany: jest.fn(),
          },
        });
      });
      jest.spyOn(service, 'getApprovalDetails').mockResolvedValue({} as any);

      const dto = {
        quotationId: 'quotation-1',
        comments: 'Please approve this quotation',
      };

      await service.requestApproval(dto, 'user-1');

      expect(mockPrismaService.quotation.findUnique).toHaveBeenCalledWith({
        where: { id: 'quotation-1' },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      expect(mockPrismaService.quotationApproval.findFirst).toHaveBeenCalledWith({
        where: {
          quotationId: 'quotation-1',
          status: ApprovalStatus.PENDING,
        },
      });
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if quotation not found', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);

      const dto = {
        quotationId: 'quotation-1',
      };

      await expect(service.requestApproval(dto, 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if quotation status is not valid', async () => {
      const approvedQuotation = {
        ...mockQuotation,
        status: QuotationStatus.APPROVED,
      };
      mockPrismaService.quotation.findUnique.mockResolvedValue(approvedQuotation);

      const dto = {
        quotationId: 'quotation-1',
      };

      await expect(service.requestApproval(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if approval already exists', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
      mockPrismaService.quotationApproval.findFirst.mockResolvedValue({
        id: 'existing-approval',
        status: ApprovalStatus.PENDING,
      });

      const dto = {
        quotationId: 'quotation-1',
      };

      await expect(service.requestApproval(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if no matching workflow found', async () => {
      const lowValueQuotation = {
        ...mockQuotation,
        totalAmount: 50000, // Below threshold
      };
      mockPrismaService.quotation.findUnique.mockResolvedValue(lowValueQuotation);
      mockPrismaService.quotationApproval.findFirst.mockResolvedValue(null);
      mockPrismaService.approvalWorkflow.findMany.mockResolvedValue([mockWorkflow]);

      const dto = {
        quotationId: 'quotation-1',
      };

      await expect(service.requestApproval(dto, 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('processApprovalStep', () => {
    const mockStep = {
      id: 'step-1',
      approvalId: 'approval-1',
      level: 1,
      approverUserId: 'user-1',
      status: ApprovalStatus.PENDING,
      approval: {
        id: 'approval-1',
        quotationId: 'quotation-1',
        status: ApprovalStatus.PENDING,
        currentLevel: 1,
        workflow: {
          id: 'workflow-1',
          approvalLevels: [
            {
              level: 1,
              name: 'Manager Approval',
              approverUserIds: ['user-1', 'user-2'],
              requireAllApprovers: false,
            },
          ],
        },
        quotation: {
          id: 'quotation-1',
          status: QuotationStatus.DRAFT,
        },
      },
    };

    it('should process approval step successfully', async () => {
      mockPrismaService.approvalStep.findUnique.mockResolvedValue(mockStep);
      mockPrismaService.approvalStep.update.mockResolvedValue({});
      jest.spyOn(service as any, 'processApprovalLogic').mockResolvedValue(undefined);
      jest.spyOn(service, 'getApprovalDetails').mockResolvedValue({} as any);

      const dto = {
        status: ApprovalStatus.APPROVED,
        comments: 'Looks good to me',
      };

      await service.processApprovalStep('approval-1', 'step-1', dto, 'user-1');

      expect(mockPrismaService.approvalStep.findUnique).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        include: {
          approval: {
            include: {
              workflow: true,
              quotation: true,
            },
          },
        },
      });
      expect(mockPrismaService.approvalStep.update).toHaveBeenCalledWith({
        where: { id: 'step-1' },
        data: {
          status: ApprovalStatus.APPROVED,
          comments: 'Looks good to me',
          approvedAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if step not found', async () => {
      mockPrismaService.approvalStep.findUnique.mockResolvedValue(null);

      const dto = {
        status: ApprovalStatus.APPROVED,
      };

      await expect(
        service.processApprovalStep('approval-1', 'step-1', dto, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if step does not belong to approval', async () => {
      const wrongStep = {
        ...mockStep,
        approvalId: 'different-approval',
      };
      mockPrismaService.approvalStep.findUnique.mockResolvedValue(wrongStep);

      const dto = {
        status: ApprovalStatus.APPROVED,
      };

      await expect(
        service.processApprovalStep('approval-1', 'step-1', dto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not the approver', async () => {
      mockPrismaService.approvalStep.findUnique.mockResolvedValue(mockStep);

      const dto = {
        status: ApprovalStatus.APPROVED,
      };

      await expect(
        service.processApprovalStep('approval-1', 'step-1', dto, 'different-user'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if step already processed', async () => {
      const processedStep = {
        ...mockStep,
        status: ApprovalStatus.APPROVED,
      };
      mockPrismaService.approvalStep.findUnique.mockResolvedValue(processedStep);

      const dto = {
        status: ApprovalStatus.APPROVED,
      };

      await expect(
        service.processApprovalStep('approval-1', 'step-1', dto, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPendingApprovalsForUser', () => {
    const mockApprovals = [
      {
        id: 'approval-1',
        status: ApprovalStatus.PENDING,
        quotation: {
          id: 'quotation-1',
          quotationNumber: 'QUO-2024-000001',
          customer: {
            id: 'customer-1',
            companyName: 'Test Company',
            contactPerson: 'John Doe',
          },
        },
        workflow: {
          id: 'workflow-1',
          name: 'High Value Approval',
        },
        requestedBy: {
          id: 'user-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
        steps: [
          {
            id: 'step-1',
            level: 1,
            approver: {
              id: 'user-1',
              firstName: 'John',
              lastName: 'Manager',
              email: 'john@example.com',
            },
            status: ApprovalStatus.PENDING,
          },
        ],
      },
    ];

    it('should return pending approvals for user', async () => {
      mockPrismaService.quotationApproval.findMany.mockResolvedValue(mockApprovals);

      const result = await service.getPendingApprovalsForUser('user-1');

      expect(result).toEqual(mockApprovals);
      expect(mockPrismaService.quotationApproval.findMany).toHaveBeenCalledWith({
        where: {
          status: ApprovalStatus.PENDING,
          steps: {
            some: {
              approverUserId: 'user-1',
              status: ApprovalStatus.PENDING,
            },
          },
        },
        include: {
          quotation: {
            include: {
              customer: {
                select: {
                  id: true,
                  companyName: true,
                  contactPerson: true,
                },
              },
            },
          },
          workflow: true,
          requestedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          steps: {
            include: {
              approver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
            orderBy: [{ level: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: { requestedAt: 'asc' },
      });
    });
  });

  describe('getApprovalDashboard', () => {
    it('should return dashboard data', async () => {
      const mockCounts = {
        totalPending: 5,
        userPending: 2,
        approvedToday: 3,
        rejectedToday: 1,
      };

      const mockRecentApprovals = [
        {
          id: 'approval-1',
          status: ApprovalStatus.APPROVED,
          completedAt: new Date(),
        },
      ];

      const mockWorkflows = [
        {
          id: 'workflow-1',
          name: 'High Value Approval',
          quotationApprovals: [
            { id: 'approval-1', status: ApprovalStatus.PENDING },
            { id: 'approval-2', status: ApprovalStatus.PENDING },
          ],
        },
      ];

      const mockCompletedApprovals = [
        {
          requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
          completedAt: new Date(),
        },
      ];

      mockPrismaService.quotationApproval.count
        .mockResolvedValueOnce(mockCounts.totalPending)
        .mockResolvedValueOnce(mockCounts.userPending)
        .mockResolvedValueOnce(mockCounts.approvedToday)
        .mockResolvedValueOnce(mockCounts.rejectedToday);

      mockPrismaService.quotationApproval.findMany
        .mockResolvedValueOnce(mockRecentApprovals)
        .mockResolvedValueOnce(mockCompletedApprovals);

      mockPrismaService.approvalWorkflow.findMany.mockResolvedValue(mockWorkflows);

      const result = await service.getApprovalDashboard('user-1');

      expect(result).toMatchObject({
        pendingApprovals: mockCounts.totalPending,
        myPendingApprovals: mockCounts.userPending,
        approvedToday: mockCounts.approvedToday,
        rejectedToday: mockCounts.rejectedToday,
        averageApprovalTime: 24, // 24 hours
        recentApprovals: mockRecentApprovals,
        workflowStats: [
          {
            workflowId: 'workflow-1',
            workflowName: 'High Value Approval',
            pendingCount: 2,
            averageTime: 0,
          },
        ],
      });
    });
  });
});