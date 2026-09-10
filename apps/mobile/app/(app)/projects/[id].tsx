import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { MemoryCard, TimelineMemoryItem, TopicChip } from '../../../components/ui/MemoryCards';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { useAsync } from '../../../hooks/useAsync';
import { projectsService } from '../../../services';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => projectsService.get(String(id)), [id]);

  if (loading) return <LoadingSkeleton rows={10} />;
  if (error || !data) {
    return <ErrorState title="Project unavailable" message={error ?? undefined} onRetry={reload} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <Badge label={data.status} tone={data.status === 'active' ? 'success' : 'neutral'} />
      <ThemedText colorKey="text" style={styles.title}>
        {data.name}
      </ThemedText>
      <ThemedText colorKey="textSecondary" style={styles.body}>
        {data.description}
      </ThemedText>
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          {data.memoryCount} memories · updated {new Date(data.updatedAt).toLocaleString()}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Related topics" />
      <View style={styles.chips}>
        {data.topics.map((topic) => (
          <TopicChip
            key={topic.id}
            label={topic.name}
            onPress={() => router.push(`/(app)/topics/${topic.id}`)}
          />
        ))}
      </View>

      <SectionHeader title="Activity" />
      {data.recentActivity.length === 0 ? (
        <ThemedText colorKey="textMuted" style={styles.meta}>
          No recent notifications for this project.
        </ThemedText>
      ) : (
        data.recentActivity.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              if (item.href) router.push(item.href as `/${string}`);
            }}
          >
            <SurfaceCard>
              <ThemedText colorKey="text" style={styles.cardTitle}>
                {item.title}
              </ThemedText>
              <ThemedText colorKey="textSecondary" style={styles.body}>
                {item.body}
              </ThemedText>
            </SurfaceCard>
          </Pressable>
        ))
      )}

      <SectionHeader title="Timeline" />
      {data.memories.slice(0, 6).map((memory, index, arr) => (
        <TimelineMemoryItem
          key={memory.id}
          memory={memory}
          isFirst={index === 0}
          isLast={index === arr.length - 1}
          onPress={() => router.push(`/(app)/memory/${memory.id}`)}
        />
      ))}

      <SectionHeader title="Recent memories" />
      {data.memories.map((memory) => (
        <MemoryCard
          key={`card-${memory.id}`}
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
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
