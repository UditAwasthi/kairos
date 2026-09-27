import type {
  ApiObservation,
  ApiProjectSummary,
  DailyBrief,
  DashboardActivityDay,
  DashboardHabitDay,
  DashboardSummary,
  PredictionItem,
  TodayInsight,
} from './api';

export type WorldNode = {
  id: string;
  name: string;
  kind: 'topic' | 'project';
  href: string;
};

export type TodayPulseStats = {
  memories: number;
  topics: number;
  processing: number;
  alive: boolean;
};

export function greetingParts(period: string, name: string): { period: string; name: string } {
  return {
    period: period.replace(/[.,\s]+$/, ''),
    name: name.trim() || 'there',
  };
}

/** Tints the last word of the period ("evening") so the greeting stays personal, not generic. */
export function greetingAccent(period: string): { lead: string; accent: string } {
  const words = period.replace(/[.,\s]+$/, '').split(/\s+/).filter(Boolean);
  if (words.length === 0) return { lead: '', accent: 'Hello' };
  if (words.length === 1) return { lead: '', accent: words[0] ?? 'Hello' };
  return {
    lead: words.slice(0, -1).join(' '),
    accent: words[words.length - 1] ?? 'Hello',
  };
}

export function homeStatusLine(params: {
  streak: number;
  processingCount: number;
  syncText?: string | null;
}): string | null {
  if (params.syncText) return params.syncText;
  if (params.streak > 0) {
    return params.streak === 1 ? '1-day recall streak' : `${params.streak}-day recall streak`;
  }
  if (params.processingCount > 0) {
    return params.processingCount === 1
      ? 'A memory is still settling.'
      : `${params.processingCount} memories are still settling.`;
  }
  return null;
}

export function homeDashboardCopy(dashboard: DashboardSummary | null): {
  body: string;
  hint: string | null;
} {
  if (!dashboard) return { body: 'No memories yet', hint: null };
  const body =
    dashboard.daySummary?.trim() ||
    (dashboard.todayCount > 0
      ? `${dashboard.todayCount} today`
      : dashboard.weekCount > 0
        ? `${dashboard.weekCount} this week`
        : 'No memories yet');
  const hint =
    dashboard.todayCount > 0 || dashboard.weekCount > 0
      ? `${dashboard.todayCount} today · ${dashboard.weekCount} this week`
      : null;
  return { body, hint: hint === body ? null : hint };
}

export function homePredictionItem(items: PredictionItem[]): PredictionItem | null {
  return items.find((item) => item.title?.trim().length > 0) ?? null;
}

export function homeBriefCopy(brief: DailyBrief | null): { body: string; hint: string | null } {
  if (!brief || brief.empty) return { body: 'No brief yet', hint: null };
  const noticed = noticedInsight(brief.noticed);
  const topic = brief.attentionTopics[0];
  const body =
    noticed?.body ||
    brief.revisit?.title ||
    topic?.name ||
    brief.title?.trim() ||
    'No brief yet';
  const hint =
    brief.yesterdayCount > 0
      ? `${brief.yesterdayCount} yesterday · ${brief.weekCount} this week`
      : brief.weekCount > 0
        ? `${brief.weekCount} this week`
        : null;
  return { body, hint };
}

export function homeProjectPreview(
  projects: ApiProjectSummary[],
  limit = 2,
): ApiProjectSummary[] {
  return projects.filter((project) => project.name?.trim()).slice(0, limit);
}

export function personalGreeting(period: string, name: string): string {
  const parts = greetingParts(period, name);
  return `${parts.period}, ${parts.name}.`;
}

export function memoryTitle(filename: string, summary: string | null | undefined): string {
  const text = summary?.trim();
  if (text) return text.replace(/\s+/g, ' ');
  return filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_-]+/g, ' ').trim() || filename;
}

export function noticedInsight(insight: TodayInsight | null | undefined): TodayInsight | null {
  if (!insight || insight.empty) return null;
  return insight.body?.trim() ? insight : null;
}

export function lastRemembered(
  recent: DashboardSummary['recent'],
): DashboardSummary['recent'][number] | null {
  return recent.find((item) => item.status === 'COMPLETED') ?? null;
}

export function todayPulseStats(dashboard: DashboardSummary): TodayPulseStats {
  return {
    memories: dashboard.todayCount,
    topics: dashboard.todayTopicCount,
    processing: dashboard.processingCount,
    alive: dashboard.todayCount > 0 || dashboard.processingCount > 0,
  };
}

const WORLD_SLOTS = [
  { x: 0.5, y: 0.5 },
  { x: 0.2, y: 0.26 },
  { x: 0.8, y: 0.3 },
  { x: 0.18, y: 0.74 },
  { x: 0.78, y: 0.72 },
] as const;

