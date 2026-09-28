import { useAuth } from '@clerk/expo';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { ThemedText } from '../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { GlassPanel } from '../../components/ui/Glass';
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
    try { const token = await getToken(); if (token) setData(await fetchDashboard(token)); else setError(true); }
    catch { setError(true); }
    finally { setLoading(false); }
  }, [getToken]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (loading && !data) return <LoadingSkeleton rows={5} />;
  if (error && !data) return <ErrorState title="Insights unavailable" onRetry={() => void load()} />;
  const maxCount = Math.max(1, ...(data?.activity.map((day) => day.count) ?? [1]));
  return <SoftPage>
    <ThemedText colorKey="textMuted" style={styles.lead}>A small view of how your memory has grown this week.</ThemedText>
    <GlassPanel style={styles.card}>
      <ThemedText colorKey="text" style={styles.title}>Seven day activity</ThemedText>
      <View style={styles.chart}>{(data?.activity ?? []).slice(-7).map((day, index) => <View key={`${day.date}-${index}`} style={styles.barCol}><ThemedText colorKey="textMuted" style={styles.count}>{day.count || ''}</ThemedText><View style={[styles.track, { backgroundColor: colors.border }]}><View style={[styles.bar, { backgroundColor: colors.text, height: `${Math.max(3, day.count / maxCount * 100)}%` }]} /></View><ThemedText colorKey="textMuted" style={styles.day}>{day.label}</ThemedText></View>)}</View>
      <ThemedText colorKey="textSecondary">{data?.weekCount ?? 0} memories this week · {data?.todayCount ?? 0} today</ThemedText>
    </GlassPanel>
    <GlassPanel style={styles.card}>
      <ThemedText colorKey="text" style={styles.title}>Sources</ThemedText>
      {(data?.sources ?? []).filter((source) => source.count > 0).map((source) => <View key={source.source} style={styles.sourceRow}><ThemedText colorKey="text" style={{ flex: 1 }}>{source.label}</ThemedText><ThemedText colorKey="textSecondary">{source.count}</ThemedText></View>)}
      {!data?.sources.some((source) => source.count > 0) ? <ThemedText colorKey="textMuted">Sources will appear as you save memories.</ThemedText> : null}
    </GlassPanel>
    <Pressable onPress={() => router.push('/(app)/dashboard')} accessibilityRole="button" accessibilityLabel="Open full dashboard" style={styles.link}><ThemedText colorKey="text">Open dashboard</ThemedText></Pressable>
    <Pressable onPress={() => router.push('/(app)/activity')} accessibilityRole="button" accessibilityLabel="Open processing activity" style={styles.link}><ThemedText colorKey="text">Open processing activity</ThemedText></Pressable>
  </SoftPage>;
}

const styles = StyleSheet.create({ lead: { fontSize: 14, lineHeight: 21 }, card: { gap: 12, padding: 16 }, title: { fontFamily: 'Inter_600SemiBold', fontSize: 18 }, chart: { flexDirection: 'row', justifyContent: 'space-between', height: 140, paddingTop: 10 }, barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 }, count: { fontSize: 11, minHeight: 14 }, track: { height: 95, width: 18, borderRadius: 9, justifyContent: 'flex-end', overflow: 'hidden' }, bar: { width: '100%', borderRadius: 9 }, day: { fontSize: 11 }, sourceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 }, link: { padding: 12, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.1)' }, });
