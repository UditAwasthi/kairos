import { createHash } from 'crypto';

/** Mirrors native FingerprintUtil for unit tests. */
export function normalizeRecallText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function recallFingerprint(text: string, appPackage?: string | null): string {
  const payload = `${normalizeRecallText(text)}|${appPackage ?? ''}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

const TOKEN_RE = /[\p{L}\p{N}]{2,}/gu;
const NOISE = new Set(['skip', 'allow', 'deny', 'ok', 'cancel', 'done', 'close', 'back']);

/** Mirrors native TextSemantics.tokens */
export function recallTokens(text: string): Set<string> {
  const out = new Set<string>();
  const matches = text.toLowerCase().match(TOKEN_RE) ?? [];
  for (const m of matches) {
    if (!NOISE.has(m)) out.add(m);
  }
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  return inter / (a.size + b.size - inter);
}

export function newTokenRatio(previous: Set<string>, incoming: Set<string>): number {
  if (incoming.size === 0) return 0;
  let novel = 0;
  for (const t of incoming) if (!previous.has(t)) novel += 1;
  return novel / incoming.size;
}

export function isMeaningfulRecallText(text: string): boolean {
  const cleaned = text.trim();
  if (cleaned.length < 20) return false;
  const toks = recallTokens(cleaned);
  if (toks.size < 4) return false;
  let alphaNum = 0;
  for (const ch of cleaned) {
    if (/[a-zA-Z0-9\u00C0-\u024F]/.test(ch)) alphaNum += 1;
  }
  return alphaNum >= 16;
}

export function unionRecallLines(existing: string, incoming: string, maxChars = 32_000): string {
  const lines = new Map<string, string>();
  const addBlock = (block: string) => {
    for (const raw of block.split('\n')) {
      const line = raw.trim();
      if (line.length < 2) continue;
      const key = normalizeRecallText(line);
      if (key.length < 2) continue;
      const prev = lines.get(key);
      if (!prev || line.length > prev.length) lines.set(key, line);
    }
  };
  addBlock(existing);
  addBlock(incoming);
  return [...lines.values()].join('\n').slice(0, maxChars);
}

export type TextRelation = 'DUPLICATE' | 'RELATED_SCROLL' | 'MATERIAL';

/** Mirrors native TextSemantics.relation */
export function textRelation(previousText: string, incomingText: string): TextRelation {
  const a = recallTokens(previousText);
  const b = recallTokens(incomingText);
  const jac = jaccard(a, b);
  const novel = newTokenRatio(a, b);
  let onlyPrev = 0;
  for (const t of a) if (!b.has(t)) onlyPrev += 1;
  let onlyNext = 0;
  for (const t of b) if (!a.has(t)) onlyNext += 1;
  const lenRatio =
    previousText.length === 0 ? 1 : incomingText.length / Math.max(previousText.length, 1);

  if (jac >= 0.88 && novel < 0.12) return 'DUPLICATE';
  // Distinctive content swap (search query, different product) — not a scroll merge.
  if (onlyPrev >= 2 && onlyNext >= 2 && novel >= 0.22) return 'MATERIAL';
  if (jac >= 0.42 && novel >= 0.18) return 'RELATED_SCROLL';
  if (jac >= 0.55 && lenRatio >= 0.7 && lenRatio <= 1.4 && novel < 0.25) {
    return 'RELATED_SCROLL';
  }
  return 'MATERIAL';
}

export type CoalesceBuffer = {
  appPackage: string | null;
  text: string;
  fingerprint: string;
  startedAtMs: number;
  updatedAtMs?: number;
  snapshotCount?: number;
};

/**
 * Legacy helper kept for fingerprint tests: exact duplicate only.
 * Prefer simulateEventAggregator for real aggregation behavior.
 */
export function shouldCoalesce(params: {
  open: CoalesceBuffer | null;
  appPackage: string | null;
  text: string;
  nowMs: number;
  windowMs?: number;
}): boolean {
  const open = params.open;
  if (!open) return false;
  if (open.appPackage !== params.appPackage) return false;
  const fp = recallFingerprint(params.text, params.appPackage);
  return (
    open.fingerprint === fp ||
    normalizeRecallText(open.text) === normalizeRecallText(params.text)
  );
}

export type AggregatorEvent = {
  extractedText: string;
  appPackage: string | null;
  fingerprint: string;
  capturedAtMs: number;
};

/**
 * JS mirror of native EventAggregator for unit tests (cases A–F).
 */
export function simulateEventAggregator(
  snapshots: Array<{
    text: string;
    appPackage?: string | null;
    nowMs: number;
  }>,
  options?: { idleFlushMs?: number; forceFinalFlush?: boolean },
): AggregatorEvent[] {
  const idleFlushMs = options?.idleFlushMs ?? 12_000;
  const emitted: AggregatorEvent[] = [];
  const state: { open: CoalesceBuffer | null } = { open: null };

  const flush = () => {
    const buf = state.open;
    if (!buf || !isMeaningfulRecallText(buf.text)) {
      state.open = null;
      return;
    }
    emitted.push({
      extractedText: buf.text.slice(0, 32_000),
      appPackage: buf.appPackage,
      fingerprint: buf.fingerprint,
      capturedAtMs: buf.updatedAtMs ?? buf.startedAtMs,
    });
    state.open = null;
  };

  const openNew = (text: string, appPackage: string | null, nowMs: number) => {
    state.open = {
      appPackage,
      text: text.slice(0, 32_000),
      fingerprint: recallFingerprint(text, appPackage),
      startedAtMs: nowMs,
      updatedAtMs: nowMs,
      snapshotCount: 1,
    };
  };

  for (const snap of snapshots) {
    const cleaned = snap.text.trim();
    if (!isMeaningfulRecallText(cleaned)) continue;
    const appPackage = snap.appPackage ?? null;
    const nowMs = snap.nowMs;
    const existing = state.open;

    if (existing && nowMs - (existing.updatedAtMs ?? existing.startedAtMs) >= idleFlushMs) {
      flush();
    }

    if (!state.open) {
      openNew(cleaned, appPackage, nowMs);
      continue;
    }

    const current = state.open;
    const appChanged =
      current.appPackage != null &&
      appPackage != null &&
      current.appPackage !== appPackage;
    if (appChanged) {
      flush();
      openNew(cleaned, appPackage, nowMs);
      continue;
    }

    const relation = textRelation(current.text, cleaned);
    if (relation === 'DUPLICATE') {
      current.updatedAtMs = nowMs;
      continue;
    }
    if (relation === 'RELATED_SCROLL') {
      current.text = unionRecallLines(current.text, cleaned);
      current.fingerprint = recallFingerprint(current.text, appPackage);
      current.updatedAtMs = nowMs;
      current.snapshotCount = (current.snapshotCount ?? 1) + 1;
      continue;
    }
    // MATERIAL
    flush();
    openNew(cleaned, appPackage, nowMs);
  }

  if (options?.forceFinalFlush !== false) {
    flush();
  }

  return emitted;
}
