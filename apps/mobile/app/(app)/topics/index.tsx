import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SoftPage, SoftTitle } from '../../../components/ui/SoftScreen';
import { KairosSectionHeader, KairosState, KairosSurface, KairosText } from '../../../components/ui/Kairos';
import { useAsync } from '../../../hooks/useAsync';
import { fetchTopics } from '../../../lib/api';
import { classifyTopics, type TopicLane } from '../../../lib/discovery';

const LANE_LABEL: Record<TopicLane, string> = {
  active: 'Active',
  emerging: 'Emerging',
  revisited: 'Recently revisited',
  quiet: 'Quiet',
};

export default function TopicsScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchTopics({ token, limit: 100 });
  }, [getToken], { cacheKey: 'topics' });

  if (loading && !data) return <KairosState kind="loading" title="Loading topics" />;
  if (error && !data) {
    return <KairosState kind="error" title="Unable to load" actionLabel="Retry" onAction={reload} />;
  }
  if (!data || data.items.length === 0) {
    return (
      <SoftPage>
        <SoftTitle>Topics</SoftTitle>
        <KairosState kind="empty" title="None yet" message="Topics appear after a few memories settle." />
      </SoftPage>
    );
  }

  const lanes = classifyTopics(data.items);

  return (
    <SoftPage>
      <SoftTitle>Topics</SoftTitle>
      {(Object.keys(LANE_LABEL) as TopicLane[]).map((lane) => {
        const items = lanes[lane];
        if (items.length === 0) return null;
        return (
          <View key={lane} style={styles.lane}>
            <KairosSectionHeader label={LANE_LABEL[lane]} />
            {items.map((topic) => (
              <Pressable
                key={topic.id}
                onPress={() => router.push(`/(app)/topics/${topic.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${topic.name}, ${topic.observationCount} memories`}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <KairosSurface contentStyle={styles.row} radiusToken="md">
                  <KairosText variant="title" numberOfLines={1} style={{ flex: 1 }}>
                    {topic.name}
                  </KairosText>
                  <KairosText variant="meta" color="textMuted">
                    {topic.observationCount}
                  </KairosText>
                </KairosSurface>
              </Pressable>
            ))}
          </View>
        );
      })}
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  lane: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 56,
    gap: 12,
  },
});
