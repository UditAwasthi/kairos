import type { ObservationType } from '@prisma/client';

export type ExtractionResult = {
  text: string | null;
  metadata: Record<string, unknown>;
  notes?: string;
};

export interface ContentExtractor {
  supports(type: ObservationType, mimeType: string): boolean;
  extract(buffer: Buffer, mimeType: string): Promise<ExtractionResult>;
}

export function normalizeExtractedText(text: string | null): string | null {
  if (text == null) return null;
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return normalized.length > 0 ? normalized : null;
}
