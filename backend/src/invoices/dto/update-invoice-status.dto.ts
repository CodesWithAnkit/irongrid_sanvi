import { IsString, IsEmail } from 'class-validator';

export class UpdateInvoiceStatusDto {
  @IsString()
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

  @IsEmail()
  recipientEmail?: string;
}
