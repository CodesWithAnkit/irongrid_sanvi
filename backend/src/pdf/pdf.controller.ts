import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PdfGenerationOptions } from './interfaces/pdf.interface';

@ApiTags('PDF')
@Controller('pdf')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PdfController {
  constructor(private readonly pdfService: PdfService) {}

  @Post('generate/quotation/:id')
  @ApiOperation({ summary: 'Generate PDF for quotation' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async generateQuotationPdf(
    @Param('id') quotationId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateQuotationPdf(quotationId);
      
      // Store the PDF
      const storageResult = await this.pdfService.storePdf(
        pdfBuffer,
        `quotation-${quotationId}.pdf`,
        quotationId,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quotation-${quotationId}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException('Failed to generate PDF');
    }
  }

  @Post('generate/custom')
  @ApiOperation({ summary: 'Generate custom PDF from template' })
  @ApiResponse({ status: 200, description: 'PDF generated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async generateCustomPdf(
    @Body() options: PdfGenerationOptions,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generatePdf(options);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${options.filename || 'document.pdf'}"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException('Failed to generate PDF');
    }
  }

  @Get('file/:fileId')
  @ApiOperation({ summary: 'Retrieve stored PDF file' })
  @ApiResponse({ status: 200, description: 'PDF file retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getStoredPdf(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.getStoredPdf(fileId);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="document.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new BadRequestException('Failed to retrieve PDF');
    }
  }
}