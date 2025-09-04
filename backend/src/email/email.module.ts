import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { EmailProcessor } from './processors/email.processor';
import { EmailTemplateService } from './services/email-template.service';
import { DatabaseModule } from 'src/common/database.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    DatabaseModule
  ],
  providers: [EmailService, EmailProcessor, EmailTemplateService],
  controllers: [EmailController],
  exports: [EmailService, EmailTemplateService],
})
export class EmailModule {}