export type WorldGraphNode = WorldNode & { x: number; y: number };

export function worldEdges(
  observations: ApiObservation[],
  nodes: WorldNode[],
): Array<{ from: string; to: string }> {
  const known = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();
  const edges: Array<{ from: string; to: string }> = [];

  for (const observation of observations) {
    const present = [
      ...(observation.topics ?? []).map((item) => `topic-${item.id}`),
      ...(observation.projects ?? []).map((item) => `project-${item.id}`),
    ].filter((id) => known.has(id));
    for (let i = 0; i < present.length; i += 1) {
      for (let j = i + 1; j < present.length; j += 1) {
        const a = present[i];
        const b = present[j];
        if (!a || !b) continue;
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (seen.has(key)) continue;
        seen.add(key);
        edges.push({ from: a, to: b });
      }
    }
  }
  return edges;
}

export function worldGraph(
  topics: DashboardSummary['topics'] | ApiTopicLike[],
  projects: ApiProjectSummary[],
  observations: ApiObservation[],
  limit = 5,
): { nodes: WorldGraphNode[]; edges: Array<{ from: string; to: string }> } {
  const nodes = worldNodes(topics as DashboardSummary['topics'], projects, limit).map(
    (node, index) => ({
      ...node,
      x: WORLD_SLOTS[index]?.x ?? 0.5,
      y: WORLD_SLOTS[index]?.y ?? 0.5,
    }),
  );
  return { nodes, edges: worldEdges(observations, nodes) };
}

type ApiTopicLike = { id: string; name: string; observationCount?: number };

export function worldNodes(
  topics: DashboardSummary['topics'],
  projects: ApiProjectSummary[],
  limit = 5,
): WorldNode[] {
  const nodes: WorldNode[] = [];
  for (const topic of topics) {
    if (nodes.length >= Math.min(3, limit)) break;
    nodes.push({
      id: `topic-${topic.id}`,
      name: topic.name,
      kind: 'topic',
      href: `/(app)/topics/${topic.id}`,
    });
  }
  for (const project of projects) {
    if (nodes.length >= limit) break;
    nodes.push({
      id: `project-${project.id}`,
      name: project.name,
      kind: 'project',
      href: `/(app)/projects/${project.id}`,
    });
  }
  return nodes;
}

export function weekDays(
  habitWeek: DashboardHabitDay[],
  activity: DashboardActivityDay[],
  weekCount: number,
): Array<{ date: string; label: string; count: number }> {
  if (weekCount <= 0) return [];
  const days =
    habitWeek.length > 0
      ? habitWeek.map((day) => ({ date: day.date, label: day.label, count: day.count }))
      : activity.slice(-7);
  if (days.length === 0 || days.every((day) => day.count === 0)) return [];
  return days;
}

export function rememberedStamp(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === now.toDateString()) return `Today · ${time}`;
  return `${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${time}`;
}

export function rememberedTags(observation: ApiObservation | null | undefined): string[] {
  if (!observation) return [];
  const projects = (observation.projects ?? []).map((item) => item.name);
  const topics = (observation.topics ?? []).map((item) => item.name);
  return [...projects, ...topics].filter(Boolean).slice(0, 3);
}

export type ResurfaceKind = 'connected' | 'oldest' | 'on-this-day' | 'kept';

export type ResurfacedPick = {
  observation: ApiObservation;
  kind: ResurfaceKind;
  label: string;
};

const RESURFACE_LABEL: Record<ResurfaceKind, string> = {
  connected: 'Still linked',
  oldest: 'An early one',
  'on-this-day': 'On this day',
  kept: 'Recently kept',
};

export function greetingWhisper(kind: ResurfaceKind | null): string | null {
  if (!kind) return null;
  return RESURFACE_LABEL[kind];
}

export function connectionCount(observation: ApiObservation | null | undefined): number {
  if (!observation) return 0;
  return (
    (observation.topics ?? []).length +
    (observation.projects ?? []).length +
    (observation.entities ?? []).length
  );
}

export function observationLinks(
  observation: ApiObservation | null | undefined,
  limit = 4,
): Array<{ id: string; name: string; href: string }> {
  if (!observation) return [];
  const links: Array<{ id: string; name: string; href: string }> = [];
  for (const project of observation.projects ?? []) {
    if (links.length >= limit) break;
    links.push({
      id: `project-${project.id}`,
      name: project.name,
      href: `/(app)/projects/${project.id}`,
    });
  }
  for (const topic of observation.topics ?? []) {
    if (links.length >= limit) break;
    links.push({
      id: `topic-${topic.id}`,
      name: topic.name,
      href: `/(app)/topics/${topic.id}`,
    });
  }
  for (const entity of observation.entities ?? []) {
    if (links.length >= limit) break;
    links.push({
      id: `entity-${entity.id}`,
      name: entity.name,
      href: `/(app)/entities/${entity.id}`,
    });
  }
  return links;
}

