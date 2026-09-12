import { BadRequestException } from '@nestjs/common';
import { AskService, NO_CONTEXT_ANSWER } from './ask.service';
import { RagContextBuilder } from './rag-context.builder';

describe('AskService', () => {
  function build(overrides?: {
    searchResults?: unknown[];
    grounded?: {
      answer: string;
      citationRefs: number[];
    };
  }) {
    const search = {
      search: jest.fn().mockResolvedValue({
        query: 'What did I learn about Redis?',
        total: overrides?.searchResults?.length ?? 1,
        results: overrides?.searchResults ?? [
          {
            chunkId: 'chunk_1',
            observationId: 'obs_1',
            chunkIndex: 0,
            content: 'Redis is an in-memory data structure store.',
            similarity: 0.91,
            observation: {
              id: 'obs_1',
              filename: 'redis.txt',
              type: 'TEXT',
              mimeType: 'text/plain',
              createdAt: '2026-09-01T00:00:00.000Z',
              capturedAt: '2026-09-01T00:00:00.000Z',
              summary: null,
            },
          },
        ],
      }),
    };

    const ai = {
      name: 'test-ai',
      isConfigured: () => true,
      generateGroundedAnswer: jest.fn().mockResolvedValue({
        answer:
          overrides?.grounded?.answer ??
          'You learned that Redis is an in-memory data structure store.',
        citationRefs: overrides?.grounded?.citationRefs ?? [1],
        provider: 'test-ai',
        model: 'test',
      }),
    };

    const service = new AskService(
      search as never,
      new RagContextBuilder(),
      ai as never,
    );

    return { service, search, ai };
  }

  it('rejects empty questions', async () => {
    const { service } = build();
    await expect(
      service.ask('clerk_a', { question: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reuses SearchService and does not call the LLM when retrieval is empty', async () => {
    const { service, search, ai } = build({ searchResults: [] });
    const response = await service.ask('clerk_a', {
      question: 'What is the capital of France?',
    });

    expect(search.search).toHaveBeenCalledWith(
      'clerk_a',
      expect.objectContaining({
        query: 'What is the capital of France?',
      }),
    );
    expect(ai.generateGroundedAnswer).not.toHaveBeenCalled();
    expect(response.answer).toBe(NO_CONTEXT_ANSWER);
    expect(response.citations).toEqual([]);
    expect(response.insufficientEvidence).toBe(true);
  });

  it('returns grounded answer with validated citations', async () => {
    const { service, ai } = build();
    const response = await service.ask('clerk_a', {
      question: 'What is Redis?',
    });

    expect(ai.generateGroundedAnswer).toHaveBeenCalledWith(
      expect.objectContaining({
        question: 'What is Redis?',
        context: expect.arrayContaining([
          expect.objectContaining({ ref: 1, chunkId: 'chunk_1' }),
        ]),
      }),
    );
    expect(response.answer).toContain('Redis');
    expect(response.citations).toHaveLength(1);
    expect(response.citations[0]).toMatchObject({
      observationId: 'obs_1',
      chunkId: 'chunk_1',
      title: 'redis.txt',
    });
  });

  it('drops invented citation refs from the model', async () => {
    const { service } = build({
      grounded: {
        answer: 'Redis is useful for caching.',
        citationRefs: [1, 99],
      },
    });
    const response = await service.ask('clerk_a', {
      question: 'What about Redis?',
    });
    expect(response.citations).toHaveLength(1);
    expect(response.citations[0]?.chunkId).toBe('chunk_1');
  });
});
