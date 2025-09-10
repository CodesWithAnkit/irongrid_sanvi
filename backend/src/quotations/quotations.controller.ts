import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationFiltersDto } from './dto/quotation-filters.dto';
import { QuotationResponseDto, PaginatedQuotationsResponseDto } from './dto/quotation-response.dto';
import { SendQuotationEmailDto, DuplicateQuotationDto } from './dto/quotation-actions.dto';
import { QuotationsService } from './quotations.service';
import { PdfService } from '../notifications/pdf/pdf.service';
import { HtmlPdfService } from '../notifications/pdf/html-pdf.service';
import { EmailService } from '../notifications/email/email.service';
import { 
  ApiStandardResponse, 
  ApiPaginatedResponse, 
  ApiAuthenticatedOperation,
  ApiCrudOperation,
  ApiPaginationQuery,
  ApiSearchQuery,
  ApiDateRangeQuery,
} from '../common/decorators/api-response.decorator';
import { ValidationSchemas } from '../common/validation/schemas';
import { JoiValidation } from 'src/common/pipes/joi-validation.pipe';

@ApiTags('Quotations')
@ApiBearerAuth('JWT-auth')
@ApiExtraModels(QuotationResponseDto, PaginatedQuotationsResponseDto, CreateQuotationDto, UpdateQuotationDto)
@Controller('quotations')
@UseGuards(AuthGuard('jwt'))
export class QuotationsController {
  constructor(
    private readonly quotations: QuotationsService,
    private readonly pdf: PdfService,
    private readonly htmlPdf: HtmlPdfService,
    private readonly email: EmailService,
  ) {}

  @Post()
  @ApiAuthenticatedOperation(
    'Create New Quotation',
    'Create a new quotation with comprehensive validation. Automatically calculates totals, generates quotation number, and validates customer and product information.'
  )
  @ApiBody({
    type: CreateQuotationDto,
    description: 'Quotation creation data with customer, items, and optional terms',
    examples: {
      basic: {
        summary: 'Basic quotation example',
        value: {
          customerId: 'cm1abc123def456ghi789',
          items: [
            {
              productId: 'cm1xyz789abc123def456',
              quantity: 2,
              unitPrice: 25000,
              discount: 1000
            }
          ],
          validUntil: '2024-12-31T23:59:59Z',
          termsConditions: 'Payment within 30 days of delivery',
          notes: 'Special handling required for this order'
        }
      }
    }
  })
  @ApiStandardResponse(QuotationResponseDto, 'Quotation created successfully')
  @UsePipes(JoiValidation(ValidationSchemas.CreateQuotation))
  create(@Body() dto: CreateQuotationDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.quotations.create(dto, payload?.sub);
  }

