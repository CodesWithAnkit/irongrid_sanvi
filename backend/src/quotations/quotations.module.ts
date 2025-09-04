import { Module } from '@nestjs/common';
import { QuotationsController } from './quotations.controller';
import { QuotationTemplateController } from './controllers/quotation-template.controller';
import { ApprovalWorkflowController } from './controllers/approval-workflow.controller';
import { QuotationsService } from './quotations.service';
import { QuotationTemplateService } from './services/quotation-template.service';
import { ApprovalWorkflowService } from './services/approval-workflow.service';
import { QuotationConfigService } from './quotation-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { DatabaseModule } from 'src/common/database.module';

@Module({
  imports: [NotificationsModule, DatabaseModule],
  controllers: [
    QuotationsController,
    QuotationTemplateController,
    ApprovalWorkflowController
  ],
  providers: [
    QuotationsService,
    QuotationTemplateService,
    ApprovalWorkflowService,
    QuotationConfigService,
    PrismaService
  ],
  exports: [
    QuotationsService,
    QuotationTemplateService,
    ApprovalWorkflowService
  ],
})
export class QuotationsModule {}
