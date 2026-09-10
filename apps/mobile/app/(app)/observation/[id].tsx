import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { SOURCE_TYPE_LABELS, observationsService } from '../../../services';

export default function ObservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(
    () => observationsService.get(String(id)),
    [id],
  );

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return (
      <ErrorState title="Observation unavailable" message={error ?? undefined} onRetry={reload} />
    );
  }

  const captured = new Date(data.capturedAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <Badge
        label={data.status}
        tone={data.status === 'READY' ? 'success' : data.status === 'FAILED' ? 'accent' : 'neutral'}
      />
      <ThemedText colorKey="text" style={styles.title}>
        {data.title}
      </ThemedText>
      <ThemedText colorKey="textMuted" style={styles.meta}>
        {SOURCE_TYPE_LABELS[data.sourceType]} · {captured}
      </ThemedText>

      <SectionHeader title="Preview" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {data.previewText}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Source" />
      <SurfaceCard>
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {data.sourceLabel}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Extracted text" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {data.extractedText ??
            (data.status === 'PENDING'
              ? 'Extraction has not started yet.'
              : data.status === 'PROCESSING'
                ? 'Extraction in progress…'
                : 'No extracted text available.')}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Generated summary" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {data.summary ?? 'Summary appears when processing completes.'}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Linked memories" />
      {data.linkedMemoryIds.length === 0 ? (
        <SurfaceCard>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            No linked memories yet.
          </ThemedText>
        </SurfaceCard>
      ) : (
        data.linkedMemoryIds.map((memoryId) => (
          <Pressable key={memoryId} onPress={() => router.push(`/(app)/memory/${memoryId}`)}>
            <SurfaceCard>
              <ThemedText colorKey="text" style={styles.cardTitle}>
                Open linked memory
              </ThemedText>
              <ThemedText colorKey="textMuted" style={styles.meta}>
                {memoryId}
              </ThemedText>
            </SurfaceCard>
          </Pressable>
        ))
      )}

      <ThemedButton
        label="Processing activity"
        variant="outline"
        onPress={() => router.push('/(app)/activity')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'DotGothic16_400Regular', fontSize: 24, letterSpacing: 1 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