  @Get()
  @ApiAuthenticatedOperation(
    'List Quotations',
    'Retrieve paginated list of quotations with advanced filtering, sorting, and search capabilities. Supports full-text search across quotation numbers, customer names, and notes.'
  )
  @ApiPaginationQuery()
  @ApiSearchQuery()
  @ApiDateRangeQuery()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'EXPIRED'],
    description: 'Filter by quotation status',
    example: 'SENT'
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by specific customer ID',
    example: 'cm1abc123def456ghi789'
  })
  @ApiQuery({
    name: 'customerName',
    required: false,
    type: String,
    description: 'Filter by customer company name or contact person',
    example: 'Acme Industries'
  })
  @ApiQuery({
    name: 'minAmount',
    required: false,
    type: Number,
    description: 'Filter quotations with total amount greater than or equal to this value',
    example: 10000
  })
  @ApiQuery({
    name: 'maxAmount',
    required: false,
    type: Number,
    description: 'Filter quotations with total amount less than or equal to this value',
    example: 100000
  })
  @ApiPaginatedResponse(QuotationResponseDto, 'Quotations retrieved successfully')
  list(@Query() filters: QuotationFiltersDto) {
    return this.quotations.findAll(filters);
  }

  @Get(':id')
  @ApiAuthenticatedOperation(
    'Get Quotation Details',
    'Retrieve detailed information for a specific quotation including customer details, line items with product information, and audit trail.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique quotation identifier',
    example: 'cm1quo123abc456def789'
  })
  @ApiStandardResponse(QuotationResponseDto, 'Quotation details retrieved successfully')
  get(@Param('id') id: string) {
    return this.quotations.findOne(id);
  }

  @Patch(':id')
  @ApiAuthenticatedOperation(
    'Update Quotation',
    'Update quotation information with status transition validation. Only certain fields can be updated based on current quotation status.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique quotation identifier',
    example: 'cm1quo123abc456def789'
  })
  @ApiBody({
    type: UpdateQuotationDto,
    description: 'Quotation update data',
    examples: {
      statusUpdate: {
        summary: 'Update quotation status',
        value: {
          status: 'SENT'
        }
      },
      extendValidity: {
        summary: 'Extend quotation validity',
        value: {
          validUntil: '2024-12-31T23:59:59Z',
          notes: 'Extended validity as per customer request'
        }
      }
    }
  })
  @ApiStandardResponse(QuotationResponseDto, 'Quotation updated successfully')
  @UsePipes(JoiValidation(ValidationSchemas.UpdateQuotation))
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.quotations.update(id, dto, payload?.sub);
  }

  @Delete(':id')
  @ApiAuthenticatedOperation(
    'Delete Quotation',
    'Delete a quotation. Only draft quotations can be deleted to maintain audit trail for sent quotations.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique quotation identifier',
    example: 'cm1quo123abc456def789'
  })
  @ApiStandardResponse(Object, 'Quotation deleted successfully')
  remove(@Param('id') id: string) {
    return this.quotations.remove(id);
  }

  @Post(':id/duplicate')
  @ApiAuthenticatedOperation(
    'Duplicate Quotation',
    'Create a copy of an existing quotation with new quotation number. Optionally change customer or reset status to draft.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'ID of quotation to duplicate',
    example: 'cm1quo123abc456def789'
  })
  @ApiBody({
    type: DuplicateQuotationDto,
    description: 'Duplication options',
    examples: {
      sameCustomer: {
        summary: 'Duplicate for same customer',
        value: {
          resetStatus: true,
          notes: 'Revised quotation based on updated requirements'
        }
      },
      differentCustomer: {
        summary: 'Duplicate for different customer',
        value: {
          customerId: 'cm1cust456def789abc123',
          resetStatus: true,
          notes: 'Similar quotation for new customer'
        }
      }
    }
  })
  @ApiStandardResponse(QuotationResponseDto, 'Quotation duplicated successfully')
  @UsePipes(JoiValidation(ValidationSchemas.DuplicateQuotation))
  duplicate(@Param('id') id: string, @Body() dto: DuplicateQuotationDto, @Req() req: any) {
    const payload = req.user as { sub: string };
    return this.quotations.duplicate(id, dto, payload?.sub);
  }

  @Post(':id/email')
  @ApiAuthenticatedOperation(
    'Send Quotation Email',
    'Send quotation via email with PDF attachment. Automatically generates PDF if not already created and tracks email delivery status.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique quotation identifier',
    example: 'cm1quo123abc456def789'
  })
  @ApiBody({
    type: SendQuotationEmailDto,
    description: 'Email sending options',
    examples: {
      basic: {
        summary: 'Send to customer email',
        value: {
          subject: 'Quotation for Industrial Machinery',
          message: 'Please find attached our quotation for your requirements.'
        }
      },
      customRecipient: {
        summary: 'Send to custom email',
        value: {
          recipientEmail: 'procurement@customer.com',
          subject: 'Updated Quotation - Ref: QUO-2024-000123',
          message: 'Please review the updated quotation attached.',
          templateId: 'cm1tpl123abc456def789'
        }
      }
    }
  })
  @ApiStandardResponse(Object, 'Email sent successfully')
  @UsePipes(JoiValidation(ValidationSchemas.SendQuotationEmail))
  sendEmail(@Param('id') id: string, @Body() dto: SendQuotationEmailDto) {
    return this.email.sendQuotationEmail(id, dto.recipientEmail || '');
  }

  @Post(':id/pdf')
  @ApiAuthenticatedOperation(
    'Generate Quotation PDF',
    'Generate professional PDF document for quotation with company branding and detailed line items. Supports both standard and HTML-based PDF generation.'
  )
  @ApiParam({
    name: 'id',
    type: String,
    description: 'Unique quotation identifier',
    example: 'cm1quo123abc456def789'
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['standard', 'html'],
    description: 'PDF generation format',
    example: 'html'
  })
  @ApiStandardResponse(Object, 'PDF generated successfully')
  generatePdf(@Param('id') id: string, @Query('format') format?: string) {
    if ((format || '').toLowerCase() === 'html') {
      return this.htmlPdf.generateQuotationPdfHtml(id).then((file: any) =>
        file && file.id ? { ...file, downloadUrl: `/api/files/${file.id}` } : file,
      );
    }
    return this.pdf.generateQuotationPdf(id).then((file: any) =>
      file && file.id ? { ...file, downloadUrl: `/api/files/${file.id}` } : file,
    );
  }

  @Get(':id/analytics')
  @ApiAuthenticatedOperation(
    'Get Quotation Analytics',
    'Retrieve analytics and performance metrics for quotations including conversion rates, response times, and trends.'
  )
  @ApiDateRangeQuery()
  @ApiStandardResponse(Object, 'Analytics retrieved successfully')
  getAnalytics(@Query() filters: any) {
    return this.quotations.getAnalytics(filters);
  }
}
