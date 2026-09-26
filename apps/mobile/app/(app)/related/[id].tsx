import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '../../../components/ThemedText';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../../components/ui/EmptyState';
import { GlassPanel } from '../../../components/ui/Glass';
import { SoftPage, SoftTitle } from '../../../components/ui/SoftScreen';
import { useAsync } from '../../../hooks/useAsync';
import { fetchRelatedMemories } from '../../../lib/api';
import { relativeMemoryLabel } from '../../../lib/searchHints';

const REASON_LABEL = {
  similar: 'Similar meaning',
  shared_topic: 'Shared topic',
  shared_entity: 'Shared entity',
  shared_project: 'Same project',
  nearby_in_time: 'Nearby in time',
} as const;

export default function RelatedMemoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(
    async () => {
      const token = await getToken();
      if (!token) throw new Error('Sign in required');
      return fetchRelatedMemories(token, String(id));
    },
    [getToken, id],
    { resetKey: String(id), cacheKey: 'related' },
  );

  if (loading && !data) return <LoadingSkeleton rows={6} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }
  if (!data || data.length === 0) {
    return (
      <SoftPage>
        <EmptyState
          title="No related memories yet"
          actionLabel="Search"
          onAction={() => router.push('/(app)/search')}
        />
      </SoftPage>
    );
  }

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        <SoftTitle>Related memories</SoftTitle>
        {data.map((item) => (
          <Pressable
            key={item.observationId}
            onPress={() =>
              router.push({
                pathname: '/(app)/observation/[id]',
                params: { id: item.observationId, highlight: item.snippet },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={item.filename}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <GlassPanel>
              <ThemedText colorKey="textMuted" style={styles.when}>
                {relativeMemoryLabel(item.capturedAt)} · {item.sourceLabel}
              </ThemedText>
              <ThemedText colorKey="text" style={styles.title} numberOfLines={2}>
                {item.filename}
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.snippet} numberOfLines={3}>
                {item.snippet}
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.reasons}>
                {item.reasons.map((reason) => REASON_LABEL[reason]).join(' · ')}
              </ThemedText>
            </GlassPanel>
          </Pressable>
        ))}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  when: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 6 },
  title: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  snippet: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21, marginTop: 6 },
  reasons: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 8 },
});
