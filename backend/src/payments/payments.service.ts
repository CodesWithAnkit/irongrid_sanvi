import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface PaymentLinkRequest {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  callbackUrl?: string;
  cancelUrl?: string;
}

export interface PaymentLinkResponse {
  id: string;
  url: string;
  shortUrl: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface PaymentVerificationRequest {
  paymentId: string;
  orderId: string;
  signature: string;
}

export interface PaymentStatus {
  id: string;
  orderId: string;
  status: 'created' | 'attempted' | 'paid' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  method?: string;
  bank?: string;
  wallet?: string;
  vpa?: string;
  email?: string;
  contact?: string;
  fee?: number;
  tax?: number;
  errorCode?: string;
  errorDescription?: string;
  createdAt: Date;
  authorizedAt?: Date;
  capturedAt?: Date;
}

export interface RefundRequest {
  paymentId: string;
  amount?: number;
  speed?: 'normal' | 'optimum';
  notes?: Record<string, string>;
  receiptId?: string;
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processed' | 'failed';
  speedRequested: string;
  speedProcessed: string;
  createdAt: Date;
  processedAt?: Date;
}

export interface WebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: PaymentStatus;
    };
    order?: {
      entity: any;
    };
  };
  created_at: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly razorpayKeyId: string;
  private readonly razorpayKeySecret: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.razorpayKeyId = this.configService.get<string>('RAZORPAY_KEY_ID') || '';
    this.razorpayKeySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET') || '';
    this.webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';

    if (!this.razorpayKeyId || !this.razorpayKeySecret) {
      this.logger.warn('Razorpay credentials not configured. Payment functionality will be limited.');
    }
  }

  /**
   * Create a payment link for an order
   */
  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    const { orderId, amount, currency = 'INR', description, customerEmail, customerPhone } = request;

    // Validate order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            companyName: true,
            contactPerson: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    // Validate amount matches order total
    if (Math.abs(amount - Number(order.totalAmount)) > 0.01) {
      throw new BadRequestException('Payment amount does not match order total');
    }

    try {
      // In a real implementation, this would call Razorpay API
      // For now, we'll simulate the response
      const paymentLink: PaymentLinkResponse = {
        id: `plink_${Date.now()}`,
        url: `https://rzp.io/l/${Date.now()}`,
        shortUrl: `https://rzp.io/s/${Date.now()}`,
        status: 'created',
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        description: description || `Payment for Order ${order.orderNumber}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };

      // Store payment link in database (in real implementation)
      this.logger.log(`Payment link created for order ${orderId}: ${paymentLink.id}`);

      return paymentLink;
    } catch (error) {
      this.logger.error(`Failed to create payment link for order ${orderId}:`, error);
      throw new BadRequestException('Failed to create payment link');
    }
  }

  /**
   * Verify payment signature from Razorpay
   */
  async verifyPayment(request: PaymentVerificationRequest): Promise<boolean> {
    const { paymentId, orderId, signature } = request;

    try {
      // Generate expected signature
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', this.razorpayKeySecret)
        .update(body.toString())
        .digest('hex');

      const isValid = expectedSignature === signature;

      if (isValid) {
        this.logger.log(`Payment verification successful for payment ${paymentId}`);
        
        // Update order payment status
        await this.updateOrderPaymentStatus(orderId, paymentId, 'PAID');
      } else {
        this.logger.warn(`Payment verification failed for payment ${paymentId}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error(`Payment verification error:`, error);
      return false;
    }
  }

  /**
   * Get payment status from Razorpay
   */
  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // In a real implementation, this would call Razorpay API
      // For now, we'll simulate the response
      const paymentStatus: PaymentStatus = {
        id: paymentId,
        orderId: `order_${Date.now()}`,
        status: 'paid',
        amount: 100000, // Amount in paise
        currency: 'INR',
        method: 'card',
        email: 'customer@example.com',
        contact: '+919999999999',
        fee: 2360,
        tax: 360,
        createdAt: new Date(Date.now() - 60000),
        authorizedAt: new Date(Date.now() - 30000),
        capturedAt: new Date(),
      };

      this.logger.log(`Retrieved payment status for ${paymentId}: ${paymentStatus.status}`);
      return paymentStatus;
    } catch (error) {
      this.logger.error(`Failed to get payment status for ${paymentId}:`, error);
      throw new BadRequestException('Failed to retrieve payment status');
    }
  }

  /**
   * Process refund for a payment
   */
  async processRefund(request: RefundRequest): Promise<RefundResponse> {
    const { paymentId, amount, speed = 'normal', notes, receiptId } = request;

    try {
      // Get payment details first
      const paymentStatus = await this.getPaymentStatus(paymentId);

      if (paymentStatus.status !== 'paid') {
        throw new BadRequestException('Can only refund paid payments');
      }

      const refundAmount = amount || paymentStatus.amount;

      if (refundAmount > paymentStatus.amount) {
        throw new BadRequestException('Refund amount cannot exceed payment amount');
      }

      // In a real implementation, this would call Razorpay API
      const refund: RefundResponse = {
        id: `rfnd_${Date.now()}`,
        paymentId,
        amount: refundAmount,
        currency: paymentStatus.currency,
        status: 'pending',
        speedRequested: speed,
        speedProcessed: speed,
        createdAt: new Date(),
      };

      this.logger.log(`Refund initiated for payment ${paymentId}: ${refund.id}`);
      return refund;
    } catch (error) {
      this.logger.error(`Failed to process refund for payment ${paymentId}:`, error);
      throw new BadRequestException('Failed to process refund');
    }
  }

  /**
   * Handle Razorpay webhook events
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      const isValidSignature = this.verifyWebhookSignature(payload, signature);

      if (!isValidSignature) {
        throw new BadRequestException('Invalid webhook signature');
      }

      const event: WebhookEvent = payload;

      this.logger.log(`Processing webhook event: ${event.event}`);

      switch (event.event) {
        case 'payment.authorized':
          await this.handlePaymentAuthorized(event.payload.payment.entity);
          break;
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity);
          break;
        case 'refund.created':
          await this.handleRefundCreated(event.payload);
          break;
        case 'refund.processed':
          await this.handleRefundProcessed(event.payload);
          break;
        default:
          this.logger.log(`Unhandled webhook event: ${event.event}`);
      }
    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return expectedSignature === signature;
    } catch (error) {
      this.logger.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Handle payment authorized webhook
   */
  private async handlePaymentAuthorized(payment: PaymentStatus): Promise<void> {
    this.logger.log(`Payment authorized: ${payment.id}`);
    
    // Update order status if needed
    if (payment.orderId) {
      await this.updateOrderPaymentStatus(payment.orderId, payment.id, 'AUTHORIZED');
    }
  }

  /**
   * Handle payment captured webhook
   */
  private async handlePaymentCaptured(payment: PaymentStatus): Promise<void> {
    this.logger.log(`Payment captured: ${payment.id}`);
    
    // Update order status
    if (payment.orderId) {
      await this.updateOrderPaymentStatus(payment.orderId, payment.id, 'PAID');
      
      // Trigger order status update to PAID
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' }
      });
    }
  }

  /**
   * Handle payment failed webhook
   */
  private async handlePaymentFailed(payment: PaymentStatus): Promise<void> {
    this.logger.log(`Payment failed: ${payment.id} - ${payment.errorDescription}`);
    
    // Update order status
    if (payment.orderId) {
      await this.updateOrderPaymentStatus(payment.orderId, payment.id, 'FAILED');
    }
  }

  /**
   * Handle refund created webhook
   */
  private async handleRefundCreated(payload: any): Promise<void> {
    this.logger.log(`Refund created: ${payload.refund?.entity?.id}`);
    // Handle refund creation logic
  }

  /**
   * Handle refund processed webhook
   */
  private async handleRefundProcessed(payload: any): Promise<void> {
    this.logger.log(`Refund processed: ${payload.refund?.entity?.id}`);
    // Handle refund processing logic
  }

  /**
   * Update order payment status
   */
  private async updateOrderPaymentStatus(orderId: string, paymentId: string, status: string): Promise<void> {
    try {
      await this.prisma.order.update({
        where: { id: orderId },
        data: {
          paymentId,
          paymentStatus: status,
          updatedAt: new Date(),
        }
      });

      this.logger.log(`Updated order ${orderId} payment status to ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update order payment status:`, error);
    }
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(filters?: {
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<{
    totalPayments: number;
    totalAmount: number;
    successRate: number;
    averageAmount: number;
    paymentMethods: Record<string, number>;
    statusBreakdown: Record<string, number>;
  }> {
    // In a real implementation, this would query payment data
    // For now, we'll return simulated analytics
    return {
      totalPayments: 150,
      totalAmount: 2500000,
      successRate: 94.5,
      averageAmount: 16667,
      paymentMethods: {
        card: 85,
        netbanking: 35,
        upi: 25,
        wallet: 5,
      },
      statusBreakdown: {
        paid: 142,
        failed: 5,
        pending: 3,
      },
    };
  }

  /**
   * Reconcile payments with orders
   */
  async reconcilePayments(date?: Date): Promise<{
    totalOrders: number;
    paidOrders: number;
    pendingPayments: number;
    failedPayments: number;
    discrepancies: Array<{
      orderId: string;
      orderAmount: number;
      paymentAmount?: number;
      status: string;
      issue: string;
    }>;
  }> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        }
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        paymentStatus: true,
        paymentId: true,
      }
    });

    const totalOrders = orders.length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length;
    const pendingPayments = orders.filter(o => o.paymentStatus === 'PENDING').length;
    const failedPayments = orders.filter(o => o.paymentStatus === 'FAILED').length;

    // Check for discrepancies (simplified logic)
    const discrepancies = orders
      .filter(order => order.paymentStatus === 'PAID' && !order.paymentId)
      .map(order => ({
        orderId: order.id,
        orderAmount: Number(order.totalAmount),
        status: order.paymentStatus || 'UNKNOWN',
        issue: 'Payment marked as paid but no payment ID found',
      }));

    return {
      totalOrders,
      paidOrders,
      pendingPayments,
      failedPayments,
      discrepancies,
    };
  }
}