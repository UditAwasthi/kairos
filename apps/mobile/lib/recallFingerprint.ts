import { createHash } from 'crypto';

/** Mirrors native FingerprintUtil for unit tests. */
export function normalizeRecallText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function recallFingerprint(text: string, appPackage?: string | null): string {
  const payload = `${normalizeRecallText(text)}|${appPackage ?? ''}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

export type CoalesceBuffer = {
  appPackage: string | null;
  text: string;
  fingerprint: string;
  startedAtMs: number;
};

export function shouldCoalesce(params: {
  open: CoalesceBuffer | null;
  appPackage: string | null;
  text: string;
  nowMs: number;
  windowMs?: number;
}): boolean {
  const windowMs = params.windowMs ?? 120_000;
  const open = params.open;
  if (!open) return false;
  if (open.appPackage !== params.appPackage) return false;
  if (params.nowMs - open.startedAtMs > windowMs) return false;
  const fp = recallFingerprint(params.text, params.appPackage);
  return (
    open.fingerprint === fp ||
    normalizeRecallText(open.text) === normalizeRecallText(params.text)
  );
}
