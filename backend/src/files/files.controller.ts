import { Controller, Get, Param, ParseIntPipe, Res, NotFoundException, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { FilesService } from './files.service';

@Controller('files')
@UseGuards(AuthGuard('jwt'))
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Get(':id')
  async download(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const file = await this.files.getFileRecord(id.toString());
    if (!file) throw new NotFoundException('File not found');

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
    const stream = this.files.createReadStream(file.key);
    stream.on('error', () => res.status(404).end());
    stream.pipe(res);
  }
}
