import { useAuth, useUser } from '@clerk/expo';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { GlassPanel } from '../../../components/ui/Glass';
import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import { fetchDailyBrief, fetchDashboard, fetchObservationsPage, fetchPredictions, fetchTodayInsight, observationStageLabel, observationStatusLabel, type ApiObservation, type DailyBrief, type DashboardSummary, type PredictionsSummary, type TodayInsight } from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useProgression } from '../../../providers/ProgressionProvider';
import { TabScreenSwipe } from '../../../components/TabScreenSwipe';

function SectionTitle({ children }: { children: string }) {
  return <ThemedText colorKey="text" style={styles.sectionTitle}>{children}</ThemedText>;
}

function HabitRing({ progress, goal, color, muted }: { progress: number; goal: number; color: string; muted: string }) {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, progress / Math.max(1, goal)));
  return <View style={styles.ringWrap} accessibilityLabel={`${progress} of ${goal} memories today`}>
    <Svg width={84} height={84}>
      <Circle cx={42} cy={42} r={radius} fill="none" stroke={muted} strokeWidth={5} />
      <Circle cx={42} cy={42} r={radius} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference * (1 - ratio)} strokeLinecap="round" />
    </Svg>
    <View style={styles.ringCenter}><ThemedText colorKey="text" style={styles.ringCount}>{progress}</ThemedText><ThemedText colorKey="textMuted" style={styles.ringGoal}>of {goal}</ThemedText></View>
  </View>;
}

