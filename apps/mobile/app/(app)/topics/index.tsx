import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { useAsync } from '../../../hooks/useAsync';
import { topicsService } from '../../../services';

export default function TopicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => topicsService.list(), []);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) return <ErrorState title="Unable to load topics" message={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No topics yet"
        message="Topics appear as Kairos organizes your memories."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Topics" subtitle="Browse by theme" />
      {data.map((topic) => (
        <Pressable key={topic.id} onPress={() => router.push(`/(app)/topics/${topic.id}`)}>
          <SurfaceCard>
            <ThemedText colorKey="text" style={styles.title}>
              {topic.name}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {topic.description}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.meta}>
              {topic.memoryCount} memories · updated{' '}
              {new Date(topic.recentActivityAt).toLocaleDateString()}
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
