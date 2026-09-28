import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { CaptureHeatmap, CaptureHistogram } from '../../components/ui/CaptureCharts';
import { ThemedText } from '../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { SurfaceCard } from '../../components/ui/SectionHeader';
import { SoftPage } from '../../components/ui/SoftScreen';
import { fetchDashboard, type DashboardSummary } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function InsightsScreen() {
  const { getToken } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      const token = await getToken();
      if (token) setData(await fetchDashboard(token));
      else setError(true);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [getToken]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (loading && !data) return <LoadingSkeleton rows={5} />;
  if (error && !data) return <ErrorState title="Insights unavailable" onRetry={() => void load()} />;

  return (
    <SoftPage>
      {/* Summary stats row */}
      <View style={styles.summaryRow}>
        <SurfaceCard style={styles.summaryChip}>
          <ThemedText colorKey="text" style={styles.summaryValue}>{data?.weekCount ?? 0}</ThemedText>
          <ThemedText colorKey="textMuted" style={styles.summaryLabel}>This Week</ThemedText>
        </SurfaceCard>
        <SurfaceCard style={styles.summaryChip}>
          <ThemedText colorKey="text" style={styles.summaryValue}>{data?.todayCount ?? 0}</ThemedText>
          <ThemedText colorKey="textMuted" style={styles.summaryLabel}>Today</ThemedText>
        </SurfaceCard>
        <SurfaceCard style={styles.summaryChip}>
          <ThemedText colorKey="text" style={styles.summaryValue}>
            {(data?.sources ?? []).reduce((acc, s) => acc + s.count, 0)}
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.summaryLabel}>Total</ThemedText>
        </SurfaceCard>
      </View>

      <ThemedText colorKey="textMuted" style={styles.lead}>
        A view of how your memory has grown over the last twelve weeks.
      </ThemedText>

      <CaptureHeatmap days={data?.heatmap ?? []} />
      <CaptureHistogram days={data?.heatmap ?? []} />

      {/* Sources breakdown */}
      <SurfaceCard style={styles.card}>
        <ThemedText colorKey="text" style={styles.cardTitle}>Memory Sources</ThemedText>
        {(data?.sources ?? []).filter((source) => source.count > 0).map((source) => (
          <View key={source.source} style={styles.sourceRow}>
            <View style={[styles.sourceDot, { backgroundColor: colors.primaryContainer }]}>
              <Feather name="layers" size={12} color={colors.primary} />
            </View>
            <ThemedText colorKey="text" style={styles.sourceLabel}>{source.label}</ThemedText>
            <View style={[styles.sourceBadge, { backgroundColor: colors.primaryContainer }]}>
              <ThemedText colorKey="primary" style={styles.sourceBadgeText}>{source.count}</ThemedText>
            </View>
          </View>
        ))}
        {!data?.sources.some((source) => source.count > 0) ? (
          <ThemedText colorKey="textMuted" style={styles.emptyNote}>
            Sources will appear as you save memories.
          </ThemedText>
        ) : null}
      </SurfaceCard>

      {/* Nav links */}
      <View style={styles.navRow}>
        <Pressable
          onPress={() => router.push('/(app)/dashboard')}
          accessibilityRole="button"
          accessibilityLabel="Open full dashboard"
          style={[styles.navLink, { backgroundColor: colors.primaryContainer }]}
        >
          <Feather name="bar-chart-2" size={16} color={colors.primary} />
          <ThemedText colorKey="primary" style={styles.navLinkText}>Full Dashboard</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/activity')}
          accessibilityRole="button"
          accessibilityLabel="Open processing activity"
          style={[styles.navLink, { backgroundColor: colors.primaryContainer }]}
        >
          <Feather name="activity" size={16} color={colors.primary} />
          <ThemedText colorKey="primary" style={styles.navLinkText}>Processing Activity</ThemedText>
        </Pressable>
      </View>
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryChip: { flex: 1, padding: 14, alignItems: 'center', gap: 2 },
  summaryValue: { fontFamily: 'Roboto_700Bold', fontSize: 22, letterSpacing: -0.3 },
  summaryLabel: { fontFamily: 'Roboto_500Medium', fontSize: 12 },
  lead: { fontFamily: 'Roboto_400Regular', fontSize: 14, lineHeight: 21 },
  card: { padding: 16, gap: 12 },
  cardTitle: { fontFamily: 'Roboto_700Bold', fontSize: 17 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  sourceDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sourceLabel: { fontFamily: 'Roboto_400Regular', fontSize: 14, flex: 1 },
  sourceBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  sourceBadgeText: { fontFamily: 'Roboto_700Bold', fontSize: 13 },
  emptyNote: { fontFamily: 'Roboto_400Regular', fontSize: 13, lineHeight: 18 },
  navRow: { gap: 8 },
  navLink: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14 },
  navLinkText: { fontFamily: 'Roboto_600SemiBold', fontSize: 14 },
});
