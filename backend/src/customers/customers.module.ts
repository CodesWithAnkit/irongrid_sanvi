import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomerCrmController } from './controllers/customer-crm.controller';
import { CustomerSegmentationController } from './controllers/customer-segmentation.controller';
import { CustomerCrmService } from './services/customer-crm.service';
import { CustomerSegmentationService } from './services/customer-segmentation.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [
    CustomersController,
    CustomerCrmController,
    CustomerSegmentationController
  ],
  providers: [
    CustomersService,
    CustomerCrmService,
    CustomerSegmentationService,
    PrismaService
  ],
  exports: [
    CustomersService,
    CustomerCrmService,
    CustomerSegmentationService
  ]
})
export class CustomersModule {}
