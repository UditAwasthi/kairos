/**
 * Rotating pool of OpenAI-compatible API keys (e.g. multiple Groq keys).
 * On 429, the hot key cools down while the next free key is used immediately.
 */

export class AiApiKeyPool {
  private readonly keys: string[];
  private readonly cooldownUntilMs: number[];
  private cursor = 0;

  constructor(keys: string[]) {
    const unique: string[] = [];
    const seen = new Set<string>();
    for (const raw of keys) {
      const key = raw.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      unique.push(key);
    }
    this.keys = unique;
    this.cooldownUntilMs = unique.map(() => 0);
  }

  get size(): number {
    return this.keys.length;
  }

  isConfigured(): boolean {
    return this.keys.length > 0;
  }

  /** How many keys are not currently cooling down. */
  availableCount(now = Date.now()): number {
    return this.keys.reduce(
      (n, _k, i) => n + (this.cooldownUntilMs[i] <= now ? 1 : 0),
      0,
    );
  }

  /**
   * Pick the next usable key (round-robin among non-cooling keys).
   * Returns null when every key is still cooling down.
   */
  select(now = Date.now()): { key: string; slot: number } | null {
    if (this.keys.length === 0) return null;
    const n = this.keys.length;
    for (let i = 0; i < n; i += 1) {
      const slot = (this.cursor + i) % n;
      if (this.cooldownUntilMs[slot] <= now) {
        this.cursor = (slot + 1) % n;
        return { key: this.keys[slot], slot };
      }
    }
    return null;
  }

  markRateLimited(slot: number, retryAfterMs: number, now = Date.now()): void {
    if (slot < 0 || slot >= this.keys.length) return;
    const wait = Number.isFinite(retryAfterMs) && retryAfterMs > 0
      ? retryAfterMs
      : 1_000;
    const until = now + wait;
    this.cooldownUntilMs[slot] = Math.max(this.cooldownUntilMs[slot], until);
  }

  /** Earliest time any key becomes free again (0 if one is free now). */
  msUntilAnyAvailable(now = Date.now()): number {
    if (this.keys.length === 0) return 0;
    if (this.availableCount(now) > 0) return 0;
    let min = Number.POSITIVE_INFINITY;
    for (const until of this.cooldownUntilMs) {
      min = Math.min(min, Math.max(0, until - now));
    }
    return Number.isFinite(min) ? min : 0;
  }
}

/**
 * Collect keys from:
 * - AI_API_KEY (primary)
 * - AI_API_KEY_1 .. AI_API_KEY_8
 * - AI_API_KEYS=comma,separated,list
 */
export function readAiApiKeys(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (value: string | undefined) => {
    const key = value?.trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(key);
  };

  push(env.AI_API_KEY);

  for (let i = 1; i <= 8; i += 1) {
    push(env[`AI_API_KEY_${i}`]);
  }

  const list = env.AI_API_KEYS?.trim();
  if (list) {
    for (const part of list.split(/[,;\s]+/)) {
      push(part);
    }
  }

  return out;
}
