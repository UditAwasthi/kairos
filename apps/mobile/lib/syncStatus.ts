type SyncSnapshot = {
  flushed: number;
  remaining: number;
  at: number;
};

let snapshot: SyncSnapshot | null = null;
const listeners = new Set<() => void>();

export function recordCaptureSync(flushed: number, remaining: number): void {
  snapshot = { flushed, remaining, at: Date.now() };
  for (const listener of listeners) listener();
}

export function getCaptureSync(): SyncSnapshot | null {
  return snapshot;
}

export function subscribeCaptureSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function syncBannerText(now = Date.now()): string | null {
  if (!snapshot) return null;
  if (snapshot.remaining > 0) {
    return snapshot.remaining === 1
      ? 'Saved locally. Kairos will sync when you are back online.'
      : `${snapshot.remaining} memories saved locally. They will sync when you are back online.`;
  }
  if (snapshot.flushed > 0 && now - snapshot.at < 60_000) {
    return snapshot.flushed === 1
      ? '1 memory synced'
      : `${snapshot.flushed} memories synced`;
  }
  return null;
}
