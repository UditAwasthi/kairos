import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { useAsync } from '../../../hooks/useAsync';
import { fetchTopics } from '../../../lib/api';

export default function TopicsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to view topics.');
    return fetchTopics({ token, limit: 100 });
  }, [getToken]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) return <ErrorState title="Unable to load topics" message={error} onRetry={reload} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No topics yet"
        message="Topics appear after Kairos analyzes your uploaded documents."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Topics" subtitle="Browse by theme" />
      {data.items.map((topic) => (
        <Pressable key={topic.id} onPress={() => router.push(`/(app)/topics/${topic.id}`)}>
          <SurfaceCard>
            <ThemedText colorKey="text" style={styles.title}>
              {topic.name}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.meta}>
              {topic.observationCount} observations
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
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
});
