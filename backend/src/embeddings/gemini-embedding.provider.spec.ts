import {
  normalizeGeminiBaseUrl,
  normalizeGeminiModel,
} from './gemini-embedding.provider';

describe('GeminiEmbeddingProvider helpers', () => {
  it('normalizes model ids', () => {
    expect(normalizeGeminiModel('models/gemini-embedding-001')).toBe(
      'gemini-embedding-001',
    );
    expect(normalizeGeminiModel('gemini-embedding-001')).toBe(
      'gemini-embedding-001',
    );
  });

  it('normalizes base URLs to v1beta', () => {
    expect(
      normalizeGeminiBaseUrl('https://generativelanguage.googleapis.com'),
    ).toBe('https://generativelanguage.googleapis.com/v1beta');
    expect(
      normalizeGeminiBaseUrl('https://generativelanguage.googleapis.com/v1beta'),
    ).toBe('https://generativelanguage.googleapis.com/v1beta');
  });
});
