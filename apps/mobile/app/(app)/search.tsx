import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SoftPage } from '../../components/ui/SoftScreen';
import { GlassPanel } from '../../components/ui/Glass';
import {
  EmptyState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../components/ui/EmptyState';
import { TopicChip } from '../../components/ui/MemoryCards';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedInput } from '../../components/ui/ThemedInput';
import { ThemedText } from '../../components/ThemedText';
import {
  ApiError,
  fetchProjects,
  fetchTopics,
  semanticSearch,
  type ApiProjectSummary,
  type ApiSemanticSearchResponse,
  type ApiTopicSummary,
} from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    topicId?: string;
    topicName?: string;
    entityId?: string;
    entityName?: string;
    projectId?: string;
    projectName?: string;
  }>();

  const [query, setQuery] = useState('');
  const [topics, setTopics] = useState<ApiTopicSummary[]>([]);
  const [projects, setProjects] = useState<ApiProjectSummary[]>([]);
  const [projectId, setProjectId] = useState<string | undefined>(
    typeof params.projectId === 'string' ? params.projectId : undefined,
  );
  const [topicId, setTopicId] = useState<string | undefined>(
    typeof params.topicId === 'string' ? params.topicId : undefined,
  );
  const [entityId, setEntityId] = useState<string | undefined>(
    typeof params.entityId === 'string' ? params.entityId : undefined,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiSemanticSearchResponse | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const [topicData, projectData] = await Promise.all([
          fetchTopics({ token, limit: 20 }),
          fetchProjects({ token, limit: 20 }),
        ]);
        setTopics(topicData.items);
        setProjects(projectData.items);
      } catch {
        /* optional */
      }
    })();
  }, [getToken]);

  const runSearch = async (q: string = query) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('Sign in required.', 401);
      const response = await semanticSearch({
        token,
        query: trimmed,
        limit: 10,
        filters: { projectId, topicId, entityId },
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FadeInContent>
      <SoftPage>

        <View style={styles.searchRow}>
          <View style={styles.inputWrap}>
            <ThemedInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search…"
              accessibilityLabel="Search"
              returnKeyType="search"
              onSubmitEditing={() => void runSearch()}
            />
          </View>
          <Pressable
            disabled={loading || query.trim().length === 0}
            onPress={() => void runSearch()}
            style={({ pressed }) => [
              styles.searchBtn,
              {
                backgroundColor: colors.buttonFill,
                opacity: loading || !query.trim() ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityLabel="Search"
          >
            <Feather name="search" size={18} color={colors.buttonText} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <TopicChip
            label="All"
            selected={!projectId && !topicId && !entityId}
            onPress={() => {
              setProjectId(undefined);
              setTopicId(undefined);
              setEntityId(undefined);
            }}
          />
          {projects.map((project) => (
            <TopicChip
              key={project.id}
              label={project.name}
              selected={projectId === project.id}
              onPress={() => {
                setProjectId(project.id);
                setTopicId(undefined);
                setEntityId(undefined);
              }}
            />
          ))}
          {topics.map((topic) => (
            <TopicChip
              key={topic.id}
              label={topic.name}
              selected={topicId === topic.id}
              onPress={() => {
                setTopicId(topic.id);
                setProjectId(undefined);
                setEntityId(undefined);
              }}
            />
          ))}
        </ScrollView>

        <SoftRefreshBar active={loading && !!result} />
        {loading && !result ? <LoadingSkeleton rows={4} /> : null}

        {error ? (
          <GlassPanel>
            <ThemedText colorKey="error" style={styles.error}>
              {error}
            </ThemedText>
            <ThemedButton label="Retry" variant="outline" onPress={() => void runSearch()} />
          </GlassPanel>
        ) : null}

        {searched && !loading && result && result.results.length === 0 ? (
          <EmptyState title="No matches" />
        ) : null}

        {result && result.results.length > 0 ? (
          <View style={{ opacity: loading ? 0.72 : 1, gap: 12 }}>
            {result.results.map((item) => (
              <Pressable
                key={item.chunkId}
                onPress={() =>
                  router.push({
                    pathname: '/(app)/observation/[id]',
                    params: {
                      id: item.observationId,
                      highlight: item.content.slice(0, 240),
                    },
                  })
                }
                accessibilityRole="button"
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <GlassPanel padded={false} contentStyle={styles.result}>
                  <ThemedText colorKey="textMuted" style={styles.meta}>
                    {formatDate(item.observation.capturedAt)}
                  </ThemedText>
                  <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
                    {item.observation.filename}
                  </ThemedText>
                  <ThemedText colorKey="textMuted" style={styles.snippet} numberOfLines={3}>
                    {item.content}
                  </ThemedText>
                </GlassPanel>
              </Pressable>
            ))}
          </View>
        ) : null}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrap: { flex: 1 },
  searchBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { gap: 8, paddingVertical: 2 },
  result: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  title: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  snippet: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, marginTop: 4 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
