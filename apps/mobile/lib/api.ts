import { apiBaseUrl } from './config';

export type AuthMeResponse = {
  id: string;
  authenticated: true;
};

export type ApiObservationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type ApiObservation = {
  id: string;
  filename: string;
  mimeType: string;
  type: 'DOCUMENT' | 'PDF' | 'IMAGE' | 'TEXT';
  status: ApiObservationStatus;
  createdAt: string;
  updatedAt: string;
  capturedAt: string;
  extractedText: string | null;
  processingError: string | null;
  sourceMetadata: Record<string, unknown> | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

async function parseError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string };
      message?: string;
    };
    const message =
      body.error?.message ||
      body.message ||
      `Request failed with status ${response.status}`;
    return new ApiError(message, response.status, body.error?.code);
  } catch {
    return new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
    );
  }
}

export async function fetchAuthMe(token: string): Promise<AuthMeResponse> {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.status === 401) {
    throw new ApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as AuthMeResponse;
}

export async function uploadObservation(params: {
  token: string;
  uri: string;
  name: string;
  mimeType: string;
}): Promise<ApiObservation> {
  const form = new FormData();
  form.append('file', {
    uri: params.uri,
    name: params.name,
    type: params.mimeType,
  } as unknown as Blob);

  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/observations/upload`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
      body: form,
    },
  );

  if (!response.ok) {
    throw await parseError(response);
  }

  const body = (await response.json()) as { data: ApiObservation };
  return body.data;
}

export async function fetchObservation(
  token: string,
  id: string,
): Promise<ApiObservation> {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/observations/${encodeURIComponent(id)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw await parseError(response);
  }

  const body = (await response.json()) as { data: ApiObservation };
  return body.data;
}

export async function fetchObservations(
  token: string,
): Promise<ApiObservation[]> {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/observations`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw await parseError(response);
  }

  const body = (await response.json()) as { data: ApiObservation[] };
  return body.data;
}

export async function pollObservationUntilSettled(params: {
  token: string;
  id: string;
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (observation: ApiObservation) => void;
}): Promise<ApiObservation> {
  const intervalMs = params.intervalMs ?? 1000;
  const timeoutMs = params.timeoutMs ?? 60_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const observation = await fetchObservation(params.token, params.id);
    params.onUpdate?.(observation);
    if (
      observation.status === 'COMPLETED' ||
      observation.status === 'FAILED'
    ) {
      return observation;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new ApiError('Timed out waiting for processing to finish', 408);
}
