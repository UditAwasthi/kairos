import type { ProgressionEventView, ProgressionSummary } from './api';

export function worldStrengthLabel(level: number): string {
  return `World strength ${level}`;
}

export function streakAssetHint(data: ProgressionSummary): string {
  if (data.freezeTokens > 0) {
    return `${data.freezeTokens} freeze${data.freezeTokens === 1 ? '' : 's'} ready if a day is missed.`;
  }
  return `A freeze costs ${data.freezeCost} keeps and covers one missed day.`;
}

export function rewardLine(event: ProgressionEventView | null): string | null {
  if (!event || event.replayed) return null;
  if (event.broke) return 'The run rested. Streak-gated titles wait until you return.';
  if (event.bonus) return `A quiet bonus · ${event.multiplier}× · +${event.xpAwarded} strength`;
  if (event.firstOfDay) return `Day ${event.streakAfter} kept.`;
  return null;
}
