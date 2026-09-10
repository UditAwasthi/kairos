import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { MemoryCard } from '../../../components/ui/MemoryCards';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { useAsync } from '../../../hooks/useAsync';
import { topicsService } from '../../../services';

export default function TopicDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => topicsService.get(String(id)), [id]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return <ErrorState title="Topic unavailable" message={error ?? undefined} onRetry={reload} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText colorKey="text" style={styles.title}>
        {data.name}
      </ThemedText>
      <ThemedText colorKey="textSecondary" style={styles.body}>
        {data.description}
      </ThemedText>
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          {data.memoryCount} memories · last activity{' '}
          {new Date(data.recentActivityAt).toLocaleString()}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Related projects" />
      {data.relatedProjectIds.length === 0 ? (
        <ThemedText colorKey="textMuted" style={styles.meta}>
          No linked projects
        </ThemedText>
      ) : (
        data.relatedProjectIds.map((projectId) => (
          <Pressable key={projectId} onPress={() => router.push(`/(app)/projects/${projectId}`)}>
            <SurfaceCard>
              <ThemedText colorKey="text" style={styles.cardTitle}>
                Open project
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.meta}>
                {projectId}
              </ThemedText>
            </SurfaceCard>
          </Pressable>
        ))
      )}

      <SectionHeader title="Memories" />
      {data.memories.map((memory) => (
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
  title: { fontFamily: 'DotGothic16_400Regular', fontSize: 28, letterSpacing: 1 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
