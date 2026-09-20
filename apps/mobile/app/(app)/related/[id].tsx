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
import { SoftPage } from '../../../components/ui/SoftScreen';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { fetchObservation, semanticSearch } from '../../../lib/api';

export default function RelatedMemoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();

  const { data, error, loading, refreshing, reload } = useAsync(
    async () => {
      const token = await getToken();
      if (!token) throw new Error('Sign in required');
      const observation = await fetchObservation(token, String(id));
      const query =
        observation.summary?.trim() ||
        observation.extractedText?.slice(0, 200)?.trim() ||
        observation.filename;
      const related = await semanticSearch({
        token,
        query,
        limit: 8,
      });
      return {
        observation,
        results: related.results.filter((r) => r.observationId !== observation.id),
      };
    },
    [getToken, id],
    { resetKey: String(id) },
  );

  if (loading) return <LoadingSkeleton rows={8} />;
  if ((error && !data) || !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }

  if (data.results.length === 0) {
    return (
      <SoftPage>
        <EmptyState
          title="None yet"
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
        <GlassPanel padded={false} contentStyle={styles.current}>
          <ThemedText colorKey="text" style={styles.currentTitle} numberOfLines={2}>
            {data.observation.filename}
          </ThemedText>
        </GlassPanel>

        {data.results.map((result) => (
          <Pressable
            key={result.chunkId}
            onPress={() =>
              router.push({
                pathname: '/(app)/observation/[id]',
                params: {
                  id: result.observationId,
                  highlight: result.content.slice(0, 280),
                },
              })
            }
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <GlassPanel padded={false} contentStyle={styles.row}>
              <ThemedText colorKey="text" style={styles.rowTitle} numberOfLines={1}>
                {result.observation.filename}
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.snippet} numberOfLines={2}>
                {result.content}
              </ThemedText>
            </GlassPanel>
          </Pressable>
        ))}

        <ThemedButton
          label="Open"
          variant="outline"
          onPress={() => router.push(`/(app)/observation/${data.observation.id}`)}
        />
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  current: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currentTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  rowTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  snippet: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
});
