import {
  FINGERPRINT_DEDUPE_WINDOW_MS,
  MAX_EVENTS_PER_DAY,
  MAX_EVENTS_PER_MINUTE,
} from './recall.validation';

type Bucket = { minute: number[]; day: number[] };

/**
 * Process-local rate limiter (same durability class as setImmediate processing).
 * Replace with Redis later without changing call sites.
 */
export class RecallRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly perMinute = MAX_EVENTS_PER_MINUTE,
    private readonly perDay = MAX_EVENTS_PER_DAY,
  ) {}

  /** Returns true if `count` additional events are allowed. */
  tryConsume(userId: string, count: number, now = Date.now()): boolean {
    if (count <= 0) return true;
    const bucket = this.buckets.get(userId) ?? { minute: [], day: [] };
    const minuteCutoff = now - 60_000;
    const dayCutoff = now - 86_400_000;
    bucket.minute = bucket.minute.filter((t) => t >= minuteCutoff);
    bucket.day = bucket.day.filter((t) => t >= dayCutoff);

    if (
      bucket.minute.length + count > this.perMinute ||
      bucket.day.length + count > this.perDay
    ) {
      this.buckets.set(userId, bucket);
      return false;
    }

    for (let i = 0; i < count; i += 1) {
      bucket.minute.push(now);
      bucket.day.push(now);
    }
    this.buckets.set(userId, bucket);
    return true;
  }

  /** Test helper */
  reset(): void {
    this.buckets.clear();
  }
}

export { FINGERPRINT_DEDUPE_WINDOW_MS };
