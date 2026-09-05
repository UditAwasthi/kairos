import type {
  AnalyticsSummary,
  BehaviorEvent,
  CreateEventInput,
  CreateGoalInput,
  DashboardSummary,
  Evidence,
  Goal,
  GoalDetail,
  Pattern,
  Prediction,
  Recommendation,
  ScenarioInput,
  ScenarioResult,
  SubscriptionPlanInfo,
  Entitlement,
  TimeRange,
  UpdateEventInput,
} from '../types';
import { EVENT_TYPE_LABELS, getStore } from './mock/store';
import { delay, formatMinutes, isoDaysAgo, round, WEEKDAY_LABELS } from './utils';

function rangeDays(range: TimeRange): number {
  if (range === '7d') return 7;
  if (range === '30d') return 30;
  return 90;
}

function eventsInRange(events: BehaviorEvent[], days: number): BehaviorEvent[] {
  const cutoff = new Date(isoDaysAgo(days - 1, 0, 0)).getTime();
  return events.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export const eventsService = {
  async list(): Promise<BehaviorEvent[]> {
    await delay();
    return [...getStore().events];
  },

  async get(id: string): Promise<BehaviorEvent> {
    await delay(280);
    const event = getStore().events.find((e) => e.id === id);
    if (!event) throw new Error('Event not found');
    return event;
  },

  async create(input: CreateEventInput): Promise<BehaviorEvent> {
    await delay(500);
    const now = new Date().toISOString();
    const event: BehaviorEvent = {
      id: `evt-user-${Date.now()}`,
      type: input.type,
      timestamp: input.timestamp,
      title: input.title || EVENT_TYPE_LABELS[input.type],
      meta: input.meta,
      createdAt: now,
      updatedAt: now,
    };
    getStore().events.unshift(event);
    return event;
  },

  async update(id: string, input: UpdateEventInput): Promise<BehaviorEvent> {
    await delay(450);
    const store = getStore();
    const index = store.events.findIndex((e) => e.id === id);
    if (index < 0) throw new Error('Event not found');
    const current = store.events[index]!;
    const updated: BehaviorEvent = {
      ...current,
      ...input,
      meta: (input.meta ?? current.meta) as BehaviorEvent['meta'],
      updatedAt: new Date().toISOString(),
    };
    store.events[index] = updated;
    return updated;
  },

  async remove(id: string): Promise<void> {
    await delay(350);
    const store = getStore();
    store.events = store.events.filter((e) => e.id !== id);
  },
};

export const analyticsService = {
  async getSummary(range: TimeRange = '30d'): Promise<AnalyticsSummary> {
    await delay();
    const days = rangeDays(range);
    const events = eventsInRange(getStore().events, days);

    const study = events.filter((e) => e.type === 'study');
    const sleep = events.filter((e) => e.type === 'sleep');
    const exercise = events.filter((e) => e.type === 'exercise');
    const tasks = events.filter((e) => e.type === 'task');
    const productivity = events.filter((e) => e.type === 'productivity');

    const avgStudy =
      study.length === 0
        ? 0
        : study.reduce((s, e) => s + (e.meta as { durationMinutes: number }).durationMinutes, 0) /
          study.length;
    const avgProd =
      productivity.length === 0
        ? 0
        : productivity.reduce((s, e) => s + (e.meta as { score: number }).score, 0) /
          productivity.length;
    const avgSleep =
      sleep.length === 0
        ? 0
        : sleep.reduce((s, e) => s + (e.meta as { durationMinutes: number }).durationMinutes, 0) /
          sleep.length /
          60;
    const avgExercise =
      exercise.length === 0
        ? 0
        : exercise.reduce((s, e) => s + (e.meta as { durationMinutes: number }).durationMinutes, 0) /
          Math.max(days / 7, 1);
    const taskRate =
      tasks.length === 0
        ? 0
        : tasks.filter((e) => (e.meta as { completed: boolean }).completed).length / tasks.length;

    const byDay = new Map<string, { study: number; sleep: number; tasksDone: number; tasksTotal: number; prod: number; prodN: number }>();
    for (let i = days - 1; i >= 0; i--) {
      byDay.set(isoDaysAgo(i).slice(0, 10), {
        study: 0,
        sleep: 0,
        tasksDone: 0,
        tasksTotal: 0,
        prod: 0,
        prodN: 0,
      });
    }

    for (const e of events) {
      const key = dayKey(e.timestamp);
      const bucket = byDay.get(key);
      if (!bucket) continue;
      if (e.type === 'study') bucket.study += (e.meta as { durationMinutes: number }).durationMinutes;
      if (e.type === 'sleep') bucket.sleep = (e.meta as { durationMinutes: number }).durationMinutes / 60;
      if (e.type === 'task') {
        bucket.tasksTotal += 1;
        if ((e.meta as { completed: boolean }).completed) bucket.tasksDone += 1;
      }
      if (e.type === 'productivity') {
        bucket.prod += (e.meta as { score: number }).score;
        bucket.prodN += 1;
      }
    }

    const dates = [...byDay.keys()];
    const productivityOverTime = dates.map((date) => {
      const b = byDay.get(date)!;
      return { date, value: b.prodN ? round(b.prod / b.prodN, 2) : 0 };
    });
    const studyDuration = dates.map((date) => ({ date, value: byDay.get(date)!.study }));
    const sleepDuration = dates.map((date) => ({
      date,
      value: round(byDay.get(date)!.sleep, 2),
    }));
    const taskCompletion = dates.map((date) => {
      const b = byDay.get(date)!;
      return { date, value: b.tasksTotal ? round(b.tasksDone / b.tasksTotal, 2) : 0 };
    });

    const weekdayAcc = Array.from({ length: 7 }, () => ({ sum: 0, n: 0 }));
    for (const point of productivityOverTime) {
      if (point.value === 0) continue;
      const wd = new Date(point.date).getDay();
      weekdayAcc[wd]!.sum += point.value;
      weekdayAcc[wd]!.n += 1;
    }
    const productivityByWeekday = weekdayAcc.map((a, weekday) => ({
      weekday,
      label: WEEKDAY_LABELS[weekday]!,
      value: a.n ? round(a.sum / a.n, 2) : 0,
    }));

    const hourAcc = Array.from({ length: 24 }, () => ({ sum: 0, n: 0 }));
    for (const e of study) {
      const hour = new Date(e.timestamp).getHours();
      const prod = (e.meta as { productivity: number }).productivity;
      hourAcc[hour]!.sum += prod;
      hourAcc[hour]!.n += 1;
    }
    const productivityByHour = hourAcc.map((a, hour) => ({
      hour,
      value: a.n ? round(a.sum / a.n, 2) : 0,
    }));

    const expected = days * 4;
    const recorded = events.length;
    const completeness = clampPct(recorded / expected);

    return {
      range,
      metrics: [
        { key: 'study', label: 'Avg study', value: round(avgStudy), unit: 'min' },
        { key: 'productivity', label: 'Productivity', value: round(avgProd, 1), unit: '/5' },
        { key: 'sleep', label: 'Avg sleep', value: round(avgSleep, 1), unit: 'h' },
        { key: 'exercise', label: 'Exercise / wk', value: round(avgExercise), unit: 'min' },
        { key: 'tasks', label: 'Task completion', value: round(taskRate * 100), unit: '%' },
      ],
      productivityOverTime,
      studyDuration,
      sleepDuration,
      taskCompletion,
      productivityByWeekday,
      productivityByHour,
      dataCompleteness: completeness,
      expectedObservations: expected,
      recordedObservations: recorded,
    };
  },
};

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 100)));
}

