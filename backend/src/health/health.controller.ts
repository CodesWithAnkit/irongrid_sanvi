import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Health check endpoint',
    description: 'Returns the health status of the application and its dependencies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Application is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        uptime: { type: 'number', example: 12345 },
        version: { type: 'string', example: '1.0.0' },
        environment: { type: 'string', example: 'production' },
        database: { type: 'string', example: 'connected' },
        redis: { type: 'string', example: 'connected' }
      }
    }
  })
  @ApiResponse({ 
    status: 503, 
    description: 'Application is unhealthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        error: { type: 'string', example: 'Database connection failed' }
      }
    }
  })
  async check() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ 
    summary: 'Readiness check',
    description: 'Returns whether the application is ready to serve requests'
  })
  @ApiResponse({ status: 200, description: 'Application is ready' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  async ready() {
    return this.healthService.ready();
  }

  @Get('live')
  @ApiOperation({ 
    summary: 'Liveness check',
    description: 'Returns whether the application is alive'
  })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  async live() {
    return this.healthService.live();
  }
}