import type {
  ApiProjectSummary,
  ApiTopicSummary,
  DailyBrief,
  DashboardSummary,
  PredictionItem,
  RelatedMemoryItem,
  TodayInsight,
} from './api';
import { noticedInsight } from './homeSummary';

export type DiscoveryKind =
  | 'repeated_interest'
  | 'emerging_topic'
  | 'unfinished_thread'
  | 'revisit'
  | 'connection'
  | 'project_momentum'
  | 'memory_connection';

export type DiscoveryItem = {
  id: string;
  kind: DiscoveryKind;
  title: string;
  body: string;
  why: string;
  evidenceCount: number;
  href: string;
  topicId?: string;
  observationId?: string;
  projectId?: string;
};

const MIN_EVIDENCE = 1;

export function insightToDiscovery(insight: TodayInsight | null | undefined): DiscoveryItem | null {
  const noticed = noticedInsight(insight);
  if (!noticed) return null;
  const evidenceCount = Math.max(noticed.observationCount ?? 0, noticed.evidence?.length ?? 0);
  if (evidenceCount < MIN_EVIDENCE) return null;
  const kind: DiscoveryKind =
    noticed.maturity === 'repeated' || noticed.maturity === 'stable'
      ? 'repeated_interest'
      : noticed.maturity === 'pattern'
        ? 'connection'
        : 'unfinished_thread';
  return {
    id: `insight-${noticed.generatedAt}`,
    kind,
    title: noticed.title.trim() || 'Kairos noticed',
    body: noticed.body.trim(),
    why: noticed.why.trim(),
    evidenceCount,
    href: '/(app)/discover',
  };
}

export function predictionToDiscovery(item: PredictionItem): DiscoveryItem | null {
  if (!item.title?.trim() || !item.body?.trim()) return null;
  const evidenceCount = Math.max(
    item.evidence?.length ?? 0,
    item.mentionCount ?? 0,
    item.dayCount ?? 0,
  );
  if (evidenceCount < MIN_EVIDENCE && !item.why?.trim()) return null;
  const kind: DiscoveryKind =
    item.kind === 'emerging'
      ? 'emerging_topic'
      : item.kind === 'revisit'
        ? 'revisit'
        : item.kind === 'focus'
          ? 'repeated_interest'
          : 'unfinished_thread';
  const href = item.observationId
    ? `/(app)/observation/${item.observationId}`
    : item.topicId
      ? `/(app)/topics/${item.topicId}`
      : '/(app)/discover';
  return {
    id: `prediction-${item.kind}-${item.topicId ?? item.observationId ?? item.title}`,
    kind,
    title: item.title.trim(),
    body: item.body.trim(),
    why: item.why.trim(),
    evidenceCount,
    href,
    topicId: item.topicId,
    observationId: item.observationId,
  };
}

export function projectMomentum(
  projects: ApiProjectSummary[],
  now = new Date(),
): DiscoveryItem | null {
  const recent = [...projects]
    .filter((project) => project.observationCount >= 2)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  if (!recent) return null;
  const days = Math.max(
    0,
    Math.round((now.getTime() - new Date(recent.updatedAt).getTime()) / 86_400_000),
  );
  if (days > 21) return null;
  return {
    id: `project-${recent.id}`,
    kind: 'project_momentum',
    title: recent.name,
    body:
      recent.observationCount === 1
        ? 'One memory is already in this project.'
        : `${recent.observationCount} memories are gathering here.`,
    why: days === 0 ? 'Updated today.' : `Last activity ${days} day${days === 1 ? '' : 's'} ago.`,
    evidenceCount: recent.observationCount,
    href: `/(app)/projects/${recent.id}`,
    projectId: recent.id,
  };
}

export function noticedDiscovery(params: {
  dashboard: DashboardSummary | null;
  brief: DailyBrief | null;
  predictions: PredictionItem[];
}): DiscoveryItem | null {
  return (
    insightToDiscovery(params.dashboard?.insight) ??
    insightToDiscovery(params.brief?.noticed) ??
    (params.brief?.revisit ? predictionToDiscovery(params.brief.revisit) : null) ??
    (params.predictions[0] ? predictionToDiscovery(params.predictions[0]) : null)
  );
}

