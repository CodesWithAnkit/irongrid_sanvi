import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

export class DatabaseTestSetup {
  private static instance: DatabaseTestSetup;
  private prisma: PrismaClient;
  private testDatabaseUrl: string;
  private originalDatabaseUrl: string;

  private constructor() {
    this.originalDatabaseUrl = process.env.DATABASE_URL || '';
    this.testDatabaseUrl = this.generateTestDatabaseUrl();
    process.env.DATABASE_URL = this.testDatabaseUrl;
    this.prisma = new PrismaClient();
  }

  static getInstance(): DatabaseTestSetup {
    if (!DatabaseTestSetup.instance) {
      DatabaseTestSetup.instance = new DatabaseTestSetup();
    }
    return DatabaseTestSetup.instance;
  }

  private generateTestDatabaseUrl(): string {
    const testDbName = `sanvi_test_${randomBytes(8).toString('hex')}`;
    const baseUrl = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432';
    return `${baseUrl}/${testDbName}`;
  }

  async setupDatabase(): Promise<void> {
    try {
      // Create test database
      await this.createTestDatabase();
      
      // Run migrations
      await this.runMigrations();
      
      // Connect Prisma client
      await this.prisma.$connect();
      
      console.log(`Test database setup complete: ${this.testDatabaseUrl}`);
    } catch (error) {
      console.error('Failed to setup test database:', error);
      throw error;
    }
  }

  async teardownDatabase(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      await this.dropTestDatabase();
      process.env.DATABASE_URL = this.originalDatabaseUrl;
      console.log('Test database teardown complete');
    } catch (error) {
      console.error('Failed to teardown test database:', error);
      throw error;
    }
  }

  async cleanDatabase(): Promise<void> {
    try {
      // Clean up in reverse order of dependencies to avoid foreign key constraints
      const tableNames = [
        'AuditLog',
        'EmailLog',
        'OrderItem',
        'Order',
        'QuotationItem',
        'Quotation',
        'CustomerInteraction',
        'ProductPricingRule',
        'Product',
        'Category',
        'Customer',
        'UserRole',
        'RolePermission',
        'User',
        'Role',
        'Permission',
        'EmailTemplate',
        'File',
      ];

      for (const tableName of tableNames) {
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
      }

      console.log('Test database cleaned');
    } catch (error) {
      console.error('Failed to clean test database:', error);
      throw error;
    }
  }

  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  private async createTestDatabase(): Promise<void> {
    const dbName = this.extractDatabaseName(this.testDatabaseUrl);
    const baseUrl = this.testDatabaseUrl.replace(`/${dbName}`, '/postgres');
    
    const tempPrisma = new PrismaClient({
      datasources: {
        db: {
          url: baseUrl,
        },
      },
    });

    try {
      await tempPrisma.$connect();
      await tempPrisma.$executeRawUnsafe(`CREATE DATABASE "${dbName}";`);
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    } finally {
      await tempPrisma.$disconnect();
    }
  }

  private async dropTestDatabase(): Promise<void> {
    const dbName = this.extractDatabaseName(this.testDatabaseUrl);
    const baseUrl = this.testDatabaseUrl.replace(`/${dbName}`, '/postgres');
    
    const tempPrisma = new PrismaClient({
      datasources: {
        db: {
          url: baseUrl,
        },
      },
    });

    try {
      await tempPrisma.$connect();
      await tempPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${dbName}";`);
    } catch (error) {
      console.warn('Failed to drop test database:', error);
    } finally {
      await tempPrisma.$disconnect();
    }
  }

  private async runMigrations(): Promise<void> {
    try {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: this.testDatabaseUrl },
        stdio: 'pipe',
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private extractDatabaseName(url: string): string {
    const parts = url.split('/');
    return parts[parts.length - 1].split('?')[0];
  }
}

// Global setup and teardown for Jest
export const setupTestDatabase = async (): Promise<void> => {
  const dbSetup = DatabaseTestSetup.getInstance();
  await dbSetup.setupDatabase();
};

export const teardownTestDatabase = async (): Promise<void> => {
  const dbSetup = DatabaseTestSetup.getInstance();
  await dbSetup.teardownDatabase();
};

export const cleanTestDatabase = async (): Promise<void> => {
  const dbSetup = DatabaseTestSetup.getInstance();
  await dbSetup.cleanDatabase();
};

export const getTestPrismaClient = (): PrismaClient => {
  const dbSetup = DatabaseTestSetup.getInstance();
  return dbSetup.getPrismaClient();
};