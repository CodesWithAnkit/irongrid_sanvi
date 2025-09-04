import { Injectable } from '@nestjs/common';

export interface OrderNumberConfig {
  prefix: string;
  separator: string;
  dateFormat: 'YYYY' | 'YYYY-MM' | 'YYYY-MM-DD' | 'YYYYMM' | 'YYYYMMDD';
  sequenceLength: number;
  resetSequence: 'NEVER' | 'YEARLY' | 'MONTHLY' | 'DAILY';
}

@Injectable()
export class OrderConfigService {
  private readonly orderNumberConfig: OrderNumberConfig = {
    prefix: 'ORD',
    separator: '-',
    dateFormat: 'YYYY',
    sequenceLength: 6,
    resetSequence: 'YEARLY'
  };

  /**
   * Get order number configuration
   */
  getOrderNumberConfig(): OrderNumberConfig {
    return { ...this.orderNumberConfig };
  }

  /**
   * Format date part for order number based on configuration
   */
  formatDatePart(date: Date, format: OrderNumberConfig['dateFormat']): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'YYYY':
        return String(year);
      case 'YYYY-MM':
        return `${year}-${month}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYYMM':
        return `${year}${month}`;
      case 'YYYYMMDD':
        return `${year}${month}${day}`;
      default:
        return String(year);
    }
  }

  /**
   * Get reset period key for sequence numbering
   */
  getResetPeriodKey(date: Date, resetSequence: OrderNumberConfig['resetSequence']): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (resetSequence) {
      case 'YEARLY':
        return String(year);
      case 'MONTHLY':
        return `${year}-${month}`;
      case 'DAILY':
        return `${year}-${month}-${day}`;
      case 'NEVER':
      default:
        return 'global';
    }
  }

  /**
   * Get default order validity period in days
   */
  getDefaultValidityDays(): number {
    return 30;
  }

  /**
   * Get default tax rate (GST for India)
   */
  getDefaultTaxRate(): number {
    return 0.18; // 18% GST
  }

  /**
   * Get order status transition rules
   */
  getStatusTransitionRules(): Record<string, string[]> {
    return {
      PENDING: ['PAID', 'CANCELLED'],
      PAID: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [], // Terminal state
      CANCELLED: [] // Terminal state
    };
  }

  /**
   * Get payment status options
   */
  getPaymentStatusOptions(): string[] {
    return [
      'PENDING',
      'PAID',
      'PARTIALLY_PAID',
      'FAILED',
      'REFUNDED',
      'CANCELLED'
    ];
  }

  /**
   * Get notification settings for order status changes
   */
  getNotificationSettings(): Record<string, { customer: boolean; internal: boolean }> {
    return {
      PENDING: { customer: true, internal: true },
      PAID: { customer: true, internal: true },
      PROCESSING: { customer: true, internal: true },
      SHIPPED: { customer: true, internal: true },
      DELIVERED: { customer: true, internal: true },
      CANCELLED: { customer: true, internal: true }
    };
  }
}