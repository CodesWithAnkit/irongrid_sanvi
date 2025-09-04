import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  Res,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoicesService, CreateInvoiceRequest } from './invoices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('generate')
  @ApiOperation({ 
    summary: 'Generate invoice from order',
    description: 'Creates an invoice from a paid order with tax calculations.'
  })
  @ApiResponse({ status: 201, description: 'Invoice generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or order not paid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async generateInvoice(@Body() request: CreateInvoiceRequest) {
    return this.invoicesService.generateInvoiceFromOrder(request);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get invoice by ID',
    description: 'Retrieves invoice details by ID.'
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(@Param('id') id: string) {
    return this.invoicesService.getInvoiceById(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ 
    summary: 'Download invoice PDF',
    description: 'Generates and downloads invoice as PDF.'
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Template ID for PDF generation' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async downloadInvoicePDF(
    @Param('id') id: string,
    @Query('templateId') templateId: string,
    @Res() res: Response
  ) {
    const pdfBuffer = await this.invoicesService.generateInvoicePDF(id, templateId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Post(':id/send')
  @ApiOperation({ 
    summary: 'Send invoice via email',
    description: 'Sends invoice PDF to customer via email.'
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice sent successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async sendInvoice(
    @Param('id') id: string,
    @Body() body: { recipientEmail: string }
  ) {
    await this.invoicesService.sendInvoiceEmail(id, body.recipientEmail || 'default@email.com');
    return { message: 'Invoice sent successfully' };
  }

  @Post(':id/status')
  @ApiOperation({ 
    summary: 'Update invoice status',
    description: 'Updates the status of an invoice.'
  })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice status updated successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async updateInvoiceStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvoiceStatusDto
  ) {
    return this.invoicesService.updateInvoiceStatus(id, updateDto.status);
  }

  @Get('analytics/overview')
  @ApiOperation({ 
    summary: 'Get invoice analytics',
    description: 'Retrieves comprehensive invoice analytics and metrics.'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for analytics (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for analytics (ISO format)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by invoice status' })
  @ApiResponse({ status: 200, description: 'Invoice analytics retrieved successfully' })
  async getInvoiceAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    };
    return this.invoicesService.getInvoiceAnalytics(filters);
  }
}