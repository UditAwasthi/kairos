import { AiRequestGate } from './ai-request-gate';
import { GeminiProvider } from './gemini.provider';
import { createChatProvider } from './ai.module';
import { OpenAICompatibleProvider } from './openai-compatible.provider';

const VALID_ANALYSIS = {
  summary: 'A valid document summary for tests.',
  topics: [],
  entities: [],
};

describe('GeminiProvider', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_KEY_1;
    delete process.env.AI_API_KEY_2;
    delete process.env.AI_API_KEY_3;
    delete process.env.AI_BASE_URL;
    delete process.env.AI_MODEL;
    delete process.env.TRANSCRIPTION_MODEL;
    delete process.env.AI_CHAT_MAX_RETRIES;
    delete process.env.AI_CHAT_CONCURRENCY;
  });

  function buildProvider() {
    process.env.AI_API_KEY = 'gemini-key';
    process.env.AI_MODEL = 'gemini-2.5-flash';
    process.env.AI_CHAT_MAX_RETRIES = '3';
    const provider = new GeminiProvider();
    provider.replaceGateForTests(new AiRequestGate(1));
    return provider;
  }

  it('calls Gemini generateContent with the rotating API key', async () => {
    const provider = buildProvider();
    global.fetch = jest.fn(async (url, init) => {
      expect(String(url)).toMatch(/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-2\.5-flash:generateContent/);
      const headers = init?.headers as Record<string, string>;
      expect(headers['x-goog-api-key']).toBe('gemini-key');
      return geminiJsonResponse(VALID_ANALYSIS);
    });

    const result = await provider.analyzeDocument(['a personal note']);
    expect(result.provider).toBe('gemini');
    expect(result.model).toBe('gemini-2.5-flash');
    expect(result.summary).toMatch(/valid document summary/i);
  });

  it('rotates to the next Gemini key on 429', async () => {
    process.env.AI_API_KEY = 'key-a';
    process.env.AI_API_KEY_1 = 'key-b';
    process.env.AI_CHAT_MAX_RETRIES = '3';
    const provider = new GeminiProvider();
    provider.replaceGateForTests(new AiRequestGate(1));

    const keys: string[] = [];
    global.fetch = jest.fn(async (_url, init) => {
      const headers = init?.headers as Record<string, string>;
      keys.push(headers['x-goog-api-key'] ?? '');
      if (keys.length === 1) {
        return new Response(JSON.stringify({ error: { message: 'quota' } }), {
          status: 429,
          headers: { 'retry-after': '5', 'content-type': 'application/json' },
        });
      }
      return geminiJsonResponse(VALID_ANALYSIS);
    });

    const result = await provider.analyzeDocument(['rotate me']);
    expect(result.summary).toMatch(/valid document summary/i);
    expect(keys[0]).toBe('key-a');
    expect(keys[1]).toBe('key-b');
  });

  it('transcribes audio through generateContent, not whisper', async () => {
    process.env.AI_API_KEY = 'gemini-key';
    process.env.TRANSCRIPTION_MODEL = 'gemini-2.5-flash';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: 'I finally understood random forests today.' }] } },
        ],
      }),
    });

    const provider = new GeminiProvider();
    const result = await provider.transcribeAudio(Buffer.from('fake-audio'), 'audio/mp4');
    expect(result.text).toMatch(/random forests/);
    expect(result.provider).toBe('gemini');
    expect(result.model).toBe('gemini-2.5-flash');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/:generateContent$/),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('defaults the chat factory to Gemini', () => {
    process.env.AI_API_KEY = 'k';
    expect(createChatProvider()).toBeInstanceOf(GeminiProvider);
  });

  it('keeps the OpenAI-compatible provider when explicitly requested', () => {
    process.env.AI_PROVIDER = 'openai';
    process.env.AI_API_KEY = 'k';
    expect(createChatProvider()).toBeInstanceOf(OpenAICompatibleProvider);
  });
});

function geminiJsonResponse(payload: unknown): Response {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}