export const patternsService = {
  async list(): Promise<Pattern[]> {
    await delay();
    return [...getStore().patterns];
  },
};

export const predictionsService = {
  async getPrimary(): Promise<Prediction> {
    await delay();
    return { ...getStore().prediction };
  },

  async getById(id: string): Promise<Prediction> {
    await delay(300);
    const p = getStore().prediction;
    if (p.id !== id) throw new Error('Prediction not found');
    return { ...p };
  },
};

export const scenariosService = {
  async simulate(inputs: ScenarioInput): Promise<ScenarioResult> {
    await delay(500);
    const baseline = getStore().prediction.estimatedMinutes;
    // Deterministic mock response surface — not a real model
    const sleepDelta = (inputs.sleepHours - 7.5) * 12;
    const studyDelta = (inputs.studyHours - 2) * 8;
    const exerciseDelta = (inputs.exerciseMinutes - 30) * 0.15;
    const taskDelta = (inputs.taskCompletionRate - 0.75) * 20;
    const scenario = Math.round(
      Math.max(30, baseline + sleepDelta + studyDelta + exerciseDelta + taskDelta),
    );

    return {
      currentEstimateMinutes: baseline,
      scenarioEstimateMinutes: scenario,
      differenceMinutes: scenario - baseline,
      inputs,
      disclaimer: 'This is an estimate, not a causal guarantee.',
    };
  },
};

export const evidenceService = {
  async get(): Promise<Evidence> {
    await delay();
    const p = getStore().prediction;
    return {
      observationWindowDays: p.observationWindowDays,
      sampleSize: p.sampleSize,
      features: [...p.features],
      baseline: 'Historical mean',
      candidateModel: `${p.modelName} ${p.modelVersion}`,
      evaluation: {
        mae: p.evaluationMaeMinutes,
        rmse: p.evaluationRmseMinutes,
        r2: p.evaluationR2,
      },
      uncertaintyMinutes: p.uncertaintyMinutes,
      limitations: [...p.limitations],
      calculationNotes: [
        'Features are aggregated from the last observation window.',
        'Baseline is the mean productive study time over the same window.',
        'Candidate model is evaluated with chronological holdout (mock metrics).',
        'Uncertainty band reflects residual error from evaluation (mock).',
      ],
    };
  },
};

export const recommendationsService = {
  async list(): Promise<Recommendation[]> {
    await delay();
    return getStore().recommendations.map((r) => ({ ...r }));
  },

  async feedback(id: string, value: 'helpful' | 'not_helpful'): Promise<Recommendation> {
    await delay(300);
    const rec = getStore().recommendations.find((r) => r.id === id);
    if (!rec) throw new Error('Recommendation not found');
    rec.feedback = value;
    return { ...rec };
  },
};

