import type {
  Observation,
  ObservationType,
  ProcessingStatus,
} from '@prisma/client';

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
  processingError: string | null;
  sourceMetadata: Record<string, unknown> | null;
};

export function toObservationResponse(
  observation: Observation,
): ObservationResponse {
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
    processingError: observation.processingError,
    sourceMetadata:
      observation.sourceMetadata &&
      typeof observation.sourceMetadata === 'object'
        ? (observation.sourceMetadata as Record<string, unknown>)
        : null,
  };
}
