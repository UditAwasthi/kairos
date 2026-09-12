import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ObservationType, ProcessingStatus } from '@prisma/client';
import { ObservationsService } from './observations.service';
import { MAX_UPLOAD_BYTES } from './file-validation';

describe('ObservationsService', () => {
  const clerkUserId = 'clerk_user_a';

  let prisma: {
    observation: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };
  let storage: {
    upload: jest.Mock;
    get: jest.Mock;
    delete: jest.Mock;
    exists: jest.Mock;
    getSignedDownloadUrl: jest.Mock;
  };
  let processor: { process: jest.Mock };
  let users: { findOrCreateByClerkId: jest.Mock };
  let service: ObservationsService;

  const userA = { id: 'user_a', clerkUserId };

  function baseObservation(overrides: Record<string, unknown> = {}) {
    const now = new Date();
    return {
      id: 'obs_1',
      userId: userA.id,
      type: ObservationType.TEXT,
      originalFilename: 'notes.txt',
      mimeType: 'text/plain',
      storageKey: 'observations/user_a/x/notes.txt',
      fileSizeBytes: 26,
      processingStatus: ProcessingStatus.PENDING,
      extractedText: null,
      summary: null,
      processingError: null,
      sourceMetadata: {},
      pageCount: null,
      characterCount: null,
      wordCount: null,
      chunkCount: null,
      capturedAt: now,
      createdAt: now,
      updatedAt: now,
      observationTopics: [],
      observationEntities: [],
      _count: { chunks: 0 },
      ...overrides,
    };
  }

  beforeEach(() => {
    prisma = {
      observation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };
    storage = {
      upload: jest
        .fn()
        .mockResolvedValue({ key: 'k', size: 1, contentType: 'text/plain' }),
      get: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn().mockResolvedValue(true),
      getSignedDownloadUrl: jest.fn().mockRejectedValue(new Error('local')),
    };
    processor = { process: jest.fn().mockResolvedValue(undefined) };
    users = {
      findOrCreateByClerkId: jest.fn(() => Promise.resolve(userA)),
    };

    service = new ObservationsService(
      prisma as never,
      users as never,
      processor as never,
      storage,
    );
  });

  function txtFile(
    overrides?: Partial<Express.Multer.File>,
  ): Express.Multer.File {
    const content = Buffer.from('Hello Kairos memory capture');
    return {
      fieldname: 'file',
      originalname: 'notes.txt',
      encoding: '7bit',
      mimetype: 'text/plain',
      size: content.byteLength,
      buffer: content,
      destination: '',
      filename: '',
      path: '',
      stream: undefined as never,
      ...overrides,
    };
  }

  it('creates an observation for an authenticated upload', async () => {
    prisma.observation.create.mockResolvedValue(baseObservation());

    const result = await service.upload({
      clerkUserId,
      file: txtFile(),
    });

    expect(result.id).toBe('obs_1');
    expect(result.status).toBe(ProcessingStatus.PENDING);
    expect(storage.upload).toHaveBeenCalled();
    await new Promise((r) => setImmediate(r));
    expect(processor.process).toHaveBeenCalledWith('obs_1');
  });

  it('rejects unsupported files', async () => {
    await expect(
      service.upload({
        clerkUserId,
        file: txtFile({
          originalname: 'malware.exe',
          mimetype: 'application/octet-stream',
          buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]),
        }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized files', async () => {
    const huge = Buffer.alloc(MAX_UPLOAD_BYTES + 1, 0x61);
    await expect(
      service.upload({
        clerkUserId,
        file: txtFile({
          originalname: 'big.txt',
          mimetype: 'text/plain',
          buffer: huge,
          size: huge.byteLength,
        }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents access to another user observation', async () => {
    prisma.observation.findFirst.mockResolvedValue(null);

    await expect(
      service.getForClerkUser(clerkUserId, 'obs_other'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.observation.findFirst).toHaveBeenCalledWith({
      where: { id: 'obs_other', userId: userA.id },
      include: expect.any(Object),
    });
  });

  it('requires ownership for original file access', async () => {
    prisma.observation.findFirst.mockResolvedValue(null);
    await expect(
      service.getFileForClerkUser(clerkUserId, 'obs_other'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.get).not.toHaveBeenCalled();
  });
});
