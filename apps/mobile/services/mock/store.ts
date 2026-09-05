import type {
  BehaviorEvent,
  EventType,
  Goal,
  Pattern,
  Prediction,
  Recommendation,
  SubscriptionPlanInfo,
} from '../../types';
import { clamp, createRng, isoDaysAgo, pick, round } from '../utils';

const SUBJECTS = ['Algorithms', 'Systems', 'Math', 'Writing', 'Design'] as const;
const EXERCISES = ['Run', 'Strength', 'Yoga', 'Walk', 'Cycling'] as const;
const HABITS = ['Meditate', 'Journal', 'Read', 'Stretch'] as const;
const TASK_CATS = ['Work', 'Personal', 'Learning', 'Health'] as const;
const MOODS = [
  { score: 2, label: 'Low' },
  { score: 3, label: 'Okay' },
  { score: 4, label: 'Good' },
  { score: 5, label: 'Great' },
] as const;
const SPEND_CATS = ['Food', 'Transport', 'Books', 'Subscriptions'] as const;
const SCREEN_CATS = ['Social', 'Productivity', 'Entertainment', 'Learning'] as const;

function eventId(day: number, index: number): string {
  return `evt-${String(day).padStart(2, '0')}-${String(index).padStart(2, '0')}`;
}

function buildDayEvents(day: number, rng: () => number): BehaviorEvent[] {
  const events: BehaviorEvent[] = [];
  const weekday = new Date(isoDaysAgo(day)).getDay();
  const isWeekend = weekday === 0 || weekday === 6;

  // Sleep — slightly better mid-week
  const sleepHours = clamp(7.1 + (weekday >= 1 && weekday <= 4 ? 0.4 : -0.3) + (rng() - 0.5) * 0.8, 5.5, 9);
  const sleepStartHour = 23;
  const wakeHour = Math.floor((sleepStartHour + sleepHours) % 24);
  const wakeMin = Math.round((sleepHours % 1) * 60);
  const sleepTs = isoDaysAgo(day, wakeHour, wakeMin);
  events.push({
    id: eventId(day, 0),
    type: 'sleep',
    timestamp: sleepTs,
    title: `Sleep · ${round(sleepHours, 1)}h`,
    meta: {
      sleepTime: isoDaysAgo(day + 1, sleepStartHour, 15),
      wakeTime: sleepTs,
      quality: clamp(Math.round(3 + sleepHours - 6 + (rng() - 0.5)), 1, 5),
      durationMinutes: Math.round(sleepHours * 60),
    },
    createdAt: sleepTs,
    updatedAt: sleepTs,
  });

  // Study — higher on weekdays, correlated with sleep
  if (!isWeekend || rng() > 0.35) {
    const base = isWeekend ? 70 : 110;
    const sleepBonus = (sleepHours - 7) * 25;
    const duration = Math.round(clamp(base + sleepBonus + (rng() - 0.5) * 40, 25, 210));
    const productivity = clamp(
      round(3.2 + (sleepHours - 7) * 0.5 + (weekday === 2 || weekday === 3 ? 0.4 : 0) + (rng() - 0.5) * 0.6, 1),
      1,
      5,
    );
    const studyHour = isWeekend ? 10 : 9;
    const studyTs = isoDaysAgo(day, studyHour, Math.floor(rng() * 40));
    events.push({
      id: eventId(day, 1),
      type: 'study',
      timestamp: studyTs,
      title: `Study · ${pick(rng, SUBJECTS)}`,
      meta: {
        durationMinutes: duration,
        subject: pick(rng, SUBJECTS),
        productivity,
        notes: productivity >= 4 ? 'Focused session' : 'Some distraction',
      },
      createdAt: studyTs,
      updatedAt: studyTs,
    });
  }

  // Exercise — 4–5x / week pattern
  if (rng() > (isWeekend ? 0.25 : 0.45)) {
    const intensity = pick(rng, ['low', 'moderate', 'high'] as const);
    const duration = intensity === 'high' ? 45 + Math.floor(rng() * 20) : 25 + Math.floor(rng() * 25);
    const exTs = isoDaysAgo(day, 17, Math.floor(rng() * 50));
    events.push({
      id: eventId(day, 2),
      type: 'exercise',
      timestamp: exTs,
      title: `Exercise · ${pick(rng, EXERCISES)}`,
      meta: {
        exerciseType: pick(rng, EXERCISES),
        durationMinutes: duration,
        intensity,
      },
      createdAt: exTs,
      updatedAt: exTs,
    });
  }

  // Tasks
  const taskCount = isWeekend ? 1 + Math.floor(rng() * 2) : 2 + Math.floor(rng() * 3);
  for (let i = 0; i < taskCount; i++) {
    const completed = rng() > (isWeekend ? 0.25 : 0.2);
    const ts = isoDaysAgo(day, 14 + i, Math.floor(rng() * 50));
    events.push({
      id: eventId(day, 10 + i),
      type: 'task',
      timestamp: ts,
      title: completed ? 'Task completed' : 'Task open',
      meta: {
        title: pick(rng, ['Review notes', 'Ship draft', 'Inbox zero', 'Plan week', 'Read paper'] as const),
        completed,
        category: pick(rng, TASK_CATS),
      },
      createdAt: ts,
      updatedAt: ts,
    });
  }

  // Habit
  if (rng() > 0.3) {
    const ts = isoDaysAgo(day, 7, 20);
    events.push({
      id: eventId(day, 20),
      type: 'habit',
      timestamp: ts,
      title: `Habit · ${pick(rng, HABITS)}`,
      meta: {
        habitName: pick(rng, HABITS),
        completed: rng() > 0.15,
      },
      createdAt: ts,
      updatedAt: ts,
    });
  }

  // Productivity score (end of day)
  {
    const sleepFactor = (sleepHours - 6.5) / 2;
    const score = clamp(round(3.4 + sleepFactor + (isWeekend ? -0.2 : 0.3) + (rng() - 0.5) * 0.8, 1), 1, 5);
    const ts = isoDaysAgo(day, 21, 30);
    events.push({
      id: eventId(day, 30),
      type: 'productivity',
      timestamp: ts,
      title: `Productivity · ${score}/5`,
      meta: { score, notes: score >= 4 ? 'Strong day' : 'Average day' },
      createdAt: ts,
      updatedAt: ts,
    });
  }

  // Mood (sparse)
  if (rng() > 0.55) {
    const mood = pick(rng, MOODS);
    const ts = isoDaysAgo(day, 20, 10);
    events.push({
      id: eventId(day, 40),
      type: 'mood',
      timestamp: ts,
      title: `Mood · ${mood.label}`,
      meta: { score: mood.score, label: mood.label },
      createdAt: ts,
      updatedAt: ts,
    });
  }

  // Screen time
  if (rng() > 0.4) {
    const ts = isoDaysAgo(day, 22, 0);
    events.push({
      id: eventId(day, 50),
      type: 'screen_time',
      timestamp: ts,
      title: 'Screen time',
      meta: {
        durationMinutes: Math.round(60 + rng() * 140),
        category: pick(rng, SCREEN_CATS),
      },
      createdAt: ts,
      updatedAt: ts,
    });
  }

  // Spending (sparse)
  if (rng() > 0.7) {
    const ts = isoDaysAgo(day, 13, 15);
    events.push({
      id: eventId(day, 60),
      type: 'spending',
      timestamp: ts,
      title: 'Spending',
      meta: {
        amount: round(8 + rng() * 40, 2),
        currency: 'USD',
        category: pick(rng, SPEND_CATS),
      },
      createdAt: ts,
      updatedAt: ts,
    });
  }

  // Observation (sparse)
  if (rng() > 0.75) {
    const ts = isoDaysAgo(day, 19, 45);
    events.push({
      id: eventId(day, 70),
      type: 'observation',
      timestamp: ts,
      title: 'Observation',
      meta: {
        text: pick(rng, [
          'Deep focus after morning walk.',
          'Harder to concentrate after late night.',
          'Shorter study blocks felt more consistent.',
          'Afternoon energy dipped after long meetings.',
        ] as const),
      },
      createdAt: ts,
      updatedAt: ts,
    });
  }

  return events;
}

