import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  KairosCard,
  KairosEnter,
  KairosSectionHeader,
  KairosState,
  KairosText,
} from '../../components/ui/Kairos';
import { useAsync } from '../../hooks/useAsync';
import {
  fetchDailyBrief,
  fetchDashboard,
  fetchPredictions,
  fetchProjects,
  fetchTopics,
} from '../../lib/api';
import { buildDiscoveries, discoveryKindLabel } from '../../lib/discovery';

export default function DiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    const [dashboard, brief, predictions, topics, projects] = await Promise.all([
      fetchDashboard(token).catch(() => null),
      fetchDailyBrief(token).catch(() => null),
      fetchPredictions(token).catch(() => null),
      fetchTopics({ token, limit: 40 }).catch(() => ({ items: [] })),
      fetchProjects({ token, limit: 20 }).catch(() => ({ items: [] })),
    ]);
    return { dashboard, brief, predictions, topics: topics.items, projects: projects.items };
  }, [getToken], { cacheKey: 'discover' });

  let items: ReturnType<typeof buildDiscoveries> = [];
  try {
    items = data
      ? buildDiscoveries({
          dashboard: data.dashboard,
          brief: data.brief,
          predictions: data.predictions?.items ?? [],
          topics: data.topics,
          projects: data.projects,
        })
      : [];
  } catch {
    items = [];
  }

  if (loading && !data) return <KairosState kind="loading" title="Looking for patterns" />;
  if (error && !data) {
    return <KairosState kind="error" title="Unable to load" actionLabel="Retry" onAction={reload} />;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      <KairosText variant="heading">Discover</KairosText>
      <KairosText variant="caption" color="textSecondary">
        Only what your memories actually support.
      </KairosText>
      {items.length === 0 ? (
        <KairosState
          kind="empty"
          title="Nothing to notice yet"
          message="Capture a few more memories and patterns will appear here."
        />
      ) : (
        items.map((item, index) => (
          <KairosEnter key={item.id} delay={index * 40}>
            <KairosSectionHeader label={discoveryKindLabel(item.kind)} />
            <KairosCard
              onPress={() => router.push(item.href as never)}
              accessibilityLabel={item.title}
            >
              <KairosText variant="title">{item.title}</KairosText>
              <KairosText variant="body" color="textSecondary" style={{ marginTop: 8 }}>
                {item.body}
              </KairosText>
              <KairosText variant="caption" color="textMuted" style={{ marginTop: 8 }}>
                {item.why}
                {item.evidenceCount > 0 ? ` · ${item.evidenceCount} memories` : ''}
              </KairosText>
            </KairosCard>
          </KairosEnter>
        ))
      )}
      <View style={styles.links}>
        <KairosCard onPress={() => router.push('/(app)/timeline')} accessibilityLabel="Timeline">
          <KairosText variant="title">Timeline</KairosText>
          <KairosText variant="caption" color="textSecondary">
            See memories by day.
          </KairosText>
        </KairosCard>
        <KairosCard onPress={() => router.push('/(app)/topics')} accessibilityLabel="Topics">
          <KairosText variant="title">Topics</KairosText>
          <KairosText variant="caption" color="textSecondary">
            Active, emerging, and quiet threads.
          </KairosText>
        </KairosCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, gap: 16 },
  links: { gap: 12, marginTop: 8 },
});
