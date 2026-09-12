import {
  ApiError,
  askKairos,
  fetchAuthMe,
  fetchObservation,
  observationStatusLabel,
  semanticSearch,
  uploadObservation,
} from '../lib/api';

describe('observations API client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('uploads a file and returns observation data', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        data: {
          id: 'obs_1',
          filename: 'notes.txt',
          mimeType: 'text/plain',
          type: 'TEXT',
          status: 'PENDING',
          createdAt: '2026-09-12T00:00:00.000Z',
          updatedAt: '2026-09-12T00:00:00.000Z',
          capturedAt: '2026-09-12T00:00:00.000Z',
          extractedText: null,
          summary: null,
          processingError: null,
          sourceMetadata: null,
          metadata: {
            filename: 'notes.txt',
            mimeType: 'text/plain',
            fileSizeBytes: 12,
            pageCount: null,
            characterCount: null,
            wordCount: null,
            chunkCount: null,
          },
          topics: [],
          entities: [],
          chunkCount: 0,
        },
      }),
    }) as typeof fetch;

    await expect(
      uploadObservation({
        token: 'tok',
        uri: 'file:///tmp/notes.txt',
        name: 'notes.txt',
        mimeType: 'text/plain',
      }),
    ).resolves.toMatchObject({ id: 'obs_1', status: 'PENDING' });
  });

  it('maps API error envelopes', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: 'UNSUPPORTED_FILE', message: 'Unsupported file type.' },
      }),
    }) as typeof fetch;

    await expect(fetchObservation('tok', 'obs_x')).rejects.toMatchObject({
      status: 400,
      code: 'UNSUPPORTED_FILE',
      message: 'Unsupported file type.',
    } satisfies Partial<ApiError>);
  });

  it('keeps auth me working', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 'user_123', authenticated: true }),
    }) as typeof fetch;

    await expect(fetchAuthMe('token')).resolves.toEqual({
      id: 'user_123',
      authenticated: true,
    });
  });

  it('maps processing status labels', () => {
    expect(observationStatusLabel('ANALYZING')).toBe('Analyzing content…');
    expect(observationStatusLabel('EMBEDDING')).toBe('Generating embeddings…');
    expect(observationStatusLabel('COMPLETED')).toBe('Ready');
    expect(observationStatusLabel('FAILED')).toBe('Processing failed');
  });

  it('posts semantic search requests', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          query: 'Redis',
          total: 1,
          results: [
            {
              chunkId: 'c1',
              observationId: 'o1',
              chunkIndex: 0,
              content: 'Redis is fast',
              similarity: 0.9,
              observation: {
                id: 'o1',
                filename: 'redis.txt',
                type: 'TEXT',
                mimeType: 'text/plain',
                createdAt: '2026-09-01T00:00:00.000Z',
                capturedAt: '2026-09-01T00:00:00.000Z',
                summary: null,
              },
            },
          ],
        },
      }),
    }) as typeof fetch;

    const result = await semanticSearch({
      token: 'tok',
      query: 'Redis',
      limit: 5,
    });
    expect(result.total).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/search$/),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('posts ask Kairos requests', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          question: 'What is Redis?',
          answer: 'You learned that Redis is used for caching.',
          citations: [
            {
              observationId: 'o1',
              chunkId: 'c1',
              title: 'redis.txt',
              snippet: 'Redis is used for caching.',
              createdAt: '2026-09-01T00:00:00.000Z',
            },
          ],
          insufficientEvidence: false,
        },
      }),
    }) as typeof fetch;

    const result = await askKairos({
      token: 'tok',
      question: 'What is Redis?',
      limit: 6,
    });
    expect(result.answer).toContain('Redis');
    expect(result.citations).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/ask$/),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
