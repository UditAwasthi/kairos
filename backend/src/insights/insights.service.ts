import { Inject, Injectable } from '@nestjs/common';
import { CaptureSource, ProcessingStatus } from '@prisma/client';
import { AI_PROVIDER, type AIProvider } from '../ai/ai.types';
import { CAPTURE_SOURCE_LABELS } from '../observations/capture-source';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

export type TodayInsight = {
  title: string;
  body: string;
  generatedAt: string;
  observationCount: number;
  empty: boolean;
};

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    @Inject(AI_PROVIDER) private readonly ai: AIProvider,
  ) {}

  async todayForClerkUser(clerkUserId: string): Promise<TodayInsight> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const observations = await this.prisma.observation.findMany({
      where: {
        userId: user.id,
        processingStatus: ProcessingStatus.COMPLETED,
        capturedAt: { gte: since },
      },
      orderBy: { capturedAt: 'desc' },
      take: 12,
      select: {
        summary: true,
        extractedText: true,
        originalFilename: true,
        source: true,
        capturedAt: true,
      },
    });

    const generatedAt = new Date().toISOString();
    if (observations.length === 0) {
      return {
        title: "Today's insight",
        body: 'Capture something today and Kairos will start finding patterns.',
        generatedAt,
        observationCount: 0,
        empty: true,
      };
    }

    const snippets = observations
      .map((item) => {
        const text = (item.summary || item.extractedText || '').trim();
        return text ? `${item.source}: ${text.slice(0, 280)}` : null;
      })
      .filter((item): item is string => Boolean(item));

    if (this.ai.isConfigured() && snippets.length > 0) {
      try {
        const analysis = await this.ai.analyzeDocument([
          `Write one short personal insight (2 sentences max) about what this person has been spending attention on recently. Be concrete. Do not invent facts.\n\nRecent memories:\n${snippets.join('\n')}`,
        ]);
        const body = analysis.summary.trim();
        if (body) {
          return {
            title: "Today's insight",
            body,
            generatedAt,
            observationCount: observations.length,
            empty: false,
          };
        }
      } catch {
        // Fall back to latest summary.
      }
    }

    const latest =
      snippets[0] ||
      observations[0].originalFilename ||
      'Recent captures are still settling.';
    return {
      title: "Today's insight",
      body: latest.replace(/^[A-Z_]+:\s*/, ''),
      generatedAt,
      observationCount: observations.length,
      empty: false,
    };
  }

  async dashboardForClerkUser(clerkUserId: string): Promise<DashboardSummary> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, todayCount, weekCount, processingCount, completedCount, sources, topics, recent] =
      await Promise.all([
        this.prisma.observation.count({ where: { userId: user.id } }),
        this.prisma.observation.count({
          where: { userId: user.id, capturedAt: { gte: startOfDay } },
        }),
        this.prisma.observation.count({
          where: { userId: user.id, capturedAt: { gte: weekAgo } },
        }),
        this.prisma.observation.count({
          where: {
            userId: user.id,
            processingStatus: { notIn: [ProcessingStatus.COMPLETED, ProcessingStatus.FAILED] },
          },
        }),
        this.prisma.observation.count({
          where: { userId: user.id, processingStatus: ProcessingStatus.COMPLETED },
        }),
        this.prisma.observation.groupBy({
          by: ['source'],
          where: { userId: user.id },
          _count: { _all: true },
        }),
        this.prisma.topic.findMany({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' },
          take: 8,
          include: { _count: { select: { observationTopics: true } } },
        }),
        this.prisma.observation.findMany({
          where: { userId: user.id },
          orderBy: { capturedAt: 'desc' },
          take: 6,
          select: {
            id: true,
            originalFilename: true,
            source: true,
            capturedAt: true,
            summary: true,
            processingStatus: true,
          },
        }),
      ]);

    const insight = await this.todayForClerkUser(clerkUserId);
    return {
      todayCount,
      weekCount,
      processingCount,
      completedCount,
      totalCount: total,
      insight,
      sources: sources
        .map((row) => ({
          source: row.source,
          label: CAPTURE_SOURCE_LABELS[row.source] || row.source,
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
      topics: topics.map((topic) => ({
        id: topic.id,
        name: topic.name,
        observationCount: topic._count.observationTopics,
      })),
      recent: recent.map((item) => ({
        id: item.id,
        filename: item.originalFilename,
        source: item.source,
        sourceLabel: CAPTURE_SOURCE_LABELS[item.source] || item.source,
        capturedAt: item.capturedAt.toISOString(),
        summary: item.summary,
        status: item.processingStatus,
      })),
    };
  }

  async predictionsForClerkUser(clerkUserId: string): Promise<PredictionsSummary> {
    const user = await this.users.findOrCreateByClerkId(clerkUserId);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [recent, older, stale] = await Promise.all([
      this.prisma.observation.findMany({
        where: {
          userId: user.id,
          processingStatus: ProcessingStatus.COMPLETED,
          capturedAt: { gte: weekAgo },
        },
        orderBy: { capturedAt: 'desc' },
        take: 40,
        include: {
          observationTopics: { include: { topic: true } },
        },
      }),
      this.prisma.observation.findMany({
        where: {
          userId: user.id,
          processingStatus: ProcessingStatus.COMPLETED,
          capturedAt: { gte: twoWeeksAgo, lt: weekAgo },
        },
        take: 40,
        include: {
          observationTopics: { include: { topic: true } },
        },
      }),
      this.prisma.observation.findFirst({
        where: {
          userId: user.id,
          processingStatus: ProcessingStatus.COMPLETED,
          capturedAt: { lt: weekAgo },
        },
        orderBy: { capturedAt: 'asc' },
        include: {
          observationTopics: { include: { topic: true } },
        },
      }),
    ]);

    const generatedAt = new Date().toISOString();
    if (recent.length === 0 && !stale) {
      return {
        generatedAt,
        empty: true,
        items: [
          {
            kind: 'next',
            title: 'Start a pattern',
            body: 'Capture a few thoughts this week and Kairos will predict what you are likely to revisit.',
          },
        ],
      };
    }

    const recentTopics = countTopics(recent);
    const olderTopics = countTopics(older);
    const focus = [...recentTopics.entries()].sort((a, b) => b[1].count - a[1].count)[0];
    const emerging = [...recentTopics.entries()].find(
      ([name, value]) => value.count >= 2 && !olderTopics.has(name),
    );
    const items: PredictionItem[] = [];

    if (focus) {
      items.push({
        kind: 'focus',
        title: `You are leaning into ${focus[1].name}`,
        body: `${focus[1].count} memories this week are about ${focus[1].name}. That is your strongest current thread.`,
        topicId: focus[1].id,
      });
    }
    if (emerging) {
      items.push({
        kind: 'emerging',
        title: `${emerging[1].name} is new this week`,
        body: 'This topic showed up recently and did not appear in the week before. It is worth watching.',
        topicId: emerging[1].id,
      });
    }
    if (stale) {
      const topicName = stale.observationTopics[0]?.topic.name;
      items.push({
        kind: 'revisit',
        title: topicName ? `Revisit ${topicName}` : 'Something older is waiting',
        body: `You have not come back to “${stale.originalFilename}” in over a week. A short recap would keep it alive.`,
        observationId: stale.id,
        topicId: stale.observationTopics[0]?.topic.id,
      });
    }
    if (focus) {
      items.push({
        kind: 'next',
        title: `Likely next: ${focus[1].name}`,
        body: `Based on this week, your next capture is most likely to stay on ${focus[1].name} unless you deliberately switch.`,
        topicId: focus[1].id,
      });
    }

    if (this.ai.isConfigured() && recent.length > 0) {
      const snippets = recent
        .map((item) => (item.summary || item.extractedText || '').trim().slice(0, 180))
        .filter(Boolean)
        .slice(0, 10);
      try {
        const analysis = await this.ai.analyzeDocument([
          `From these personal memories, write one concrete prediction about what this person should revisit or will likely work on next. Two sentences max. Do not invent facts.\n\n${snippets.join('\n')}`,
        ]);
        if (analysis.summary.trim()) {
          items.unshift({
            kind: 'next',
            title: 'Kairos prediction',
            body: analysis.summary.trim(),
          });
        }
      } catch {
        // Heuristic items are enough.
      }
    }

    return {
      generatedAt,
      empty: items.length === 0,
      items: items.slice(0, 6),
    };
  }
}

export type DashboardSummary = {
  todayCount: number;
  weekCount: number;
  processingCount: number;
  completedCount: number;
  totalCount: number;
  insight: TodayInsight;
  sources: Array<{ source: CaptureSource; label: string; count: number }>;
  topics: Array<{ id: string; name: string; observationCount: number }>;
  recent: Array<{
    id: string;
    filename: string;
    source: CaptureSource;
    sourceLabel: string;
    capturedAt: string;
    summary: string | null;
    status: ProcessingStatus;
  }>;
};

export type PredictionItem = {
  kind: 'revisit' | 'focus' | 'emerging' | 'next';
  title: string;
  body: string;
  topicId?: string;
  observationId?: string;
};

export type PredictionsSummary = {
  generatedAt: string;
  empty: boolean;
  items: PredictionItem[];
};

function countTopics(
  observations: Array<{
    observationTopics: Array<{ topic: { id: string; name: string } }>;
  }>,
): Map<string, { id: string; name: string; count: number }> {
  const map = new Map<string, { id: string; name: string; count: number }>();
  for (const observation of observations) {
    for (const row of observation.observationTopics) {
      const key = row.topic.name.toLowerCase();
      const current = map.get(key);
      if (current) current.count += 1;
      else map.set(key, { id: row.topic.id, name: row.topic.name, count: 1 });
    }
  }
  return map;
}
