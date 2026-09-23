import NativeKairosOs from 'kairos-os';

import { apiBaseUrl } from './config';
import { submitCapture } from './capture';
import type { CaptureSource } from './api';

type PendingOsCapture = {
  content?: string;
  url?: string;
  title?: string;
  source?: CaptureSource;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
};

export const KairosOs = {
  isAvailable(): boolean {
    return NativeKairosOs.isAvailable();
  },

  async setAuthToken(token: string | null): Promise<void> {
    if (!NativeKairosOs.isAvailable()) return;
    await NativeKairosOs.setAuthToken(token);
    await NativeKairosOs.setApiBaseUrl(apiBaseUrl);
  },

  async refreshWidget(insight?: string): Promise<void> {
    if (!NativeKairosOs.isAvailable()) return;
    await NativeKairosOs.refreshWidget(insight);
  },

  async takePendingCapture(): Promise<PendingOsCapture | null> {
    if (!NativeKairosOs.isAvailable()) return null;
    const pending = (await NativeKairosOs.getPendingCapture()) as PendingOsCapture | null;
    if (pending) await NativeKairosOs.clearPendingCapture();
    return pending;
  },
};

export async function consumePendingOsCapture(
  getToken: () => Promise<string | null>,
): Promise<void> {
  const pending = await KairosOs.takePendingCapture();
  if (!pending) return;
  const token = await getToken();
  if (!token) return;
  if (!pending.content && !pending.url && !pending.fileUri) return;
  await submitCapture({
    token,
    source: pending.source || 'SHARE',
    content: pending.content,
    url: pending.url,
    title: pending.title,
    fileUri: pending.fileUri,
    fileName: pending.fileName,
    mimeType: pending.mimeType,
  });
}
