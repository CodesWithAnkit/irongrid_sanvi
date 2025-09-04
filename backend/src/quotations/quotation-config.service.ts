import { Injectable } from '@nestjs/common';

export interface QuotationNumberConfig {
  prefix: string;
  dateFormat: 'YYYY' | 'YYYYMM' | 'YYYYMMDD';
  separator: string;
  sequenceLength: number;
  resetSequence: 'NEVER' | 'YEARLY' | 'MONTHLY' | 'DAILY';
}

@Injectable()
export class QuotationConfigService {
  private readonly defaultConfig: QuotationNumberConfig = {
    prefix: 'QUO',
    dateFormat: 'YYYY',
    separator: '-',
    sequenceLength: 6,
    resetSequence: 'YEARLY'
  };

  getQuotationNumberConfig(): QuotationNumberConfig {
    // In a real implementation, this could be loaded from database or config file
    return {
      ...this.defaultConfig,
      // Override with environment variables if needed
      prefix: process.env.QUOTATION_PREFIX || this.defaultConfig.prefix,
      dateFormat: (process.env.QUOTATION_DATE_FORMAT as any) || this.defaultConfig.dateFormat,
      separator: process.env.QUOTATION_SEPARATOR || this.defaultConfig.separator,
      sequenceLength: parseInt(process.env.QUOTATION_SEQUENCE_LENGTH || '6') || this.defaultConfig.sequenceLength,
      resetSequence: (process.env.QUOTATION_RESET_SEQUENCE as any) || this.defaultConfig.resetSequence
    };
  }

  formatDatePart(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'YYYY':
        return String(year);
      case 'YYYYMM':
        return `${year}${month}`;
      case 'YYYYMMDD':
        return `${year}${month}${day}`;
      default:
        return String(year);
    }
  }

  getResetPeriodKey(date: Date, resetSequence: string): string {
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
      default:
        return 'NEVER';
    }
  }
}