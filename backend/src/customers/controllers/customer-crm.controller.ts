import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  Res,
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CustomerCrmService } from '../services/customer-crm.service';
import {
  CreateInteractionDto,
  UpdateInteractionDto,
  CreateFollowUpDto,
  CustomerTimelineDto,
  CustomerRelationshipScoreDto,
  CrmAnalyticsDto,
  CreditLimitUpdateDto,
  CreditLimitAlertDto,
  CustomerExportDto
} from '../dto/customer-crm.dto';

@ApiTags('Customer CRM')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers/crm')
export class CustomerCrmController {
  constructor(private readonly crmService: CustomerCrmService) {}

  @Post('interactions')
  @ApiOperation({ summary: 'Create a new customer interaction' })
  @ApiResponse({ status: 201, description: 'Interaction created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async createInteraction(
    @Body() createInteractionDto: CreateInteractionDto,
    @Request() req: any
  ) {
    return this.crmService.createInteraction(createInteractionDto, req.user.id);
  }

  @Put('interactions/:id')
  @ApiOperation({ summary: 'Update an existing interaction' })
  @ApiResponse({ status: 200, description: 'Interaction updated successfully' })
  @ApiResponse({ status: 404, description: 'Interaction not found' })
  async updateInteraction(
    @Param('id') id: string,
    @Body() updateInteractionDto: UpdateInteractionDto,
    @Request() req: any
  ) {
    return this.crmService.updateInteraction(id, updateInteractionDto, req.user.id);
  }

  @Get('customers/:customerId/timeline')
  @ApiOperation({ summary: 'Get customer interaction timeline' })
  @ApiResponse({ status: 200, description: 'Timeline retrieved successfully', type: CustomerTimelineDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of events to return' })
  async getCustomerTimeline(
    @Param('customerId') customerId: string,
    @Query('limit') limit?: number
  ): Promise<CustomerTimelineDto> {
    return this.crmService.getCustomerTimeline(customerId, limit);
  }

  @Post('follow-up-tasks')
  @ApiOperation({ summary: 'Create a follow-up task' })
  @ApiResponse({ status: 201, description: 'Follow-up task created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async createFollowUpTask(
    @Body() createFollowUpDto: CreateFollowUpDto,
    @Request() req: any
  ) {
    return this.crmService.createFollowUpTask(createFollowUpDto, req.user.id);
  }

  @Get('follow-up-tasks')
  @ApiOperation({ summary: 'Get follow-up tasks for current user' })
  @ApiResponse({ status: 200, description: 'Follow-up tasks retrieved successfully' })
  @ApiQuery({ name: 'customerId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'priority', required: false, type: String })
  @ApiQuery({ name: 'dueBefore', required: false, type: String })
  @ApiQuery({ name: 'dueAfter', required: false, type: String })
  async getFollowUpTasks(
    @Request() req: any,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('dueBefore') dueBefore?: string,
    @Query('dueAfter') dueAfter?: string
  ) {
    const filters = {
      customerId,
      status,
      priority,
      dueBefore,
      dueAfter
    };

    return this.crmService.getFollowUpTasks(req.user.id, filters);
  }

  @Put('follow-up-tasks/:id/complete')
  @ApiOperation({ summary: 'Complete a follow-up task' })
  @ApiResponse({ status: 200, description: 'Task completed successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async completeFollowUpTask(
    @Param('id') taskId: string,
    @Body('outcome') outcome?: string
  ) {
    return this.crmService.completeFollowUpTask(taskId, outcome);
  }

  @Get('customers/:customerId/relationship-score')
  @ApiOperation({ summary: 'Calculate customer relationship score' })
  @ApiResponse({ 
    status: 200, 
    description: 'Relationship score calculated successfully', 
    type: CustomerRelationshipScoreDto 
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async calculateRelationshipScore(
    @Param('customerId') customerId: string
  ): Promise<CustomerRelationshipScoreDto> {
    return this.crmService.calculateRelationshipScore(customerId);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get CRM analytics for date range' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully', type: CrmAnalyticsDto })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Start date (ISO format)' })
  @ApiQuery({ name: 'endDate', required: true, type: String, description: 'End date (ISO format)' })
  async getCrmAnalytics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<CrmAnalyticsDto> {
    if (!startDate || !endDate) {
      throw new BadRequestException('Both startDate and endDate are required');
    }

    return this.crmService.getCrmAnalytics(new Date(startDate), new Date(endDate));
  }

  @Put('customers/:customerId/credit-limit')
  @ApiOperation({ summary: 'Update customer credit limit' })
  @ApiResponse({ status: 200, description: 'Credit limit updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async updateCreditLimit(
    @Param('customerId') customerId: string,
    @Body() updateDto: CreditLimitUpdateDto,
    @Request() req: any
  ) {
    return this.crmService.updateCreditLimit(
      customerId, 
      updateDto.creditLimit, 
      updateDto.reason, 
      req.user.id
    );
  }

  @Get('credit-limit-alerts')
  @ApiOperation({ summary: 'Get credit limit alerts' })
  @ApiResponse({ 
    status: 200, 
    description: 'Credit limit alerts retrieved successfully', 
    type: [CreditLimitAlertDto] 
  })
  async getCreditLimitAlerts(): Promise<CreditLimitAlertDto[]> {
    return this.crmService.getCreditLimitAlerts();
  }

  @Post('customers/:customerId/calculate-lifetime-value')
  @ApiOperation({ summary: 'Calculate customer lifetime value' })
  @ApiResponse({ status: 200, description: 'Lifetime value calculated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async calculateLifetimeValue(@Param('customerId') customerId: string) {
    return this.crmService.calculateCustomerLifetimeValue(customerId);
  }

  @Post('customers/import')
  @ApiOperation({ summary: 'Import customers from CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Customers imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or data' })
  @UseInterceptors(FileInterceptor('file'))
  async importCustomers(
    @UploadedFile() file: any,
    @Body('skipDuplicates') skipDuplicates?: boolean,
    @Body('updateExisting') updateExisting?: boolean
  ) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('Only CSV files are supported');
    }

    const options = {
      skipDuplicates: skipDuplicates === true,
      updateExisting: updateExisting === true
    };

    return this.crmService.importCustomers(file, options);
  }

  @Post('customers/export')
  @ApiOperation({ summary: 'Export customers to file' })
  @ApiResponse({ status: 200, description: 'Customers exported successfully' })
  async exportCustomers(
    @Body() exportDto: CustomerExportDto,
    @Res() res: Response
  ) {
    const format = exportDto.format || 'CSV';
    const filters = {
      segmentId: exportDto.segmentId,
      customerType: exportDto.customerType,
      dateRange: exportDto.dateRange
    };

    const buffer = await this.crmService.exportCustomers(filters, format);

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `customers_export_${timestamp}.${format.toLowerCase()}`;

    let contentType = 'application/octet-stream';
    if (format === 'CSV') contentType = 'text/csv';
    else if (format === 'EXCEL') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (format === 'JSON') contentType = 'application/json';

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString()
    });

    res.status(HttpStatus.OK).send(buffer);
  }
}