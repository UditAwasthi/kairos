/** Current default for Ask, analysis, transcription, and OCR. */
export const DEFAULT_GEMINI_CHAT_MODEL = 'gemini-3.8-flash';

const RETIRED_GEMINI_CHAT_MODELS: Record<string, string> = {
  'gemini-2.0-flash': DEFAULT_GEMINI_CHAT_MODEL,
  'gemini-2.5-flash': DEFAULT_GEMINI_CHAT_MODEL,
  'gemini-2.5-flash-lite': DEFAULT_GEMINI_CHAT_MODEL,
};

/**
 * Strip `models/` and remap Google-retired Flash ids so existing env
 * (`AI_MODEL=gemini-2.5-flash`) keeps working for new API keys.
 */
export function resolveGeminiChatModel(model?: string): string {
  const id = model?.replace(/^models\//, '').trim();
  if (!id) return DEFAULT_GEMINI_CHAT_MODEL;
  return RETIRED_GEMINI_CHAT_MODELS[id] ?? id;
}
