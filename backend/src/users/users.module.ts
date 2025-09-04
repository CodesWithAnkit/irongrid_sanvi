import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RbacService } from './rbac/rbac.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, RbacService, PrismaService],
  exports: [UsersService, RbacService],
})
export class UsersModule {}
