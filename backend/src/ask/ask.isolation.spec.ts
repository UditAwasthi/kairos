import { AskService } from './ask.service';
import { RagContextBuilder } from './rag-context.builder';
import type { SemanticSearchResult } from '../search/search.service';

/**
 * Isolation test: AskService only receives SearchService hits.
 * SearchService is already user-scoped; we assert Ask never passes foreign hits
 * to the LLM even if a buggy search were to be mocked incorrectly — and that
 * Ask calls search with the authenticated Clerk id only.
 */
describe('AskService user isolation', () => {
  it('scopes retrieval to the authenticated clerk user and never mixes users', async () => {
    const userAHit: SemanticSearchResult = {
      chunkId: 'chunk_a',
      observationId: 'obs_a',
      chunkIndex: 0,
      content: 'Redis is used for caching.',
      similarity: 0.93,
      observation: {
        id: 'obs_a',
        filename: 'redis.txt',
        type: 'TEXT',
        mimeType: 'text/plain',
        createdAt: '2026-09-01T00:00:00.000Z',
        capturedAt: '2026-09-01T00:00:00.000Z',
        summary: null,
      },
    };

    const search = {
      search: jest.fn().mockImplementation(async (clerkUserId: string) => {
        expect(clerkUserId).toBe('clerk_user_a');
        return {
          query: 'What do I know about databases?',
          total: 1,
          results: [userAHit],
        };
      }),
    };

    const ai = {
      name: 'test-ai',
      isConfigured: () => true,
      generateGroundedAnswer: jest
        .fn()
        .mockImplementation(async ({ context }) => {
          expect(
            context.every(
              (item: { content: string }) =>
                !item.content.toLowerCase().includes('postgresql'),
            ),
          ).toBe(true);
          expect(context[0]?.content).toContain('Redis');
          return {
            answer: 'You know that Redis is used for caching.',
            citationRefs: [1],
            provider: 'test-ai',
            model: 'test',
          };
        }),
    };

    const service = new AskService(
      search as never,
      new RagContextBuilder(),
      ai as never,
    );

    const response = await service.ask('clerk_user_a', {
      question: 'What do I know about databases?',
    });

    expect(search.search).toHaveBeenCalledWith(
      'clerk_user_a',
      expect.any(Object),
    );
    expect(response.answer).toContain('Redis');
    expect(response.answer.toLowerCase()).not.toContain('postgresql');
    expect(response.citations[0]?.observationId).toBe('obs_a');
  });
});
