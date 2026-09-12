export type OcrConfig = {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl: string;
};

export type OcrResult = {
  text: string;
  provider: string;
  model: string;
};

export interface OcrProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  extractText(buffer: Buffer, mimeType: string): Promise<OcrResult>;
}

export function readOcrConfig(): OcrConfig {
  const provider = (process.env.OCR_PROVIDER ?? 'gemini').toLowerCase();
  // gemini-2.0-flash was shut down 2026-06-01; prefer a current Flash multimodal model.
  const defaultModel = 'gemini-2.5-flash';

  return {
    provider,
    model: process.env.OCR_MODEL?.trim() || defaultModel,
    apiKey:
      process.env.OCR_API_KEY?.trim() ||
      process.env.EMBEDDING_API_KEY?.trim() ||
      undefined,
    baseUrl: (
      process.env.OCR_BASE_URL?.trim() ||
      process.env.EMBEDDING_BASE_URL?.trim() ||
      'https://generativelanguage.googleapis.com'
    ).replace(/\/+$/, ''),
  };
}

/** Inline multimodal requests get large once base64-encoded; stay under ~12MB raw. */
export const OCR_MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export const OCR_SUPPORTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
