import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { MemoryCard } from '../../../components/ui/MemoryCards';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { useAsync } from '../../../hooks/useAsync';
import { memoriesService } from '../../../services';

export default function RelatedMemoriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const detail = useAsync(() => memoriesService.get(String(id)), [id]);
  const related = useAsync(() => memoriesService.getRelated(String(id)), [id]);

  if (detail.loading || related.loading) return <LoadingSkeleton rows={8} />;
  if (detail.error || related.error || !detail.data) {
    return (
      <ErrorState
        title="Unable to load related memories"
        message={detail.error ?? related.error ?? undefined}
        onRetry={() => {
          detail.reload();
          related.reload();
        }}
      />
    );
  }

  if (!related.data || related.data.length === 0) {
    return (
      <EmptyState
        title="No related memories"
        message="Related items will appear as Kairos connects more of your library."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.kicker}>
          Current memory
        </ThemedText>
        <ThemedText colorKey="text" style={styles.title}>
          {detail.data.title}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader
        title="Related"
        subtitle="Semantic neighbors from your library"
      />
      {related.data.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onPress={() => router.push(`/(app)/memory/${memory.id}`)}
        />
      ))}
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
});
