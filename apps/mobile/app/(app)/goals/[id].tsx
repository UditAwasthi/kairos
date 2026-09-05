import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ChartCard,
  SimpleBarChart,
  timeSeriesToBars,
} from '../../../components/ui/ChartCard';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { ProgressBar } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { eventsService, goalsService } from '../../../services';
import { BehaviorEvent } from '../../../types';
import { useEffect, useState } from 'react';

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const { data, error, loading, reload } = useAsync(() => goalsService.get(String(id)), [id]);
  const [related, setRelated] = useState<BehaviorEvent[]>([]);

  useEffect(() => {
    if (!data) return;
    void (async () => {
      const all = await eventsService.list();
      setRelated(all.filter((e) => data.relatedEventIds.includes(e.id)));
    })();
  }, [data]);

  if (loading) return <LoadingSkeleton rows={7} />;
  if (error || !data) {
    return <ErrorState title="Unable to load goal" message={error ?? undefined} onRetry={reload} />;
  }

  const progress = data.target === 0 ? 0 : data.current / data.target;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.title}>
        {data.title}
      </ThemedText>
      <ProgressBar progress={progress} />
      <SurfaceCard>
        <Row label="Progress" value={`${data.current} / ${data.target} ${data.unit}`} />
        <Row label="Deadline" value={new Date(data.deadline).toLocaleDateString()} />
        <Row label="Trend" value={`${data.trend >= 0 ? '+' : ''}${Math.round(data.trend * 100)}%`} />
      </SurfaceCard>

      <ChartCard title="Historical progress">
        <SimpleBarChart points={timeSeriesToBars(data.history, 3)} />
      </ChartCard>

      <SectionHeader title="Trajectory" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          {data.trajectory}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Related events" />
      <SurfaceCard>
        {related.length === 0 ? (
          <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
            No related events linked yet.
          </ThemedText>
        ) : (
          related.map((event) => (
            <ThemedButton
              key={event.id}
              label={event.title}
              variant="outline"
              onPress={() => router.push(`/(app)/event/${event.id}`)}
              style={styles.relatedBtn}
            />
          ))
        )}
      </SurfaceCard>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { themeProgress } = useAppTheme();
  return (
    <View style={styles.row}>
      <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.rowLabel}>
        {label}
      </ThemedText>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'DotGothic16_400Regular', fontSize: 24, letterSpacing: 1 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  rowLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  rowValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, flex: 1, textAlign: 'right' },
  relatedBtn: { marginTop: 8 },
});
