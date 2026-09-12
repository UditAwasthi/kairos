import { useAuth } from '@clerk/expo';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { SOURCE_TYPE_LABELS } from '../../../constants/source-labels';
import {
  ApiError,
  deleteObservation,
  fetchObservation,
  formatObservationReadyTime,
  isProcessingObservationStatus,
  isTerminalObservationStatus,
  observationStageLabel,
  observationStatusHeadline,
  reprocessObservation,
  type ApiObservation,
} from '../../../lib/api';
import type { Observation, ProcessingStatus, SourceType } from '../../../types';

const POLL_MS = 2000;

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
    projects: (api.projects ?? []).map((p) => ({ id: p.id, name: p.name })),
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

function extractedTextMessage(
  data: Observation,
  apiObs: ApiObservation | null,
): string {
  if (data.status !== 'COMPLETED' && data.status !== 'READY') {
    if (data.status === 'FAILED') {
      return 'Processing failed. Extracted text is unavailable until retry succeeds.';
    }
    if (data.status === 'PENDING' || data.status === 'EXTRACTING') {
      return 'Extraction has not finished yet.';
    }
    return 'Extraction in progress…';
  }
  if (data.extractedText) return data.extractedText;

  const processingNote =
    typeof apiObs?.sourceMetadata?.processingNote === 'string'
      ? apiObs.sourceMetadata.processingNote.trim()
      : '';
  if (processingNote) return processingNote;

  if (data.sourceType === 'photo' || data.sourceType === 'screenshot') {
    return 'No text was extracted from this image yet. Try Reprocess after OCR is configured.';
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
  const [data, setData] = useState<Observation | null>(null);
  const [apiObs, setApiObs] = useState<ApiObservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
      setError('Sign in to view this observation.');
      setData(null);
      setApiObs(null);
      return;
    }

    try {
      const api = await fetchObservation(token, observationId);
      setApiObs(api);
      setData(mapApiObservation(api));
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Observation not found.');
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Your session expired. Sign in again.');
      } else {
        setError('Unable to load observation.');
      }
      setData(null);
      setApiObs(null);
    }
  }, [getToken, id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();

      return () => {
        cancelled = true;
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };
    }, [load]),
  );

  useEffect(() => {
    if (
      !data ||
      isTerminalObservationStatus(data.status as ApiObservation['status'])
    ) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    if (pollRef.current) return;

    pollRef.current = setInterval(() => {
      void (async () => {
        const token = await getToken();
        if (!token) return;
        try {
          const api = await fetchObservation(token, String(id));
          setApiObs(api);
          setData(mapApiObservation(api));
        } catch {
          // Keep last known state while polling.
        }
      })();
    }, POLL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [data, getToken, id]);

  const onRetry = async () => {
    try {
      setRetrying(true);
      const token = await getToken();
      if (!token) return;
      const api = await reprocessObservation(token, String(id));
      setApiObs(api);
      setData(mapApiObservation(api));
    } catch {
      setError('Retry failed. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Delete observation?',
      'This permanently deletes the observation, its chunks, embeddings, and cloud file. Projects stay; only membership is removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setDeleting(true);
                const token = await getToken();
                if (!token) throw new ApiError('Sign in required.', 401);
                await deleteObservation(token, String(id));
                router.replace('/(app)/(tabs)/timeline');
              } catch (err) {
                Alert.alert(
                  'Unable to delete',
                  err instanceof ApiError ? err.message : 'Try again.',
                );
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  };

  if (loading && !data) return <LoadingSkeleton rows={8} />;
  if ((error && !data) || !data) {
    return (
      <ErrorState
        title="Observation unavailable"
        message={error ?? undefined}
        onRetry={() => void load()}
      />
    );
  }

  const captured = new Date(data.capturedAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const ready = data.status === 'COMPLETED' || data.status === 'READY';
  const failed = data.status === 'FAILED';
  const processing = isProcessingObservationStatus(
    data.status as ApiObservation['status'],
  );
  const stage =
    apiObs != null
      ? observationStageLabel(apiObs)
      : observationStageLabel({
          status: data.status as ApiObservation['status'],
        });
  const headline = observationStatusHeadline(
    data.status as ApiObservation['status'],
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Badge label={headline} tone={statusTone(data.status)} />
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
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {headline}
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {stage}
          {ready && apiObs
            ? `\n${formatObservationReadyTime(apiObs.processedAt || apiObs.updatedAt)}`
            : ''}
          {failed && data.processingError ? `\n${data.processingError}` : ''}
        </ThemedText>
        {failed ? (
          <View style={styles.retryWrap}>
            <ThemedButton
              label={retrying ? 'Retrying…' : 'Retry'}
              onPress={() => void onRetry()}
              disabled={retrying}
            />
          </View>
        ) : null}
      </SurfaceCard>

      <SectionHeader title="Summary" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {ready
            ? data.summary
              ? data.summary
              : data.analysisNote
                ? data.analysisNote
                : 'No summary available for this observation.'
            : processing
              ? stage
              : failed
                ? 'Summary unavailable until processing succeeds.'
                : 'Summary appears when analysis completes.'}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Topics" />
      <SurfaceCard>
        {ready && data.topics && data.topics.length > 0 ? (
          <View style={styles.chipRow}>
            {data.topics.map((topic) => (
              <Pressable
                key={topic.id}
                onPress={() => router.push(`/(app)/topics/${topic.id}`)}
                style={styles.chip}
              >
                <ThemedText colorKey="text" style={styles.chipText}>
                  {topic.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {ready
              ? 'No topics extracted yet.'
              : processing
                ? 'Topics appear when processing finishes.'
                : 'No topics available.'}
          </ThemedText>
        )}
      </SurfaceCard>

      <SectionHeader title="Entities" />
      <SurfaceCard>
        {ready && data.entities && data.entities.length > 0 ? (
          <View style={styles.chipRow}>
            {data.entities.map((entity) => (
              <Pressable
                key={entity.id}
                onPress={() => router.push(`/(app)/entities/${entity.id}`)}
                style={styles.chip}
              >
                <ThemedText colorKey="text" style={styles.chipText}>
                  {entity.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {ready
              ? 'No entities extracted yet.'
              : processing
                ? 'Entities appear when processing finishes.'
                : 'No entities available.'}
          </ThemedText>
        )}
      </SurfaceCard>

      <SectionHeader title="Projects" />
      <SurfaceCard>
        {data.projects && data.projects.length > 0 ? (
          <View style={styles.chipRow}>
            {data.projects.map((project) => (
              <Pressable
                key={project.id}
                onPress={() => router.push(`/(app)/projects/${project.id}`)}
                style={styles.chip}
              >
                <ThemedText colorKey="text" style={styles.chipText}>
                  {project.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            Not in any project yet.
          </ThemedText>
        )}
      </SurfaceCard>
      <ThemedButton
        label="Add to project"
        variant="outline"
        onPress={() =>
          router.push({
            pathname: '/(app)/observation/projects',
            params: { id: String(id) },
          })
        }
      />

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
          {ready && data.metadata?.chunkCount != null
            ? ` · ${data.metadata.chunkCount} chunks`
            : ''}
          {ready && data.metadata?.wordCount != null
            ? ` · ${data.metadata.wordCount} words`
            : ''}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Extracted text" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {extractedTextMessage(data, apiObs)}
        </ThemedText>
      </SurfaceCard>

      <ThemedButton
        label="Processing activity"
        variant="outline"
        onPress={() => router.push('/(app)/activity')}
      />
      <ThemedButton
        label={deleting ? 'Deleting…' : 'Delete observation'}
        variant="outline"
        disabled={deleting || retrying}
        onPress={onDelete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 24,
    letterSpacing: 1,
  },
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
  retryWrap: { marginTop: 12 },
});
