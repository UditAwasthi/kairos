import {
  askPrompts,
  buildDiscoveries,
  classifyTopics,
  connectionCopy,
  noticedDiscovery,
  predictionToDiscovery,
} from '../lib/discovery';
import type {
  ApiProjectSummary,
  ApiTopicSummary,
  DailyBrief,
  DashboardSummary,
  PredictionItem,
  RelatedMemoryItem,
  TodayInsight,
} from '../lib/api';

const insight = (overrides: Partial<TodayInsight> = {}): TodayInsight => ({
  title: 'Machine learning again',
  body: 'You keep returning to machine learning.',
  generatedAt: '2026-09-27T08:00:00.000Z',
  observationCount: 4,
  empty: false,
  evidence: [
    {
      observationId: '1',
      filename: 'note.txt',
      snippet: 'ml',
      capturedAt: '2026-09-20T00:00:00.000Z',
      sourceLabel: 'Note',
    },
  ],
  why: 'Repeated topic this week.',
  maturity: 'repeated',
  ...overrides,
});

const prediction = (overrides: Partial<PredictionItem> = {}): PredictionItem => ({
  kind: 'emerging',
  title: 'Design systems',
  body: 'This topic is showing up more often.',
  why: '3 mentions across 2 days.',
  topicId: 't1',
  mentionCount: 3,
  dayCount: 2,
  maturity: 'pattern',
  evidence: [],
  ...overrides,
});

const dashboard = (overrides: Partial<DashboardSummary> = {}): DashboardSummary =>
  ({
    greeting: 'Good morning',
    daySummary: '1 memory',
    todayCount: 1,
    weekCount: 4,
    todayTopicCount: 1,
    todayProjectCount: 0,
    processingCount: 0,
    completedCount: 8,
    totalCount: 8,
    insight: insight(),
    sources: [],
    topics: [],
    activity: [],
    streak: { current: 0, longest: 0, capturedToday: false },
    habit: {
      dailyGoal: 0,
      todayProgress: 0,
      weekGoalDays: 0,
      weekDaysCompleted: 0,
      week: [],
    },
    recent: [],
    ...overrides,
  }) as DashboardSummary;

describe('discovery', () => {
  it('prefers dashboard insight for Kairos noticed', () => {
    const item = noticedDiscovery({
      dashboard: dashboard(),
      brief: null,
      predictions: [prediction()],
    });
    expect(item?.kind).toBe('repeated_interest');
    expect(item?.body).toContain('machine learning');
  });

  it('falls back to a prediction when insights are empty', () => {
    const item = noticedDiscovery({
      dashboard: dashboard({ insight: insight({ empty: true, body: '' }) }),
      brief: null,
      predictions: [prediction()],
    });
    expect(item?.kind).toBe('emerging_topic');
    expect(item?.title).toBe('Design systems');
  });

  it('does not crash when evidence is missing', () => {
    const item = noticedDiscovery({
      dashboard: dashboard({
        insight: insight({ evidence: undefined as never, observationCount: 4 }),
      }),
      brief: null,
      predictions: [],
    });
    expect(item?.body).toContain('machine learning');
  });

  it('omits predictions without evidence or why', () => {
    expect(
      predictionToDiscovery(
        prediction({ title: '', body: '', why: '', mentionCount: 0, dayCount: 0, evidence: [] }),
      ),
    ).toBeNull();
  });

  it('builds a bounded discovery list from real fields', () => {
    const brief: DailyBrief = {
      title: 'Brief',
      generatedAt: '2026-09-27T08:00:00.000Z',
      empty: false,
      yesterdayCount: 1,
      weekCount: 4,
      attentionTopics: [{ id: 't2', name: 'Redis', observationCount: 3 }],
      noticed: insight({ empty: true, body: '' }),
      revisit: prediction({ kind: 'revisit', title: 'Old notes', topicId: 't3' }),
    };
    const topics: ApiTopicSummary[] = [
      { id: 'e1', name: 'New thread', observationCount: 2, updatedAt: '2026-09-26T00:00:00.000Z' },
    ];
    const projects: ApiProjectSummary[] = [
      {
        id: 'p1',
        name: 'Kairos',
        description: null,
        observationCount: 4,
        createdAt: '2026-09-01T00:00:00.000Z',
        updatedAt: '2026-09-26T00:00:00.000Z',
      },
    ];
    const items = buildDiscoveries({
      dashboard: dashboard(),
      brief,
      predictions: [prediction()],
      topics,
      projects,
      now: new Date('2026-09-27T12:00:00.000Z'),
    });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.evidenceCount >= 1)).toBe(true);
    expect(items.some((item) => item.kind === 'project_momentum')).toBe(true);
  });

  it('classifies topics without ranking language', () => {
    const now = new Date('2026-09-27T12:00:00.000Z');
    const lanes = classifyTopics(
      [
        { id: 'a', name: 'Active', observationCount: 6, updatedAt: '2026-09-26T00:00:00.000Z' },
        { id: 'e', name: 'Emerging', observationCount: 2, updatedAt: '2026-09-25T00:00:00.000Z' },
        { id: 'q', name: 'Quiet', observationCount: 5, updatedAt: '2026-08-01T00:00:00.000Z' },
      ],
      now,
    );
    expect(lanes.active[0]?.name).toBe('Active');
    expect(lanes.emerging[0]?.name).toBe('Emerging');
    expect(lanes.quiet[0]?.name).toBe('Quiet');
  });

  it('uses similar+age for resurfacing copy', () => {
    const related: RelatedMemoryItem = {
      observationId: '1',
      filename: 'old.txt',
      snippet: 'similar thought',
      capturedAt: '2026-03-01T00:00:00.000Z',
      sourceLabel: 'Note',
      score: 0.8,
      reasons: ['similar'],
    };
    expect(connectionCopy(related, new Date('2026-09-27T00:00:00.000Z'))).toContain(
      'something similar',
    );
  });

  it('builds ask prompts from real names', () => {
    expect(
      askPrompts({
        topics: [{ name: 'Redis' }],
        projects: [{ name: 'Kairos' }],
        weekCount: 3,
      }),
    ).toEqual([
      'What have I been saying about Redis?',
      'How is Kairos going?',
      'What did I capture this week?',
    ]);
  });
});
