/** Current default for Ask, analysis, transcription, and OCR. */
export const DEFAULT_GEMINI_CHAT_MODEL = 'gemini-3.8-flash';

const RETIRED_GEMINI_CHAT_MODELS: Record<string, string> = {
  'gemini-2.0-flash': DEFAULT_GEMINI_CHAT_MODEL,
  'gemini-2.5-flash': DEFAULT_GEMINI_CHAT_MODEL,
  'gemini-2.5-flash-lite': DEFAULT_GEMINI_CHAT_MODEL,
};

/**
 * Capacity fallbacks when the primary Flash model returns 503/404.
 * Only ids already used in this repo / documented by Gemini for this stack.
 */
export const GEMINI_CHAT_FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
] as const;

/**
 * Strip `models/` and remap Google-retired Flash ids so existing env
 * (`AI_MODEL=gemini-2.5-flash`) keeps working for new API keys.
 */
export function resolveGeminiChatModel(model?: string): string {
  const id = model?.replace(/^models\//, '').trim();
  if (!id) return DEFAULT_GEMINI_CHAT_MODEL;
  return RETIRED_GEMINI_CHAT_MODELS[id] ?? id;
}

export function geminiChatModelChain(
  preferred?: string,
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const primary = resolveGeminiChatModel(preferred);
  const extra = (env.AI_MODEL_FALLBACKS ?? '')
    .split(',')
    .map((part) => part.replace(/^models\//, '').trim())
    .filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of [primary, ...extra, ...GEMINI_CHAT_FALLBACK_MODELS]) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
