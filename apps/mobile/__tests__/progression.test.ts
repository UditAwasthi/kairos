import { rewardLine, streakAssetHint, worldStrengthLabel } from '../lib/progression';
import type { ProgressionEventView, ProgressionSummary } from '../lib/api';

const event = (overrides: Partial<ProgressionEventView> = {}): ProgressionEventView => ({
  action: 'CAPTURE',
  xpAwarded: 10,
  keepsAwarded: 0,
  multiplier: 1,
  bonus: false,
  freezeUsed: 0,
  streakAfter: 3,
  firstOfDay: true,
  broke: false,
  replayed: false,
  ...overrides,
});

const summary = (overrides: Partial<ProgressionSummary> = {}): ProgressionSummary => ({
  xp: 80,
  level: 2,
  intoLevel: 0,
  nextLevelXp: 320,
  progress: 0,
  keeps: 4,
  currentStreak: 3,
  longestStreak: 3,
  lastActiveDate: '2026-09-27',
  freezeTokens: 0,
  freezeCost: 25,
  equippedTitle: null,
  equippedAura: null,
  equippedTitleLabel: null,
  equippedAuraLabel: null,
  leaderboardVisible: true,
  displayName: null,
  unlocks: [],
  lastEvent: null,
  ...overrides,
});

describe('progression copy', () => {
  it('names the single primary metric', () => {
    expect(worldStrengthLabel(4)).toBe('World strength 4');
  });

  it('explains freezes from real counts', () => {
    expect(streakAssetHint(summary({ freezeTokens: 2 }))).toContain('2 freezes');
    expect(streakAssetHint(summary())).toContain('25 keeps');
  });

  it('only celebrates real bonus or first-of-day events', () => {
    expect(rewardLine(null)).toBeNull();
    expect(rewardLine(event({ replayed: true }))).toBeNull();
    expect(rewardLine(event({ bonus: true, multiplier: 2, xpAwarded: 20 }))).toContain('2×');
    expect(rewardLine(event({ firstOfDay: true, streakAfter: 5 }))).toContain('Day 5');
  });
});
