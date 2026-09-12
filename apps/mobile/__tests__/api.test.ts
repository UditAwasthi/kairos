import {
  ApiError,
  fetchAuthMe,
  fetchObservation,
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
          processingError: null,
          sourceMetadata: null,
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
});
