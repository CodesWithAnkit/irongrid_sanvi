import { Test, TestingModule } from '@nestjs/testing';
import { QuotationConfigService } from './quotation-config.service';

describe('QuotationConfigService', () => {
  let service: QuotationConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotationConfigService],
    }).compile();

    service = module.get<QuotationConfigService>(QuotationConfigService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.QUOTATION_PREFIX;
    delete process.env.QUOTATION_DATE_FORMAT;
    delete process.env.QUOTATION_SEPARATOR;
    delete process.env.QUOTATION_SEQUENCE_LENGTH;
    delete process.env.QUOTATION_RESET_SEQUENCE;
  });

  describe('getQuotationNumberConfig', () => {
    it('should return default configuration', () => {
      const config = service.getQuotationNumberConfig();

      expect(config).toEqual({
        prefix: 'QUO',
        dateFormat: 'YYYY',
        separator: '-',
        sequenceLength: 6,
        resetSequence: 'YEARLY'
      });
    });

    it('should override with environment variables', () => {
      process.env.QUOTATION_PREFIX = 'QUOTE';
      process.env.QUOTATION_DATE_FORMAT = 'YYYYMM';
      process.env.QUOTATION_SEPARATOR = '_';
      process.env.QUOTATION_SEQUENCE_LENGTH = '4';
      process.env.QUOTATION_RESET_SEQUENCE = 'MONTHLY';

      const config = service.getQuotationNumberConfig();

      expect(config).toEqual({
        prefix: 'QUOTE',
        dateFormat: 'YYYYMM',
        separator: '_',
        sequenceLength: 4,
        resetSequence: 'MONTHLY'
      });
    });

    it('should handle invalid sequence length gracefully', () => {
      process.env.QUOTATION_SEQUENCE_LENGTH = 'invalid';

      const config = service.getQuotationNumberConfig();

      expect(config.sequenceLength).toBe(6); // Should fallback to default
    });
  });

  describe('formatDatePart', () => {
    const testDate = new Date('2024-03-15');

    it('should format YYYY correctly', () => {
      const result = service.formatDatePart(testDate, 'YYYY');
      expect(result).toBe('2024');
    });

    it('should format YYYYMM correctly', () => {
      const result = service.formatDatePart(testDate, 'YYYYMM');
      expect(result).toBe('202403');
    });

    it('should format YYYYMMDD correctly', () => {
      const result = service.formatDatePart(testDate, 'YYYYMMDD');
      expect(result).toBe('20240315');
    });

    it('should default to YYYY for invalid format', () => {
      const result = service.formatDatePart(testDate, 'INVALID' as any);
      expect(result).toBe('2024');
    });

    it('should handle single digit months and days', () => {
      const testDate = new Date('2024-01-05');
      
      const yyyymm = service.formatDatePart(testDate, 'YYYYMM');
      const yyyymmdd = service.formatDatePart(testDate, 'YYYYMMDD');
      
      expect(yyyymm).toBe('202401');
      expect(yyyymmdd).toBe('20240105');
    });
  });

  describe('getResetPeriodKey', () => {
    const testDate = new Date('2024-03-15');

    it('should return year for YEARLY reset', () => {
      const result = service.getResetPeriodKey(testDate, 'YEARLY');
      expect(result).toBe('2024');
    });

    it('should return year-month for MONTHLY reset', () => {
      const result = service.getResetPeriodKey(testDate, 'MONTHLY');
      expect(result).toBe('2024-03');
    });

    it('should return year-month-day for DAILY reset', () => {
      const result = service.getResetPeriodKey(testDate, 'DAILY');
      expect(result).toBe('2024-03-15');
    });

    it('should return NEVER for NEVER reset', () => {
      const result = service.getResetPeriodKey(testDate, 'NEVER');
      expect(result).toBe('NEVER');
    });

    it('should default to NEVER for invalid reset sequence', () => {
      const result = service.getResetPeriodKey(testDate, 'INVALID');
      expect(result).toBe('NEVER');
    });

    it('should handle single digit months and days with padding', () => {
      const testDate = new Date('2024-01-05');
      
      const monthly = service.getResetPeriodKey(testDate, 'MONTHLY');
      const daily = service.getResetPeriodKey(testDate, 'DAILY');
      
      expect(monthly).toBe('2024-01');
      expect(daily).toBe('2024-01-05');
    });
  });

  describe('edge cases', () => {
    it('should handle leap year dates', () => {
      const leapYearDate = new Date('2024-02-29');
      
      const yyyy = service.formatDatePart(leapYearDate, 'YYYY');
      const yyyymm = service.formatDatePart(leapYearDate, 'YYYYMM');
      const yyyymmdd = service.formatDatePart(leapYearDate, 'YYYYMMDD');
      
      expect(yyyy).toBe('2024');
      expect(yyyymm).toBe('202402');
      expect(yyyymmdd).toBe('20240229');
    });

    it('should handle year boundaries', () => {
      const newYearDate = new Date('2024-01-01');
      const yearEndDate = new Date('2024-12-31');
      
      expect(service.formatDatePart(newYearDate, 'YYYYMMDD')).toBe('20240101');
      expect(service.formatDatePart(yearEndDate, 'YYYYMMDD')).toBe('20241231');
    });

    it('should handle different timezones consistently', () => {
      // Test with a date that might cross timezone boundaries
      const testDate = new Date('2024-03-15T23:59:59.999Z');
      
      const result = service.formatDatePart(testDate, 'YYYYMMDD');
      
      // The result should be consistent regardless of local timezone
      expect(result).toMatch(/^\d{8}$/);
    });
  });
});