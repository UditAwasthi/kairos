import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ObservationType, ProcessingStatus } from '@prisma/client';
import { ObservationsService } from './observations.service';
import { ObservationProcessor } from './observation.processor';
import { MAX_UPLOAD_BYTES } from './file-validation';

describe('ObservationsService', () => {
  const clerkUserId = 'clerk_user_a';
  const otherClerkUserId = 'clerk_user_b';

  let prisma: {
    user: { upsert: jest.Mock };
    observation: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let storage: { upload: jest.Mock; get: jest.Mock; delete: jest.Mock };
  let processor: { process: jest.Mock };
  let users: { findOrCreateByClerkId: jest.Mock };
  let service: ObservationsService;

  const userA = { id: 'user_a', clerkUserId };
  const userB = { id: 'user_b', clerkUserId: otherClerkUserId };

  beforeEach(() => {
    prisma = {
      user: { upsert: jest.fn() },
      observation: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    storage = {
      upload: jest
        .fn()
        .mockResolvedValue({ key: 'k', size: 1, contentType: 'text/plain' }),
      get: jest.fn(),
      delete: jest.fn(),
    };
    processor = { process: jest.fn().mockResolvedValue(undefined) };
    users = {
      findOrCreateByClerkId: jest.fn((id: string) =>
        Promise.resolve(id === clerkUserId ? userA : userB),
      ),
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
    const now = new Date();
    prisma.observation.create.mockResolvedValue({
      id: 'obs_1',
      userId: userA.id,
      type: ObservationType.TEXT,
      originalFilename: 'notes.txt',
      mimeType: 'text/plain',
      storageKey: 'observations/user_a/x/notes.txt',
      fileSizeBytes: 26,
      processingStatus: ProcessingStatus.PENDING,
      extractedText: null,
      processingError: null,
      sourceMetadata: {},
      capturedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const result = await service.upload({
      clerkUserId,
      file: txtFile(),
    });

    expect(result.id).toBe('obs_1');
    expect(result.status).toBe(ProcessingStatus.PENDING);
    expect(storage.upload).toHaveBeenCalled();
    expect(prisma.observation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: userA.id,
          processingStatus: ProcessingStatus.PENDING,
          mimeType: 'text/plain',
        }) as Record<string, unknown>,
      }) as Record<string, unknown>,
    );

    // Allow setImmediate to flush
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
    });
  });
});

describe('ObservationProcessor', () => {
  it('saves extracted text and marks COMPLETED', async () => {
    const prisma = {
      observation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'obs_1',
          type: ObservationType.TEXT,
          mimeType: 'text/plain',
          storageKey: 'k',
          processingStatus: ProcessingStatus.PENDING,
          sourceMetadata: {},
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const storage = {
      upload: jest.fn(),
      get: jest.fn().mockResolvedValue(Buffer.from('  hello\r\n\r\nworld  ')),
      delete: jest.fn(),
    };

    const processor = new ObservationProcessor(prisma as never, storage);

    await processor.process('obs_1');

    expect(prisma.observation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'obs_1' },
        data: expect.objectContaining({
          processingStatus: ProcessingStatus.PROCESSING,
        }),
      }),
    );

    expect(prisma.observation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'obs_1' },
        data: expect.objectContaining({
          processingStatus: ProcessingStatus.COMPLETED,
          extractedText: 'hello\n\nworld',
        }),
      }),
    );
  });

  it('marks FAILED when extraction throws', async () => {
    const prisma = {
      observation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'obs_fail',
          type: ObservationType.PDF,
          mimeType: 'application/pdf',
          storageKey: 'k',
          processingStatus: ProcessingStatus.PENDING,
          sourceMetadata: {},
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const storage = {
      upload: jest.fn(),
      get: jest.fn().mockRejectedValue(new Error('disk exploded')),
      delete: jest.fn(),
    };

    const processor = new ObservationProcessor(prisma as never, storage);

    await processor.process('obs_fail');

    expect(prisma.observation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'obs_fail' },
        data: expect.objectContaining({
          processingStatus: ProcessingStatus.FAILED,
          processingError: expect.any(String),
        }),
      }),
    );
  });

  it('completes images without fabricated OCR text', async () => {
    const prisma = {
      observation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'obs_img',
          type: ObservationType.IMAGE,
          mimeType: 'image/png',
          storageKey: 'k',
          processingStatus: ProcessingStatus.PENDING,
          sourceMetadata: {},
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const storage = {
      upload: jest.fn(),
      get: jest.fn().mockResolvedValue(Buffer.from([0x89, 0x50, 0x4e, 0x47])),
      delete: jest.fn(),
    };

    const processor = new ObservationProcessor(prisma as never, storage);

    await processor.process('obs_img');

    expect(prisma.observation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          processingStatus: ProcessingStatus.COMPLETED,
          extractedText: null,
        }),
      }),
    );
  });
});
