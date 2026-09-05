import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

import {
  ChartCard,
  SimpleBarChart,
  hourlyToBars,
  timeSeriesToBars,
  weekdayToBars,
} from '../../../components/ui/ChartCard';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { MetricCard } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { analyticsService } from '../../../services';
import { TimeRange } from '../../../types';

const RANGES: TimeRange[] = ['7d', '30d', '90d'];

export default function AnalyticsScreen() {
  const [range, setRange] = useState<TimeRange>('30d');
  const insets = useSafeAreaInsets();
  const { themeProgress, isLight, colors } = useAppTheme();
  const { data, error, loading, reload } = useAsync(
    () => analyticsService.getSummary(range),
    [range],
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.eyebrow}>
            Overview
          </ThemedText>
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.pageTitle}>
            Analytics
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.rangeRow,
          {
            backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
          },
        ]}
      >
        {RANGES.map((r) => {
          const active = r === range;
          return (
            <Pressable
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.rangeChip,
                {
                  backgroundColor: active
                    ? isLight
                      ? '#111'
                      : '#fff'
                    : 'transparent',
                  shadowOpacity: active ? 0.15 : 0,
                },
              ]}
            >
              <ThemedText
                themeProgress={themeProgress}
                colorKey={active ? 'buttonPressedText' : 'textSecondary'}
                style={styles.rangeLabel}
              >
                {r.toUpperCase()}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {loading ? <LoadingSkeleton rows={8} /> : null}
      {error ? (
        <ErrorState title="Unable to load analytics" message={error} onRetry={reload} />
      ) : null}

      {data && !loading ? (
        <Animated.View entering={FadeIn.duration(320)}>
          <SectionHeader title="Metrics" />
          <View style={styles.metrics}>
            {data.metrics.map((m) => (
              <MetricCard
                key={m.key}
                label={m.label}
                value={
                  m.unit === '%'
                    ? `${m.value}%`
                    : m.unit === '/5'
                      ? `${m.value}/5`
                      : `${m.value}${m.unit === 'h' ? 'h' : m.unit === 'min' ? 'm' : ` ${m.unit}`}`
                }
              />
            ))}
          </View>

          <SurfaceCard style={styles.completeness}>
            <View style={styles.completenessHeaderRow}>
              <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.kicker}>
                Data completeness
              </ThemedText>
              <View
                style={[
                  styles.completenessBadge,
                  { backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)' },
                ]}
              >
                <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.completenessBadgeText}>
                  {data.dataCompleteness}%
                </ThemedText>
              </View>
            </View>
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.completeValue}>
              {data.dataCompleteness}% of expected observations recorded
            </ThemedText>
            <View
              style={[
                styles.progressTrack,
                { backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, Math.max(0, data.dataCompleteness))}%`,
                    backgroundColor: colors.accent,
                  },
                ]}
              />
            </View>
            <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
              {data.recordedObservations} recorded · {data.expectedObservations} expected
            </ThemedText>
          </SurfaceCard>

          <ChartCard title="Productivity over time">
            <SimpleBarChart points={timeSeriesToBars(data.productivityOverTime)} />
          </ChartCard>
          <ChartCard title="Study duration" subtitle="Minutes per day">
            <SimpleBarChart points={timeSeriesToBars(data.studyDuration)} />
          </ChartCard>
          <ChartCard title="Sleep duration" subtitle="Hours per night">
            <SimpleBarChart points={timeSeriesToBars(data.sleepDuration)} />
          </ChartCard>
          <ChartCard title="Task completion" subtitle="Daily completion rate">
            <SimpleBarChart points={timeSeriesToBars(data.taskCompletion)} />
          </ChartCard>
          <ChartCard title="Productivity by weekday">
            <SimpleBarChart points={weekdayToBars(data.productivityByWeekday)} maxBars={7} />
          </ChartCard>
          <ChartCard title="Productivity by hour" subtitle="Study session productivity">
            <SimpleBarChart points={hourlyToBars(data.productivityByHour)} maxBars={12} />
          </ChartCard>
        </Animated.View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 8 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  eyebrow: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  pageTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
  },
  rangeChip: {
    flex: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  rangeLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 12,
    letterSpacing: 1,
  },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  completeness: { marginBottom: 14, gap: 8 },
  completenessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completenessBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  completenessBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  completeValue: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});