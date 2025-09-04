import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderConfigService } from './order-config.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [OrdersController],
  providers: [OrdersService, OrderConfigService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
