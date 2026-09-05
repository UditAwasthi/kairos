import {
  analyticsService,
  eventsService,
  predictionsService,
  scenariosService,
  subscriptionsService,
} from '../services';
import { resetStore } from '../services/mock/store';

describe('mock services', () => {
  beforeEach(() => {
    resetStore();
  });

  it('lists coherent timeline events', async () => {
    const events = await eventsService.list();
    expect(events.length).toBeGreaterThan(50);
    expect(events[0]?.timestamp >= events[events.length - 1]!.timestamp).toBe(true);
  });

  it('returns analytics for ranges', async () => {
    const summary = await analyticsService.getSummary('7d');
    expect(summary.metrics.length).toBe(5);
    expect(summary.dataCompleteness).toBeGreaterThan(0);
  });

  it('returns a primary prediction with baseline distinct from estimate', async () => {
    const prediction = await predictionsService.getPrimary();
    expect(prediction.estimatedMinutes).not.toBe(prediction.historicalBaselineMinutes);
    expect(prediction.sampleSize).toBeGreaterThan(0);
  });

  it('simulates scenarios without claiming causality', async () => {
    const result = await scenariosService.simulate({
      sleepHours: 8,
      studyHours: 2.5,
      exerciseMinutes: 40,
      taskCompletionRate: 0.85,
    });
    expect(result.disclaimer.toLowerCase()).toContain('not a causal');
    expect(typeof result.scenarioEstimateMinutes).toBe('number');
  });

  it('exposes subscription plans and restore messaging', async () => {
    const plans = await subscriptionsService.listPlans();
    const restore = await subscriptionsService.restorePurchases();
    expect(plans.map((p) => p.id)).toEqual(['free', 'pro', 'premium']);
    expect(restore.restored).toBe(false);
  });
});
