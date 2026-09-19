import {
  normalizeRecallText,
  recallFingerprint,
  shouldCoalesce,
} from '../lib/recallFingerprint';

describe('recallFingerprint', () => {
  it('normalizes whitespace and case', () => {
    expect(normalizeRecallText('  Hello   WORLD ')).toBe('hello world');
  });

  it('is deterministic for same content + package', () => {
    const a = recallFingerprint('Hybrid retrieval notes', 'com.github.android');
    const b = recallFingerprint('Hybrid retrieval notes', 'com.github.android');
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('changes when package changes', () => {
    const a = recallFingerprint('same text', 'com.a');
    const b = recallFingerprint('same text', 'com.b');
    expect(a).not.toBe(b);
  });

  it('coalesces same app within window', () => {
    const text = 'Pull request review';
    const open = {
      appPackage: 'com.github.android',
      text,
      fingerprint: recallFingerprint(text, 'com.github.android'),
      startedAtMs: 1_000,
    };
    expect(
      shouldCoalesce({
        open,
        appPackage: 'com.github.android',
        text,
        nowMs: 30_000,
      }),
    ).toBe(true);
    expect(
      shouldCoalesce({
        open,
        appPackage: 'com.other',
        text,
        nowMs: 30_000,
      }),
    ).toBe(false);
  });
});
