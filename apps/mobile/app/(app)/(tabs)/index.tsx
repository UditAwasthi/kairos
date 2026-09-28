import { useAuth, useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SurfaceCard } from '../../../components/ui/SectionHeader';
import { Badge } from '../../../components/ui/MetricCard';
import { AmbientBackground } from '../../../components/ui/system/AmbientBackground';
import { HeroStatusWidget } from '../../../components/ui/system/HeroStatusWidget';
import { InsightCard as SuggestionCard } from '../../../components/ui/system/InsightCard';
import { QuickActionGrid } from '../../../components/ui/system/QuickActionTile';
import { TopBar } from '../../../components/ui/system/TopBar';
import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import {
  fetchDailyBrief,
  fetchDashboard,
  fetchObservationsPage,
  fetchPredictions,
  fetchTodayInsight,
  observationStageLabel,
  observationStatusLabel,
  type ApiObservation,
  type DailyBrief,
  type DashboardSummary,
  type PredictionsSummary,
  type TodayInsight,
} from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useProgression } from '../../../providers/ProgressionProvider';
import { TabScreenSwipe } from '../../../components/TabScreenSwipe';
import { NetworkErrorScreen } from '../../../components/ui/NetworkStatus';
import { dedupeRequest, readQueryCache, writeQueryCache } from '../../../hooks/useAsync';
import { isStale } from '../../../lib/freshness';
import { onReconnect, useNetworkStatus } from '../../../lib/network';
import { PressScale } from '../../../components/ui/Motion';

/** Shared with the Dashboard / Brief / Predictions / Today screens so either side warms the other. */
const CACHE = {
  dashboard: 'dashboard',
  brief: 'brief',
  predictions: 'predictions',
  insight: 'today-insight',
  memories: 'today:memories',
} as const;
const FOCUS_REFRESH_MS = 30_000;

function withoutExtractedText(observation: ApiObservation): ApiObservation {
  return { ...observation, extractedText: null };
}

function getGreetingTime(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const HOME_ACTIONS = [
  { id: 'capture', label: 'Capture', icon: 'plus' as const, tint: 'amber' as const, route: '/(app)/quick-capture' },
  { id: 'ask', label: 'Ask', icon: 'message-circle' as const, tint: 'blue' as const, route: '/(app)/(tabs)/ask' },
  { id: 'search', label: 'Search', icon: 'search' as const, tint: 'teal' as const, route: '/(app)/search' },
  { id: 'recall', label: 'Recall', icon: 'eye' as const, tint: 'blue' as const, route: '/(app)/screen-memory' },
  { id: 'projects', label: 'Projects', icon: 'folder' as const, tint: 'amber' as const, route: '/(app)/projects' },
  { id: 'timeline', label: 'Timeline', icon: 'clock' as const, tint: 'teal' as const, route: '/(app)/timeline' },
];

const MEMORY_TYPE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  TEXT: 'edit-note',
  DOCUMENT: 'description',
  PDF: 'picture-as-pdf',
  IMAGE: 'image',
  AUDIO: 'mic',
};

