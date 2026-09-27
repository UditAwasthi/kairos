import {
  connectionCount,
  exploreTopics,
  greetingAccent,
  greetingParts,
  greetingWhisper,
  homeBriefCopy,
  homeDashboardCopy,
  homeNudge,
  homePredictionItem,
  homeProjectPreview,
  homeStatusLine,
  lastRemembered,
  memoryTitle,
  noticedInsight,
  personalGreeting,
  recentRail,
  rememberedStamp,
  rememberedTags,
  resurfacedMemory,
  resurfacedOptions,
  todayPulseStats,
  weekDays,
  worldEdges,
  worldGraph,
  worldNodes,
} from '../lib/homeSummary';
import type { ApiObservation, DailyBrief, DashboardSummary, PredictionItem, TodayInsight } from '../lib/api';

const insight = (overrides: Partial<TodayInsight> = {}): TodayInsight => ({
  title: 'Something I noticed',
  body: "I've noticed you returning to Machine Learning across 4 of 12 recent memories.",
  generatedAt: '2026-09-27T08:00:00.000Z',
  observationCount: 12,
  empty: false,
  evidence: [],
  why: 'Repeated topic this week.',
  maturity: 'repeated',
  ...overrides,
});

const observation = (overrides: Partial<ApiObservation> = {}): ApiObservation =>
  ({
    id: '1',
    filename: 'note.txt',
    mimeType: 'text/plain',
    type: 'TEXT',
    status: 'COMPLETED',
    createdAt: '2026-09-27T10:00:00.000Z',
    updatedAt: '2026-09-27T10:00:00.000Z',
    capturedAt: '2026-09-27T10:00:00.000Z',
    extractedText: null,
    summary: 'A morning thought',
    processingError: null,
    sourceMetadata: null,
    metadata: {
      filename: 'note.txt',
      mimeType: 'text/plain',
      fileSizeBytes: 12,
      pageCount: null,
      characterCount: null,
      wordCount: null,
      chunkCount: null,
    },
    topics: [],
    entities: [],
    projects: [],
    chunkCount: 0,
    ...overrides,
  }) as ApiObservation;

const dashboard = (overrides: Partial<DashboardSummary> = {}): DashboardSummary => ({
  greeting: 'Good morning',
  daySummary: '1 memory',
  todayCount: 2,
  weekCount: 5,
  todayTopicCount: 1,
  todayProjectCount: 0,
  processingCount: 0,
  completedCount: 4,
  totalCount: 4,
  insight: insight(),
  sources: [],
  topics: [{ id: 'topic-1', name: 'Machine Learning', observationCount: 4 }],
  activity: [],
  streak: { current: 1, longest: 1, capturedToday: true },
  habit: {
    dailyGoal: 1,
    todayProgress: 1,
    weekGoalDays: 5,
    weekDaysCompleted: 2,
    week: [
      { date: '2026-09-21', label: 'M', done: false, count: 0 },
      { date: '2026-09-22', label: 'T', done: true, count: 2 },
      { date: '2026-09-23', label: 'W', done: true, count: 3 },
      { date: '2026-09-24', label: 'T', done: false, count: 0 },
      { date: '2026-09-25', label: 'F', done: false, count: 0 },
      { date: '2026-09-26', label: 'S', done: false, count: 0 },
      { date: '2026-09-27', label: 'S', done: false, count: 0 },
    ],
  },
  recent: [],
  ...overrides,
});

describe('home summary', () => {
  it('joins the server greeting with the user name', () => {
    expect(personalGreeting('Good morning', 'Nikhil')).toBe('Good morning, Nikhil.');
    expect(greetingParts('Good evening.', 'Ada')).toEqual({ period: 'Good evening', name: 'Ada' });
    expect(greetingAccent('Good evening')).toEqual({ lead: 'Good', accent: 'evening' });
    expect(greetingAccent('Hello')).toEqual({ lead: '', accent: 'Hello' });
  });

  it('uses a real streak or sync line and invents nothing', () => {
    expect(homeStatusLine({ streak: 3, processingCount: 0 })).toBe('3-day recall streak');
    expect(homeStatusLine({ streak: 1, processingCount: 2 })).toBe('1-day recall streak');
    expect(homeStatusLine({ streak: 0, processingCount: 0 })).toBeNull();
    expect(homeStatusLine({ streak: 0, processingCount: 2, syncText: 'Syncing 1 capture…' })).toBe(
      'Syncing 1 capture…',
    );
  });

  it('keeps dashboard, brief, predictions, and projects grounded in real data', () => {
    expect(homeDashboardCopy(null)).toEqual({ body: 'No memories yet', hint: null });
    expect(homeDashboardCopy(dashboard({ daySummary: '2 memories', todayCount: 2, weekCount: 5 }))).toEqual({
      body: '2 memories',
      hint: '2 today · 5 this week',
    });

    const prediction: PredictionItem = {
      kind: 'revisit',
      title: 'Return to the kitchen note',
      body: 'You left a plan unfinished.',
      why: 'Repeated this week.',
      maturity: 'repeated',
      evidence: [],
    };
    expect(homePredictionItem([])).toBeNull();
    expect(homePredictionItem([prediction])?.title).toBe('Return to the kitchen note');

    const brief = (overrides: Partial<DailyBrief> = {}): DailyBrief => ({
      title: 'Monday brief',
      generatedAt: '2026-09-27T08:00:00.000Z',
      empty: false,
      yesterdayCount: 1,
      weekCount: 4,
      attentionTopics: [{ id: 't1', name: 'Kitchen', observationCount: 2 }],
      noticed: insight({ empty: true, body: '' }),
      revisit: null,
      ...overrides,
    });
    expect(homeBriefCopy(brief({ empty: true }))).toEqual({ body: 'No brief yet', hint: null });
    expect(homeBriefCopy(brief()).body).toBe('Kitchen');
    expect(homeBriefCopy(brief()).hint).toBe('1 yesterday · 4 this week');

    expect(homeProjectPreview([])).toEqual([]);
    expect(
      homeProjectPreview([
        {
          id: 'p1',
          name: 'Kairos',
          description: null,
          observationCount: 3,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ]).map((item) => item.id),
    ).toEqual(['p1']);
  });

  it('prefers a real summary over a filename', () => {
    expect(memoryTitle('note.txt', 'Finish the kitchen before summer.')).toBe(
      'Finish the kitchen before summer.',
    );
    expect(memoryTitle('scan_page.pdf', null)).toBe('scan page');
  });

  it('omits empty or invented insights', () => {
    expect(noticedInsight(insight({ empty: true }))).toBeNull();
    expect(noticedInsight(insight({ body: '   ' }))).toBeNull();
    expect(noticedInsight(insight())?.body).toContain('Machine Learning');
  });

  it('picks the latest completed memory only', () => {
    const last = lastRemembered([
      {
        id: '1',
        filename: 'draft.txt',
        source: 'MANUAL',
        sourceLabel: 'Note',
        capturedAt: '2026-09-27T10:00:00.000Z',
        summary: 'Still settling',
        status: 'PROCESSING',
      },
      {
        id: '2',
        filename: 'kept.txt',
        source: 'MANUAL',
        sourceLabel: 'Note',
        capturedAt: '2026-09-26T10:00:00.000Z',
        summary: 'Kept thought',
        status: 'COMPLETED',
      },
    ]);
    expect(last?.id).toBe('2');
  });

  it('resurfaces a real memory and rotates among honest strategies', () => {
    const items = [
      observation({ id: 'newest', capturedAt: '2026-09-27T10:00:00.000Z' }),
      observation({
        id: 'connected',
        capturedAt: '2026-09-20T10:00:00.000Z',
        topics: [{ id: 't1', name: 'ML', confidence: 0.8 }],
        projects: [{ id: 'p1', name: 'Kairos' }],
      }),
      observation({
        id: 'older',
        capturedAt: '2026-09-10T10:00:00.000Z',
        topics: [{ id: 't2', name: 'Notes', confidence: 0.4 }],
      }),
      observation({ id: 'ancient', capturedAt: '2024-01-02T10:00:00.000Z' }),
      observation({ id: 'this-day', capturedAt: new Date(2025, 8, 27, 12).toISOString() }),
    ];
    const now = new Date(2026, 8, 27, 12);
    const options = resurfacedOptions(items, now);
    expect(options.map((item) => item.kind)).toEqual(
      expect.arrayContaining(['connected', 'oldest', 'on-this-day', 'kept']),
    );
    expect(options.find((item) => item.kind === 'connected')?.observation.id).toBe('connected');
    expect(options.find((item) => item.kind === 'on-this-day')?.observation.id).toBe('this-day');
    const picked = resurfacedMemory(items, now);
    expect(picked?.observation.id).toBeTruthy();
    expect(items.map((item) => item.id)).toContain(picked?.observation.id);
    expect(resurfacedMemory([])).toBeNull();
    expect(greetingWhisper('on-this-day')).toBe('On this day');
    expect(connectionCount(items[1])).toBe(2);
  });

  it('keeps the recent rail free of the resurfaced memory', () => {
    const items = recentRail(
      [
        observation({ id: 'a' }),
        observation({ id: 'b' }),
        observation({ id: 'c', status: 'PROCESSING' }),
      ],
      'a',
    );
    expect(items.map((item) => item.id)).toEqual(['b']);
  });

  it('caps explore chips and reports overflow', () => {
    const topics = Array.from({ length: 8 }, (_, index) => ({ id: String(index) }));
    expect(exploreTopics(topics, 6)).toEqual({
      shown: topics.slice(0, 6),
      overflow: 2,
    });
  });

  it('rotates one real nudge and never invents one', () => {
    expect(
      homeNudge({
        processingCount: 0,
        weekCount: 0,
        insight: insight({ empty: true }),
        topics: [],
      }),
    ).toBeNull();

    const monday = new Date('2026-09-21T12:00:00.000Z');
    const nudge = homeNudge({
      processingCount: 1,
      weekCount: 4,
      insight: insight(),
      topics: [{ id: 't1', name: 'Machine Learning' }],
      now: monday,
    });
    expect(nudge).not.toBeNull();
    expect(['settling', 'noticed', 'topic', 'ask']).toContain(nudge?.key);
  });

  it('uses real today counts for the pulse and does not invent a score', () => {
    const stats = todayPulseStats(dashboard({ todayCount: 8, todayTopicCount: 3, processingCount: 1 }));
    expect(stats.alive).toBe(true);
    expect(todayPulseStats(dashboard({ todayCount: 0, todayTopicCount: 0, processingCount: 0 })).alive).toBe(
      false,
    );
  });

  it('builds world nodes from real topics and projects only', () => {
    expect(worldNodes([], [])).toEqual([]);
    const linked = observation({
      topics: [{ id: 't1', name: 'Machine Learning', confidence: 0.9 }],
      projects: [{ id: 'p1', name: 'Kairos' }],
    });
    const graph = worldGraph(
      [{ id: 't1', name: 'Machine Learning', observationCount: 3 }],
      [
        {
          id: 'p1',
          name: 'Kairos',
          description: null,
          observationCount: 1,
          createdAt: '2026-09-01T00:00:00.000Z',
          updatedAt: '2026-09-01T00:00:00.000Z',
        },
      ],
      [linked],
    );
    expect(graph.nodes.map((node) => node.name)).toEqual(['Machine Learning', 'Kairos']);
    expect(worldEdges([linked], graph.nodes)).toEqual([{ from: 'topic-t1', to: 'project-p1' }]);
  });

  it('hides the week widget when there is no real activity', () => {
    expect(weekDays([], [], 0)).toEqual([]);
    expect(weekDays(dashboard().habit.week, [], 5)).toHaveLength(7);
  });

  it('formats a readable stamp and real tags only', () => {
    const stamp = rememberedStamp('2026-09-27T10:42:00.000Z', new Date('2026-09-27T12:00:00.000Z'));
    expect(stamp.startsWith('Today ·')).toBe(true);
    expect(rememberedTags(observation({
      topics: [{ id: 't1', name: 'Machine Learning', confidence: 0.9 }],
      projects: [{ id: 'p1', name: 'Kairos' }],
    }))).toEqual(['Kairos', 'Machine Learning']);
  });
});
