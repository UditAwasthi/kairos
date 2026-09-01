import { fetchAuthMe } from '../lib/api';

describe('fetchAuthMe', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns the authenticated identity on success', async () => {
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

  it('throws on 401 responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    }) as typeof fetch;

    await expect(fetchAuthMe('token')).rejects.toMatchObject({ status: 401 });
  });
});
