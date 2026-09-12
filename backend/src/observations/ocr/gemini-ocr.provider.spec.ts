import { normalizeGeminiOcrBaseUrl } from './gemini-ocr.provider';
import { readOcrConfig } from './ocr.types';

describe('OCR helpers', () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it('normalizes Gemini OCR base URL to v1beta', () => {
    expect(
      normalizeGeminiOcrBaseUrl('https://generativelanguage.googleapis.com'),
    ).toBe('https://generativelanguage.googleapis.com/v1beta');
  });

  it('reads OCR config with embedding key fallback', () => {
    delete process.env.OCR_API_KEY;
    process.env.EMBEDDING_API_KEY = 'test-key';
    process.env.OCR_PROVIDER = 'gemini';
    const config = readOcrConfig();
    expect(config.provider).toBe('gemini');
    expect(config.apiKey).toBe('test-key');
    expect(config.model).toBe('gemini-2.0-flash');
  });
});
