import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../components/ui/EmptyState';
import { TopicChip } from '../../components/ui/MemoryCards';
import { ObservationStatusCard } from '../../components/ui/ObservationStatusCard';
import { ThemedText } from '../../components/ThemedText';
import {
  fetchEntities,
  fetchObservationsPage,
  fetchProjects,
  fetchTopics,
  isProcessingObservationStatus,
  reprocessObservation,
  type ApiEntitySummary,
  type ApiObservation,
  type ApiProjectSummary,
  type ApiTopicSummary,
} from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

type FilterMode = 'all' | 'project' | 'topic' | 'entity';

const POLL_MS = 3000;
const PAGE_SIZE = 40;

function mergeHead(
  previous: ApiObservation[],
  incoming: ApiObservation[],
): ApiObservation[] {
  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...incoming, ...previous.filter((item) => !incomingIds.has(item.id))];
}

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
  const [filtering, setFiltering] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [endReached, setEndReached] = useState(false);

  const focusedRef = useRef(true);
  const observationsRef = useRef<ApiObservation[]>([]);
  const filtersRef = useRef({ mode, projectId, topicId, entityId });
  const nextCursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const hasLoadedRef = useRef(false);
  observationsRef.current = observations;
  filtersRef.current = { mode, projectId, topicId, entityId };

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

  const loadPage = useCallback(
    async (modeKind: 'reset' | 'more' | 'head') => {
      const token = await getToken();
      if (!token) throw new Error('Sign in to view your timeline.');
      const f = filtersRef.current;
      const page = await fetchObservationsPage(token, {
        projectId: f.mode === 'project' ? f.projectId : undefined,
        topicId: f.mode === 'topic' ? f.topicId : undefined,
        entityId: f.mode === 'entity' ? f.entityId : undefined,
        limit: PAGE_SIZE,
        cursor: modeKind === 'more' ? nextCursorRef.current ?? undefined : undefined,
      });
      if (modeKind === 'reset') {
        nextCursorRef.current = page.nextCursor;
        setEndReached(!page.nextCursor);
        return page.items;
      }
      if (modeKind === 'head') {
        return page.items;
      }
      nextCursorRef.current = page.nextCursor;
      setEndReached(!page.nextCursor);
      return page.items;
    },
    [getToken],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const initial = !hasLoadedRef.current;
      if (initial) setLoading(true);
      else setFiltering(true);
      setError(null);
      nextCursorRef.current = null;
      setEndReached(false);
      try {
        const data = await loadPage('reset');
        if (cancelled) return;
        setObservations(data);
        hasLoadedRef.current = true;
      } catch {
        if (!cancelled) setError('Unable to load timeline.');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setFiltering(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, projectId, topicId, entityId, loadPage]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      void loadMeta();

      if (hasLoadedRef.current) {
        void loadPage('head')
          .then((data) => setObservations((prev) => mergeHead(prev, data)))
          .catch(() => {
            /* keep last good list */
          });
      }

      const timer = setInterval(() => {
        if (!focusedRef.current) return;
        if (
          observationsRef.current.some((o) =>
            isProcessingObservationStatus(o.status),
          )
        ) {
          void loadPage('head')
            .then((data) => setObservations((prev) => mergeHead(prev, data)))
            .catch(() => {
              /* keep last good list */
            });
        }
      }, POLL_MS);

      return () => {
        focusedRef.current = false;
        clearInterval(timer);
      };
    }, [loadMeta, loadPage]),
  );

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !nextCursorRef.current || endReached) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    void loadPage('more')
      .then((incoming) => {
        setObservations((prev) => {
          const seen = new Set(prev.map((item) => item.id));
          return [...prev, ...incoming.filter((item) => !seen.has(item.id))];
        });
      })
      .catch(() => {
        /* keep current page */
      })
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [endReached, loadPage]);

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

  if (loading && observations.length === 0 && !error) {
    return <LoadingSkeleton rows={10} />;
  }

  if (error && observations.length === 0) {
    return (
      <ErrorState
        title="Unavailable"
        onRetry={() => {
          setLoading(true);
          void loadPage('reset')
            .then((data) => {
              setObservations(data);
              setError(null);
              hasLoadedRef.current = true;
            })
            .catch(() => setError('Unable to load timeline.'))
            .finally(() => setLoading(false));
        }}
      />
    );
  }

  return (
    <FadeInContent style={[styles.flex, { paddingBottom: insets.bottom }]}>
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

      <SoftRefreshBar active={filtering} />

      {observations.length === 0 ? (
        <EmptyState
          title="No memories yet"
          actionLabel="Capture something"
          onAction={() => router.push('/(app)/quick-capture')}
        />
      ) : (
        <FlatList
          data={observations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          style={{ opacity: filtering ? 0.72 : 1 }}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : endReached ? (
              <ThemedText colorKey="textMuted" style={styles.end}>
                End of timeline
              </ThemedText>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.text}
              onRefresh={() => {
                setRefreshing(true);
                nextCursorRef.current = null;
                void loadPage('reset')
                  .then((data) => {
                    setObservations(data);
                    setError(null);
                  })
                  .catch(() => setError('Unable to load timeline.'))
                  .finally(() => setRefreshing(false));
              }}
            />
          }
          renderItem={({ item, index }) => {
            const day = new Date(item.capturedAt).toDateString();
            const prev = observations[index - 1];
            const showDay = !prev || new Date(prev.capturedAt).toDateString() !== day;
            const label = day === new Date().toDateString()
              ? 'Today'
              : day === new Date(Date.now() - 86400000).toDateString()
                ? 'Yesterday'
                : new Date(item.capturedAt).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  });
            return (
              <>
                {showDay ? (
                  <ThemedText colorKey="textMuted" style={styles.day}>
                    {label}
                  </ThemedText>
                ) : null}
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
              </>
            );
          }}
        />
      )}
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filters: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  footer: { paddingVertical: 16, alignItems: 'center' },
  end: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
  day: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 8,
  },
});
