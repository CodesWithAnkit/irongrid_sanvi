import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
  ApiResponse
} from '@nestjs/swagger';
import { QuotationTemplateService } from '../services/quotation-template.service';
import { 
  CreateQuotationTemplateDto,
  UpdateQuotationTemplateDto,
  QuotationTemplateFiltersDto,
  QuotationTemplateResponseDto,
  PaginatedQuotationTemplatesResponseDto,
  CreateQuotationFromTemplateDto,
  BulkQuotationCreateDto,
  BulkQuotationJobResponseDto
} from '../dto/quotation-template.dto';
import { 
  ApiStandardResponse, 
  ApiPaginatedResponse, 
  ApiAuthenticatedOperation,
} from '../../common/decorators/api-response.decorator';
@ApiTags('Quotation Templates')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(QuotationTemplateResponseDto, PaginatedQuotationTemplatesResponseDto, CreateQuotationTemplateDto)
@Controller('quotations/templates')
@UseGuards(AuthGuard('jwt'))
export class QuotationTemplateController {
  constructor(
    private readonly templateService: QuotationTemplateService,
  ) {}

  @Post()
  @ApiAuthenticatedOperation(
    'Create Quotation Template',
    'Create a new quotation template with reusable configurations. Templates can include default products, pricing, terms, and validity periods.'
  )
  @ApiBody({
    type: CreateQuotationTemplateDto,
    description: 'Template creation data',
    examples: {
      standard: {
        summary: 'Standard industrial machinery template',
        value: {
          name: 'Standard Industrial Machinery Quote',
          description: 'Template for standard industrial machinery quotations',
          category: 'STANDARD',
          isPublic: false,
          items: [
            {
              productId: 'cm1prod123abc456def789',
              quantity: 1,
              unitPrice: 25000,
              discountAmount: 1000,
              customSpecifications: {
                warranty: '2 years',
                installation: 'Included'
              },
              deliveryTimeline: '4-6 weeks'
            }
          ],
          defaultValidityDays: 30,
          defaultTermsConditions: 'Payment within 30 days of delivery. Prices valid for 30 days.',
          tags: ['machinery', 'industrial', 'standard']
        }
      }
    }
  })
  @ApiStandardResponse(QuotationTemplateResponseDto, 'Template created successfully')
  create(@Body() dto: CreateQuotationTemplateDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.create(dto, payload?.sub);
  }