export function buildDiscoveries(params: {
  dashboard: DashboardSummary | null;
  brief: DailyBrief | null;
  predictions: PredictionItem[];
  topics: ApiTopicSummary[];
  projects: ApiProjectSummary[];
  now?: Date;
}): DiscoveryItem[] {
  const now = params.now ?? new Date();
  const items: DiscoveryItem[] = [];
  const seen = new Set<string>();
  const push = (item: DiscoveryItem | null) => {
    if (!item || seen.has(item.id) || item.evidenceCount < MIN_EVIDENCE) return;
    seen.add(item.id);
    items.push(item);
  };

  push(insightToDiscovery(params.dashboard?.insight));
  push(insightToDiscovery(params.brief?.noticed));
  if (params.brief?.revisit) push(predictionToDiscovery(params.brief.revisit));
  for (const prediction of params.predictions) {
    push(predictionToDiscovery(prediction));
  }
  for (const topic of params.brief?.attentionTopics ?? []) {
    if (topic.observationCount < 2) continue;
    push({
      id: `attention-${topic.id}`,
      kind: 'repeated_interest',
      title: topic.name,
      body: `${topic.observationCount} memories mention this.`,
      why: 'This topic kept coming back recently.',
      evidenceCount: topic.observationCount,
      href: `/(app)/topics/${topic.id}`,
      topicId: topic.id,
    });
  }
  push(projectMomentum(params.projects, now));
  for (const topic of classifyTopics(params.topics, now).emerging.slice(0, 2)) {
    push({
      id: `emerging-${topic.id}`,
      kind: 'emerging_topic',
      title: topic.name,
      body: `${topic.observationCount} recent memories.`,
      why: 'This topic is newer than the rest of your world.',
      evidenceCount: topic.observationCount,
      href: `/(app)/topics/${topic.id}`,
      topicId: topic.id,
    });
  }
  return items.slice(0, 8);
}

export type TopicLane = 'active' | 'emerging' | 'revisited' | 'quiet';

export type ClassifiedTopics = Record<TopicLane, ApiTopicSummary[]>;

export function daysSince(iso: string, now = new Date()): number {
  return Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 86_400_000));
}

export function classifyTopics(topics: ApiTopicSummary[], now = new Date()): ClassifiedTopics {
  const lanes: ClassifiedTopics = { active: [], emerging: [], revisited: [], quiet: [] };
  const medianAge = median(
    topics.map((topic) => daysSince(topic.updatedAt, now)).filter((value) => Number.isFinite(value)),
  );
  for (const topic of topics) {
    const age = daysSince(topic.updatedAt, now);
    if (topic.observationCount >= 3 && age <= Math.max(7, medianAge)) {
      lanes.active.push(topic);
    } else if (topic.observationCount >= 2 && topic.observationCount < 5 && age <= 14) {
      lanes.emerging.push(topic);
    } else if (age > Math.max(14, medianAge) && topic.observationCount >= 2) {
      lanes.quiet.push(topic);
    } else {
      lanes.revisited.push(topic);
    }
  }
  return lanes;
}

function median(values: number[]): number {
  if (values.length === 0) return 10;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 10) + (sorted[mid] ?? 10)) / 2
    : (sorted[mid] ?? 10);
}

export function connectionCopy(item: RelatedMemoryItem, now = new Date()): string {
  const ageDays = daysSince(item.capturedAt, now);
  if (item.reasons.includes('similar') && ageDays > 30) {
    const months = Math.max(1, Math.round(ageDays / 30));
    return months === 1
      ? 'You wrote something similar a month ago.'
      : `You wrote something similar ${months} months ago.`;
  }
  if (item.reasons.includes('shared_topic')) return 'Shares a topic with this memory.';
  if (item.reasons.includes('shared_project')) return 'Lives in the same project.';
  if (item.reasons.includes('shared_entity')) return 'Mentions the same person or thing.';
  if (item.reasons.includes('nearby_in_time')) return 'Captured around the same time.';
  return 'Connected to this memory.';
}

export function askPrompts(params: {
  topics: Array<{ name: string }>;
  projects: Array<{ name: string }>;
  weekCount: number;
}): string[] {
  const prompts: string[] = [];
  const topic = params.topics[0]?.name?.trim();
  const project = params.projects[0]?.name?.trim();
  if (topic) prompts.push(`What have I been saying about ${topic}?`);
  if (project) prompts.push(`How is ${project} going?`);
  if (params.weekCount > 0) prompts.push('What did I capture this week?');
  return prompts.slice(0, 3);
}

export function recallPlaceholders(): string[] {
  return ['Remember something…', 'Find that idea I had…', 'Where did I save…'];
}

export function discoveryKindLabel(kind: DiscoveryKind): string {
  switch (kind) {
    case 'repeated_interest':
      return 'Repeated interest';
    case 'emerging_topic':
      return 'Emerging topic';
    case 'unfinished_thread':
      return 'Unfinished thread';
    case 'revisit':
      return 'Revisit';
    case 'connection':
      return 'Connection';
    case 'project_momentum':
      return 'Project momentum';
    case 'memory_connection':
      return 'Memory connection';
  }
}
