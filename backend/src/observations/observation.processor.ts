import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  EntityType,
  ObservationType,
  Prisma,
  ProcessingStatus,
} from '@prisma/client';
import { AI_PROVIDER, type AIProvider } from '../ai/ai.types';
import { ChunkEmbeddingService } from '../embeddings/chunk-embedding.service';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from '../embeddings/embedding.types';
import { PrismaService } from '../prisma/prisma.service';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.types';
import { chunkText, computeTextStats } from './chunking';
import { ImageExtractor } from './extractors/image.extractor';
import { PdfExtractor } from './extractors/pdf.extractor';
import { TextExtractor } from './extractors/text.extractor';
import type {
  ContentExtractor,
  ExtractionResult,
} from './extractors/extractor.types';
import { normalizeDocumentText } from './normalize';

@Injectable()
export class ObservationProcessor {
  private readonly logger = new Logger(ObservationProcessor.name);
  private readonly extractors: ContentExtractor[];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embeddingProvider: EmbeddingProvider,
    private readonly chunkEmbeddings: ChunkEmbeddingService,
  ) {
    this.extractors = [
      new TextExtractor(),
      new PdfExtractor(),
      new ImageExtractor(),
    ];
  }

  /** Entry point for async processing after upload. Safe to retry. */
  async process(observationId: string): Promise<void> {
    const observation = await this.prisma.observation.findUnique({
      where: { id: observationId },
    });

    if (!observation) {
      this.logger.warn(`Observation ${observationId} not found for processing`);
      return;
    }

    if (observation.processingStatus === ProcessingStatus.COMPLETED) {
      return;
    }

    // Allow retry from FAILED / PENDING / mid-pipeline states.
    if (
      observation.processingStatus === ProcessingStatus.EXTRACTING ||
      observation.processingStatus === ProcessingStatus.NORMALIZING ||
      observation.processingStatus === ProcessingStatus.CHUNKING ||
      observation.processingStatus === ProcessingStatus.ANALYZING ||
      observation.processingStatus === ProcessingStatus.EMBEDDING ||
      observation.processingStatus === ProcessingStatus.PROCESSING
    ) {
      // Continue / reclaim — idempotent replace below.
    }

    try {
      await this.setStatus(observationId, ProcessingStatus.EXTRACTING);
      const buffer = await this.storage.get(observation.storageKey);
      const extracted = await this.extract(
        observation.type,
        observation.mimeType,
        buffer,
      );

      await this.setStatus(observationId, ProcessingStatus.NORMALIZING);
      const normalized = this.normalize(extracted.text);
      const stats = computeTextStats(normalized);
      const pageCount =
        typeof extracted.metadata.pageCount === 'number'
          ? extracted.metadata.pageCount
          : null;

      await this.prisma.observation.update({
        where: { id: observationId },
        data: {
          extractedText: normalized,
          characterCount: stats.characterCount,
          wordCount: stats.wordCount,
          pageCount,
          processingError: null,
          sourceMetadata: {
            ...(typeof observation.sourceMetadata === 'object' &&
            observation.sourceMetadata !== null
              ? (observation.sourceMetadata as Record<string, unknown>)
              : {}),
            extraction: extracted.metadata,
            // Always overwrite so stale "OCR not available" notes do not linger.
            processingNote: extracted.notes ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      await this.setStatus(observationId, ProcessingStatus.CHUNKING);
      const chunks = chunkText(normalized ?? '');
      await this.replaceChunks(observationId, chunks);

      await this.prisma.observation.update({
        where: { id: observationId },
        data: { chunkCount: chunks.length },
      });

      await this.setStatus(observationId, ProcessingStatus.ANALYZING);

      let analysisNote: string | undefined;
      if (!normalized || chunks.length === 0) {
        analysisNote =
          'No extractable text available for summary/topics/entities.';
        await this.clearAnalysisLinks(observationId);
        await this.prisma.observation.update({
          where: { id: observationId },
          data: { summary: null },
        });
      } else if (!this.ai.isConfigured()) {
        analysisNote =
          'AI provider is not configured. Chunks and metadata were saved without summary/topics/entities.';
        await this.clearAnalysisLinks(observationId);
        await this.prisma.observation.update({
          where: { id: observationId },
          data: { summary: null },
        });
      } else {
        try {
          const analysis = await this.ai.analyzeDocument(
            chunks.map((c) => c.content),
          );
          await this.persistAnalysis(
            observationId,
            observation.userId,
            analysis,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'AI analysis failed';
          this.logger.warn(
            `AI analysis failed for ${observationId}: ${message}`,
          );
          analysisNote = `AI analysis skipped: ${toSafeProcessingError(message)}`;
          // Keep extracted text + chunks; do not fail the whole observation.
        }
      }

      const current = await this.prisma.observation.findUnique({
        where: { id: observationId },
      });
      const sourceMetadata = {
        ...(typeof current?.sourceMetadata === 'object' &&
        current.sourceMetadata !== null
          ? current.sourceMetadata
          : {}),
        ...(analysisNote ? { analysisNote } : {}),
        analysisProvider: this.ai.isConfigured() ? this.ai.name : 'none',
        ...(this.ai.isConfigured()
          ? { analysisModel: process.env.AI_MODEL?.trim() || 'gpt-4o-mini' }
          : {}),
      } as Prisma.InputJsonValue;

      await this.prisma.observation.update({
        where: { id: observationId },
        data: {
          sourceMetadata,
        },
      });

      // Embeddings are required for eligible text chunks before COMPLETED.
      if (chunks.length > 0) {
        await this.setStatus(observationId, ProcessingStatus.EMBEDDING);
        if (!this.embeddingProvider.isConfigured()) {
          throw new Error(
            'Embedding provider is not configured. Set EMBEDDING_API_KEY or EMBEDDING_PROVIDER=local.',
          );
        }
        const embedStats =
          await this.chunkEmbeddings.embedMissingChunks(observationId);
        await this.prisma.observation.update({
          where: { id: observationId },
          data: {
            sourceMetadata: {
              ...(typeof sourceMetadata === 'object' && sourceMetadata !== null
                ? (sourceMetadata as Record<string, unknown>)
                : {}),
              embeddingProvider: this.embeddingProvider.name,
              embeddingModel: this.embeddingProvider.model,
              embeddingDimensions: this.embeddingProvider.dimensions,
              embeddingsCreated: embedStats.newlyEmbedded,
              embeddingsReused: embedStats.alreadyEmbedded,
            },
          },
        });
      }

      await this.prisma.observation.update({
        where: { id: observationId },
        data: {
          processingStatus: ProcessingStatus.COMPLETED,
          processingError: null,
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
    return normalizeDocumentText(text);
  }

  /** Explicit embedding stage entry (used by pipeline). */
  async embed(observationId: string): Promise<void> {
    await this.chunkEmbeddings.embedMissingChunks(observationId);
  }

  private async setStatus(
    observationId: string,
    status: ProcessingStatus,
  ): Promise<void> {
    await this.prisma.observation.update({
      where: { id: observationId },
      data: { processingStatus: status, processingError: null },
    });
  }

  private async replaceChunks(
    observationId: string,
    chunks: ReturnType<typeof chunkText>,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.observationChunk.deleteMany({ where: { observationId } });
      if (chunks.length === 0) return;
      await tx.observationChunk.createMany({
        data: chunks.map((chunk) => ({
          observationId,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
        })),
      });
    });
  }

  private async clearAnalysisLinks(observationId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.observationTopic.deleteMany({ where: { observationId } }),
      this.prisma.observationEntity.deleteMany({ where: { observationId } }),
    ]);
  }

  private async persistAnalysis(
    observationId: string,
    userId: string,
    analysis: {
      summary: string;
      topics: Array<{ name: string; confidence?: number }>;
      entities: Array<{
        name: string;
        type: keyof typeof EntityType;
        confidence?: number;
      }>;
      provider: string;
      model: string;
    },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.observationTopic.deleteMany({ where: { observationId } });
      await tx.observationEntity.deleteMany({ where: { observationId } });

      await tx.observation.update({
        where: { id: observationId },
        data: {
          summary: analysis.summary,
        },
      });

      for (const topic of analysis.topics) {
        const normalizedName = normalizeLabel(topic.name);
        const saved = await tx.topic.upsert({
          where: {
            userId_normalizedName: { userId, normalizedName },
          },
          create: {
            userId,
            name: topic.name.trim(),
            normalizedName,
          },
          update: {
            name: topic.name.trim(),
          },
        });
        await tx.observationTopic.create({
          data: {
            observationId,
            topicId: saved.id,
            confidence: topic.confidence ?? null,
          },
        });
      }

      for (const entity of analysis.entities) {
        const normalizedName = normalizeLabel(entity.name);
        const type = EntityType[entity.type];
        const saved = await tx.entity.upsert({
          where: {
            userId_normalizedName_type: {
              userId,
              normalizedName,
              type,
            },
          },
          create: {
            userId,
            name: entity.name.trim(),
            normalizedName,
            type,
          },
          update: {
            name: entity.name.trim(),
          },
        });
        await tx.observationEntity.create({
          data: {
            observationId,
            entityId: saved.id,
            confidence: entity.confidence ?? null,
          },
        });
      }
    });
  }
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 120);
}

function toSafeProcessingError(message: string): string {
  const cleaned = message.replace(/\s+/g, ' ').trim().slice(0, 500);
  if (/stack|ECONNREFUSED|ENOENT|secret|token|api[_-]?key/i.test(cleaned)) {
    return 'Processing failed while understanding the document.';
  }
  return cleaned || 'Processing failed.';
}
