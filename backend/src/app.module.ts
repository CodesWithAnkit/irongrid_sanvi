import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import jwtConfig from './config/jwt.config';
import awsConfig from './config/aws.config';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { QuotationsModule } from './quotations/quotations.module';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { InvoicesModule } from './invoices/invoices.module';
import { UsersModule } from './users/users.module';
import { FilesModule } from './files/files.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PdfModule } from './pdf/pdf.module';
import { EmailModule } from './email/email.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DatabaseModule } from './common/database.module';
import { CacheModule } from './common/cache.module';
import { BullModule } from '@nestjs/bull';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { DatabaseAdminController } from './common/controllers/database-admin.controller';
import { CacheAdminController } from './common/controllers/cache-admin.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfig, redisConfig, jwtConfig, awsConfig] }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: 6379,
        password: process.env.REDIS_PASSWORD,
      },
    }),
    AuthModule,
    QuotationsModule,
    CustomersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    InvoicesModule,
    UsersModule,
    FilesModule,
    NotificationsModule,
    PdfModule,
    EmailModule,
    AnalyticsModule,
    DatabaseModule,
    CacheModule,
  ],
  controllers: [AppController, DatabaseAdminController, CacheAdminController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware, RateLimitMiddleware)
      .forRoutes('*');
  }
}
