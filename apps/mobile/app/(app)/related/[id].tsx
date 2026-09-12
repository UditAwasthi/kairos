import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { fetchObservation, semanticSearch } from '../../../lib/api';

export default function RelatedMemoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to view related items.');
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
  }, [getToken, id]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load related memories"
        message={error ?? undefined}
        onRetry={reload}
      />
    );
  }

  if (data.results.length === 0) {
    return (
      <EmptyState
        title="No related memories"
        message="Search your library to find more related observations."
        actionLabel="Search"
        onAction={() => router.push('/(app)/search')}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.kicker}>
          Current observation
        </ThemedText>
        <ThemedText colorKey="text" style={styles.title}>
          {data.observation.filename}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Related" subtitle="Semantic neighbors from your library" />
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
        >
          <SurfaceCard>
            <ThemedText colorKey="text" style={styles.cardTitle}>
              {result.observation.filename}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={3}>
              {result.content}
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}

      <ThemedButton
        label="Open observation"
        variant="outline"
        onPress={() => router.push(`/(app)/observation/${data.observation.id}`)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 4 },
});
