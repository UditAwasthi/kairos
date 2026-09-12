import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { TopicChip } from '../../../components/ui/MemoryCards';
import { useAppTheme } from '../../../providers/ThemeProvider';
import {
  fetchEntities,
  fetchObservations,
  fetchTopics,
  type ApiEntitySummary,
  type ApiObservation,
  type ApiTopicSummary,
} from '../../../lib/api';

type FilterMode = 'all' | 'topic' | 'entity';

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{ topicId?: string; entityId?: string }>();

  const [observations, setObservations] = useState<ApiObservation[]>([]);
  const [topics, setTopics] = useState<ApiTopicSummary[]>([]);
  const [entities, setEntities] = useState<ApiEntitySummary[]>([]);
  const [mode, setMode] = useState<FilterMode>(
    params.topicId ? 'topic' : params.entityId ? 'entity' : 'all',
  );
  const [topicId, setTopicId] = useState<string | undefined>(
    typeof params.topicId === 'string' ? params.topicId : undefined,
  );
  const [entityId, setEntityId] = useState<string | undefined>(
    typeof params.entityId === 'string' ? params.entityId : undefined,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const [topicData, entityData] = await Promise.all([
      fetchTopics({ token, limit: 30 }),
      fetchEntities({ token, limit: 30 }),
    ]);
    setTopics(topicData.items);
    setEntities(entityData.items);
  }, [getToken]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in to view your timeline.');
      const data = await fetchObservations(token, {
        topicId: mode === 'topic' ? topicId : undefined,
        entityId: mode === 'entity' ? entityId : undefined,
      });
      setObservations(data);
    } catch {
      setError('Unable to load timeline.');
    }
  }, [entityId, getToken, mode, topicId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await Promise.all([loadMeta(), load()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load, loadMeta]);

  if (loading) return <LoadingSkeleton rows={10} />;

  if (error && observations.length === 0) {
    return (
      <ErrorState
        title="Timeline unavailable"
        message={error}
        onRetry={() => {
          setLoading(true);
          void load().finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <View style={[styles.flex, { paddingBottom: insets.bottom }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <TopicChip
          label="All"
          selected={mode === 'all'}
          onPress={() => {
            setMode('all');
            setTopicId(undefined);
            setEntityId(undefined);
          }}
        />
        {topics.slice(0, 8).map((topic) => (
          <TopicChip
            key={topic.id}
            label={topic.name}
            selected={mode === 'topic' && topicId === topic.id}
            onPress={() => {
              setMode('topic');
              setTopicId(topic.id);
              setEntityId(undefined);
            }}
          />
        ))}
        {entities.slice(0, 8).map((entity) => (
          <TopicChip
            key={entity.id}
            label={entity.name}
            selected={mode === 'entity' && entityId === entity.id}
            onPress={() => {
              setMode('entity');
              setEntityId(entity.id);
              setTopicId(undefined);
            }}
          />
        ))}
      </ScrollView>

      {observations.length === 0 ? (
        <EmptyState
          title="No observations"
          message={
            mode === 'all'
              ? 'Capture documents and they will appear here chronologically.'
              : 'Nothing matches this filter yet.'
          }
          actionLabel="Capture"
          onAction={() => router.push('/(app)/(tabs)/capture')}
        />
      ) : (
        <FlatList
          data={observations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.text}
              onRefresh={() => {
                setRefreshing(true);
                void load().finally(() => setRefreshing(false));
              }}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(app)/observation/${item.id}`)}
              style={styles.row}
            >
              <ThemedText colorKey="textMuted" style={styles.meta}>
                {formatDateLabel(item.capturedAt)} · {item.type}
              </ThemedText>
              <ThemedText colorKey="text" style={styles.title}>
                {item.filename}
              </ThemedText>
              <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={3}>
                {item.summary || item.extractedText || item.mimeType}
              </ThemedText>
            </Pressable>
          )}
          ListFooterComponent={
            refreshing ? <ActivityIndicator color={colors.accent} /> : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  row: { gap: 4 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
});
