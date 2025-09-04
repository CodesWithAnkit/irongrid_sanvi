import { Controller, Get, Post, Delete, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RequirePermissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { DatabaseMonitoringService } from '../services/database-monitoring.service';
import { BackupService } from '../services/backup.service';
import { PerformanceOptimizationService } from '../services/performance-optimization.service';

@ApiTags('Database Administration')
@Controller('admin/database')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class DatabaseAdminController {
  constructor(
    private readonly monitoringService: DatabaseMonitoringService,
    private readonly backupService: BackupService,
    private readonly optimizationService: PerformanceOptimizationService,
  ) {}

  @Get('metrics')
  @RequirePermissions('system:configure')
  @ApiOperation({ summary: 'Get database metrics' })
  @ApiResponse({ status: 200, description: 'Database metrics retrieved successfully' })
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('connection-pool')
  @RequirePermissions('system:configure')
  @ApiOperation({ summary: 'Get connection pool status' })
  @ApiResponse({ status: 200, description: 'Connection pool status retrieved successfully' })
  async getConnectionPoolStatus() {
    return this.monitoringService.getConnectionPoolStatus();
  }

  @Get('slow-queries')
  @RequirePermissions('system:configure')
  @ApiOperation({ summary: 'Analyze slow queries' })
  @ApiResponse({ status: 200, description: 'Slow queries analysis completed' })
  async analyzeSlowQueries() {
    return this.monitoringService.analyzeSlowQueries();
  }

  @Get('missing-indexes')
  @RequirePermissions('system:configure')
  @ApiOperation({ summary: 'Analyze missing indexes' })
  @ApiResponse({ status: 200, description: 'Missing indexes analysis completed' })
  async analyzeMissingIndexes() {
    return this.monitoringService.analyzeMissingIndexes();
  }

  @Get('unused-indexes')
  @RequirePermissions('system:configure')
  @ApiOperation({ summary: 'Analyze unused indexes' })
  @ApiResponse({ status: 200, description: 'Unused indexes analysis completed' })
  async analyzeUnusedIndexes() {
    return this.monitoringService.analyzeUnusedIndexes();
  }

  @Post('optimize')
  @RequirePermissions('system:configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize database performance' })
  @ApiResponse({ status: 200, description: 'Database optimization completed' })
  async optimizeDatabase() {
    await this.monitoringService.optimizeDatabase();
    return { message: 'Database optimization completed' };
  }

  @Get('performance-report')
  @RequirePermissions('system:configure')
  @ApiOperation({ summary: 'Get comprehensive performance report' })
  @ApiResponse({ status: 200, description: 'Performance report generated successfully' })
  async getPerformanceReport() {
    return this.optimizationService.getPerformanceReport();
  }

  @Post('optimize-indexes')
  @RequirePermissions('system:configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Optimize database indexes' })
  @ApiResponse({ status: 200, description: 'Index optimization completed' })
  async optimizeIndexes() {
    await this.optimizationService.optimizeIndexes();
    return { message: 'Index optimization completed' };
  }

  @Get('backups')
  @RequirePermissions('system:configure')
  @ApiOperation({ summary: 'List all backups' })
  @ApiResponse({ status: 200, description: 'Backups listed successfully' })
  async listBackups() {
    const backups = await this.backupService.listBackups();
    const backupDetails = await Promise.all(
      backups.map(async (filename) => {
        const info = await this.backupService.getBackupInfo(filename);
        return info;
      })
    );
    return backupDetails.filter(Boolean);
  }

  @Post('backup')
  @RequirePermissions('system:configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create database backup' })
  @ApiResponse({ status: 200, description: 'Backup created successfully' })
  @ApiResponse({ status: 500, description: 'Backup creation failed' })
  async createBackup() {
    const result = await this.backupService.createBackup();
    
    if (result.success) {
      return {
        message: 'Backup created successfully',
        filename: result.filename,
        size: result.size,
        duration: result.duration,
      };
    } else {
      throw new Error(`Backup failed: ${result.error}`);
    }
  }

  @Post('backup/:filename/restore')
  @RequirePermissions('system:configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore database from backup' })
  @ApiResponse({ status: 200, description: 'Database restored successfully' })
  @ApiResponse({ status: 500, description: 'Restore failed' })
  async restoreBackup(@Param('filename') filename: string) {
    const result = await this.backupService.restoreBackup(filename);
    
    if (result.success) {
      return {
        message: 'Database restored successfully',
        filename: result.filename,
        duration: result.duration,
      };
    } else {
      throw new Error(`Restore failed: ${result.error}`);
    }
  }

  @Delete('backup/:filename')
  @RequirePermissions('system:configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete backup file' })
  @ApiResponse({ status: 200, description: 'Backup deleted successfully' })
  @ApiResponse({ status: 404, description: 'Backup not found' })
  async deleteBackup(@Param('filename') filename: string) {
    const success = await this.backupService.deleteBackup(filename);
    
    if (success) {
      return { message: 'Backup deleted successfully' };
    } else {
      throw new Error('Failed to delete backup');
    }
  }

  @Post('backup/test')
  @RequirePermissions('system:configure')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test backup and restore functionality' })
  @ApiResponse({ status: 200, description: 'Backup test completed successfully' })
  async testBackupRestore() {
    const success = await this.backupService.testBackupRestore();
    
    return {
      message: success ? 'Backup test completed successfully' : 'Backup test failed',
      success,
    };
  }
}