import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProcessingStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  STORAGE_SERVICE,
  type SignedDownload,
  type StorageService,
} from '../storage/storage.types';
import { UsersService } from '../users/users.service';
import { validateUpload } from './file-validation';
import {
  toObservationResponse,
  type ObservationResponse,
} from './observation.mapper';
import { ObservationProcessor } from './observation.processor';
import {
  resolveEntityFilter,
  resolveProjectFilter,
  resolveTopicFilter,
} from '../metadata/resolve-filters';

const observationInclude = {
  observationTopics: { include: { topic: true } },
  observationEntities: { include: { entity: true } },
  projectObservations: { include: { project: true } },
  _count: { select: { chunks: true } },
} as const;

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
      include: observationInclude,
    });

    setImmediate(() => {
      void this.processor.process(observation.id);
    });

    return toObservationResponse(observation);
  }

  async listForClerkUser(
    clerkUserId: string,
    filters?: {
      topicId?: string;
      entityId?: string;
      projectId?: string;
      topic?: string;
      entity?: string;
    },
  ): Promise<ObservationResponse[]> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const topicId = await resolveTopicFilter({
      prisma: this.prisma,
      userId: user.id,
      topicId: filters?.topicId,
      topic: filters?.topic,
    });
    const entityId = await resolveEntityFilter({
      prisma: this.prisma,
      userId: user.id,
      entityId: filters?.entityId,
      entity: filters?.entity,
    });
    const projectId = await resolveProjectFilter({
      prisma: this.prisma,
      userId: user.id,
      projectId: filters?.projectId,
    });

    const observations = await this.prisma.observation.findMany({
      where: {
        userId: user.id,
        ...(topicId ? { observationTopics: { some: { topicId } } } : {}),
        ...(entityId ? { observationEntities: { some: { entityId } } } : {}),
        ...(projectId ? { projectObservations: { some: { projectId } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: observationInclude,
    });
    return observations.map(toObservationResponse);
  }

  async getForClerkUser(
    clerkUserId: string,
    observationId: string,
  ): Promise<ObservationResponse> {
    const observation = await this.findOwned(clerkUserId, observationId);
    return toObservationResponse(observation);
  }

  async getFileForClerkUser(
    clerkUserId: string,
    observationId: string,
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const observation = await this.findOwned(clerkUserId, observationId);
    const exists = await this.storage.exists(observation.storageKey);
    if (!exists) {
      throw new NotFoundException({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'The original file could not be found in storage.',
        },
      });
    }
    const buffer = await this.storage.get(observation.storageKey);
    return {
      buffer,
      mimeType: observation.mimeType,
      filename: observation.originalFilename,
    };
  }

  async getDownloadUrlForClerkUser(
    clerkUserId: string,
    observationId: string,
  ): Promise<SignedDownload & { mode: 'signed' | 'stream' }> {
    const observation = await this.findOwned(clerkUserId, observationId);
    try {
      const signed = await this.storage.getSignedDownloadUrl(
        observation.storageKey,
        300,
      );
      return { ...signed, mode: 'signed' };
    } catch {
      return {
        url: `/observations/${observation.id}/file`,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
        mode: 'stream',
      };
    }
  }

  async reprocessForClerkUser(
    clerkUserId: string,
    observationId: string,
  ): Promise<ObservationResponse> {
    const observation = await this.findOwned(clerkUserId, observationId);
    await this.prisma.observation.update({
      where: { id: observation.id },
      data: {
        processingStatus: ProcessingStatus.PENDING,
        processingError: null,
      },
    });
    setImmediate(() => {
      void this.processor.process(observation.id);
    });
    const refreshed = await this.findOwned(clerkUserId, observationId);
    return toObservationResponse(refreshed);
  }

  private async findOwned(clerkUserId: string, observationId: string) {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const observation = await this.prisma.observation.findFirst({
      where: {
        id: observationId,
        userId: user.id,
      },
      include: observationInclude,
    });

    if (!observation) {
      throw new NotFoundException({
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'The requested resource was not found.',
        },
      });
    }

    return observation;
  }
}

function buildStorageKey(userId: string, safeFilename: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `observations/${userId}/${stamp}/${randomUUID()}-${safeFilename}`;
}
