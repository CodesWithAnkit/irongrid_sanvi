import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLoggerService } from './audit-logger.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  enabled: boolean;
  schedule: string;
  retentionDays: number;
  storageLocation: string;
  compress: boolean;
  s3Bucket?: string;
  backupTypes: ('database' | 'files' | 'configs')[];
}

export interface RecoveryPoint {
  id: string;
  timestamp: Date;
  type: 'scheduled' | 'manual' | 'pre-deployment';
  size: number;
  location: string;
  status: 'completed' | 'failed' | 'in_progress';
  metadata: any;
}

@Injectable()
export class BackupRecoveryService implements OnModuleInit {
  private readonly backupConfig: BackupConfig;
  private isBackupInProgress = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly auditLogger: AuditLoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Load backup configuration from environment or use defaults
    this.backupConfig = {
      enabled: this.configService.get<boolean>('BACKUP_ENABLED') ?? true,
      schedule: this.configService.get<string>('BACKUP_SCHEDULE') ?? CronExpression.EVERY_DAY_AT_MIDNIGHT,
      retentionDays: this.configService.get<number>('BACKUP_RETENTION_DAYS') ?? 30,
      storageLocation: this.configService.get<string>('BACKUP_STORAGE_LOCATION') ?? './backups',
      compress: this.configService.get<boolean>('BACKUP_COMPRESS') ?? true,
      s3Bucket: this.configService.get<string>('BACKUP_S3_BUCKET'),
      backupTypes: this.parseBackupTypes(
        this.configService.get<string>('BACKUP_TYPES') ?? 'database,files,configs'
      ),
    };
  }

  onModuleInit() {
    // Ensure backup directory exists
    if (this.backupConfig.enabled) {
      this.ensureBackupDirectoryExists();
      console.log('Backup and recovery service initialized with schedule:', this.backupConfig.schedule);
    } else {
      console.log('Backup and recovery service is disabled');
    }
  }

  /**
   * Scheduled backup job
   */
  @Cron('0 0 * * *') // Default: Every day at midnight
  async scheduledBackup() {
    if (!this.backupConfig.enabled || this.isBackupInProgress) {
      return;
    }

    try {
      this.isBackupInProgress = true;
      const backupResult = await this.createBackup('scheduled');
      
      await this.auditLogger.log({
        action: 'scheduled_backup_completed',
        resource: 'system',
        resourceId: backupResult.id,
        details: {
          status: backupResult.status,
          size: backupResult.size,
        },
        level: 'INFO',
      });
      
      // Clean up old backups
      await this.cleanupOldBackups();
    } catch (error) {
      console.error('Scheduled backup failed:', error);
      
      await this.auditLogger.log({
        action: 'scheduled_backup_failed',
        resource: 'system',
        details: { error: error.message },
        level: 'ERROR',
      });
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Create a manual backup
   * @param type Type of backup
   * @param metadata Optional metadata
   */
  async createBackup(type: 'scheduled' | 'manual' | 'pre-deployment' = 'manual', metadata?: any): Promise<RecoveryPoint> {
    if (this.isBackupInProgress) {
      throw new Error('Another backup operation is already in progress');
    }

    this.isBackupInProgress = true;
    const timestamp = new Date();
    const backupId = `backup_${timestamp.toISOString().replace(/[:.]/g, '-')}_${type}`;
    const backupDir = path.join(this.backupConfig.storageLocation, backupId);
    
    try {
      // Create backup directory
      await fs.promises.mkdir(backupDir, { recursive: true });
      
      // Create recovery point record
      const recoveryPoint = await this.prisma.recoveryPoint.create({
        data: {
          id: backupId,
          type,
          status: 'in_progress',
          location: backupDir,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
      
      // Backup database if enabled
      if (this.backupConfig.backupTypes.includes('database')) {
        await this.backupDatabase(backupDir, timestamp);
      }
      
      // Backup files if enabled
      if (this.backupConfig.backupTypes.includes('files')) {
        await this.backupFiles(backupDir, timestamp);
      }
      
      // Backup configurations if enabled
      if (this.backupConfig.backupTypes.includes('configs')) {
        await this.backupConfigurations(backupDir, timestamp);
      }
      
      // Get backup size
      const size = await this.getDirectorySize(backupDir);
      
      // Compress backup if enabled
      if (this.backupConfig.compress) {
        await this.compressBackup(backupDir, timestamp);
      }
      
      // Upload to S3 if configured
      if (this.backupConfig.s3Bucket) {
        await this.uploadToS3(backupDir, backupId);
      }
      
      // Update recovery point status
      const updatedRecoveryPoint = await this.prisma.recoveryPoint.update({
        where: { id: backupId },
        data: {
          status: 'completed',
          size,
        },
      });
      
      this.eventEmitter.emit('backup.completed', updatedRecoveryPoint);
      
      return {
        ...updatedRecoveryPoint,
        timestamp,
        metadata: metadata || {},
      };
    } catch (error) {
      console.error(`Backup failed: ${error.message}`);
      
      // Update recovery point status to failed
      await this.prisma.recoveryPoint.update({
        where: { id: backupId },
        data: {
          status: 'failed',
          metadata: JSON.stringify({ error: error.message }),
        },
      });
      
      throw error;
    } finally {
      this.isBackupInProgress = false;
    }
  }

  /**
   * Restore from a backup
   * @param recoveryPointId ID of the recovery point
   */
  async restoreFromBackup(recoveryPointId: string): Promise<any> {
    const recoveryPoint = await this.prisma.recoveryPoint.findUnique({
      where: { id: recoveryPointId },
    });
    
    if (!recoveryPoint) {
      throw new Error('Recovery point not found');
    }
    
    if (recoveryPoint.status !== 'completed') {
      throw new Error('Cannot restore from an incomplete backup');
    }
    
    await this.auditLogger.log({
      action: 'restore_initiated',
      resource: 'system',
      resourceId: recoveryPointId,
      level: 'SECURITY',
    });
    
    try {
      // Check if backup exists
      const backupDir = recoveryPoint.location;
      if (!fs.existsSync(backupDir)) {
        throw new Error('Backup files not found at the specified location');
      }
      
      // Uncompress backup if it was compressed
      if (this.backupConfig.compress) {
        await this.uncompressBackup(backupDir);
      }
      
      // Restore database if it exists in the backup
      if (fs.existsSync(path.join(backupDir, 'database'))) {
        await this.restoreDatabase(backupDir);
      }
      
      // Restore files if they exist in the backup
      if (fs.existsSync(path.join(backupDir, 'files'))) {
        await this.restoreFiles(backupDir);
      }
      
      // Restore configurations if they exist in the backup
      if (fs.existsSync(path.join(backupDir, 'configs'))) {
        await this.restoreConfigurations(backupDir);
      }
      
      await this.auditLogger.log({
        action: 'restore_completed',
        resource: 'system',
        resourceId: recoveryPointId,
        level: 'SECURITY',
      });
      
      return {
        status: 'success',
        message: 'System successfully restored from backup',
        recoveryPointId,
      };
    } catch (error) {
      console.error(`Restore failed: ${error.message}`);
      
      await this.auditLogger.log({
        action: 'restore_failed',
        resource: 'system',
        resourceId: recoveryPointId,
        details: { error: error.message },
        level: 'ERROR',
      });
      
      throw error;
    }
  }

  /**
   * List all available recovery points
   */
  async listRecoveryPoints(limit = 10, offset = 0, type?: string): Promise<any> {
    const where = type ? { type } : {};
    
    const [recoveryPoints, total] = await Promise.all([
      this.prisma.recoveryPoint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.recoveryPoint.count({ where }),
    ]);
    
    return {
      recoveryPoints: recoveryPoints.map(point => ({
        ...point,
        metadata: point.metadata ? JSON.parse(point.metadata) : {},
      })),
      total,
      limit,
      offset,
    };
  }

  /**
   * Test backup restoration in a safe environment
   */
  async testRestoreProcedure(recoveryPointId: string): Promise<any> {
    // This would be implemented in a real-world scenario to create
    // a sandbox/test environment and verify the backup integrity
    throw new Error('Test restore procedure not implemented');
  }

  /**
   * Generate a disaster recovery plan document
   */
  async generateDisasterRecoveryPlan(): Promise<any> {
    // In a real implementation, this would generate a comprehensive
    // disaster recovery document based on the current system configuration
    
    const plan = {
      generatedAt: new Date(),
      version: '1.0',
      backupStrategy: {
        schedule: this.backupConfig.schedule,
        types: this.backupConfig.backupTypes,
        retention: `${this.backupConfig.retentionDays} days`,
        storage: this.backupConfig.s3Bucket ? 'AWS S3' : 'Local Storage',
      },
      recoveryProcedures: {
        completeSystemFailure: [
          '1. Access the latest recovery point from backup storage',
          '2. Provision new infrastructure if needed',
          '3. Install base system dependencies',
          '4. Run restore procedure with the recovery point ID',
          '5. Verify system integrity and functionality',
          '6. Update DNS/routing to point to the restored system',
        ],
        databaseCorruption: [
          '1. Stop application services',
          '2. Identify the most recent valid backup',
          '3. Restore only the database component',
          '4. Run data integrity checks',
          '5. Restart application services',
        ],
        securityIncident: [
          '1. Isolate affected systems',
          '2. Identify last known good backup before the incident',
          '3. Prepare clean environment for restoration',
          '4. Restore system to pre-incident state',
          '5. Apply security patches before bringing system online',
          '6. Implement additional security measures',
          '7. Gradually restore services with monitoring',
        ],
      },
      testingSchedule: 'Quarterly',
      responsiblePersonnel: {
        primary: 'System Administrator',
        secondary: 'DevOps Engineer',
        management: 'IT Director',
      },
      estimatedRecoveryTime: {
        fullSystemRestore: '4-8 hours',
        databaseOnlyRestore: '1-2 hours',
        configurationRestore: '30 minutes',
      },
    };
    
    return plan;
  }

  // Private helper methods
  private async ensureBackupDirectoryExists() {
    await fs.promises.mkdir(this.backupConfig.storageLocation, { recursive: true });
  }

  private parseBackupTypes(typesString: string): ('database' | 'files' | 'configs')[] {
    const validTypes = ['database', 'files', 'configs'];
    const types = typesString.split(',').map(t => t.trim());
    return types.filter(t => validTypes.includes(t)) as ('database' | 'files' | 'configs')[];
  }

  private async backupDatabase(backupDir: string, timestamp: Date): Promise<void> {
    const databaseBackupDir = path.join(backupDir, 'database');
    await fs.promises.mkdir(databaseBackupDir, { recursive: true });
    
    // Get database connection info from config
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Extract database type from connection string
    const dbType = dbUrl.split(':')[0];
    
    // Execute the appropriate backup command based on database type
    if (dbType.includes('postgres')) {
      // Extract connection parts from URL
      const connectionMatch = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!connectionMatch) {
        throw new Error('Invalid PostgreSQL connection string');
      }
      
      const [, user, password, host, port, dbName] = connectionMatch;
      const backupFile = path.join(databaseBackupDir, `${dbName}_${timestamp.toISOString().replace(/[:.]/g, '-')}.sql`);
      
      // Set environment variables for pg_dump
      const env = {
        PGPASSWORD: password,
        ...process.env,
      };
      
      // Execute pg_dump
      await execAsync(`pg_dump -h ${host} -p ${port} -U ${user} -d ${dbName} -F c -f "${backupFile}"`, { env });
    } else {
      // Handle other database types or throw error
      throw new Error(`Backup not implemented for database type: ${dbType}`);
    }
  }

  private async backupFiles(backupDir: string, timestamp: Date): Promise<void> {
    const filesBackupDir = path.join(backupDir, 'files');
    await fs.promises.mkdir(filesBackupDir, { recursive: true });
    
    // Define directories to backup (upload directories, etc.)
    const dirsToBackup = [
      path.resolve(process.cwd(), 'uploads'),
      path.resolve(process.cwd(), 'public/assets'),
      // Add other important directories
    ];
    
    for (const dir of dirsToBackup) {
      if (fs.existsSync(dir)) {
        const dirName = path.basename(dir);
        const targetDir = path.join(filesBackupDir, dirName);
        await fs.promises.mkdir(targetDir, { recursive: true });
        
        // Copy files
        await execAsync(`cp -R ${dir}/* ${targetDir}`);
      }
    }
  }

  private async backupConfigurations(backupDir: string, timestamp: Date): Promise<void> {
    const configsBackupDir = path.join(backupDir, 'configs');
    await fs.promises.mkdir(configsBackupDir, { recursive: true });
    
    // Backup environment variables
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      await fs.promises.copyFile(envFile, path.join(configsBackupDir, '.env.backup'));
    }
    
    // Backup other configuration files
    const configFiles = [
      'nest-cli.json',
      'tsconfig.json',
      'package.json',
      // Add other important configuration files
    ];
    
    for (const file of configFiles) {
      const filePath = path.resolve(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        await fs.promises.copyFile(filePath, path.join(configsBackupDir, file));
      }
    }
    
    // Export system configuration from database
    const systemConfig = await this.prisma.systemConfig.findMany();
    await fs.promises.writeFile(
      path.join(configsBackupDir, 'system-config.json'),
      JSON.stringify(systemConfig, null, 2)
    );
  }

  private async compressBackup(backupDir: string, timestamp: Date): Promise<void> {
    const parentDir = path.dirname(backupDir);
    const dirName = path.basename(backupDir);
    
    // Create tar.gz archive
    await execAsync(`tar -czf "${backupDir}.tar.gz" -C "${parentDir}" "${dirName}"`);
    
    // Remove original directory to save space (keep only the compressed version)
    await fs.promises.rm(backupDir, { recursive: true, force: true });
  }

  private async uncompressBackup(backupPath: string): Promise<void> {
    const parentDir = path.dirname(backupPath);
    
    // Check if we need to uncompress (if it's a compressed file)
    if (backupPath.endsWith('.tar.gz')) {
      const extractDir = backupPath.replace('.tar.gz', '');
      await execAsync(`tar -xzf "${backupPath}" -C "${parentDir}"`);
      return;
    }
  }

  private async uploadToS3(backupDir: string, backupId: string): Promise<void> {
    // In a real implementation, this would use AWS SDK to upload to S3
    console.log(`[MOCK] Uploading backup ${backupId} to S3 bucket ${this.backupConfig.s3Bucket}`);
  }

  private async restoreDatabase(backupDir: string): Promise<void> {
    const databaseDir = path.join(backupDir, 'database');
    const backupFiles = await fs.promises.readdir(databaseDir);
    
    if (backupFiles.length === 0) {
      throw new Error('No database backup files found');
    }
    
    // Use the most recent backup file (should be only one, but just in case)
    const backupFile = path.join(databaseDir, backupFiles[0]);
    
    // Get database connection info
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }
    
    // Extract database type from connection string
    const dbType = dbUrl.split(':')[0];
    
    if (dbType.includes('postgres')) {
      // Extract connection parts from URL
      const connectionMatch = dbUrl.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
      if (!connectionMatch) {
        throw new Error('Invalid PostgreSQL connection string');
      }
      
      const [, user, password, host, port, dbName] = connectionMatch;
      
      // Set environment variables for pg_restore
      const env = {
        PGPASSWORD: password,
        ...process.env,
      };
      
      // Execute pg_restore
      await execAsync(`pg_restore -h ${host} -p ${port} -U ${user} -d ${dbName} -c "${backupFile}"`, { env });
    } else {
      throw new Error(`Restore not implemented for database type: ${dbType}`);
    }
  }

  private async restoreFiles(backupDir: string): Promise<void> {
    const filesDir = path.join(backupDir, 'files');
    const backupDirs = await fs.promises.readdir(filesDir);
    
    for (const dir of backupDirs) {
      const sourceDir = path.join(filesDir, dir);
      const targetDir = path.resolve(process.cwd(), dir);
      
      // Create target directory if it doesn't exist
      await fs.promises.mkdir(targetDir, { recursive: true });
      
      // Copy files
      await execAsync(`cp -R ${sourceDir}/* ${targetDir}`);
    }
  }

  private async restoreConfigurations(backupDir: string): Promise<void> {
    const configsDir = path.join(backupDir, 'configs');
    const backupFiles = await fs.promises.readdir(configsDir);
    
    for (const file of backupFiles) {
      // Skip system-config.json as it will be handled separately
      if (file === 'system-config.json') {
        continue;
      }
      
      const sourceFile = path.join(configsDir, file);
      const targetFile = path.resolve(process.cwd(), file.replace('.backup', ''));
      
      // Copy configuration file
      await fs.promises.copyFile(sourceFile, targetFile);
    }
    
    // Restore system configuration from backup
    const systemConfigPath = path.join(configsDir, 'system-config.json');
    if (fs.existsSync(systemConfigPath)) {
      const systemConfig = JSON.parse(await fs.promises.readFile(systemConfigPath, 'utf-8'));
      
      // Apply each config item
      for (const config of systemConfig) {
        await this.prisma.systemConfig.upsert({
          where: { key: config.key },
          update: { value: config.value },
          create: { key: config.key, value: config.value },
        });
      }
    }
  }

  private async getDirectorySize(dirPath: string): Promise<number> {
    const stats = await fs.promises.stat(dirPath);
    
    if (!stats.isDirectory()) {
      return stats.size;
    }
    
    const files = await fs.promises.readdir(dirPath);
    let size = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const fileStats = await fs.promises.stat(filePath);
      
      if (fileStats.isDirectory()) {
        size += await this.getDirectorySize(filePath);
      } else {
        size += fileStats.size;
      }
    }
    
    return size;
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.backupConfig.retentionDays);
      
      // Find old recovery points
      const oldRecoveryPoints = await this.prisma.recoveryPoint.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          type: 'scheduled', // Only auto-delete scheduled backups
        },
      });
      
      for (const point of oldRecoveryPoints) {
        // Delete physical backup files
        if (fs.existsSync(point.location)) {
          await fs.promises.rm(point.location, { recursive: true, force: true });
        }
        
        // Check for compressed version
        if (fs.existsSync(`${point.location}.tar.gz`)) {
          await fs.promises.rm(`${point.location}.tar.gz`, { force: true });
        }
        
        // Delete from database
        await this.prisma.recoveryPoint.delete({
          where: { id: point.id },
        });
      }
      
      if (oldRecoveryPoints.length > 0) {
        await this.auditLogger.log({
          action: 'backup_cleanup',
          resource: 'system',
          details: { removedBackups: oldRecoveryPoints.length },
          level: 'INFO',
        });
      }
    } catch (error) {
      console.error('Error during backup cleanup:', error);
    }
  }
}
