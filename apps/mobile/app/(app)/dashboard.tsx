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
import { AccentGradient, GlassPanel } from '../../components/ui/Glass';
import { InsightCard } from '../../components/ui/InsightCard';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { useAsync } from '../../hooks/useAsync';
import { fetchDashboard } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, radius } = useAppTheme();
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
        <EmptyState
          title="No memories yet"
          actionLabel="Capture something"
          onAction={() => router.push('/(app)/quick-capture')}
        />
      </SoftPage>
    );
  }

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        <SoftTitle>{data.greeting}</SoftTitle>
        <ThemedText colorKey="textMuted" style={styles.day}>
          {data.daySummary}
        </ThemedText>

        <InsightCard
          insight={data.insight}
          onExplore={() => router.push('/(app)/insight')}
        />

        <ThemedText colorKey="textMuted" style={styles.section}>
          Recently remembered
        </ThemedText>
        {data.recent.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            actionLabel="Capture something"
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
                <ThemedText colorKey="text" style={styles.recentTitle} numberOfLines={1}>
                  {item.filename}
                </ThemedText>
                <ThemedText colorKey="textMuted" style={styles.recentMeta} numberOfLines={1}>
                  {item.sourceLabel}
                  {item.summary ? ` · ${item.summary}` : ''}
                </ThemedText>
              </GlassPanel>
            </Pressable>
          ))
        )}

        {data.topics.length > 0 ? (
          <>
            <ThemedText colorKey="textMuted" style={styles.section}>
              What’s emerging
            </ThemedText>
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
          </>
        ) : null}

        {data.processingCount > 0 ? (
          <Pressable
            onPress={() => router.push('/(app)/activity')}
            accessibilityRole="button"
            accessibilityLabel="Current activity"
          >
            <GlassPanel>
              <ThemedText colorKey="textMuted" style={styles.kicker}>
                Current activity
              </ThemedText>
              <ThemedText colorKey="text" style={styles.recentTitle}>
                {data.processingCount} {data.processingCount === 1 ? 'memory' : 'memories'} still settling
              </ThemedText>
            </GlassPanel>
          </Pressable>
        ) : null}

        <Pressable
          onPress={() => router.push('/(app)/(tabs)/ask')}
          accessibilityRole="button"
          accessibilityLabel="Ask Kairos"
        >
          <AccentGradient style={[styles.askCard, { borderRadius: radius.xl }]}>
            <ThemedText colorKey="inverseText" style={styles.askTitle}>
              Ask Kairos
            </ThemedText>
            <ThemedText colorKey="inverseText" style={styles.askHint}>
              What was I working on…
            </ThemedText>
          </AccentGradient>
        </Pressable>
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  day: { fontFamily: 'Inter_400Regular', fontSize: 15, marginBottom: 8 },
  section: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  kicker: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 6 },
  recentRow: { paddingHorizontal: 16, paddingVertical: 16, gap: 4 },
  recentTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  recentMeta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  topicDot: { width: 7, height: 7, borderRadius: 4 },
  topicLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, maxWidth: 140 },
  topicCount: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  askCard: { paddingHorizontal: 20, paddingVertical: 18, gap: 4 },
  askTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  askHint: { fontFamily: 'Inter_400Regular', fontSize: 14, opacity: 0.86 },
});
