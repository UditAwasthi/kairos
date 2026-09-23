import * as FileSystem from 'expo-file-system/legacy';

import type { CaptureSource } from './api';

export type PendingCapture = {
  id: string;
  kind: 'text' | 'url' | 'file';
  source: CaptureSource;
  content?: string;
  url?: string;
  title?: string;
  capturedAt: string;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  lastError?: string;
  attempts: number;
};

const QUEUE_NAME = 'kairos-capture-queue.json';

function queueUri(): string {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('Local storage is unavailable on this device.');
  }
  return `${base}${QUEUE_NAME}`;
}

async function readQueue(): Promise<PendingCapture[]> {
  try {
    const info = await FileSystem.getInfoAsync(queueUri());
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(queueUri());
    const parsed = JSON.parse(raw) as PendingCapture[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingCapture[]): Promise<void> {
  await FileSystem.writeAsStringAsync(queueUri(), JSON.stringify(items), {
    encoding: FileSystem.EncodingType.UTF8,
  });
}

export async function enqueueCapture(
  item: Omit<PendingCapture, 'id' | 'attempts' | 'capturedAt'> & {
    capturedAt?: string;
  },
): Promise<PendingCapture> {
  const pending: PendingCapture = {
    ...item,
    id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    capturedAt: item.capturedAt || new Date().toISOString(),
    attempts: 0,
  };
  const queue = await readQueue();
  queue.push(pending);
  await writeQueue(queue);
  return pending;
}

export async function listPendingCaptures(): Promise<PendingCapture[]> {
  return readQueue();
}

export async function removePendingCapture(id: string): Promise<void> {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function markCaptureAttempt(
  id: string,
  error: string,
): Promise<void> {
  const queue = await readQueue();
  await writeQueue(
    queue.map((item) =>
      item.id === id
        ? { ...item, attempts: item.attempts + 1, lastError: error }
        : item,
    ),
  );
}
