import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import {
  ApiError,
  fetchObservation,
  observationStatusLabel,
  type ApiObservation,
} from '../../../lib/api';
import { SOURCE_TYPE_LABELS, observationsService } from '../../../services';
import type { Observation, ProcessingStatus, SourceType } from '../../../types';

function mapApiObservation(api: ApiObservation): Observation {
  const sourceType = mapType(api.type);
  const analysisNote =
    typeof api.sourceMetadata?.analysisNote === 'string'
      ? api.sourceMetadata.analysisNote
      : null;
  return {
    id: api.id,
    title: api.filename,
    sourceType,
    capturedAt: api.capturedAt,
    status: api.status as ProcessingStatus,
    previewText:
      api.summary?.slice(0, 180) ||
      api.extractedText?.slice(0, 180) ||
      `${api.type} · ${api.mimeType}`,
    extractedText: api.extractedText ?? undefined,
    summary: api.summary ?? undefined,
    linkedMemoryIds: [],
    sourceLabel: api.filename,
    topics: api.topics.map((t) => ({ id: t.id, name: t.name })),
    entities: api.entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
    })),
    metadata: api.metadata,
    processingError: api.processingError,
    analysisNote,
  };
}

function mapType(type: ApiObservation['type']): SourceType {
  switch (type) {
    case 'PDF':
    case 'DOCUMENT':
      return 'document';
    case 'IMAGE':
      return 'photo';
    case 'TEXT':
      return 'note';
    default:
      return 'document';
  }
}

function statusTone(
  status: ProcessingStatus,
): 'success' | 'accent' | 'neutral' {
  if (status === 'COMPLETED' || status === 'READY') return 'success';
  if (status === 'FAILED') return 'accent';
  return 'neutral';
}

function extractedTextMessage(data: Observation): string {
  if (data.extractedText) return data.extractedText;
  if (data.status === 'PENDING' || data.status === 'EXTRACTING') {
    return 'Extraction has not finished yet.';
  }
  if (
    data.status === 'PROCESSING' ||
    data.status === 'NORMALIZING' ||
    data.status === 'CHUNKING' ||
    data.status === 'ANALYZING'
  ) {
    return 'Extraction in progress…';
  }
  if (data.status === 'FAILED') {
    return 'Processing failed. Extracted text is unavailable.';
  }
  if (data.sourceType === 'photo' || data.sourceType === 'screenshot') {
    return 'OCR is not available yet. Image metadata was saved, but no text was extracted.';
  }
  return 'No extracted text available.';
}

export default function ObservationDetailScreen() {
  const { id, highlight } = useLocalSearchParams<{
    id: string;
    highlight?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const matchedSnippet =
    typeof highlight === 'string' && highlight.trim().length > 0
      ? highlight.trim()
      : Array.isArray(highlight) && typeof highlight[0] === 'string'
        ? highlight[0].trim()
        : null;

  const load = useCallback(async () => {
    const observationId = String(id);
    const token = await getToken();
    if (!token) {
      return observationsService.get(observationId);
    }

    try {
      const api = await fetchObservation(token, observationId);
      return mapApiObservation(api);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return observationsService.get(observationId);
      }
      throw error;
    }
  }, [getToken, id]);

  const { data, error, loading, reload } = useAsync(load, [id]);

  useEffect(() => {
    const terminal =
      data?.status === 'COMPLETED' ||
      data?.status === 'FAILED' ||
      data?.status === 'READY';
    if (!data || terminal) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(() => {
      void reload();
    }, 1500);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [data, reload]);

  if (loading && !data) return <LoadingSkeleton rows={8} />;
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
      <Badge label={data.status} tone={statusTone(data.status)} />
      <ThemedText colorKey="text" style={styles.title}>
        {data.title}
      </ThemedText>
      <ThemedText colorKey="textMuted" style={styles.meta}>
        {SOURCE_TYPE_LABELS[data.sourceType]} · {captured}
      </ThemedText>

      {matchedSnippet ? (
        <>
          <SectionHeader title="Matched snippet" />
          <SurfaceCard>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {matchedSnippet}
            </ThemedText>
          </SurfaceCard>
        </>
      ) : null}

      <SectionHeader title="Processing status" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {observationStatusLabel(data.status as ApiObservation['status'])}
          {data.processingError ? `\n${data.processingError}` : ''}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Summary" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {data.summary
            ? data.summary
            : data.analysisNote
              ? data.analysisNote
              : data.status === 'ANALYZING'
                ? 'Analyzing content…'
                : data.status === 'COMPLETED'
                  ? 'No summary available for this observation.'
                  : 'Summary appears when analysis completes.'}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Topics" />
      <SurfaceCard>
        {data.topics && data.topics.length > 0 ? (
          <View style={styles.chipRow}>
            {data.topics.map((topic) => (
              <View key={topic.id} style={styles.chip}>
                <ThemedText colorKey="text" style={styles.chipText}>
                  {topic.name}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            No topics extracted yet.
          </ThemedText>
        )}
      </SurfaceCard>

      <SectionHeader title="Entities" />
      <SurfaceCard>
        {data.entities && data.entities.length > 0 ? (
          data.entities.map((entity) => (
            <ThemedText key={entity.id} colorKey="textSecondary" style={styles.body}>
              {entity.name} · {entity.type}
            </ThemedText>
          ))
        ) : (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            No entities extracted yet.
          </ThemedText>
        )}
      </SurfaceCard>

      <SectionHeader title="Source" />
      <SurfaceCard>
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {data.sourceLabel}
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          {data.metadata?.mimeType ?? ''}
          {data.metadata?.fileSizeBytes
            ? ` · ${Math.round(data.metadata.fileSizeBytes / 1024)} KB`
            : ''}
          {data.metadata?.chunkCount != null
            ? ` · ${data.metadata.chunkCount} chunks`
            : ''}
          {data.metadata?.wordCount != null
            ? ` · ${data.metadata.wordCount} words`
            : ''}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Extracted text" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {extractedTextMessage(data)}
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
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.35)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});