/** Mutable in-memory store — deterministic seed, coherent timeline. */
export function createMockStore() {
  const rng = createRng(20260305);
  const events: BehaviorEvent[] = [];

  for (let day = 29; day >= 0; day--) {
    events.push(...buildDayEvents(day, rng));
  }

  events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  const patterns: Pattern[] = [
    {
      id: 'pat-1',
      title: 'Most productive hours',
      observation:
        'Higher productivity scores are associated with morning study blocks between 9–11.',
      supportingMetric: 'Avg productivity 4.2 / 5 in 9–11 window',
      observationWindow: '30 days',
      sampleSize: 87,
      evidenceStrength: 'moderate',
    },
    {
      id: 'pat-2',
      title: 'Strongest days',
      observation:
        'Tue and Wed show higher recorded productive study time in your data.',
      supportingMetric: '+28 min vs weekly mean',
      observationWindow: '30 days',
      sampleSize: 87,
      evidenceStrength: 'moderate',
    },
    {
      id: 'pat-3',
      title: 'Study / productivity association',
      observation:
        'Days with 90–150 minutes of study are associated with higher end-of-day productivity scores.',
      supportingMetric: 'r ≈ 0.41 (observational)',
      observationWindow: '30 days',
      sampleSize: 64,
      evidenceStrength: 'limited',
    },
    {
      id: 'pat-4',
      title: 'Sleep / productivity association',
      observation:
        'Sleep duration near 7.5–8h is associated with higher next-day productivity in your recorded data.',
      supportingMetric: '+0.6 score vs <6.5h nights',
      observationWindow: '30 days',
      sampleSize: 30,
      evidenceStrength: 'limited',
    },
    {
      id: 'pat-5',
      title: 'Consistency trend',
      observation:
        'Task completion consistency improved over the last two weeks relative to the prior two.',
      supportingMetric: '+12% completion rate',
      observationWindow: '28 days',
      sampleSize: 72,
      evidenceStrength: 'moderate',
    },
  ];

  const prediction: Prediction = {
    id: 'pred-next-day-study',
    title: "Tomorrow's productive study time",
    targetLabel: 'Next-day productive study time',
    estimatedMinutes: 144,
    uncertaintyMinutes: 31,
    historicalBaselineMinutes: 121,
    modelName: 'Random Forest',
    modelVersion: 'v1',
    evaluationMaeMinutes: 24,
    evaluationRmseMinutes: 31,
    evaluationR2: 0.42,
    observationWindowDays: 30,
    sampleSize: 87,
    features: [
      'sleep',
      'study duration',
      'exercise',
      'task completion',
      'day of week',
      'time of day',
    ],
    limitations: [
      'Estimate is based on observational associations, not causal effects.',
      'Sample size is modest; uncertainty remains material.',
      'Unmeasured factors (meetings, illness, travel) are not included.',
      'Past patterns may not hold if routines change.',
    ],
    inputs: [
      { label: 'Last night sleep', value: '7h 42m' },
      { label: 'Yesterday study', value: '2h 05m' },
      { label: 'Exercise yesterday', value: '35m' },
      { label: 'Task completion (7d)', value: '78%' },
      { label: 'Day of week', value: 'Saturday → Sunday' },
    ],
    createdAt: new Date().toISOString(),
  };

  const recommendations: Recommendation[] = [
    {
      id: 'rec-1',
      recommendation:
        'Your recorded data shows higher completion consistency during shorter focused sessions.',
      supportingEvidence:
        'Sessions under 90 minutes are associated with higher task completion in the last 30 days.',
      dataWindow: '30 days',
      evidenceStrength: 'limited',
      action: 'Try a 60–90 minute focused block tomorrow morning.',
      feedback: null,
    },
    {
      id: 'rec-2',
      recommendation:
        'Sleep near 7.5–8 hours is associated with higher next-day productivity scores in your data.',
      supportingEvidence:
        'Nights in that range show +0.6 average productivity vs nights under 6.5 hours.',
      dataWindow: '30 days',
      evidenceStrength: 'limited',
      action: 'Aim for a consistent bedtime that yields ~7.5–8h.',
      feedback: null,
    },
    {
      id: 'rec-3',
      recommendation:
        'Tue–Wed mornings appear among your stronger productivity windows.',
      supportingEvidence:
        'Average productive study time is higher mid-week in the observed sample.',
      dataWindow: '30 days',
      evidenceStrength: 'moderate',
      action: 'Schedule demanding study blocks for Tue or Wed morning when possible.',
      feedback: null,
    },
  ];

  const goals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Study 20 hours this week',
      metricKey: 'study_minutes',
      target: 1200,
      current: 780,
      unit: 'min',
      deadline: isoDaysAgo(-2, 23, 59),
      trend: 0.08,
      createdAt: isoDaysAgo(6),
    },
    {
      id: 'goal-2',
      title: 'Complete 5 workouts',
      metricKey: 'exercise_sessions',
      target: 5,
      current: 3,
      unit: 'sessions',
      deadline: isoDaysAgo(-2, 23, 59),
      trend: 0.05,
      createdAt: isoDaysAgo(6),
    },
    {
      id: 'goal-3',
      title: 'Maintain 7h average sleep',
      metricKey: 'sleep_hours',
      target: 7,
      current: 7.3,
      unit: 'hours',
      deadline: isoDaysAgo(-2, 23, 59),
      trend: 0.02,
      createdAt: isoDaysAgo(13),
    },
  ];

  const plans: SubscriptionPlanInfo[] = [
    {
      id: 'free',
      name: 'Free',
      priceLabel: '$0',
      features: ['Tracking', 'Basic analytics', 'Limited predictions'],
    },
    {
      id: 'pro',
      name: 'Pro',
      priceLabel: '$9.99/mo',
      highlighted: true,
      features: [
        'Advanced analytics',
        'Predictions',
        'Scenario simulations',
        'Evidence inspection',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      priceLabel: '$19.99/mo',
      features: [
        'Everything in Pro',
        'Advanced longitudinal analysis',
        'Priority model updates',
      ],
    },
  ];

  return {
    events,
    patterns,
    prediction,
    recommendations,
    goals,
    plans,
    entitlementPlan: 'pro' as const,
    deleted: false,
  };
}

export type MockStore = ReturnType<typeof createMockStore>;

let store: MockStore | null = null;

export function getStore(): MockStore {
  if (!store) {
    store = createMockStore();
  }
  return store;
}

export function resetStore(): void {
  store = createMockStore();
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  study: 'Study',
  sleep: 'Sleep',
  exercise: 'Exercise',
  habit: 'Habit',
  task: 'Task',
  productivity: 'Productivity',
  mood: 'Mood',
  screen_time: 'Screen time',
  spending: 'Spending',
  observation: 'Observation',
};
