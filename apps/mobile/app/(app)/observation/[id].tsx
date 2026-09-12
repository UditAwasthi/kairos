import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { ApiError, fetchObservation, type ApiObservation } from '../../../lib/api';
import { SOURCE_TYPE_LABELS, observationsService } from '../../../services';
import type { Observation, ProcessingStatus, SourceType } from '../../../types';

function mapApiObservation(api: ApiObservation): Observation {
  const sourceType = mapType(api.type);
  return {
    id: api.id,
    title: api.filename,
    sourceType,
    capturedAt: api.capturedAt,
    status: api.status as ProcessingStatus,
    previewText:
      api.extractedText?.slice(0, 180) ||
      `${api.type} · ${api.mimeType}`,
    extractedText: api.extractedText ?? undefined,
    linkedMemoryIds: [],
    sourceLabel: api.filename,
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
  if (data.status === 'PENDING') return 'Extraction has not started yet.';
  if (data.status === 'PROCESSING') return 'Extraction in progress…';
  if (data.status === 'FAILED') {
    return 'Processing failed. Extracted text is unavailable.';
  }
  if (data.sourceType === 'photo' || data.sourceType === 'screenshot') {
    return 'OCR is not available yet. Image metadata was saved, but no text was extracted.';
  }
  return 'No extracted text available.';
}

export default function ObservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();

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
      <Badge label={data.status} tone={statusTone(data.status)} />
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
        <ThemedText colorKey="textMuted" style={styles.meta}>
          Captured {captured}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Processing status" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {data.status === 'COMPLETED' || data.status === 'READY'
            ? 'Processing finished. Extracted content is shown below when available.'
            : data.status === 'FAILED'
              ? 'Processing failed. You can retry by capturing the file again.'
              : data.status === 'PROCESSING' || data.status === 'PENDING'
                ? 'Kairos is extracting content from your file.'
                : data.status}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Extracted text" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {extractedTextMessage(data)}
        </ThemedText>
      </SurfaceCard>

      {data.summary ? (
        <>
          <SectionHeader title="Generated summary" />
          <SurfaceCard>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {data.summary}
            </ThemedText>
          </SurfaceCard>
        </>
      ) : null}

      <SectionHeader title="Linked memories" />
      {data.linkedMemoryIds.length === 0 ? (
        <SurfaceCard>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            No linked memories yet. Memory creation is not part of this upload slice.
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