export default function TodayScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { progression, lastReward } = useProgression();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [todayInsight, setTodayInsight] = useState<TodayInsight | null>(null);
  const [predictions, setPredictions] = useState<PredictionsSummary | null>(null);
  const [memories, setMemories] = useState<ApiObservation[]>([]);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const results = await Promise.allSettled([
        fetchDashboard(token), fetchDailyBrief(token), fetchPredictions(token), fetchTodayInsight(token),
        fetchObservationsPage(token, { limit: 8 }),
      ]);
      setErrors({ dashboard: results[0].status === 'rejected', brief: results[1].status === 'rejected', predictions: results[2].status === 'rejected', insight: results[3].status === 'rejected', memories: results[4].status === 'rejected' });
      if (results[0].status === 'fulfilled') setDashboard(results[0].value);
      if (results[1].status === 'fulfilled') setBrief(results[1].value);
      if (results[2].status === 'fulfilled') setPredictions(results[2].value);
      if (results[3].status === 'fulfilled') setTodayInsight(results[3].value);
      if (results[4].status === 'fulfilled') setMemories(results[4].value.items);
    } catch {
      setErrors({ dashboard: true, brief: true, predictions: true, insight: true, memories: true });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [getToken]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const name = user?.firstName || user?.fullName || 'there';
  if (loading && !dashboard && !brief && !predictions) {
    return <View style={[styles.screen, { backgroundColor: colors.background }]}><LoadingSkeleton rows={6} /></View>;
  }

  return (
    <TabScreenSwipe>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 24 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.text} />}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText colorKey="text" style={styles.brand}>Today</ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.greeting}>{dashboard?.greeting || `Good to see you, ${name}`}</ThemedText>
          </View>
          {progression ? <Pressable onPress={() => router.push('/(app)/progress')} accessibilityRole="button" accessibilityLabel={`Level ${progression.level}, ${progression.currentStreak} day streak. View progress`}><ThemedText colorKey="text" style={styles.pill}>Level {progression.level} · {progression.currentStreak} day streak</ThemedText></Pressable> : null}
        </View>
        {lastReward ? <Animated.View entering={lastReward.bonus ? FadeIn.duration(220) : undefined}><ThemedText colorKey="textSecondary" style={styles.reward}>{lastReward.bonus ? 'A small bonus' : 'Progress saved'}{lastReward.xp ? ` · +${lastReward.xp} XP` : ''}{lastReward.keeps ? ` · +${lastReward.keeps} keeps` : ''}</ThemedText></Animated.View> : null}
        {dashboard ? <ThemedText colorKey="textSecondary" style={styles.summary}>{dashboard.daySummary}</ThemedText> : errors.dashboard ? <ErrorState title="Today summary unavailable" onRetry={() => void load()} /> : null}

        {brief ? <GlassPanel style={styles.card}>
          <SectionTitle>Daily brief</SectionTitle>
          <ThemedText colorKey="textSecondary" style={styles.copy}>{todayInsight?.body || brief.noticed.body}</ThemedText>
          {errors.insight ? <ThemedText colorKey="textMuted">A fresh daily insight is unavailable right now.</ThemedText> : null}
          {brief.attentionTopics.length ? <ThemedText colorKey="text" style={styles.label}>On your mind: {brief.attentionTopics.slice(0, 3).map((topic) => topic.name).join(' · ')}</ThemedText> : null}
          {brief.revisit ? <Pressable onPress={() => router.push(brief.revisit?.observationId ? `/(app)/observation/${brief.revisit.observationId}` : '/(app)/predictions')} accessibilityRole="button" accessibilityLabel={`Revisit ${brief.revisit.title}`} style={styles.revisit}><ThemedText colorKey="text" style={styles.label}>Revisit · {brief.revisit.title}</ThemedText><ThemedText colorKey="textSecondary" style={styles.copy}>{brief.revisit.why}</ThemedText></Pressable> : null}
        </GlassPanel> : errors.brief ? <ErrorState title="Daily brief unavailable" onRetry={() => void load()} /> : null}

        {dashboard ? <GlassPanel style={styles.card}>
          <View style={styles.row}><SectionTitle>Your rhythm</SectionTitle><ThemedText colorKey="textSecondary">{dashboard.habit.todayProgress} / {dashboard.habit.dailyGoal}</ThemedText></View>
          <View style={styles.habitRow}><HabitRing progress={dashboard.habit.todayProgress} goal={dashboard.habit.dailyGoal} color={colors.text} muted={colors.border} /><ThemedText colorKey="textSecondary" style={styles.habitCopy}>A steady pace is enough. Your goal is {dashboard.habit.dailyGoal} {dashboard.habit.dailyGoal === 1 ? 'memory' : 'memories'} today.</ThemedText></View>
          <View style={styles.week}>{dashboard.habit.week.map((day, i) => <View key={`${day.date}-${i}`} style={styles.day}><View style={[styles.dot, { backgroundColor: day.done ? colors.text : colors.border }]} /><ThemedText colorKey="textMuted" style={styles.dayLabel}>{day.label}</ThemedText></View>)}</View>
          <ThemedText colorKey="textSecondary" style={styles.copy}>{dashboard.streak.current} day streak · {dashboard.habit.weekDaysCompleted} of {dashboard.habit.weekGoalDays} days this week</ThemedText>
        </GlassPanel> : null}

        {predictions?.items[0] ? <GlassPanel style={styles.card}>
          <SectionTitle>{{ revisit: 'A thought to revisit', focus: 'Focus for today', emerging: 'A pattern taking shape', next: 'A possible next step' }[predictions.items[0].kind]}</SectionTitle>
          <ThemedText colorKey="text" style={styles.label}>{predictions.items[0].title}</ThemedText>
          <ThemedText colorKey="textSecondary" style={styles.copy}>{predictions.items[0].why}</ThemedText>
          <View style={styles.chips}>{predictions.items[0].evidence.slice(0, 3).map((item) => <Pressable key={item.observationId} onPress={() => router.push(`/(app)/observation/${item.observationId}`)} accessibilityRole="button" accessibilityLabel={`Open source memory ${item.filename}`} style={[styles.chip, { borderColor: colors.border }]}><ThemedText colorKey="textSecondary" numberOfLines={1}>{item.filename}</ThemedText></Pressable>)}</View>
        </GlassPanel> : errors.predictions ? <ErrorState title="Suggestions unavailable" onRetry={() => void load()} /> : null}

        {memories.some((memory) => !['COMPLETED', 'FAILED'].includes(memory.status)) ? <GlassPanel style={styles.card}>
          <SectionTitle>Settling in</SectionTitle>
          {memories.filter((memory) => !['COMPLETED', 'FAILED'].includes(memory.status)).map((memory) => <Pressable key={memory.id} onPress={() => router.push(`/(app)/observation/${memory.id}`)} accessibilityRole="button" accessibilityLabel={`Open ${memory.filename}, ${observationStageLabel(memory)}`} style={styles.memoryRow}><ThemedText colorKey="text" style={styles.label} numberOfLines={1}>{memory.filename}</ThemedText><ThemedText colorKey="textSecondary">{observationStageLabel(memory) || observationStatusLabel(memory.status)}</ThemedText></Pressable>)}
        </GlassPanel> : null}

        <View style={styles.row}><SectionTitle>Recent memories</SectionTitle><Pressable onPress={() => router.push('/(app)/timeline')} accessibilityRole="button" accessibilityLabel="See all memories"><ThemedText colorKey="textSecondary">See all</ThemedText></Pressable></View>
        {errors.memories && memories.length === 0 ? <ErrorState title="Memories unavailable" onRetry={() => void load()} /> : memories.length === 0 ? <EmptyState title="No memories yet" message="Capture a note, voice memo, photo, or link to begin." actionLabel="Capture" onAction={() => router.push('/(app)/(tabs)/capture')} /> : memories.slice(0, 6).map((memory) => <Pressable key={memory.id} style={styles.memoryRow} onPress={() => router.push(`/(app)/observation/${memory.id}`)} accessibilityRole="button" accessibilityLabel={`Open memory ${memory.filename}`}><View style={{ flex: 1 }}><ThemedText colorKey="text" style={styles.label} numberOfLines={1}>{memory.filename}</ThemedText><ThemedText colorKey="textSecondary" numberOfLines={2}>{memory.summary || memory.sourceLabel || memory.type}</ThemedText></View><ThemedText colorKey="textMuted">›</ThemedText></Pressable>)}
        <View style={styles.row}><Pressable onPress={() => router.push('/(app)/dashboard')} accessibilityRole="button" accessibilityLabel="Open dashboard"><ThemedText colorKey="textSecondary">Dashboard details</ThemedText></Pressable><Pressable onPress={() => router.push('/(app)/activity')} accessibilityRole="button" accessibilityLabel="Open capture activity"><ThemedText colorKey="textSecondary">Activity</ThemedText></Pressable></View>
      </ScrollView>
    </TabScreenSwipe>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, contentContainer: { paddingHorizontal: 18 },
  reward: { textAlign: 'right', marginHorizontal: 18, fontSize: 12, opacity: 0.85 },
  ringWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' }, ringCenter: { position: 'absolute', alignItems: 'center' }, ringCount: { fontFamily: 'Inter_600SemiBold', fontSize: 20 }, ringGoal: { fontSize: 10 }, habitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 }, habitCopy: { flex: 1, fontSize: 14, lineHeight: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, marginBottom: 8 },
  brand: { fontFamily: 'Inter_600SemiBold', fontSize: 30, lineHeight: 38 }, greeting: { fontSize: 15 },
  summary: { paddingHorizontal: 18, marginBottom: 12, fontSize: 16, lineHeight: 23 },
  pill: { borderWidth: StyleSheet.hairlineWidth, borderColor: '#888', borderRadius: 18, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 7, fontSize: 12 },
  card: { marginHorizontal: 16, marginVertical: 7, padding: 16, gap: 10 }, sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 }, copy: { fontSize: 14, lineHeight: 20 }, label: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  revisit: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#888', paddingTop: 10, gap: 4 }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginTop: 12, marginBottom: 5 }, track: { height: 7, borderRadius: 4, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 4 }, week: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }, day: { alignItems: 'center', gap: 5 }, dot: { width: 9, height: 9, borderRadius: 5 }, dayLabel: { fontSize: 11 }, chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' }, chip: { maxWidth: '48%', borderWidth: StyleSheet.hairlineWidth, borderRadius: 15, paddingHorizontal: 9, paddingVertical: 6 }, memoryRow: { marginHorizontal: 16, marginVertical: 4, minHeight: 60, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(128,128,128,0.08)' },
});
