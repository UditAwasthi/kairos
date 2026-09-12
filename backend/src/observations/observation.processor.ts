import { Inject, Injectable, Logger } from '@nestjs/common';
import { ObservationType, Prisma, ProcessingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.types';
import { ImageExtractor } from './extractors/image.extractor';
import { PdfExtractor } from './extractors/pdf.extractor';
import { TextExtractor } from './extractors/text.extractor';
import {
  normalizeExtractedText,
  type ContentExtractor,
  type ExtractionResult,
} from './extractors/extractor.types';

@Injectable()
export class ObservationProcessor {
  private readonly logger = new Logger(ObservationProcessor.name);
  private readonly extractors: ContentExtractor[];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
  ) {
    this.extractors = [
      new TextExtractor(),
      new PdfExtractor(),
      new ImageExtractor(),
    ];
  }

  /** Entry point for async processing after upload. */
  async process(observationId: string): Promise<void> {
    const observation = await this.prisma.observation.findUnique({
      where: { id: observationId },
    });

    if (!observation) {
      this.logger.warn(`Observation ${observationId} not found for processing`);
      return;
    }

    if (
      observation.processingStatus === ProcessingStatus.COMPLETED ||
      observation.processingStatus === ProcessingStatus.PROCESSING
    ) {
      return;
    }

    await this.prisma.observation.update({
      where: { id: observationId },
      data: {
        processingStatus: ProcessingStatus.PROCESSING,
        processingError: null,
      },
    });

    try {
      const buffer = await this.storage.get(observation.storageKey);
      const extracted = await this.extract(
        observation.type,
        observation.mimeType,
        buffer,
      );
      const normalized = this.normalize(extracted.text);
      // Future hooks (intentionally no-ops for this vertical slice):
      await this.analyze(normalized);
      await this.summarize(normalized);
      await this.embed(normalized);

      const sourceMetadata = {
        ...(typeof observation.sourceMetadata === 'object' &&
        observation.sourceMetadata !== null
          ? observation.sourceMetadata
          : {}),
        extraction: extracted.metadata,
        ...(extracted.notes ? { processingNote: extracted.notes } : {}),
      } as Prisma.InputJsonValue;

      await this.prisma.observation.update({
        where: { id: observationId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          extractedText: normalized,
          processingError: null,
          sourceMetadata,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Processing failed';
      this.logger.error(
        `Processing failed for observation ${observationId}: ${message}`,
      );

      await this.prisma.observation.update({
        where: { id: observationId },
        data: {
          processingStatus: ProcessingStatus.FAILED,
          processingError: toSafeProcessingError(message),
        },
      });
    }
  }

  async extract(
    type: ObservationType,
    mimeType: string,
    buffer: Buffer,
  ): Promise<ExtractionResult> {
    const extractor = this.extractors.find((item) =>
      item.supports(type, mimeType),
    );
    if (!extractor) {
      throw new Error(`No extractor for type=${type} mime=${mimeType}`);
    }
    return extractor.extract(buffer, mimeType);
  }

  normalize(text: string | null): string | null {
    return normalizeExtractedText(text);
  }

  /** Future: entity extraction / classification. */
  analyze(_text: string | null): Promise<void> {
    void _text;
    return Promise.resolve();
  }

  /** Future: summarization. */
  summarize(_text: string | null): Promise<void> {
    void _text;
    return Promise.resolve();
  }

  /** Future: embeddings. */
  embed(_text: string | null): Promise<void> {
    void _text;
    return Promise.resolve();
  }
}

function toSafeProcessingError(message: string): string {
  const cleaned = message.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (/stack|ECONNREFUSED|ENOENT|secret|token/i.test(cleaned)) {
    return 'Processing failed while extracting content from the file.';
  }
  return cleaned || 'Processing failed.';
}
