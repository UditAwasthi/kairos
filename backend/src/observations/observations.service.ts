import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ObservationType, Prisma, ProcessingStatus } from '@prisma/client';
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
import { fetchUrlContent } from './url-ingest';

const observationInclude = {
  observationTopics: { include: { topic: true } },
  observationEntities: { include: { entity: true } },
  projectObservations: { include: { project: true } },
  _count: { select: { chunks: true } },
} as const;

const MAX_NOTE_CHARS = 100_000;

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

  async createFromText(params: {
    clerkUserId: string;
    text: string;
    title?: string;
  }): Promise<ObservationResponse> {
    const text = params.text?.trim() ?? '';
    if (!text) {
      throw new BadRequestException({
        error: {
          code: 'MISSING_TEXT',
          message: 'Note text is required.',
        },
      });
    }
    if (text.length > MAX_NOTE_CHARS) {
      throw new BadRequestException({
        error: {
          code: 'TEXT_TOO_LARGE',
          message: 'Note text is too long.',
        },
      });
    }

    const title = (params.title?.trim() || text.slice(0, 48)).slice(0, 80);
    const safeFilename = `${slugFilename(title)}.txt`;
    const buffer = Buffer.from(text, 'utf8');
    return this.createStoredObservation({
      clerkUserId: params.clerkUserId,
      buffer,
      mimeType: 'text/plain',
      observationType: ObservationType.TEXT,
      safeFilename,
      sourceMetadata: {
        captureKind: 'note',
        title,
      },
    });
  }

  async createFromUrl(params: {
    clerkUserId: string;
    url: string;
  }): Promise<ObservationResponse> {
    const fetched = await fetchUrlContent(params.url);
    const body = `${fetched.title}\nSource: ${fetched.url}\n\n${fetched.text}`;
    const buffer = Buffer.from(body, 'utf8');
    const safeFilename = `${slugFilename(fetched.title)}.txt`;
    return this.createStoredObservation({
      clerkUserId: params.clerkUserId,
      buffer,
      mimeType: 'text/plain',
      observationType: ObservationType.TEXT,
      safeFilename,
      sourceMetadata: {
        captureKind: 'url',
        sourceUrl: fetched.url,
        title: fetched.title,
        fetchedContentType: fetched.contentType,
      },
    });
  }

  async deleteForClerkUser(
    clerkUserId: string,
    observationId: string,
  ): Promise<void> {
    const observation = await this.findOwned(clerkUserId, observationId);
    const storageKey = observation.storageKey;
    await this.prisma.observation.delete({ where: { id: observation.id } });
    try {
      await this.storage.delete(storageKey);
    } catch {
      // DB row is gone; storage cleanup is best-effort.
    }
  }

  private async createStoredObservation(params: {
    clerkUserId: string;
    buffer: Buffer;
    mimeType: string;
    observationType: ObservationType;
    safeFilename: string;
    sourceMetadata: Prisma.InputJsonValue;
  }): Promise<ObservationResponse> {
    const user = await this.users.findOrCreateByClerkId(params.clerkUserId);
    const storageKey = buildStorageKey(user.id, params.safeFilename);

    try {
      await this.storage.upload(storageKey, params.buffer, params.mimeType);
    } catch {
      throw new BadRequestException({
        error: {
          code: 'STORAGE_FAILURE',
          message: 'Failed to store the observation.',
        },
      });
    }

    const observation = await this.prisma.observation.create({
      data: {
        userId: user.id,
        type: params.observationType,
        originalFilename: params.safeFilename,
        mimeType: params.mimeType,
        storageKey,
        fileSizeBytes: params.buffer.byteLength,
        processingStatus: ProcessingStatus.PENDING,
        sourceMetadata: params.sourceMetadata,
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

function slugFilename(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'note';
}
