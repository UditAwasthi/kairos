import type { CaptureSource } from './api';

export const SEARCH_SOURCE_OPTIONS: Array<{
  value: CaptureSource;
  label: string;
}> = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'KEYBOARD', label: 'Keyboard' },
  { value: 'SHARE', label: 'Share' },
  { value: 'QUICK_CAPTURE', label: 'Quick Capture' },
  { value: 'VOICE', label: 'Voice' },
  { value: 'WIDGET', label: 'Widget' },
  { value: 'RECALL', label: 'Recall' },
];

export type SearchDatePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_week'
  | 'this_month';

export const SEARCH_DATE_OPTIONS: Array<{
  value: SearchDatePreset;
  label: string;
}> = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
];

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function dateRangeForPreset(
  preset: SearchDatePreset,
  now = new Date(),
): { from: string; to: string } {
  if (preset === 'today') {
    return {
      from: startOfDay(now).toISOString(),
      to: endOfDay(now).toISOString(),
    };
  }
  if (preset === 'yesterday') {
    const day = startOfDay(now);
    day.setDate(day.getDate() - 1);
    return { from: day.toISOString(), to: endOfDay(day).toISOString() };
  }
  if (preset === 'this_week') {
    const start = startOfDay(now);
    const weekday = start.getDay() || 7;
    start.setDate(start.getDate() - weekday + 1);
    return { from: start.toISOString(), to: endOfDay(now).toISOString() };
  }
  if (preset === 'last_week') {
    const end = startOfDay(now);
    const weekday = end.getDay() || 7;
    end.setDate(end.getDate() - weekday);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { from: start.toISOString(), to: endOfDay(end).toISOString() };
  }
  const start = startOfDay(now);
  start.setDate(1);
  return { from: start.toISOString(), to: endOfDay(now).toISOString() };
}

export function searchSourceLabel(source: CaptureSource): string {
  return SEARCH_SOURCE_OPTIONS.find((item) => item.value === source)?.label ?? source;
}

export function searchDateLabel(preset: SearchDatePreset): string {
  return SEARCH_DATE_OPTIONS.find((item) => item.value === preset)?.label ?? preset;
}
