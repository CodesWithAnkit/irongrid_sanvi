import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PdfService } from './pdf/pdf.service';
import { FilesModule } from '../files/files.module';
import { PrismaService } from '../prisma/prisma.service';
import { HtmlPdfService } from './pdf/html-pdf.service';
import { EmailService } from './email/email.service';
import { DatabaseModule } from 'src/common/database.module';

@Module({
  imports: [FilesModule, DatabaseModule],
  providers: [NotificationsService, PdfService, HtmlPdfService, EmailService, PrismaService],
  exports: [NotificationsService, PdfService, HtmlPdfService, EmailService],
})
export class NotificationsModule {}
