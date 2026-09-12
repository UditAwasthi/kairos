import { useAuth } from '@clerk/expo';
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
import { TopicChip } from '../../components/ui/MemoryCards';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedInput } from '../../components/ui/ThemedInput';
import {
  ApiError,
  semanticSearch,
  type ApiSemanticSearchResponse,
} from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

const TYPE_FILTERS: {
  label: string;
  value?: 'DOCUMENT' | 'PDF' | 'IMAGE' | 'TEXT';
}[] = [
  { label: 'All' },
  { label: 'Text', value: 'TEXT' },
  { label: 'PDF', value: 'PDF' },
  { label: 'Images', value: 'IMAGE' },
  { label: 'Docs', value: 'DOCUMENT' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function typeLabel(type: string): string {
  switch (type) {
    case 'TEXT':
      return 'Text';
    case 'PDF':
      return 'PDF';
    case 'IMAGE':
      return 'Image';
    case 'DOCUMENT':
      return 'Document';
    default:
      return type;
  }
}

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();

  const [query, setQuery] = useState('');
  const [observationType, setObservationType] = useState<
    'DOCUMENT' | 'PDF' | 'IMAGE' | 'TEXT' | undefined
  >();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiSemanticSearchResponse | null>(null);
  const [searched, setSearched] = useState(false);

  const runSearch = async (q: string = query) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new ApiError('You must be signed in to search.', 401);
      }
      const response = await semanticSearch({
        token,
        query: trimmed,
        limit: 10,
        filters: observationType ? { observationType } : undefined,
      });
      setResult(response);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Couldn't search your memories. Try again.";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <ThemedInput
        value={query}
        onChangeText={setQuery}
        placeholder="What did I learn about…?"
        accessibilityLabel="Search memories"
        returnKeyType="search"
        onSubmitEditing={() => void runSearch()}
      />
      <ThemedButton
        label={loading ? 'Searching…' : 'Search'}
        disabled={loading || query.trim().length === 0}
        onPress={() => void runSearch()}
      />

      <SectionHeader title="Filters" subtitle="Optional observation type" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {TYPE_FILTERS.map((filter) => (
          <TopicChip
            key={filter.label}
            label={filter.label}
            selected={
              observationType === filter.value ||
              (!observationType && !filter.value)
            }
            onPress={() => setObservationType(filter.value)}
          />
        ))}
      </ScrollView>

      {!searched && !loading ? (
        <SurfaceCard>
          <ThemedText colorKey="textSecondary" style={styles.row}>
            Search across your captured documents with natural language. Results
            open the original observation.
          </ThemedText>
        </SurfaceCard>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.text} />
          <ThemedText colorKey="textSecondary" style={styles.meta}>
            Looking through your memories…
          </ThemedText>
        </View>
      ) : null}

      {error ? (
        <SurfaceCard>
          <ThemedText colorKey="error" style={styles.row}>
            {error}
          </ThemedText>
          <ThemedButton
            label="Retry"
            variant="outline"
            onPress={() => void runSearch()}
          />
        </SurfaceCard>
      ) : null}

      {searched && !loading && result && result.results.length === 0 ? (
        <EmptyState
          title="Nothing relevant found"
          message={`Nothing relevant matched “${result.query}”. Try another phrasing or clear filters.`}
        />
      ) : null}

      {result && result.results.length > 0 ? (
        <>
          <SectionHeader
            title="Results"
            subtitle={`${result.total} relevant ${result.total === 1 ? 'match' : 'matches'}`}
          />
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
            >
              <SurfaceCard>
                <ThemedText colorKey="textMuted" style={styles.meta}>
                  {typeLabel(item.observation.type)} ·{' '}
                  {formatDate(item.observation.capturedAt)}
                </ThemedText>
                <ThemedText colorKey="text" style={styles.title}>
                  {item.observation.filename}
                </ThemedText>
                <ThemedText
                  colorKey="textSecondary"
                  style={styles.row}
                  numberOfLines={4}
                >
                  {item.content}
                </ThemedText>
              </SurfaceCard>
            </Pressable>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  chips: { gap: 8, paddingVertical: 2 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 4 },
  row: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 21 },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 20 },
});
