import {
  ApiError,
  createCapture,
  uploadCapture,
  type ApiObservation,
  type CaptureSource,
} from './api';
import {
  enqueueCapture,
  listPendingCaptures,
  markCaptureAttempt,
  removePendingCapture,
  type PendingCapture,
} from './captureQueue';

export type SubmitCaptureInput = {
  token: string;
  source: CaptureSource;
  content?: string;
  url?: string;
  title?: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
  fileUri?: string;
  fileName?: string;
  mimeType?: string;
};

export type SubmitCaptureResult = {
  observation?: ApiObservation;
  queued: boolean;
  pending?: PendingCapture;
};

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 0 || error.status >= 500 || error.status === 408;
  }
  if (error instanceof Error) {
    return /network|fetch|timeout|unreachable|failed to connect/i.test(
      error.message,
    );
  }
  return true;
}

export async function submitCapture(
  input: SubmitCaptureInput,
): Promise<SubmitCaptureResult> {
  try {
    if (input.fileUri && input.fileName && input.mimeType) {
      const observation = await uploadCapture({
        token: input.token,
        uri: input.fileUri,
        name: input.fileName,
        mimeType: input.mimeType,
        source: input.source,
        title: input.title,
        url: input.url,
        capturedAt: input.capturedAt,
        metadata: input.metadata,
      });
      return { observation, queued: false };
    }

    const observation = await createCapture(input.token, {
      content: input.content,
      source: input.source,
      capturedAt: input.capturedAt,
      url: input.url,
      title: input.title,
      metadata: input.metadata,
    });
    return { observation, queued: false };
  } catch (error) {
    if (!isNetworkFailure(error)) {
      throw error;
    }
    const pending = await enqueueCapture({
      kind: input.fileUri ? 'file' : input.url && !input.content ? 'url' : 'text',
      source: input.source,
      content: input.content,
      url: input.url,
      title: input.title,
      capturedAt: input.capturedAt,
      fileUri: input.fileUri,
      fileName: input.fileName,
      mimeType: input.mimeType,
      metadata: input.metadata,
      lastError: error instanceof Error ? error.message : 'Network unavailable',
    });
    return { queued: true, pending };
  }
}

export async function flushCaptureQueue(token: string): Promise<{
  flushed: number;
  remaining: number;
}> {
  const pending = await listPendingCaptures();
  let flushed = 0;
  for (const item of pending) {
    try {
      await submitQueuedItem(token, item);
      await removePendingCapture(item.id);
      flushed += 1;
    } catch (error) {
      await markCaptureAttempt(
        item.id,
        error instanceof Error ? error.message : 'Retry failed',
      );
    }
  }
  const remaining = (await listPendingCaptures()).length;
  return { flushed, remaining };
}

async function submitQueuedItem(
  token: string,
  item: PendingCapture,
): Promise<void> {
  if (item.fileUri && item.fileName && item.mimeType) {
    await uploadCapture({
      token,
      uri: item.fileUri,
      name: item.fileName,
      mimeType: item.mimeType,
      source: item.source,
      title: item.title,
      url: item.url,
      capturedAt: item.capturedAt,
      metadata: item.metadata,
    });
    return;
  }
  await createCapture(token, {
    content: item.content,
    source: item.source,
    capturedAt: item.capturedAt,
    url: item.url,
    title: item.title,
    metadata: item.metadata,
  });
}

export function captureSourceLabel(source?: string | null): string {
  switch ((source || '').toUpperCase()) {
    case 'KEYBOARD':
      return 'Keyboard';
    case 'SHARE':
      return 'Share';
    case 'QUICK_CAPTURE':
      return 'Quick capture';
    case 'VOICE':
      return 'Voice';
    case 'WIDGET':
      return 'Widget';
    case 'RECALL':
      return 'Recall';
    case 'MANUAL':
    default:
      return 'Manual';
  }
}
