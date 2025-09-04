import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheService } from './services/cache.service';
import { CacheWarmingService } from './services/cache-warming.service';
import { CacheMonitoringService } from './services/cache-monitoring.service';
import { QueryOptimizationService } from './services/query-optimization.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  providers: [
    CacheService,
    CacheWarmingService,
    CacheMonitoringService,
    QueryOptimizationService,
    PrismaService,
  ],
  exports: [
    CacheService,
    CacheWarmingService,
    CacheMonitoringService,
    QueryOptimizationService,
  ],
})
export class CacheModule {}