function completedMemories(observations: ApiObservation[]): ApiObservation[] {
  return observations.filter((item) => item.status === 'COMPLETED');
}

function mostConnected(items: ApiObservation[]): ApiObservation | null {
  if (items.length === 0) return null;
  const ranked = [...items].sort((a, b) => {
    const connected =
      (b.topics ?? []).length +
      (b.projects ?? []).length -
      ((a.topics ?? []).length + (a.projects ?? []).length);
    if (connected !== 0) return connected;
    return new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime();
  });
  const best = ranked[0];
  if (!best || (best.topics ?? []).length + (best.projects ?? []).length === 0) return null;
  return best;
}

function oldestMemory(items: ApiObservation[]): ApiObservation | null {
  if (items.length === 0) return null;
  return [...items].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  )[0] ?? null;
}

function onThisDayMemory(items: ApiObservation[], now: Date): ApiObservation | null {
  const month = now.getMonth();
  const date = now.getDate();
  const today = now.toDateString();
  return (
    items.find((item) => {
      const captured = new Date(item.capturedAt);
      return (
        captured.getMonth() === month &&
        captured.getDate() === date &&
        captured.toDateString() !== today
      );
    }) ?? null
  );
}

export function dayOfYear(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000);
}

export function resurfacedOptions(
  observations: ApiObservation[],
  now = new Date(),
): ResurfacedPick[] {
  const completed = completedMemories(observations);
  if (completed.length === 0) return [];
  if (completed.length === 1) {
    const only = completed[0];
    if (!only) return [];
    return [{ observation: only, kind: 'kept', label: RESURFACE_LABEL.kept }];
  }

  const older = completed.slice(1);
  const picks: ResurfacedPick[] = [];
  const push = (observation: ApiObservation | null, kind: ResurfaceKind) => {
    if (!observation || picks.some((item) => item.observation.id === observation.id)) return;
    picks.push({ observation, kind, label: RESURFACE_LABEL[kind] });
  };

  push(mostConnected(older), 'connected');
  push(oldestMemory(completed), 'oldest');
  push(onThisDayMemory(completed, now), 'on-this-day');
  push(completed[0] ?? null, 'kept');
  return picks;
}

export function resurfacedMemory(
  observations: ApiObservation[],
  now = new Date(),
): ResurfacedPick | null {
  const options = resurfacedOptions(observations, now);
  if (options.length === 0) return null;
  return options[dayOfYear(now) % options.length] ?? options[0] ?? null;
}

export function recentRail(
  observations: ApiObservation[],
  excludeId?: string,
  limit = 6,
): ApiObservation[] {
  return observations
    .filter((item) => item.status === 'COMPLETED' && item.id !== excludeId)
    .slice(0, limit);
}

export function exploreTopics<T>(topics: T[], visible = 6): { shown: T[]; overflow: number } {
  return {
    shown: topics.slice(0, visible),
    overflow: Math.max(0, topics.length - visible),
  };
}

export type HomeNudge = {
  key: string;
  label: string;
  body: string;
  href: string;
};

export function homeNudge(params: {
  processingCount: number;
  weekCount: number;
  insight: TodayInsight | null | undefined;
  topics: Array<{ id: string; name: string }>;
  now?: Date;
}): HomeNudge | null {
  const options: HomeNudge[] = [];
  if (params.processingCount > 0) {
    options.push({
      key: 'settling',
      label: 'Settling',
      body:
        params.processingCount === 1
          ? 'A memory is still settling.'
          : `${params.processingCount} memories are still settling.`,
      href: '/(app)/timeline',
    });
  }
  const noticed = noticedInsight(params.insight);
  if (noticed) {
    options.push({
      key: 'noticed',
      label: 'I noticed',
      body: noticed.body,
      href: '/(app)/discover',
    });
  }
  const topic = params.topics[0];
  if (topic) {
    options.push({
      key: 'topic',
      label: 'Explore',
      body: topic.name,
      href: `/(app)/topics/${topic.id}`,
    });
  }
  if (params.weekCount > 0) {
    options.push({
      key: 'ask',
      label: 'Ask',
      body: 'Ask Kairos about this week.',
      href: '/(app)/(tabs)/ask',
    });
  }
  if (options.length === 0) return null;
  const index = (params.now ?? new Date()).getDay() % options.length;
  return options[index] ?? null;
}
