import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchResultCard, TopicChip } from '../../components/ui/MemoryCards';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedInput } from '../../components/ui/ThemedInput';
import { useAsync } from '../../hooks/useAsync';
import { useAppTheme } from '../../providers/ThemeProvider';
import { searchService, topicsService } from '../../services';
import type { SearchResponse, SourceType } from '../../types';

const SOURCE_FILTERS: { label: string; value?: SourceType }[] = [
  { label: 'All' },
  { label: 'Notes', value: 'note' },
  { label: 'Links', value: 'link' },
  { label: 'Docs', value: 'document' },
  { label: 'Shots', value: 'screenshot' },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const suggestions = useAsync(() => searchService.suggestions(), []);
  const topics = useAsync(() => topicsService.list(), []);

  const [query, setQuery] = useState('');
  const [topicId, setTopicId] = useState<string | undefined>();
  const [sourceType, setSourceType] = useState<SourceType | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = async (q: string = query) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const response = await searchService.search(q, { topicId, sourceType });
      setResult(response);
    } catch {
      setError('Search failed. Check your connection and retry.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const recent = result?.recentSearches ?? suggestions.data?.recent ?? [];
  const suggested = result?.suggestedSearches ?? suggestions.data?.suggested ?? [];

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search memories…"
        accessibilityLabel="Search memories"
        returnKeyType="search"
        onSubmitEditing={() => void runSearch()}
      />
      <ThemedButton
        label={loading ? 'Searching…' : 'Search'}
        disabled={loading || query.trim().length === 0}
        onPress={() => void runSearch()}
      />

      <SectionHeader title="Filters" subtitle="Topic and source type" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <TopicChip
          label="Any topic"
          selected={!topicId}
          onPress={() => setTopicId(undefined)}
        />
        {(topics.data ?? []).map((topic) => (
          <TopicChip
            key={topic.id}
            label={topic.name}
            selected={topicId === topic.id}
            onPress={() => setTopicId(topic.id)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SOURCE_FILTERS.map((filter) => (
          <TopicChip
            key={filter.label}
            label={filter.label}
            selected={sourceType === filter.value || (!sourceType && !filter.value)}
            onPress={() => setSourceType(filter.value)}
          />
        ))}
      </ScrollView>

      {!searched ? (
        <>
          <SectionHeader title="Recent searches" />
          {recent.length === 0 ? (
            <ThemedText colorKey="textMuted" style={styles.meta}>
              No recent searches yet.
            </ThemedText>
          ) : (
            recent.map((item) => (
              <Pressable
                key={item}
                onPress={() => {
                  setQuery(item);
                  void runSearch(item);
                }}
              >
                <SurfaceCard>
                  <ThemedText colorKey="text" style={styles.row}>
                    {item}
                  </ThemedText>
                </SurfaceCard>
              </Pressable>
            ))
          )}

          <SectionHeader title="Suggested" />
          {suggested.map((item) => (
            <Pressable
              key={item}
              onPress={() => {
                setQuery(item);
                void runSearch(item);
              }}
            >
              <SurfaceCard>
                <ThemedText colorKey="text" style={styles.row}>
                  {item}
                </ThemedText>
              </SurfaceCard>
            </Pressable>
          ))}
        </>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text} />
          <ThemedText colorKey="textSecondary" style={styles.meta}>
            Searching your memory library…
          </ThemedText>
        </View>
      ) : null}

      {error ? (
        <SurfaceCard>
          <ThemedText colorKey="error" style={styles.row}>
            {error}
          </ThemedText>
          <ThemedButton label="Retry" variant="outline" onPress={() => void runSearch()} />
        </SurfaceCard>
      ) : null}

      {searched && !loading && result && result.results.length === 0 ? (
        <EmptyState
          title="No results"
          message={`Nothing matched “${result.query}”. Try another phrasing or clear filters.`}
          actionLabel="Ask Kairos"
          onAction={() => router.push('/(app)/(tabs)/ask')}
        />
      ) : null}

      {result && result.results.length > 0 ? (
        <>
          <SectionHeader
            title="Results"
            subtitle={`${result.total} memories`}
          />
          {result.results.map((item) => (
            <SearchResultCard
              key={item.memory.id}
              result={item}
              onPress={() => router.push(`/(app)/memory/${item.memory.id}`)}
            />
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  chips: { gap: 8, paddingVertical: 2 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  row: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 20 },
});
