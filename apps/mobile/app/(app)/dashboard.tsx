import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../components/ui/EmptyState';
import { GlassPanel } from '../../components/ui/Glass';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { useAsync } from '../../hooks/useAsync';
import { fetchDashboard } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchDashboard(token);
  }, [getToken]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }
  if (!data) {
    return (
      <SoftPage>
        <EmptyState title="Nothing yet" />
      </SoftPage>
    );
  }

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        <SoftTitle>Dashboard</SoftTitle>

        <View style={styles.metrics}>
          <GlassPanel style={styles.metric} contentStyle={styles.metricInner} padded={false}>
            <ThemedText colorKey="text" style={styles.metricValue}>
              {data.todayCount}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.metricLabel}>
              today
            </ThemedText>
          </GlassPanel>
          <GlassPanel style={styles.metric} contentStyle={styles.metricInner} padded={false}>
            <ThemedText colorKey="text" style={styles.metricValue}>
              {data.weekCount}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.metricLabel}>
              this week
            </ThemedText>
          </GlassPanel>
          <GlassPanel style={styles.metric} contentStyle={styles.metricInner} padded={false}>
            <ThemedText colorKey="text" style={styles.metricValue}>
              {data.completedCount}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.metricLabel}>
              ready
            </ThemedText>
          </GlassPanel>
          <GlassPanel style={styles.metric} contentStyle={styles.metricInner} padded={false}>
            <ThemedText colorKey="text" style={styles.metricValue}>
              {data.processingCount}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.metricLabel}>
              in flight
            </ThemedText>
          </GlassPanel>
        </View>

        <Pressable
          onPress={() => router.push('/(app)/insight')}
          accessibilityRole="button"
          accessibilityLabel="Today’s insight"
        >
          <GlassPanel>
            <ThemedText colorKey="textMuted" style={styles.kicker}>
              {data.insight.title}
            </ThemedText>
            <ThemedText colorKey="text" style={styles.insightBody}>
              {data.insight.body}
            </ThemedText>
          </GlassPanel>
        </Pressable>

        {data.sources.length > 0 ? (
          <GlassPanel>
            <ThemedText colorKey="textMuted" style={styles.kicker}>
              Sources
            </ThemedText>
            {data.sources.map((source) => (
              <View key={source.source} style={styles.sourceRow}>
                <ThemedText colorKey="text" style={styles.sourceName}>
                  {source.label}
                </ThemedText>
                <ThemedText colorKey="textMuted" style={styles.sourceCount}>
                  {source.count}
                </ThemedText>
              </View>
            ))}
          </GlassPanel>
        ) : null}

        {data.topics.length > 0 ? (
          <View style={styles.topicWrap}>
            {data.topics.map((topic) => (
              <Pressable
                key={topic.id}
                onPress={() => router.push(`/(app)/topics/${topic.id}`)}
                accessibilityRole="button"
                accessibilityLabel={topic.name}
              >
                <GlassPanel padded={false} contentStyle={styles.topicChip}>
                  <View style={[styles.topicDot, { backgroundColor: colors.accent }]} />
                  <ThemedText colorKey="text" style={styles.topicLabel} numberOfLines={1}>
                    {topic.name}
                  </ThemedText>
                  <ThemedText colorKey="textMuted" style={styles.topicCount}>
                    {topic.observationCount}
                  </ThemedText>
                </GlassPanel>
              </Pressable>
            ))}
          </View>
        ) : null}

        {data.recent.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            actionLabel="Capture"
            onAction={() => router.push('/(app)/quick-capture')}
          />
        ) : (
          data.recent.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push(`/(app)/observation/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={item.filename}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
            >
              <GlassPanel padded={false} contentStyle={styles.recentRow}>
                <View style={styles.recentText}>
                  <ThemedText colorKey="text" style={styles.recentTitle} numberOfLines={1}>
                    {item.filename}
                  </ThemedText>
                  <ThemedText colorKey="textMuted" style={styles.recentMeta} numberOfLines={1}>
                    {item.sourceLabel}
                    {item.summary ? ` · ${item.summary}` : ''}
                  </ThemedText>
                </View>
              </GlassPanel>
            </Pressable>
          ))
        )}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metric: {
    width: '48%',
    flexGrow: 1,
  },
  metricInner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  metricValue: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 28,
    letterSpacing: -0.4,
  },
  metricLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 8,
  },
  insightBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sourceName: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  sourceCount: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  topicWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  topicDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  topicLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    maxWidth: 140,
  },
  topicCount: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  recentRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  recentText: { gap: 4 },
  recentTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  recentMeta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
