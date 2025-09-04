import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { S3PresignedService } from './s3-presigned.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FilesController],
  providers: [FilesService, S3PresignedService, PrismaService],
  exports: [FilesService],
})
export class FilesModule {}