export const goalsService = {
  async list(): Promise<Goal[]> {
    await delay();
    return getStore().goals.map((g) => ({ ...g }));
  },

  async get(id: string): Promise<GoalDetail> {
    await delay(320);
    const goal = getStore().goals.find((g) => g.id === id);
    if (!goal) throw new Error('Goal not found');

    const history = Array.from({ length: 14 }, (_, i) => {
      const day = 13 - i;
      const progress = goal.current * ((i + 1) / 14) * (0.85 + (i % 3) * 0.05);
      return { date: isoDaysAgo(day).slice(0, 10), value: round(progress, 1) };
    });

    const related = getStore()
      .events.filter((e) => {
        if (goal.metricKey === 'study_minutes') return e.type === 'study';
        if (goal.metricKey === 'exercise_sessions') return e.type === 'exercise';
        if (goal.metricKey === 'sleep_hours') return e.type === 'sleep';
        return false;
      })
      .slice(0, 8)
      .map((e) => e.id);

    return {
      ...goal,
      history,
      relatedEventIds: related,
      trajectory:
        goal.current / goal.target >= 0.85
          ? 'On track relative to the deadline, based on recent pace.'
          : 'Slightly behind recent pace; additional sessions may help close the gap.',
    };
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    await delay(450);
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: input.title,
      metricKey: input.metricKey,
      target: input.target,
      current: 0,
      unit: input.unit,
      deadline: input.deadline,
      trend: 0,
      createdAt: new Date().toISOString(),
    };
    getStore().goals.unshift(goal);
    return goal;
  },
};

export const subscriptionsService = {
  async getEntitlement(): Promise<Entitlement> {
    await delay(250);
    const plan = getStore().entitlementPlan;
    const features =
      getStore().plans.find((p) => p.id === plan)?.features ?? [];
    return {
      plan,
      features,
      isActive: true,
      renewsAt: isoDaysAgo(-20),
    };
  },

  async listPlans(): Promise<SubscriptionPlanInfo[]> {
    await delay(200);
    return getStore().plans.map((p) => ({ ...p }));
  },

  async restorePurchases(): Promise<{ restored: boolean; message: string }> {
    await delay(600);
    return {
      restored: false,
      message:
        'No purchases to restore. Payment processing will be available when RevenueCat is connected.',
    };
  },

  hasFeature(plan: Entitlement['plan'], feature: 'predictions' | 'scenarios' | 'evidence' | 'advanced_analytics'): boolean {
    if (plan === 'premium' || plan === 'pro') return true;
    if (feature === 'predictions') return false;
    return false;
  },
};

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    await delay();
    const analytics = await analyticsService.getSummary('7d');
    const events = getStore().events.slice(0, 6);
    const patterns = getStore().patterns.slice(0, 3);
    const prediction = getStore().prediction;
    const scenario = await scenariosService.simulate({
      sleepHours: 8,
      studyHours: 2.5,
      exerciseMinutes: 40,
      taskCompletionRate: 0.8,
    });

    return {
      metrics: [
        {
          key: 'study',
          label: 'Study',
          value: analytics.metrics.find((m) => m.key === 'study')?.value ?? 0,
          unit: 'min avg',
        },
        {
          key: 'productivity',
          label: 'Productivity',
          value: analytics.metrics.find((m) => m.key === 'productivity')?.value ?? 0,
          unit: '/5',
        },
        {
          key: 'sleep',
          label: 'Sleep',
          value: analytics.metrics.find((m) => m.key === 'sleep')?.value ?? 0,
          unit: 'h avg',
        },
        {
          key: 'exercise',
          label: 'Exercise',
          value: analytics.metrics.find((m) => m.key === 'exercise')?.value ?? 0,
          unit: 'min/wk',
        },
        {
          key: 'tasks',
          label: 'Tasks',
          value: analytics.metrics.find((m) => m.key === 'tasks')?.value ?? 0,
          unit: '%',
        },
      ],
      recentEvents: events,
      recentPatterns: patterns,
      predictionPreview: prediction,
      scenarioPreview: {
        label: 'What if sleep + study increase slightly?',
        currentMinutes: scenario.currentEstimateMinutes,
        scenarioMinutes: scenario.scenarioEstimateMinutes,
      },
      evidencePreview: {
        sampleSize: prediction.sampleSize,
        completeness: analytics.dataCompleteness,
      },
    };
  },
};

export const privacyService = {
  async exportData(): Promise<{ message: string }> {
    await delay(700);
    return {
      message:
        'Export is prepared in the mock layer. A downloadable archive will be available when the backend is connected.',
    };
  },

  async requestDeletion(): Promise<{ message: string }> {
    await delay(700);
    getStore().deleted = true;
    return {
      message:
        'Deletion request recorded locally for this demo. Server-side deletion will be enforced when the backend privacy API is available.',
    };
  },
};

export function formatPredictionMinutes(minutes: number): string {
  return formatMinutes(minutes);
}