export default function TodayScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, radius } = useAppTheme();
  const { progression, lastReward } = useProgression();
  const { online } = useNetworkStatus();
  const [dashboard, setDashboard] = useState(() => readQueryCache<DashboardSummary>(CACHE.dashboard));
  const [brief, setBrief] = useState(() => readQueryCache<DailyBrief>(CACHE.brief));
  const [todayInsight, setTodayInsight] = useState(() => readQueryCache<TodayInsight>(CACHE.insight));
  const [predictions, setPredictions] = useState(() => readQueryCache<PredictionsSummary>(CACHE.predictions));
  const [memories, setMemories] = useState<ApiObservation[]>(() => readQueryCache<ApiObservation[]>(CACHE.memories) ?? []);
  const [rawErrors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(() => !dashboard && !brief && !predictions);
  const [refreshing, setRefreshing] = useState(false);
  const lastLoadedAt = useRef(0);

  const load = useCallback(async () => {
    lastLoadedAt.current = Date.now();
    try {
      const token = await getToken();
      if (!token) return;
      const [dash, daily, predicted, insight, recent] = await Promise.allSettled([
        dedupeRequest(CACHE.dashboard, () => fetchDashboard(token)),
        dedupeRequest(CACHE.brief, () => fetchDailyBrief(token)),
        dedupeRequest(CACHE.predictions, () => fetchPredictions(token)),
        dedupeRequest(CACHE.insight, () => fetchTodayInsight(token)),
        fetchObservationsPage(token, { limit: 8 }),
      ]);
      const failed = (result: PromiseSettledResult<unknown>, key: string) =>
        result.status === 'rejected' && readQueryCache(key) == null;
      setErrors({
        dashboard: failed(dash, CACHE.dashboard),
        brief: failed(daily, CACHE.brief),
        predictions: failed(predicted, CACHE.predictions),
        insight: failed(insight, CACHE.insight),
        memories: failed(recent, CACHE.memories),
      });
      if (dash.status === 'fulfilled') { setDashboard(dash.value); writeQueryCache(CACHE.dashboard, dash.value); }
      if (daily.status === 'fulfilled') { setBrief(daily.value); writeQueryCache(CACHE.brief, daily.value); }
      if (predicted.status === 'fulfilled') { setPredictions(predicted.value); writeQueryCache(CACHE.predictions, predicted.value); }
      if (insight.status === 'fulfilled') { setTodayInsight(insight.value); writeQueryCache(CACHE.insight, insight.value); }
      if (recent.status === 'fulfilled') {
        const items = recent.value.items.map(withoutExtractedText);
        setMemories(items);
        writeQueryCache(CACHE.memories, items);
      }
    } catch {
      setErrors({
        dashboard: !readQueryCache(CACHE.dashboard),
        brief: !readQueryCache(CACHE.brief),
        predictions: !readQueryCache(CACHE.predictions),
        insight: !readQueryCache(CACHE.insight),
        memories: !readQueryCache(CACHE.memories),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(useCallback(() => {
    if (isStale(lastLoadedAt.current || null, FOCUS_REFRESH_MS)) void load();
  }, [load]));
  useEffect(() => onReconnect(() => void load()), [load]);

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'Friend';
  const greeting = `${getGreetingTime()}, ${firstName}`;
  const errors: Record<string, boolean> = online ? rawErrors : { memories: rawErrors.memories };

  if (loading && !dashboard && !brief && !predictions) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <LoadingSkeleton rows={6} label="Kairos is preparing your day…" />
      </View>
    );
  }

  if (!online && !dashboard && !brief && !predictions && memories.length === 0) {
    return (
      <NetworkErrorScreen
        onRetry={() => void load()}
        onCapture={() => router.push('/(app)/quick-capture')}
      />
    );
  }

  const todayProgress = dashboard?.habit.todayProgress ?? memories.length;
  const dailyGoal = dashboard?.habit.dailyGoal ?? 5;
  const isGoalReached = todayProgress >= dailyGoal;

  const insightMessage = todayInsight?.body || brief?.noticed.body;
  const streakDays = dashboard?.streak.current ?? progression?.currentStreak;

  return (
    <TabScreenSwipe>
      <AmbientBackground>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 32,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <TopBar
          title={greeting}
          trailing={{
            icon: 'award',
            label: 'View progress and streaks',
            onPress: () => router.push('/(app)/progress'),
          }}
        />

        {/* Bonus reward alert */}
        {lastReward ? (
          <Animated.View
            entering={lastReward.bonus ? FadeIn.duration(240) : undefined}
            style={[
              styles.rewardPill,
              { backgroundColor: colors.primaryContainer, borderColor: colors.borderAccent },
            ]}
          >
            <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
            <ThemedText colorKey="primary" style={styles.rewardText}>
              {lastReward.bonus ? 'Momentum bonus!' : 'Signal recorded'}
              {lastReward.xp ? ` · +${lastReward.xp} XP` : ''}
              {lastReward.keeps ? ` · +${lastReward.keeps} keeps` : ''}
            </ThemedText>
          </Animated.View>
        ) : null}

        <View style={styles.sectionPad}>
          <HeroStatusWidget
            value={String(todayProgress)}
            label={isGoalReached ? 'Daily goal reached' : 'Daily progress'}
            subtitle={
              isGoalReached
                ? "You've built a clearer picture of yourself today."
                : `${Math.max(0, dailyGoal - todayProgress)} more to reach today's pace.`
            }
            progress={todayProgress / Math.max(1, dailyGoal)}
            secondaryValue={streakDays != null ? String(streakDays) : undefined}
            secondaryLabel={streakDays != null ? 'day streak' : undefined}
            mascot={isGoalReached ? 'celebrating' : 'idle'}
            accessibilityLabel={`${todayProgress} of ${dailyGoal} actions captured`}
          />
        </View>

        {insightMessage ? (
          <View style={styles.sectionPad}>
            <SuggestionCard
              message={insightMessage}
              onPress={() => router.push('/(app)/brief')}
            />
          </View>
        ) : null}

        <View style={styles.sectionPad}>
          <QuickActionGrid
            actions={HOME_ACTIONS.map(({ route, ...action }) => ({
              ...action,
              onPress: () => router.push(route as never),
            }))}
          />
        </View>

        {dashboard?.habit.week ? (
          <View style={styles.sectionPad}>
          <SurfaceCard>
            <View style={styles.weekContainer}>
              <View style={styles.weekDotsRow}>
                {dashboard.habit.week.map((day, i) => (
                  <View key={`${day.date}-${i}`} style={styles.dayDotCol}>
                    <View
                      style={[
                        styles.dayDot,
                        {
                          backgroundColor: day.done
                            ? colors.primary
                            : colors.surfaceContainer,
                          borderColor: day.done ? colors.primaryPressed : colors.border,
                        },
                      ]}
                    >
                      {day.done ? (
                        <MaterialIcons name="check" size={12} color={colors.onPrimary} />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.dayLabel,
                        { color: day.done ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {day.label}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.streakFooter}>
                <ThemedText colorKey="textSecondary" style={styles.streakFootText}>
                  {dashboard.streak.current} day streak · {dashboard.habit.weekDaysCompleted} of {dashboard.habit.weekGoalDays} days
                </ThemedText>
              </View>
            </View>
          </SurfaceCard>
          </View>
        ) : null}

        {brief && (brief.attentionTopics.length > 0 || brief.revisit) ? (
          <View style={styles.sectionBlock}>
            <SurfaceCard elevated style={styles.insightCard}>
              {brief.attentionTopics.length > 0 ? (
                <View style={styles.attentionRow}>
                  <ThemedText colorKey="textMuted" style={styles.attentionLabel}>
                    On your mind:
                  </ThemedText>
                  {brief.attentionTopics.slice(0, 3).map((topic) => (
                    <View
                      key={topic.name}
                      style={[
                        styles.attentionChip,
                        { backgroundColor: colors.primaryContainer, borderRadius: radius.full },
                      ]}
                    >
                      <Text style={[styles.attentionChipText, { color: colors.primary }]}>
                        {topic.name}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {brief.revisit ? (
                <Pressable
                  onPress={() =>
                    router.push(
                      brief.revisit?.observationId
                        ? `/(app)/observation/${brief.revisit.observationId}`
                        : '/(app)/predictions',
                    )
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Revisit ${brief.revisit.title}`}
                  style={[styles.revisitBox, { borderColor: colors.border }]}
                >
                  <View style={styles.revisitHeader}>
                    <MaterialIcons name="replay" size={16} color={colors.primary} />
                    <ThemedText colorKey="text" style={styles.revisitTitle}>
                      Revisit · {brief.revisit.title}
                    </ThemedText>
                  </View>
                  <ThemedText colorKey="textSecondary" style={styles.revisitWhy}>
                    {brief.revisit.why}
                  </ThemedText>
                </Pressable>
              ) : null}
            </SurfaceCard>
          </View>
        ) : errors.brief ? (
          <ErrorState compact title="Daily brief unavailable" onRetry={() => void load()} />
        ) : null}

        {/* Prediction / Pattern */}
        {predictions?.items[0] ? (
          <View style={styles.sectionBlock}>
            <SurfaceCard style={{ borderColor: colors.borderAccent }}>
              <Badge
                label={{
                  revisit: 'REVISIT',
                  focus: 'FOCUS',
                  emerging: 'EMERGING PATTERN',
                  next: 'NEXT STEP',
                }[predictions.items[0].kind]}
                tone="accent"
              />
              <ThemedText colorKey="text" style={styles.predictionTitle}>
                {predictions.items[0].title}
              </ThemedText>
              <ThemedText colorKey="textSecondary" style={styles.predictionWhy}>
                {predictions.items[0].why}
              </ThemedText>
            </SurfaceCard>
          </View>
        ) : null}

        {/* Settling In: Observations in flight */}
        {memories.some((memory) => !['COMPLETED', 'FAILED'].includes(memory.status)) ? (
          <View style={styles.sectionBlock}>
            <SurfaceCard style={{ borderColor: colors.borderActive }}>
              <View style={styles.settlingHead}>
                <MaterialIcons name="sync" size={18} color={colors.primary} />
                <ThemedText colorKey="text" style={styles.settlingTitle}>
                  Connecting the dots…
                </ThemedText>
              </View>
              {memories
                .filter((memory) => !['COMPLETED', 'FAILED'].includes(memory.status))
                .map((memory) => (
                  <Pressable
                    key={memory.id}
                    onPress={() => router.push(`/(app)/observation/${memory.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${memory.filename}`}
                    style={[styles.memoryRow, { backgroundColor: colors.surfaceContainer }]}
                  >
                    <ThemedText colorKey="text" style={styles.memoryTitle} numberOfLines={1}>
                      {memory.filename}
                    </ThemedText>
                    <Badge
                      label={observationStageLabel(memory) || observationStatusLabel(memory.status)}
                      tone="accent"
                    />
                  </Pressable>
                ))}
            </SurfaceCard>
          </View>
        ) : null}

        {/* Recent Memories Section */}
        <View style={styles.sectionHeadRow}>
          <ThemedText colorKey="text" style={styles.sectionHeaderTitle}>
            Recent Memories
          </ThemedText>
          <Pressable
            onPress={() => router.push('/(app)/timeline')}
            accessibilityRole="button"
            accessibilityLabel="See all memories"
            hitSlop={8}
          >
            <ThemedText colorKey="primary" style={styles.seeAllText}>
              See all ›
            </ThemedText>
          </Pressable>
        </View>

        {errors.memories && memories.length === 0 ? (
          <ErrorState compact title="Memories unavailable" onRetry={() => void load()} />
        ) : memories.length === 0 ? (
          <EmptyState
            title="Your memory is still growing"
            message="Start capturing moments, thoughts, or links, and Kairos will build understanding from there."
            actionLabel="Capture something"
            onAction={() => router.push('/(app)/quick-capture')}
          />
        ) : (
          <View style={styles.memoriesList}>
            {memories.slice(0, 6).map((memory) => {
              const iconName = MEMORY_TYPE_ICONS[memory.type] ?? 'edit-note';
              return (
                <PressScale
                  key={memory.id}
                  onPress={() => router.push(`/(app)/observation/${memory.id}`)}
                  accessibilityLabel={`Open memory ${memory.filename}`}
                >
                  <View
                    style={[
                      styles.memoryCardItem,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.memIconBubble,
                        { backgroundColor: colors.surfaceContainer, borderRadius: radius.md },
                      ]}
                    >
                      <MaterialIcons name={iconName} size={20} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <ThemedText colorKey="text" style={styles.memoryTitle} numberOfLines={1}>
                        {memory.filename}
                      </ThemedText>
                      <ThemedText
                        colorKey="textSecondary"
                        numberOfLines={2}
                        style={styles.memorySnippet}
                      >
                        {memory.summary || memory.sourceLabel || memory.type}
                      </ThemedText>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
                  </View>
                </PressScale>
              );
            })}
          </View>
        )}

        {/* Dashboard links */}
        <View style={styles.bottomLinks}>
          <Pressable
            onPress={() => router.push('/(app)/dashboard')}
            accessibilityRole="button"
            accessibilityLabel="Open dashboard"
            style={[styles.smallPillLink, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <MaterialIcons name="bar-chart" size={16} color={colors.textSecondary} />
            <ThemedText colorKey="textSecondary" style={styles.pillLinkText}>
              Detailed Dashboard
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/activity')}
            accessibilityRole="button"
            accessibilityLabel="Open capture activity"
            style={[styles.smallPillLink, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <MaterialIcons name="history" size={16} color={colors.textSecondary} />
            <ThemedText colorKey="textSecondary" style={styles.pillLinkText}>
              Capture Activity
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
      </AmbientBackground>
    </TabScreenSwipe>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  greetingTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  contextMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  profileBadgeWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  avatarLetterCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  streakMiniPill: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  flameEmoji: { fontSize: 10 },
  streakNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  rewardText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  heroSignalCard: {
    marginHorizontal: 18,
    marginBottom: 16,
    padding: 18,
    gap: 14,
  },
  signalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  signalTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginTop: 4,
  },
  levelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  levelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  ringHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ringWrap: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  ringCount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  ringGoal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  signalHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  signalSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  weekContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
    paddingTop: 12,
    gap: 8,
  },
  weekDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayDotCol: {
    alignItems: 'center',
    gap: 4,
  },
  dayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  streakFooter: {
    alignItems: 'center',
    marginTop: 2,
  },
  streakFootText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  primaryCtaWrap: {
    marginHorizontal: 18,
    marginBottom: 20,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  quickActionsScroll: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
  quickActionCard: {
    width: 130,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  actionIconBubble: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionCardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
  },
  actionCardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 15,
  },
  sectionPad: {
    marginHorizontal: 20,
    marginTop: 12,
  },
  sectionBlock: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  insightCard: {
    gap: 10,
  },
  insightTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sparkleWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  insightBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  attentionLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  attentionChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  attentionChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  revisitBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    gap: 4,
    marginTop: 4,
  },
  revisitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  revisitTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  revisitWhy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  predictionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginTop: 4,
  },
  predictionWhy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  settlingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settlingTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  memoriesList: {
    paddingHorizontal: 18,
    gap: 8,
  },
  memoryCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  memIconBubble: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
  memorySnippet: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 12,
    marginVertical: 3,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 18,
  },
  smallPillLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillLinkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
});
