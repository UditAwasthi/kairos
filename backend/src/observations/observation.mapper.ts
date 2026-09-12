import type {
  Entity,
  EntityType,
  Observation,
  ObservationType,
  ProcessingStatus,
  Topic,
} from '@prisma/client';

export type ObservationTopicResponse = {
  id: string;
  name: string;
  confidence: number | null;
};

export type ObservationEntityResponse = {
  id: string;
  name: string;
  type: EntityType;
  confidence: number | null;
};

export type ObservationMetadataResponse = {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number | null;
  characterCount: number | null;
  wordCount: number | null;
  chunkCount: number | null;
};

export type ObservationResponse = {
  id: string;
  filename: string;
  mimeType: string;
  type: ObservationType;
  status: ProcessingStatus;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  extractedText: string | null;
  summary: string | null;
  processingError: string | null;
  sourceMetadata: Record<string, unknown> | null;
  metadata: ObservationMetadataResponse;
  topics: ObservationTopicResponse[];
  entities: ObservationEntityResponse[];
  chunkCount: number;
};

type ObservationWithRelations = Observation & {
  observationTopics?: Array<{
    confidence: number | null;
    topic: Topic;
  }>;
  observationEntities?: Array<{
    confidence: number | null;
    entity: Entity;
  }>;
  _count?: { chunks?: number };
};

export function toObservationResponse(
  observation: ObservationWithRelations,
): ObservationResponse {
  const topics = (observation.observationTopics ?? []).map((row) => ({
    id: row.topic.id,
    name: row.topic.name,
    confidence: row.confidence,
  }));
  const entities = (observation.observationEntities ?? []).map((row) => ({
    id: row.entity.id,
    name: row.entity.name,
    type: row.entity.type,
    confidence: row.confidence,
  }));

  return {
    id: observation.id,
    filename: observation.originalFilename,
    mimeType: observation.mimeType,
    type: observation.type,
    status: observation.processingStatus,
    createdAt: observation.createdAt.toISOString(),
    updatedAt: observation.updatedAt.toISOString(),
    capturedAt: observation.capturedAt.toISOString(),
    extractedText: observation.extractedText,
    summary: observation.summary,
    processingError: observation.processingError,
    sourceMetadata:
      observation.sourceMetadata &&
      typeof observation.sourceMetadata === 'object'
        ? (observation.sourceMetadata as Record<string, unknown>)
        : null,
    metadata: {
      filename: observation.originalFilename,
      mimeType: observation.mimeType,
      fileSizeBytes: observation.fileSizeBytes,
      pageCount: observation.pageCount,
      characterCount: observation.characterCount,
      wordCount: observation.wordCount,
      chunkCount: observation.chunkCount,
    },
    topics,
    entities,
    chunkCount: observation.chunkCount ?? observation._count?.chunks ?? 0,
  };
}