  @Get()
  @ApiAuthenticatedOperation(
    'List Quotation Templates',
    'Retrieve paginated list of quotation templates with filtering and search capabilities. Users can see their own templates and public templates.'
  )
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['STANDARD', 'CUSTOM', 'INDUSTRY_SPECIFIC', 'CUSTOMER_SPECIFIC'],
    description: 'Filter by template category'
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    type: Boolean,
    description: 'Filter by public/private templates'
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active/inactive templates'
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in template name and description'
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: [String],
    description: 'Filter by tags'
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 20
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of items to skip',
    example: 0
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field',
    example: 'createdAt'
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
    example: 'desc'
  })
  @ApiPaginatedResponse(QuotationTemplateResponseDto, 'Templates retrieved successfully')
  list(@Query() filters: QuotationTemplateFiltersDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.findAll(filters, payload?.sub);
  }

  @Get(':id')
  @ApiAuthenticatedOperation(
    'Get Template Details',
    'Retrieve detailed information for a specific quotation template including all configuration data and usage statistics.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique template identifier',
    example: 'cm1tpl123abc456def789'
  })
  @ApiStandardResponse(QuotationTemplateResponseDto, 'Template details retrieved successfully')
  get(@Param('id') id: string, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.findOne(id, payload?.sub);
  }

  @Patch(':id')
  @ApiAuthenticatedOperation(
    'Update Template',
    'Update quotation template information. Only the template creator can update their templates.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique template identifier',
    example: 'cm1tpl123abc456def789'
  })
  @ApiBody({
    type: UpdateQuotationTemplateDto,
    description: 'Template update data',
    examples: {
      updateItems: {
        summary: 'Update template items',
        value: {
          items: [
            {
              productId: 'cm1prod123abc456def789',
              quantity: 2,
              unitPrice: 24000,
              discountAmount: 2000
            }
          ]
        }
      },
      updateSettings: {
        summary: 'Update template settings',
        value: {
          isPublic: true,
          defaultValidityDays: 45,
          tags: ['machinery', 'industrial', 'premium']
        }
      }
    }
  })
  @ApiStandardResponse(QuotationTemplateResponseDto, 'Template updated successfully')
  update(@Param('id') id: string, @Body() dto: UpdateQuotationTemplateDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.update(id, dto, payload?.sub);
  }

  @Delete(':id')
  @ApiAuthenticatedOperation(
    'Delete Template',
    'Delete a quotation template. Only the template creator can delete their templates.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique template identifier',
    example: 'cm1tpl123abc456def789'
  })
  @ApiStandardResponse(Object, 'Template deleted successfully')
  remove(@Param('id') id: string, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.remove(id, payload?.sub);
  }

  @Post(':id/create-quotation')
  @ApiAuthenticatedOperation(
    'Create Quotation from Template',
    'Create a new quotation using a template as the base. Template items and settings can be customized during creation.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Template ID to use',
    example: 'cm1tpl123abc456def789'
  })
  @ApiBody({
    type: CreateQuotationFromTemplateDto,
    description: 'Quotation creation data with template customizations',
    examples: {
      basic: {
        summary: 'Create quotation with template defaults',
        value: {
          templateId: 'cm1tpl123abc456def789',
          customerId: 'cm1cust123abc456def789',
          notes: 'Created from standard template'
        }
      },
      customized: {
        summary: 'Create quotation with customizations',
        value: {
          templateId: 'cm1tpl123abc456def789',
          customerId: 'cm1cust123abc456def789',
          validityDays: 45,
          termsConditions: 'Custom terms for this customer',
          customizations: [
            {
              productId: 'cm1prod123abc456def789',
              quantity: 3,
              unitPrice: 23000
            }
          ]
        }
      }
    }
  })
  @ApiStandardResponse(Object, 'Quotation created from template successfully')
  createQuotationFromTemplate(@Param('id') id: string, @Body() dto: CreateQuotationFromTemplateDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    const createDto = { ...dto, templateId: id };
    return this.templateService.createQuotationFromTemplate(createDto, payload?.sub);
  }

  @Get(':id/analytics')
  @ApiAuthenticatedOperation(
    'Get Template Analytics',
    'Retrieve usage analytics and performance metrics for a specific template.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Template ID',
    example: 'cm1tpl123abc456def789'
  })
  @ApiStandardResponse(Object, 'Template analytics retrieved successfully')
  getAnalytics(@Param('id') id: string, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.getTemplateAnalytics(id, payload?.sub);
  }

  @Post('bulk-quotations')
  @ApiAuthenticatedOperation(
    'Create Bulk Quotations',
    'Create multiple quotations for different customers using a single template. This operation is processed asynchronously.'
  )
  @ApiBody({
    type: BulkQuotationCreateDto,
    description: 'Bulk quotation creation data',
    examples: {
      bulk: {
        summary: 'Create quotations for multiple customers',
        value: {
          name: 'Q4 2024 Bulk Quotations',
          description: 'End of year quotations for all enterprise customers',
          templateId: 'cm1tpl123abc456def789',
          customerIds: [
            'cm1cust123abc456def789',
            'cm1cust456def789abc123',
            'cm1cust789abc123def456'
          ],
          validityDays: 45,
          notes: 'Special Q4 pricing included'
        }
      }
    }
  })
  @ApiStandardResponse(BulkQuotationJobResponseDto, 'Bulk quotation job created successfully')
  createBulkQuotations(@Body() dto: BulkQuotationCreateDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.createBulkQuotationJob(dto, payload?.sub);
  }

  @Get('bulk-jobs/:jobId')
  @ApiAuthenticatedOperation(
    'Get Bulk Quotation Job Status',
    'Retrieve the status and progress of a bulk quotation creation job.'
  )
  @ApiParam({
    name: 'jobId',
    type: String,
    description: 'Bulk job identifier',
    example: 'cm1job123abc456def789'
  })
  @ApiStandardResponse(BulkQuotationJobResponseDto, 'Bulk job status retrieved successfully')
  getBulkJob(@Param('jobId') jobId: string, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.getBulkQuotationJob(jobId, payload?.sub);
  }

  @Get('bulk-jobs')
  @ApiAuthenticatedOperation(
    'List User Bulk Jobs',
    'Retrieve all bulk quotation jobs created by the current user.'
  )
  @ApiResponse({ status: 200, description: 'Bulk jobs retrieved successfully', type: [BulkQuotationJobResponseDto] })
  getUserBulkJobs(@Req() req: any) {
    const payload = req.user as { sub: string };
    return this.templateService.getUserBulkQuotationJobs(payload?.sub);
  }
}