import { Logger, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChunkEmbeddingService } from './chunk-embedding.service';
import {
  EMBEDDING_PROVIDER,
  readEmbeddingConfig,
  type EmbeddingProvider,
} from './embedding.types';
import { LocalDeterministicEmbeddingProvider } from './local-deterministic-embedding.provider';
import { OpenAICompatibleEmbeddingProvider } from './openai-compatible-embedding.provider';
import { VectorSearchService } from './vector-search.service';

const logger = new Logger('EmbeddingsModule');

function createEmbeddingProvider(): EmbeddingProvider {
  const config = readEmbeddingConfig();
  if (config.provider === 'local') {
    logger.warn(
      'Using local deterministic embeddings (dev/test only). Not suitable for semantic quality.',
    );
    return new LocalDeterministicEmbeddingProvider();
  }

  const openai = new OpenAICompatibleEmbeddingProvider();
  if (!openai.isConfigured()) {
    logger.warn(
      'Embedding API key missing. Set EMBEDDING_API_KEY (or AI_API_KEY), or EMBEDDING_PROVIDER=local for plumbing tests.',
    );
  }
  return openai;
}

@Module({
  imports: [PrismaModule],
  providers: [
    OpenAICompatibleEmbeddingProvider,
    LocalDeterministicEmbeddingProvider,
    {
      provide: EMBEDDING_PROVIDER,
      useFactory: createEmbeddingProvider,
    },
    ChunkEmbeddingService,
    VectorSearchService,
  ],
  exports: [
    EMBEDDING_PROVIDER,
    ChunkEmbeddingService,
    VectorSearchService,
    OpenAICompatibleEmbeddingProvider,
    LocalDeterministicEmbeddingProvider,
  ],
})
export class EmbeddingsModule {}
