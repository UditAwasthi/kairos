import { useAuth } from '@clerk/expo';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { TopicChip } from '../../../components/ui/MemoryCards';
import { ObservationStatusCard } from '../../../components/ui/ObservationStatusCard';
import {
  fetchEntities,
  fetchObservations,
  fetchProjects,
  fetchTopics,
  isProcessingObservationStatus,
  reprocessObservation,
  type ApiEntitySummary,
  type ApiObservation,
  type ApiProjectSummary,
  type ApiTopicSummary,
} from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';

type FilterMode = 'all' | 'project' | 'topic' | 'entity';

const POLL_MS = 3000;

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    topicId?: string;
    entityId?: string;
    projectId?: string;
  }>();

  const [observations, setObservations] = useState<ApiObservation[]>([]);
  const [topics, setTopics] = useState<ApiTopicSummary[]>([]);
  const [entities, setEntities] = useState<ApiEntitySummary[]>([]);
  const [projects, setProjects] = useState<ApiProjectSummary[]>([]);
  const [mode, setMode] = useState<FilterMode>(
    params.projectId
      ? 'project'
      : params.topicId
        ? 'topic'
        : params.entityId
          ? 'entity'
          : 'all',
  );
  const [projectId, setProjectId] = useState<string | undefined>(
    typeof params.projectId === 'string' ? params.projectId : undefined,
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
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const focusedRef = useRef(true);
  const observationsRef = useRef<ApiObservation[]>([]);
  observationsRef.current = observations;

  const loadMeta = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const [topicData, entityData, projectData] = await Promise.all([
      fetchTopics({ token, limit: 30 }),
      fetchEntities({ token, limit: 30 }),
      fetchProjects({ token, limit: 30 }),
    ]);
    setTopics(topicData.items);
    setEntities(entityData.items);
    setProjects(projectData.items);
  }, [getToken]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in to view your timeline.');
      const data = await fetchObservations(token, {
        projectId: mode === 'project' ? projectId : undefined,
        topicId: mode === 'topic' ? topicId : undefined,
        entityId: mode === 'entity' ? entityId : undefined,
      });
      setObservations(data);
    } catch {
      setError('Unable to load timeline.');
    }
  }, [entityId, getToken, mode, projectId, topicId]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      let cancelled = false;
      void (async () => {
        setLoading(true);
        await Promise.all([loadMeta(), load()]);
        if (!cancelled) setLoading(false);
      })();

      const timer = setInterval(() => {
        if (!focusedRef.current) return;
        if (
          observationsRef.current.some((o) =>
            isProcessingObservationStatus(o.status),
          )
        ) {
          void load();
        }
      }, POLL_MS);

      return () => {
        cancelled = true;
        focusedRef.current = false;
        clearInterval(timer);
      };
    }, [load, loadMeta]),
  );

  const onRetry = useCallback(
    async (id: string) => {
      try {
        setRetryingId(id);
        const token = await getToken();
        if (!token) return;
        const updated = await reprocessObservation(token, id);
        setObservations((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
      } catch {
        setError('Retry failed. Try again from the observation detail.');
      } finally {
        setRetryingId(null);
      }
    },
    [getToken],
  );

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
            setProjectId(undefined);
            setTopicId(undefined);
            setEntityId(undefined);
          }}
        />
        {projects.slice(0, 6).map((project) => (
          <TopicChip
            key={project.id}
            label={project.name}
            selected={mode === 'project' && projectId === project.id}
            onPress={() => {
              setMode('project');
              setProjectId(project.id);
              setTopicId(undefined);
              setEntityId(undefined);
            }}
          />
        ))}
        {topics.slice(0, 6).map((topic) => (
          <TopicChip
            key={topic.id}
            label={topic.name}
            selected={mode === 'topic' && topicId === topic.id}
            onPress={() => {
              setMode('topic');
              setTopicId(topic.id);
              setProjectId(undefined);
              setEntityId(undefined);
            }}
          />
        ))}
        {entities.slice(0, 6).map((entity) => (
          <TopicChip
            key={entity.id}
            label={entity.name}
            selected={mode === 'entity' && entityId === entity.id}
            onPress={() => {
              setMode('entity');
              setEntityId(entity.id);
              setProjectId(undefined);
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
            <ObservationStatusCard
              observation={item}
              retrying={retryingId === item.id}
              onPress={() => router.push(`/(app)/observation/${item.id}`)}
              onRetry={
                item.status === 'FAILED'
                  ? () => void onRetry(item.id)
                  : undefined
              }
            />
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
  list: { paddingHorizontal: 16, paddingBottom: 24 },
});
