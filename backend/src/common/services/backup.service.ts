import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

interface BackupResult {
  success: boolean;
  filename?: string;
  size?: number;
  duration?: number;
  error?: string;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly configService: ConfigService) {}

  @Cron('0 2 * * *') // Daily at 2 AM
  async performScheduledBackup(): Promise<void> {
    if (!this.configService.get<boolean>('database.backup.enableAutomatedBackup')) {
      return;
    }

    this.logger.log('Starting scheduled database backup...');
    
    try {
      const result = await this.createBackup();
      
      if (result.success) {
        this.logger.log(`Backup completed successfully: ${result.filename} (${result.size} bytes, ${result.duration}ms)`);
        await this.cleanupOldBackups();
      } else {
        this.logger.error(`Backup failed: ${result.error}`);
      }
    } catch (error) {
      this.logger.error('Scheduled backup failed', error);
    }
  }

  async createBackup(customName?: string): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Create backup directory if it doesn't exist
      const backupDir = this.configService.get<string>('database.backup.backupLocation', './backups');
      await fs.mkdir(backupDir, { recursive: true });

      // Generate backup filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = customName || `backup-${dbName}-${timestamp}.sql`;
      const backupPath = path.join(backupDir, filename);

      // Set environment variables for pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: password,
      };

      // Create pg_dump command
      const command = [
        'pg_dump',
        `-h ${host}`,
        `-p ${port}`,
        `-U ${username}`,
        `-d ${dbName}`,
        '--verbose',
        '--clean',
        '--if-exists',
        '--create',
        '--format=custom',
        `--file=${backupPath}`,
      ].join(' ');

      this.logger.debug(`Executing backup command: ${command.replace(password, '***')}`);

      // Execute backup
      const { stdout, stderr } = await execAsync(command, { env });
      
      if (stderr && !stderr.includes('NOTICE')) {
        this.logger.warn('Backup warnings:', stderr);
      }

      // Get backup file size
      const stats = await fs.stat(backupPath);
      const duration = Date.now() - startTime;

      return {
        success: true,
        filename,
        size: stats.size,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Backup creation failed', error);
      
      return {
        success: false,
        duration,
        error: error.message,
      };
    }
  }

  async restoreBackup(backupFilename: string): Promise<BackupResult> {
    const startTime = Date.now();
    
    try {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');
      if (!databaseUrl) {
        throw new Error('DATABASE_URL not configured');
      }

      // Parse database URL
      const url = new URL(databaseUrl);
      const dbName = url.pathname.slice(1);
      const host = url.hostname;
      const port = url.port || '5432';
      const username = url.username;
      const password = url.password;

      // Check if backup file exists
      const backupDir = this.configService.get<string>('database.backup.backupLocation', './backups');
      const backupPath = path.join(backupDir, backupFilename);
      
      try {
        await fs.access(backupPath);
      } catch {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      // Set environment variables for pg_restore
      const env = {
        ...process.env,
        PGPASSWORD: password,
      };

      // Create pg_restore command
      const command = [
        'pg_restore',
        `-h ${host}`,
        `-p ${port}`,
        `-U ${username}`,
        `-d ${dbName}`,
        '--verbose',
        '--clean',
        '--if-exists',
        backupPath,
      ].join(' ');

      this.logger.debug(`Executing restore command: ${command.replace(password, '***')}`);

      // Execute restore
      const { stdout, stderr } = await execAsync(command, { env });
      
      if (stderr && !stderr.includes('NOTICE')) {
        this.logger.warn('Restore warnings:', stderr);
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        filename: backupFilename,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Backup restore failed', error);
      
      return {
        success: false,
        duration,
        error: error.message,
      };
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const backupDir = this.configService.get<string>('database.backup.backupLocation', './backups');
      const files = await fs.readdir(backupDir);
      
      return files
        .filter(file => file.endsWith('.sql'))
        .sort((a, b) => b.localeCompare(a)); // Sort by name (newest first due to timestamp)
    } catch (error) {
      this.logger.error('Failed to list backups', error);
      return [];
    }
  }

  async getBackupInfo(filename: string): Promise<any> {
    try {
      const backupDir = this.configService.get<string>('database.backup.backupLocation', './backups');
      const backupPath = path.join(backupDir, filename);
      const stats = await fs.stat(backupPath);
      
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      this.logger.error(`Failed to get backup info for ${filename}`, error);
      return null;
    }
  }

  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const backupDir = this.configService.get<string>('database.backup.backupLocation', './backups');
      const backupPath = path.join(backupDir, filename);
      
      await fs.unlink(backupPath);
      this.logger.log(`Deleted backup: ${filename}`);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete backup ${filename}`, error);
      return false;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    try {
      const retentionDays = this.configService.get<number>('database.backup.retentionDays', 30);
      const backupDir = this.configService.get<string>('database.backup.backupLocation', './backups');
      const files = await fs.readdir(backupDir);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      let deletedCount = 0;
      
      for (const file of files) {
        if (!file.endsWith('.sql')) continue;
        
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.birthtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
          this.logger.debug(`Deleted old backup: ${file}`);
        }
      }
      
      if (deletedCount > 0) {
        this.logger.log(`Cleaned up ${deletedCount} old backup(s)`);
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old backups', error);
    }
  }

  async testBackupRestore(): Promise<boolean> {
    this.logger.log('Starting backup/restore test...');
    
    try {
      // Create a test backup
      const backupResult = await this.createBackup('test-backup.sql');
      
      if (!backupResult.success) {
        this.logger.error('Test backup creation failed');
        return false;
      }
      
      this.logger.log('Test backup created successfully');
      
      // Clean up test backup
      await this.deleteBackup('test-backup.sql');
      
      this.logger.log('Backup/restore test completed successfully');
      return true;
    } catch (error) {
      this.logger.error('Backup/restore test failed', error);
      return false;
    }
  }
}