import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProcessingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.types';
import { UsersService } from '../users/users.service';
import { validateUpload } from './file-validation';
import {
  toObservationResponse,
  type ObservationResponse,
} from './observation.mapper';
import { ObservationProcessor } from './observation.processor';

@Injectable()
export class ObservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly processor: ObservationProcessor,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {}

  async upload(params: {
    clerkUserId: string;
    file: Express.Multer.File;
  }): Promise<ObservationResponse> {
    if (!params.file) {
      throw new BadRequestException({
        error: {
          code: 'MISSING_FILE',
          message: 'A file field named "file" is required.',
        },
      });
    }

    const validated = await validateUpload({
      buffer: params.file.buffer,
      originalFilename: params.file.originalname,
      declaredMimeType: params.file.mimetype,
    });

    const user = await this.users.findOrCreateByClerkId(params.clerkUserId);
    const storageKey = buildStorageKey(user.id, validated.safeFilename);

    try {
      await this.storage.upload(
        storageKey,
        params.file.buffer,
        validated.mimeType,
      );
    } catch {
      throw new BadRequestException({
        error: {
          code: 'STORAGE_FAILURE',
          message: 'Failed to store the uploaded file.',
        },
      });
    }

    const observation = await this.prisma.observation.create({
      data: {
        userId: user.id,
        type: validated.observationType,
        originalFilename: validated.safeFilename,
        mimeType: validated.mimeType,
        storageKey,
        fileSizeBytes: params.file.buffer.byteLength,
        processingStatus: ProcessingStatus.PENDING,
        sourceMetadata: {
          clientMimeType: params.file.mimetype ?? null,
        },
      },
    });

    // Fire-and-forget: upload succeeds even if processing later fails.
    setImmediate(() => {
      void this.processor.process(observation.id);
    });

    return toObservationResponse(observation);
  }

  async listForClerkUser(clerkUserId: string): Promise<ObservationResponse[]> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const observations = await this.prisma.observation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return observations.map(toObservationResponse);
  }

  async getForClerkUser(
    clerkUserId: string,
    observationId: string,
  ): Promise<ObservationResponse> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const observation = await this.prisma.observation.findFirst({
      where: {
        id: observationId,
        userId: user.id,
      },
    });

    if (!observation) {
      throw new NotFoundException({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
        },
      });
    }

    return toObservationResponse(observation);
  }
}

function buildStorageKey(userId: string, safeFilename: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `observations/${userId}/${stamp}/${randomUUID()}-${safeFilename}`;
}
