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
import { InsightCard } from '../../components/ui/InsightCard';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { useAsync } from '../../hooks/useAsync';
import { fetchDailyBrief } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function DailyBriefScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchDailyBrief(token);
  }, [getToken], { cacheKey: 'brief' });

  if (loading && !data) return <LoadingSkeleton rows={7} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }
  if (!data || data.empty) {
    return (
      <SoftPage>
        <EmptyState
          title="No brief yet"
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
        <SoftTitle>{data.title}</SoftTitle>
        <GlassPanel>
          <ThemedText colorKey="text" style={styles.stat}>
            Yesterday you captured {data.yesterdayCount}{' '}
            {data.yesterdayCount === 1 ? 'memory' : 'memories'}.
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {data.weekCount} this week
          </ThemedText>
        </GlassPanel>

        {data.attentionTopics.length > 0 ? (
          <GlassPanel>
            <ThemedText colorKey="textMuted" style={styles.kicker}>
              You spent most of your attention on
            </ThemedText>
            <View style={styles.topicWrap}>
              {data.attentionTopics.map((topic) => (
                <Pressable
                  key={topic.id}
                  onPress={() => router.push(`/(app)/topics/${topic.id}`)}
                >
                  <View style={[styles.topic, { borderColor: colors.glassBorder }]}>
                    <ThemedText colorKey="text" style={styles.topicLabel}>
                      {topic.name}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          </GlassPanel>
        ) : null}

        <InsightCard
          insight={data.noticed}
          onExplore={() => router.push('/(app)/insight')}
        />

        {data.revisit ? (
          <Pressable
            onPress={() =>
              router.push(
                data.revisit?.observationId
                  ? `/(app)/observation/${data.revisit.observationId}`
                  : '/(app)/predictions',
              )
            }
          >
            <GlassPanel>
              <ThemedText colorKey="textMuted" style={styles.kicker}>
                Worth revisiting
              </ThemedText>
              <ThemedText colorKey="text" style={styles.stat}>
                {data.revisit.title}
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.meta}>
                {data.revisit.body}
              </ThemedText>
            </GlassPanel>
          </Pressable>
        ) : null}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  stat: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 6 },
  kicker: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 8 },
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topic: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topicLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});
