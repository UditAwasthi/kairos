import { createCapture, uploadCapture, fetchTodayInsight } from '../lib/api';

describe('canonical capture API client', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('posts normalized capture payloads', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          id: 'obs_1',
          type: 'TEXT',
          source: 'QUICK_CAPTURE',
          sourceLabel: 'Quick capture',
          status: 'PENDING',
        },
      }),
    }) as unknown as typeof fetch;

    const result = await createCapture('tok', {
      content: 'A thought',
      source: 'QUICK_CAPTURE',
    });
    expect(result.id).toBe('obs_1');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/capture$/),
      expect.objectContaining({ method: 'POST' }),
    );
    const body = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body as string,
    );
    expect(body.source).toBe('QUICK_CAPTURE');
    expect(body.content).toBe('A thought');
  });

  it('uploads voice files to the capture upload endpoint', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: 'obs_voice', type: 'AUDIO', source: 'VOICE', status: 'PENDING' },
      }),
    }) as unknown as typeof fetch;

    const result = await uploadCapture({
      token: 'tok',
      uri: 'file://voice.m4a',
      name: 'voice.m4a',
      mimeType: 'audio/mp4',
      source: 'VOICE',
    });
    expect(result.source).toBe('VOICE');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/capture\/upload$/),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('loads today insight', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          title: "Today's insight",
          body: 'Backend work this week.',
          generatedAt: '2026-09-23T00:00:00.000Z',
          observationCount: 2,
          empty: false,
        },
      }),
    }) as unknown as typeof fetch;

    const insight = await fetchTodayInsight('tok');
    expect(insight.body).toMatch(/Backend work/);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/insights\/today$/),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
