import { Injectable, Logger } from '@nestjs/common';
import {
  readEmbeddingConfig,
  type EmbeddingProvider,
  type EmbeddingResult,
} from './embedding.types';
import { validateEmbeddingVector } from './embedding.validation';

/**
 * Google Gemini embedding API (not OpenAI-compatible).
 * POST .../v1beta/models/{model}:embedContent | :batchEmbedContents
 */
@Injectable()
export class GeminiEmbeddingProvider implements EmbeddingProvider {
  readonly name = 'gemini';
  readonly model: string;
  readonly dimensions: number;
  private readonly logger = new Logger(GeminiEmbeddingProvider.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly maxRetries: number;

  constructor() {
    const config = readEmbeddingConfig();
    this.model = normalizeGeminiModel(config.model);
    this.dimensions = config.dimensions;
    this.apiKey = config.apiKey;
    this.baseUrl = normalizeGeminiBaseUrl(config.baseUrl);
    this.maxRetries = config.maxRetries;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async embedText(text: string): Promise<EmbeddingResult> {
    const [result] = await this.embedTexts([text]);
    return result;
  }

  async embedTexts(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.isConfigured()) {
      throw new Error('Embedding provider is not configured');
    }
    if (texts.length === 0) {
      return [];
    }

    const vectors = await this.requestWithRetry(texts);
    if (vectors.length !== texts.length) {
      throw new Error('Embedding provider returned unexpected batch size');
    }

    return vectors.map((embedding) => ({
      embedding: validateEmbeddingVector(embedding, this.dimensions),
      model: this.model,
      dimensions: this.dimensions,
    }));
  }

  private async requestWithRetry(texts: string[]): Promise<number[][]> {
    let attempt = 0;
    let lastError: Error | undefined;

    while (attempt <= this.maxRetries) {
      try {
        return await this.requestOnce(texts);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const retryable = isRetryableEmbeddingError(lastError);
        if (!retryable || attempt === this.maxRetries) {
          throw lastError;
        }
        const delayMs = Math.min(1000 * 2 ** attempt, 8000);
        this.logger.warn(
          `Gemini embedding failed (attempt ${attempt + 1}/${this.maxRetries + 1}): ${lastError.message}. Retrying in ${delayMs}ms`,
        );
        await sleep(delayMs);
        attempt += 1;
      }
    }

    throw lastError ?? new Error('Embedding request failed');
  }

  private async requestOnce(texts: string[]): Promise<number[][]> {
    if (texts.length === 1) {
      return [await this.embedOne(texts[0])];
    }
    return this.embedBatch(texts);
  }

  private async embedOne(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:embedContent`;
    const response = await this.fetchJson(url, {
      model: `models/${this.model}`,
      content: { parts: [{ text }] },
      outputDimensionality: this.dimensions,
    });

    const values = (response as { embedding?: { values?: unknown } }).embedding
      ?.values;
    if (!Array.isArray(values)) {
      throw new Error('Gemini embedding response missing values');
    }
    return values as number[];
  }

  private async embedBatch(texts: string[]): Promise<number[][]> {
    const url = `${this.baseUrl}/models/${encodeURIComponent(this.model)}:batchEmbedContents`;
    const response = await this.fetchJson(url, {
      requests: texts.map((text) => ({
        model: `models/${this.model}`,
        content: { parts: [{ text }] },
        outputDimensionality: this.dimensions,
      })),
    });

    const embeddings = (response as { embeddings?: Array<{ values?: unknown }> })
      .embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== texts.length) {
      throw new Error('Gemini batch embedding response size mismatch');
    }

    return embeddings.map((item, index) => {
      if (!Array.isArray(item.values)) {
        throw new Error(`Gemini batch embedding missing values at index ${index}`);
      }
      return item.values as number[];
    });
  }

  private async fetchJson(
    url: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey!,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (response.status === 429) {
        throw new Error('Embedding rate limit exceeded');
      }
      if (!response.ok) {
        let detail = '';
        try {
          const errBody = (await response.json()) as {
            error?: { message?: string };
          };
          detail = errBody.error?.message
            ? `: ${errBody.error.message}`
            : '';
        } catch {
          // ignore body parse errors
        }
        throw new Error(
          `Embedding request failed with status ${response.status}${detail}`,
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Embedding request timed out');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function normalizeGeminiModel(model: string): string {
  return model.replace(/^models\//, '').trim() || 'gemini-embedding-001';
}

export function normalizeGeminiBaseUrl(baseUrl?: string): string {
  const raw = (baseUrl?.trim() || 'https://generativelanguage.googleapis.com').replace(
    /\/+$/,
    '',
  );
  if (raw.endsWith('/v1beta')) return raw;
  if (raw.endsWith('/v1')) return `${raw}beta`;
  return `${raw}/v1beta`;
}

function isRetryableEmbeddingError(error: Error): boolean {
  return /timeout|rate limit|429|502|503|504|network|ECONNRESET|fetch failed/i.test(
    error.message,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
