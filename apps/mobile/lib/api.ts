import { apiBaseUrl } from './config';

export type AuthMeResponse = {
  id: string;
  authenticated: true;
};

export type ApiObservationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'EXTRACTING'
  | 'NORMALIZING'
  | 'CHUNKING'
  | 'ANALYZING'
  | 'EMBEDDING'
  | 'COMPLETED'
  | 'FAILED';

export type ApiObservationTopic = {
  id: string;
  name: string;
  confidence: number | null;
};

export type ApiObservationEntity = {
  id: string;
  name: string;
  type:
    | 'PERSON'
    | 'ORGANIZATION'
    | 'TECHNOLOGY'
    | 'PRODUCT'
    | 'LOCATION'
    | 'CONCEPT';
  confidence: number | null;
};

export type ApiObservationMetadata = {
  filename: string;
  mimeType: string;
  fileSizeBytes: number;
  pageCount: number | null;
  characterCount: number | null;
  wordCount: number | null;
  chunkCount: number | null;
};

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
  summary: string | null;
  processingError: string | null;
  sourceMetadata: Record<string, unknown> | null;
  metadata: ApiObservationMetadata;
  topics: ApiObservationTopic[];
  entities: ApiObservationEntity[];
  chunkCount: number;
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
  filters?: {
    topicId?: string;
    entityId?: string;
    topic?: string;
    entity?: string;
  },
): Promise<ApiObservation[]> {
  const qs = new URLSearchParams();
  if (filters?.topicId) qs.set('topicId', filters.topicId);
  if (filters?.entityId) qs.set('entityId', filters.entityId);
  if (filters?.topic) qs.set('topic', filters.topic);
  if (filters?.entity) qs.set('entity', filters.entity);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/observations${suffix}`,
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

export type ApiTopicSummary = {
  id: string;
  name: string;
  observationCount: number;
  updatedAt: string;
};

export type ApiEntitySummary = {
  id: string;
  name: string;
  type:
    | 'PERSON'
    | 'ORGANIZATION'
    | 'TECHNOLOGY'
    | 'PRODUCT'
    | 'LOCATION'
    | 'CONCEPT';
  observationCount: number;
  updatedAt: string;
};

export type ApiTopicDetail = ApiTopicSummary & {
  observations: ApiObservation[];
};

export type ApiEntityDetail = ApiEntitySummary & {
  observations: ApiObservation[];
};

export async function fetchTopics(params: {
  token: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: ApiTopicSummary[]; nextCursor: string | null }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/topics${suffix}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as {
    data: { items: ApiTopicSummary[]; nextCursor: string | null };
  };
  return body.data;
}

export async function fetchTopic(params: {
  token: string;
  id: string;
}): Promise<ApiTopicDetail> {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/topics/${encodeURIComponent(params.id)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: ApiTopicDetail };
  return body.data;
}

export async function fetchEntities(params: {
  token: string;
  limit?: number;
  cursor?: string;
  type?: string;
}): Promise<{ items: ApiEntitySummary[]; nextCursor: string | null }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  if (params.type) qs.set('type', params.type);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/entities${suffix}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as {
    data: { items: ApiEntitySummary[]; nextCursor: string | null };
  };
  return body.data;
}

export async function fetchEntity(params: {
  token: string;
  id: string;
}): Promise<ApiEntityDetail> {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/entities/${encodeURIComponent(params.id)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: ApiEntityDetail };
  return body.data;
}

export function isTerminalObservationStatus(
  status: ApiObservationStatus,
): boolean {
  return status === 'COMPLETED' || status === 'FAILED';
}

export function observationStatusLabel(status: ApiObservationStatus): string {
  switch (status) {
    case 'PENDING':
    case 'EXTRACTING':
    case 'NORMALIZING':
    case 'CHUNKING':
    case 'PROCESSING':
      return 'Processing your document…';
    case 'ANALYZING':
      return 'Analyzing content…';
    case 'EMBEDDING':
      return 'Generating embeddings…';
    case 'COMPLETED':
      return 'Ready';
    case 'FAILED':
      return 'Processing failed';
    default:
      return 'Working…';
  }
}

export async function pollObservationUntilSettled(params: {
  token: string;
  id: string;
  intervalMs?: number;
  timeoutMs?: number;
  onUpdate?: (observation: ApiObservation) => void;
}): Promise<ApiObservation> {
  const intervalMs = params.intervalMs ?? 1000;
  const timeoutMs = params.timeoutMs ?? 120_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const observation = await fetchObservation(params.token, params.id);
    params.onUpdate?.(observation);
    if (isTerminalObservationStatus(observation.status)) {
      return observation;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new ApiError('Timed out waiting for processing to finish', 408);
}

export type ApiSemanticSearchFilters = {
  from?: string;
  to?: string;
  observationType?: 'DOCUMENT' | 'PDF' | 'IMAGE' | 'TEXT';
  mimeType?: string;
  topicId?: string;
  entityId?: string;
  topic?: string;
  entity?: string;
};

export type ApiSemanticSearchResult = {
  chunkId: string;
  observationId: string;
  chunkIndex: number;
  content: string;
  similarity: number;
  observation: {
    id: string;
    filename: string;
    type: 'DOCUMENT' | 'PDF' | 'IMAGE' | 'TEXT';
    mimeType: string;
    createdAt: string;
    capturedAt: string;
    summary: string | null;
  };
};

export type ApiSemanticSearchResponse = {
  query: string;
  results: ApiSemanticSearchResult[];
  total: number;
};

export async function semanticSearch(params: {
  token: string;
  query: string;
  limit?: number;
  filters?: ApiSemanticSearchFilters;
}): Promise<ApiSemanticSearchResponse> {
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: params.query,
      limit: params.limit,
      filters: params.filters,
      topic: params.filters?.topic,
      entity: params.filters?.entity,
    }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const body = (await response.json()) as { data: ApiSemanticSearchResponse };
  return body.data;
}

export type ApiAskCitation = {
  observationId: string;
  chunkId: string;
  title: string;
  snippet: string;
  createdAt: string;
};

export type ApiAskResponse = {
  question: string;
  answer: string;
  citations: ApiAskCitation[];
  insufficientEvidence: boolean;
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
};

export type ApiConversationSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type ApiConversationMessage = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  status: 'COMPLETED' | 'FAILED';
  citations: ApiAskCitation[];
  insufficientEvidence: boolean | null;
  createdAt: string;
};

export type ApiConversationDetail = ApiConversationSummary & {
  messages: ApiConversationMessage[];
  nextCursor: string | null;
};

export async function askKairos(params: {
  token: string;
  question: string;
  limit?: number;
  conversationId?: string;
  clientRequestId?: string;
  filters?: ApiSemanticSearchFilters;
}): Promise<ApiAskResponse> {
  const path = params.conversationId
    ? `/conversations/${encodeURIComponent(params.conversationId)}/ask`
    : '/ask';
  const response = await fetch(`${normalizeBaseUrl(apiBaseUrl)}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question: params.question,
      limit: params.limit,
      clientRequestId: params.clientRequestId,
      filters: params.filters,
      topic: params.filters?.topic,
      entity: params.filters?.entity,
    }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const body = (await response.json()) as { data: ApiAskResponse };
  return body.data;
}

export async function listConversations(params: {
  token: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: ApiConversationSummary[]; nextCursor: string | null }> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/conversations${suffix}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as {
    data: { items: ApiConversationSummary[]; nextCursor: string | null };
  };
  return body.data;
}

export async function fetchConversation(params: {
  token: string;
  id: string;
  limit?: number;
}): Promise<ApiConversationDetail> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/conversations/${encodeURIComponent(params.id)}${suffix}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok) throw await parseError(response);
  const body = (await response.json()) as { data: ApiConversationDetail };
  return body.data;
}

export async function deleteConversation(params: {
  token: string;
  id: string;
}): Promise<void> {
  const response = await fetch(
    `${normalizeBaseUrl(apiBaseUrl)}/conversations/${encodeURIComponent(params.id)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${params.token}`,
        Accept: 'application/json',
      },
    },
  );
  if (!response.ok && response.status !== 204) {
    throw await parseError(response);
  }
}
