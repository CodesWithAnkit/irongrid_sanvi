import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { DatabaseMonitoringService } from './services/database-monitoring.service';
import { BackupService } from './services/backup.service';
import { PerformanceOptimizationService } from './services/performance-optimization.service';
import databaseOptimizationConfig from '../config/database-optimization.config';

@Module({
  imports: [
    ConfigModule.forFeature(databaseOptimizationConfig),
    ScheduleModule.forRoot(),
  ],
  providers: [
    PrismaService,
    DatabaseMonitoringService,
    BackupService,
    PerformanceOptimizationService,
  ],
  exports: [
    PrismaService,
    DatabaseMonitoringService,
    BackupService,
    PerformanceOptimizationService,
  ],
})
export class DatabaseModule {}