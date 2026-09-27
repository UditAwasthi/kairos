import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  KairosBottomSheet,
  KairosEnter,
  KairosMemoryCard,
  KairosPill,
  KairosSectionHeader,
  KairosState,
  KairosText,
} from '../../../components/ui/Kairos';
import { SoftPage } from '../../../components/ui/SoftScreen';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import {
  ApiError,
  fetchProjects,
  fetchTopics,
  semanticSearch,
  type ApiProjectSummary,
  type ApiSemanticSearchResponse,
  type ApiTopicSummary,
  type CaptureSource,
} from '../../../lib/api';
import { askPrompts, recallPlaceholders } from '../../../lib/discovery';
import { memoryTitle } from '../../../lib/homeSummary';
import { listRecentSearches, rememberSearch } from '../../../lib/recentSearches';
import {
  SEARCH_DATE_OPTIONS,
  SEARCH_SOURCE_OPTIONS,
  dateRangeForPreset,
  type SearchDatePreset,
} from '../../../lib/searchFilters';
import { inferSearchHints } from '../../../lib/searchHints';
import { useAppTheme } from '../../../providers/ThemeProvider';

export default function RecallScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    q?: string;
    topicId?: string;
    topicName?: string;
    entityId?: string;
    projectId?: string;
  }>();

  const placeholders = recallPlaceholders();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const [topics, setTopics] = useState<ApiTopicSummary[]>([]);
  const [projects, setProjects] = useState<ApiProjectSummary[]>([]);
  const [recent, setRecent] = useState(listRecentSearches);
  const [projectId, setProjectId] = useState<string | undefined>(
    typeof params.projectId === 'string' ? params.projectId : undefined,
  );
  const [topicId, setTopicId] = useState<string | undefined>(
    typeof params.topicId === 'string' ? params.topicId : undefined,
  );
  const [entityId, setEntityId] = useState<string | undefined>(
    typeof params.entityId === 'string' ? params.entityId : undefined,
  );
  const [source, setSource] = useState<CaptureSource | undefined>();
  const [datePreset, setDatePreset] = useState<SearchDatePreset | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiSemanticSearchResponse | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIndex((index) => (index + 1) % placeholders.length);
    }, 4000);
    return () => clearInterval(id);
  }, [placeholders.length]);

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
    setQuery(trimmed);
    setRecent(rememberSearch(trimmed));
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('Sign in required.', 401);
      const hints = inferSearchHints(trimmed);
      const dates = datePreset ? dateRangeForPreset(datePreset) : undefined;
      const response = await semanticSearch({
        token,
        query: hints.query,
        limit: 12,
        filters: {
          projectId,
          topicId,
          entityId,
          from: dates?.from ?? hints.from,
          to: dates?.to ?? hints.to,
          source: source ?? hints.source,
        },
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof params.q === 'string' && params.q.trim()) {
      void runSearch(params.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  const suggestions = [
    ...askPrompts({ topics, projects, weekCount: 1 }),
    ...topics.slice(0, 3).map((topic) => topic.name),
  ].slice(0, 5);

  return (
    <SoftPage tabBar safeTop>
      <KairosText variant="heading">Recall</KairosText>
      <ThemedInput
        value={query}
        onChangeText={setQuery}
        placeholder={placeholders[placeholderIndex]}
        accessibilityLabel="Search memories"
        returnKeyType="search"
        onSubmitEditing={() => void runSearch()}
      />
      <View style={styles.row}>
        <KairosPill label="Filters" selected={Boolean(source || datePreset || topicId || projectId)} onPress={() => setFiltersOpen(true)} />
        <Pressable
          onPress={() => void runSearch()}
          disabled={!query.trim()}
          accessibilityRole="button"
          accessibilityLabel="Search"
          style={({ pressed }) => [
            styles.searchBtn,
            { backgroundColor: colors.buttonFill, opacity: !query.trim() ? 0.4 : pressed ? 0.85 : 1 },
          ]}
        >
          <KairosText variant="caption" color="text" style={{ color: colors.buttonText }}>
            Search
          </KairosText>
        </Pressable>
      </View>

      {!searched && recent.length > 0 ? (
        <View style={styles.block}>
          <KairosSectionHeader label="Recent" />
          <View style={styles.chips}>
            {recent.map((item) => (
              <KairosPill key={item} label={item} onPress={() => void runSearch(item)} />
            ))}
          </View>
        </View>
      ) : null}

      {!searched ? (
        <View style={styles.block}>
          <KairosSectionHeader label="Suggestions" />
          <View style={styles.chips}>
            {suggestions.map((item) => (
              <KairosPill key={item} label={item} onPress={() => void runSearch(item)} />
            ))}
          </View>
        </View>
      ) : null}

      {loading ? <KairosState kind="loading" title="Looking through your memories" /> : null}
      {error ? <KairosState kind="error" title="Unable to search" message={error} actionLabel="Retry" onAction={() => void runSearch()} /> : null}

      {searched && !loading && result && result.results.length === 0 ? (
        <KairosState kind="empty" title="Nothing matched" message="Try a topic, a date, or fewer words." />
      ) : null}

      {result?.results.map((item, index) => (
        <KairosEnter key={item.chunkId} delay={index * 40}>
          <KairosMemoryCard
            title={memoryTitle(item.observation.filename, item.observation.summary)}
            date={new Date(item.observation.capturedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
            snippet={item.content}
            onPress={() =>
              router.push({
                pathname: '/(app)/observation/[id]',
                params: { id: item.observationId, highlight: item.content.slice(0, 180) },
              })
            }
          />
        </KairosEnter>
      ))}

      <KairosBottomSheet visible={filtersOpen} title="Filters" onClose={() => setFiltersOpen(false)}>
        <ScrollView contentContainerStyle={styles.sheet}>
          <KairosText variant="label" color="textMuted">
            Source
          </KairosText>
          <View style={styles.chips}>
            {SEARCH_SOURCE_OPTIONS.map((option) => (
              <KairosPill
                key={option.value}
                label={option.label}
                selected={source === option.value}
                onPress={() => setSource((current) => (current === option.value ? undefined : option.value))}
              />
            ))}
          </View>
          <KairosText variant="label" color="textMuted">
            Date
          </KairosText>
          <View style={styles.chips}>
            {SEARCH_DATE_OPTIONS.map((option) => (
              <KairosPill
                key={option.value}
                label={option.label}
                selected={datePreset === option.value}
                onPress={() =>
                  setDatePreset((current) => (current === option.value ? undefined : option.value))
                }
              />
            ))}
          </View>
          {topics.length > 0 ? (
            <>
              <KairosText variant="label" color="textMuted">
                Topics
              </KairosText>
              <View style={styles.chips}>
                {topics.slice(0, 8).map((topic) => (
                  <KairosPill
                    key={topic.id}
                    label={topic.name}
                    selected={topicId === topic.id}
                    onPress={() => setTopicId((current) => (current === topic.id ? undefined : topic.id))}
                  />
                ))}
              </View>
            </>
          ) : null}
          {projects.length > 0 ? (
            <>
              <KairosText variant="label" color="textMuted">
                Projects
              </KairosText>
              <View style={styles.chips}>
                {projects.slice(0, 8).map((project) => (
                  <KairosPill
                    key={project.id}
                    label={project.name}
                    selected={projectId === project.id}
                    onPress={() =>
                      setProjectId((current) => (current === project.id ? undefined : project.id))
                    }
                  />
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </KairosBottomSheet>
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  searchBtn: {
    minHeight: 44,
    minWidth: 88,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  block: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sheet: { gap: 12, paddingBottom: 24 },
});
