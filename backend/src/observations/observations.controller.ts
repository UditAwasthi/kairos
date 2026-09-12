import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/auth-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { MAX_UPLOAD_BYTES } from './file-validation';
import type { ObservationResponse } from './observation.mapper';
import { ObservationsService } from './observations.service';

@Controller('observations')
@UseGuards(AuthGuard)
export class ObservationsController {
  constructor(private readonly observations: ObservationsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_UPLOAD_BYTES },
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ data: ObservationResponse }> {
    const observation = await this.observations.upload({
      clerkUserId: user.id,
      file,
    });
    return { data: observation };
  }

  @Get()
  async list(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ data: ObservationResponse[] }> {
    const observations = await this.observations.listForClerkUser(user.id);
    return { data: observations };
  }

  @Get(':id')
  async getOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ data: ObservationResponse }> {
    const observation = await this.observations.getForClerkUser(user.id, id);
    return { data: observation };
  }

  @Get(':id/download-url')
  async downloadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    const result = await this.observations.getDownloadUrlForClerkUser(
      user.id,
      id,
    );
    return { data: result };
  }

  @Get(':id/file')
  @Header('Cache-Control', 'private, no-store')
  async file(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const file = await this.observations.getFileForClerkUser(user.id, id);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.filename.replace(/"/g, '')}"`,
    });
    return new StreamableFile(file.buffer);
  }

  @Post(':id/reprocess')
  async reprocess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ data: ObservationResponse }> {
    const observation = await this.observations.reprocessForClerkUser(
      user.id,
      id,
    );
    return { data: observation };
  }
}
