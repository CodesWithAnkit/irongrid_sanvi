import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { PaymentsService, PaymentLinkRequest, PaymentVerificationRequest, RefundRequest } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-payment-link')
  @ApiOperation({ 
    summary: 'Create payment link',
    description: 'Creates a Razorpay payment link for an order.'
  })
  @ApiResponse({ status: 201, description: 'Payment link created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createPaymentLink(@Body() request: PaymentLinkRequest) {
    return this.paymentsService.createPaymentLink(request);
  }

  @Post('verify')
  @ApiOperation({ 
    summary: 'Verify payment',
    description: 'Verifies payment signature from Razorpay webhook or callback.'
  })
  @ApiResponse({ status: 200, description: 'Payment verification result' })
  @ApiResponse({ status: 400, description: 'Invalid verification data' })
  async verifyPayment(@Body() request: PaymentVerificationRequest) {
    const isValid = await this.paymentsService.verifyPayment(request);
    return { verified: isValid };
  }

  @Get(':paymentId/status')
  @ApiOperation({ 
    summary: 'Get payment status',
    description: 'Retrieves the current status of a payment from Razorpay.'
  })
  @ApiParam({ name: 'paymentId', description: 'Payment ID from Razorpay' })
  @ApiResponse({ status: 200, description: 'Payment status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  @Post(':paymentId/refund')
  @ApiOperation({ 
    summary: 'Process refund',
    description: 'Initiates a refund for a payment through Razorpay.'
  })
  @ApiParam({ name: 'paymentId', description: 'Payment ID to refund' })
  @ApiResponse({ status: 201, description: 'Refund initiated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid refund request' })
  async processRefund(
    @Param('paymentId') paymentId: string,
    @Body() request: Omit<RefundRequest, 'paymentId'>
  ) {
    return this.paymentsService.processRefund({ ...request, paymentId });
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Handle Razorpay webhook',
    description: 'Processes webhook events from Razorpay for payment status updates.'
  })
  @ApiHeader({ name: 'x-razorpay-signature', description: 'Razorpay webhook signature' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature or payload' })
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-razorpay-signature') signature: string
  ) {
    await this.paymentsService.handleWebhook(payload, signature);
    return { status: 'success' };
  }

  @Get('analytics')
  @ApiOperation({ 
    summary: 'Get payment analytics',
    description: 'Retrieves comprehensive payment analytics and metrics.'
  })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for analytics (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for analytics (ISO format)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payment status' })
  @ApiResponse({ status: 200, description: 'Payment analytics retrieved successfully' })
  async getPaymentAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string
  ) {
    const filters = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
    };
    return this.paymentsService.getPaymentAnalytics(filters);
  }

  @Get('reconciliation')
  @ApiOperation({ 
    summary: 'Reconcile payments',
    description: 'Reconciles payments with orders to identify discrepancies.'
  })
  @ApiQuery({ name: 'date', required: false, description: 'Date to reconcile (ISO format, defaults to today)' })
  @ApiResponse({ status: 200, description: 'Payment reconciliation completed' })
  async reconcilePayments(@Query('date') date?: string) {
    const reconciliationDate = date ? new Date(date) : undefined;
    return this.paymentsService.reconcilePayments(reconciliationDate);
  }
}