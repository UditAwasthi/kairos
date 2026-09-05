/** Domain types for Kairos. Mock services today; NestJS API later. */

export type EventType =
  | 'study'
  | 'sleep'
  | 'exercise'
  | 'habit'
  | 'task'
  | 'productivity'
  | 'mood'
  | 'screen_time'
  | 'spending'
  | 'observation';

export type EvidenceStrength = 'limited' | 'moderate' | 'strong';

export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
};

export type StudyEventMeta = {
  durationMinutes: number;
  subject: string;
  productivity: number;
  notes?: string;
};

export type SleepEventMeta = {
  sleepTime: string;
  wakeTime: string;
  quality: number;
  durationMinutes: number;
};

export type ExerciseEventMeta = {
  exerciseType: string;
  durationMinutes: number;
  intensity: 'low' | 'moderate' | 'high';
};

export type HabitEventMeta = {
  habitName: string;
  completed: boolean;
};

export type TaskEventMeta = {
  title: string;
  completed: boolean;
  category: string;
};

export type ProductivityEventMeta = {
  score: number;
  notes?: string;
};

export type MoodEventMeta = {
  score: number;
  label: string;
  notes?: string;
};

export type ScreenTimeEventMeta = {
  durationMinutes: number;
  category: string;
};

export type SpendingEventMeta = {
  amount: number;
  currency: string;
  category: string;
  notes?: string;
};

export type ObservationEventMeta = {
  text: string;
};

export type EventMetaMap = {
  study: StudyEventMeta;
  sleep: SleepEventMeta;
  exercise: ExerciseEventMeta;
  habit: HabitEventMeta;
  task: TaskEventMeta;
  productivity: ProductivityEventMeta;
  mood: MoodEventMeta;
  screen_time: ScreenTimeEventMeta;
  spending: SpendingEventMeta;
  observation: ObservationEventMeta;
};

export type BehaviorEvent<T extends EventType = EventType> = {
  id: string;
  type: T;
  timestamp: string;
  title: string;
  meta: EventMetaMap[T];
  createdAt: string;
  updatedAt: string;
};

export type CreateEventInput = {
  type: EventType;
  timestamp: string;
  title: string;
  meta: EventMetaMap[EventType];
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type TimeRange = '7d' | '30d' | '90d';

export type MetricSummary = {
  key: string;
  label: string;
  value: number;
  unit: string;
  trend?: number;
};

export type TimeSeriesPoint = {
  date: string;
  value: number;
};

export type HourlyPoint = {
  hour: number;
  value: number;
};

export type WeekdayPoint = {
  weekday: number;
  label: string;
  value: number;
};

export type AnalyticsSummary = {
  range: TimeRange;
  metrics: MetricSummary[];
  productivityOverTime: TimeSeriesPoint[];
  studyDuration: TimeSeriesPoint[];
  sleepDuration: TimeSeriesPoint[];
  taskCompletion: TimeSeriesPoint[];
  productivityByWeekday: WeekdayPoint[];
  productivityByHour: HourlyPoint[];
  dataCompleteness: number;
  expectedObservations: number;
  recordedObservations: number;
};

export type Pattern = {
  id: string;
  title: string;
  observation: string;
  supportingMetric: string;
  observationWindow: string;
  sampleSize: number;
  evidenceStrength: EvidenceStrength;
};

export type Prediction = {
  id: string;
  title: string;
  targetLabel: string;
  estimatedMinutes: number;
  uncertaintyMinutes: number;
  historicalBaselineMinutes: number;
  modelName: string;
  modelVersion: string;
  evaluationMaeMinutes: number;
  evaluationRmseMinutes: number;
  evaluationR2: number;
  observationWindowDays: number;
  sampleSize: number;
  features: string[];
  limitations: string[];
  inputs: { label: string; value: string }[];
  createdAt: string;
};

export type ScenarioInput = {
  sleepHours: number;
  studyHours: number;
  exerciseMinutes: number;
  taskCompletionRate: number;
};

export type ScenarioResult = {
  currentEstimateMinutes: number;
  scenarioEstimateMinutes: number;
  differenceMinutes: number;
  inputs: ScenarioInput;
  disclaimer: string;
};

export type Evidence = {
  observationWindowDays: number;
  sampleSize: number;
  features: string[];
  baseline: string;
  candidateModel: string;
  evaluation: {
    mae: number;
    rmse: number;
    r2: number;
  };
  uncertaintyMinutes: number;
  limitations: string[];
  calculationNotes: string[];
};

export type Recommendation = {
  id: string;
  recommendation: string;
  supportingEvidence: string;
  dataWindow: string;
  evidenceStrength: EvidenceStrength;
  action: string;
  feedback?: 'helpful' | 'not_helpful' | null;
};

export type Goal = {
  id: string;
  title: string;
  metricKey: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  trend: number;
  createdAt: string;
};

export type GoalDetail = Goal & {
  history: TimeSeriesPoint[];
  relatedEventIds: string[];
  trajectory: string;
};

export type CreateGoalInput = {
  title: string;
  metricKey: string;
  target: number;
  unit: string;
  deadline: string;
};

export type Entitlement = {
  plan: SubscriptionPlan;
  features: string[];
  renewsAt?: string;
  isActive: boolean;
};

export type SubscriptionPlanInfo = {
  id: SubscriptionPlan;
  name: string;
  priceLabel: string;
  features: string[];
  highlighted?: boolean;
};

export type DashboardSummary = {
  metrics: MetricSummary[];
  recentEvents: BehaviorEvent[];
  recentPatterns: Pattern[];
  predictionPreview: Prediction | null;
  scenarioPreview: {
    label: string;
    currentMinutes: number;
    scenarioMinutes: number;
  } | null;
  evidencePreview: {
    sampleSize: number;
    completeness: number;
  };
};

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };
