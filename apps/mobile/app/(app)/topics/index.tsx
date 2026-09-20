import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { SoftPage } from '../../../components/ui/SoftScreen';
import { GlassPanel } from '../../../components/ui/Glass';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../../components/ui/EmptyState';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { fetchTopics } from '../../../lib/api';

export default function TopicsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchTopics({ token, limit: 100 });
  }, [getToken]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }
  if (!data || data.items.length === 0) {
    return (
      <SoftPage>
        <EmptyState title="None yet" />
      </SoftPage>
    );
  }

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        {data.items.map((topic) => (
          <Pressable
            key={topic.id}
            onPress={() => router.push(`/(app)/topics/${topic.id}`)}
            style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
          >
            <GlassPanel padded={false} contentStyle={styles.row}>
              <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
                {topic.name}
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.meta}>
                {topic.observationCount}
              </ThemedText>
            </GlassPanel>
          </Pressable>
        ))}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  title: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
