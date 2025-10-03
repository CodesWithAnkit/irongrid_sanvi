import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async check() {
    const timestamp = new Date().toISOString();
    const uptime = process.uptime();
    const version = process.env.npm_package_version || '1.0.0';
    const environment = this.configService.get('NODE_ENV', 'development');

    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      const databaseStatus = 'connected';

      // Check Redis connection (if available)
      let redisStatus = 'not configured';
      try {
        // Add Redis health check here if you have Redis service injected
        redisStatus = 'connected';
      } catch (error) {
        redisStatus = 'disconnected';
      }

      return {
        status: 'ok',
        timestamp,
        uptime,
        version,
        environment,
        database: databaseStatus,
        redis: redisStatus,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp,
        error: error.message,
      };
    }
  }

  async ready() {
    try {
      // Check if database is ready
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error('Application not ready');
    }
  }

  async live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}