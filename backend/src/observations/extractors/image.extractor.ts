import { ObservationType } from '@prisma/client';
import type { ContentExtractor, ExtractionResult } from './extractor.types';

/**
 * Image extraction for v1: metadata only.
 * OCR is intentionally deferred — do not invent extracted text.
 */
export class ImageExtractor implements ContentExtractor {
  supports(type: ObservationType, mimeType: string): boolean {
    return type === ObservationType.IMAGE || mimeType.startsWith('image/');
  }

  extract(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
    return Promise.resolve({
      text: null,
      metadata: {
        mimeType,
        byteLength: buffer.byteLength,
        ocrAvailable: false,
      },
      notes:
        'OCR is not yet available. Image metadata was stored without text extraction.',
    });
  }
}
