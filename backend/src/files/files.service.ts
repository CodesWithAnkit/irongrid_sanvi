import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(private prisma: PrismaService) {}

  async saveBuffer(buffer: Buffer, originalName: string, mimeType: string) {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filename = `${Date.now()}_${safeName}`;
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, buffer);

    const stats = await fs.stat(filePath);
    const key = `uploads/${filename}`;

    const file = await this.prisma.file.create({
      data: {
        key,
        originalName: originalName,
        mimeType,
        size: stats.size,
      },
    });

    return file;
  }

  async getFileRecord(id: string) {
    return this.prisma.file.findUnique({ where: { id } });
  }

  createReadStream(key: string) {
    const filePath = path.join(process.cwd(), key);
    return fsSync.createReadStream(filePath);
  }
}
