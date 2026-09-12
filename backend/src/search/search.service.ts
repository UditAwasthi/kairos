import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ObservationType } from '@prisma/client';
import {
  EMBEDDING_PROVIDER,
  type EmbeddingProvider,
} from '../embeddings/embedding.types';
import {
  VectorSearchService,
  type VectorSearchHit,
} from '../embeddings/vector-search.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  type SearchRequestBody,
  validateSearchRequest,
} from './search.validation';

export type SemanticSearchResult = {
  chunkId: string;
  observationId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  observation: {
    id: string;
    filename: string;
    type: ObservationType;
    mimeType: string;
    createdAt: string;
    capturedAt: string;
    summary: string | null;
  };
};

export type SemanticSearchResponse = {
  query: string;
  results: SemanticSearchResult[];
  total: number;
};

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly minSimilarity: number;
  private readonly maxPerObservation: number;

  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly vectorSearch: VectorSearchService,
    @Inject(EMBEDDING_PROVIDER) private readonly embeddings: EmbeddingProvider,
  ) {
    this.minSimilarity = readFloatEnv('SEARCH_MIN_SIMILARITY', 0.2);
    this.maxPerObservation = Math.max(
      1,
      Math.floor(readFloatEnv('SEARCH_MAX_PER_OBSERVATION', 2)),
    );
  }

  async search(
    clerkUserId: string,
    body: SearchRequestBody,
  ): Promise<SemanticSearchResponse> {
    const started = Date.now();
    const request = validateSearchRequest(body);

    if (!this.embeddings.isConfigured()) {
      throw new Error('Embedding provider is not configured');
    }

    const user = await this.users.findOrCreateByClerkId(clerkUserId);

    const embedStarted = Date.now();
    const embedded = await this.embeddings.embedText(request.query);
    const embedMs = Date.now() - embedStarted;

    const candidateLimit = Math.min(
      request.limit * Math.max(3, this.maxPerObservation + 1),
      100,
    );

    const searchStarted = Date.now();
    const hits = await this.vectorSearch.search(user.id, embedded.embedding, {
      candidateLimit,
      minSimilarity: this.minSimilarity,
      filters: {
        observationType: request.filters.observationType,
        mimeType: request.filters.mimeType,
        from: request.filters.from,
        to: request.filters.to,
        topicId: request.filters.topicId,
      },
    });
    const searchMs = Date.now() - searchStarted;

    const capped = applyPerObservationCap(hits, this.maxPerObservation).slice(
      0,
      request.limit,
    );
    const results = await this.hydrateResults(capped);

    this.logger.log(
      JSON.stringify({
        event: 'semantic_search',
        userId: user.id,
        resultCount: results.length,
        embedMs,
        searchMs,
        totalMs: Date.now() - started,
        limit: request.limit,
        minSimilarity: this.minSimilarity,
      }),
    );

    return {
      query: request.query,
      results,
      total: results.length,
    };
  }

  private async hydrateResults(
    hits: VectorSearchHit[],
  ): Promise<SemanticSearchResult[]> {
    if (hits.length === 0) return [];

    const observationIds = [...new Set(hits.map((hit) => hit.observationId))];
    const observations = await this.prisma.observation.findMany({
      where: { id: { in: observationIds } },
      select: {
        id: true,
        originalFilename: true,
        type: true,
        mimeType: true,
        createdAt: true,
        capturedAt: true,
        summary: true,
      },
    });
    const byId = new Map(observations.map((obs) => [obs.id, obs]));

    return hits.flatMap((hit) => {
      const observation = byId.get(hit.observationId);
      if (!observation) return [];
      return [
        {
          chunkId: hit.chunkId,
          observationId: hit.observationId,
          chunkIndex: hit.chunkIndex,
          content: hit.content,
          similarity: hit.similarity,
          observation: {
            id: observation.id,
            filename: observation.originalFilename,
            type: observation.type,
            mimeType: observation.mimeType,
            createdAt: observation.createdAt.toISOString(),
            capturedAt: observation.capturedAt.toISOString(),
            summary: observation.summary,
          },
        },
      ];
    });
  }
}

function applyPerObservationCap(
  hits: VectorSearchHit[],
  maxPerObservation: number,
): VectorSearchHit[] {
  const counts = new Map<string, number>();
  const out: VectorSearchHit[] = [];
  for (const hit of hits) {
    const count = counts.get(hit.observationId) ?? 0;
    if (count >= maxPerObservation) continue;
    counts.set(hit.observationId, count + 1);
    out.push(hit);
  }
  return out;
}

function readFloatEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : fallback;
}
