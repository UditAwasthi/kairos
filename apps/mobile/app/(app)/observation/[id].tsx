import { useAuth } from '@clerk/expo';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, FadeInContent, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { GlassPanel } from '../../../components/ui/Glass';
import { SoftLinkList, SoftPage, SoftTitle } from '../../../components/ui/SoftScreen';
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
import { useAppTheme } from '../../../providers/ThemeProvider';
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
    if (data.status === 'FAILED') return 'Unavailable';
    if (data.status === 'PENDING' || data.status === 'EXTRACTING') return 'Pending';
    return 'Processing…';
  }
  if (data.extractedText) return data.extractedText;

  const processingNote =
    typeof apiObs?.sourceMetadata?.processingNote === 'string'
      ? apiObs.sourceMetadata.processingNote.trim()
      : '';
  if (processingNote) return processingNote;

  if (data.sourceType === 'photo' || data.sourceType === 'screenshot') {
    return 'No text yet';
  }
  return 'None';
}

function summaryText(
  data: Observation,
  ready: boolean,
  processing: boolean,
  failed: boolean,
  stage: string,
): string {
  if (ready) {
    if (data.summary) return data.summary;
    if (data.analysisNote) return data.analysisNote;
    return 'None';
  }
  if (processing) return stage;
  if (failed) return 'Unavailable';
  return 'Pending';
}

export default function ObservationDetailScreen() {
  const { id, highlight } = useLocalSearchParams<{
    id: string;
    highlight?: string;
  }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedIdRef = useRef<string | null>(null);
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
      setError('Sign in required');
      setData(null);
      setApiObs(null);
      loadedIdRef.current = null;
      return;
    }

    try {
      const api = await fetchObservation(token, observationId);
      setApiObs(api);
      setData(mapApiObservation(api));
      setError(null);
      loadedIdRef.current = observationId;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Not found');
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Session expired');
      } else {
        setError('Unable to load');
      }
      setData(null);
      setApiObs(null);
      loadedIdRef.current = null;
    }
  }, [getToken, id]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const soft = loadedIdRef.current === String(id);
        if (!soft) setLoading(true);
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
    }, [load, id]),
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
      setError('Retry failed');
    } finally {
      setRetrying(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Delete?',
      data?.title ?? 'Observation',
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
                router.replace('/(app)/timeline');
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
        title="Unable to load"
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

  const statusDetail = [
    stage,
    ready && apiObs
      ? formatObservationReadyTime(apiObs.processedAt || apiObs.updatedAt)
      : null,
    failed && data.processingError ? data.processingError : null,
  ]
    .filter(Boolean)
    .join('\n');

  const sourceMeta = [
    data.metadata?.mimeType ?? '',
    data.metadata?.fileSizeBytes
      ? `${Math.round(data.metadata.fileSizeBytes / 1024)} KB`
      : '',
    ready && data.metadata?.chunkCount != null ? `${data.metadata.chunkCount} chunks` : '',
    ready && data.metadata?.wordCount != null ? `${data.metadata.wordCount} words` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <FadeInContent>
      <SoftPage>
        <View style={styles.titleBlock}>
          <Badge label={headline} tone={statusTone(data.status)} />
          <SoftTitle>{data.title}</SoftTitle>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {SOURCE_TYPE_LABELS[data.sourceType]} · {captured}
          </ThemedText>
        </View>

        {matchedSnippet ? (
          <GlassPanel>
            <ThemedText colorKey="textMuted" style={styles.kicker}>
              Match
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {matchedSnippet}
            </ThemedText>
          </GlassPanel>
        ) : null}

        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Status
          </ThemedText>
          {statusDetail ? (
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {statusDetail}
            </ThemedText>
          ) : null}
          {failed ? (
            <ThemedButton
              label={retrying ? 'Retrying…' : 'Retry'}
              onPress={() => void onRetry()}
              disabled={retrying}
              style={styles.inlineBtn}
            />
          ) : null}
        </GlassPanel>

        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Summary
          </ThemedText>
          <ThemedText colorKey="textSecondary" style={styles.body}>
            {summaryText(data, ready, processing, failed, stage)}
          </ThemedText>
        </GlassPanel>

        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Topics
          </ThemedText>
          {ready && data.topics && data.topics.length > 0 ? (
            <View style={styles.chipRow}>
              {data.topics.map((topic) => (
                <Pressable
                  key={topic.id}
                  onPress={() => router.push(`/(app)/topics/${topic.id}`)}
                  style={[styles.chip, { borderColor: colors.glassBorder }]}
                >
                  <ThemedText colorKey="text" style={styles.chipText}>
                    {topic.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          ) : (
            <ThemedText colorKey="textMuted" style={styles.placeholder}>
              {processing ? '…' : 'None yet'}
            </ThemedText>
          )}
        </GlassPanel>

        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Entities
          </ThemedText>
          {ready && data.entities && data.entities.length > 0 ? (
            <View style={styles.chipRow}>
              {data.entities.map((entity) => (
                <Pressable
                  key={entity.id}
                  onPress={() => router.push(`/(app)/entities/${entity.id}`)}
                  style={[styles.chip, { borderColor: colors.glassBorder }]}
                >
                  <ThemedText colorKey="text" style={styles.chipText}>
                    {entity.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          ) : (
            <ThemedText colorKey="textMuted" style={styles.placeholder}>
              {processing ? '…' : 'None yet'}
            </ThemedText>
          )}
        </GlassPanel>

        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Projects
          </ThemedText>
          {data.projects && data.projects.length > 0 ? (
            <View style={styles.chipRow}>
              {data.projects.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => router.push(`/(app)/projects/${project.id}`)}
                  style={[styles.chip, { borderColor: colors.glassBorder }]}
                >
                  <ThemedText colorKey="text" style={styles.chipText}>
                    {project.name}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          ) : (
            <ThemedText colorKey="textMuted" style={styles.placeholder}>
              None yet
            </ThemedText>
          )}
        </GlassPanel>

        <SoftLinkList
          items={[
            {
              label: 'Add to project',
              icon: 'folder-plus',
              onPress: () =>
                router.push({
                  pathname: '/(app)/observation/projects',
                  params: { id: String(id) },
                }),
            },
            {
              label: 'Activity',
              icon: 'activity',
              onPress: () => router.push('/(app)/activity'),
            },
          ]}
        />

        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Source
          </ThemedText>
          <ThemedText colorKey="text" style={styles.sourceTitle} numberOfLines={2}>
            {data.sourceLabel}
          </ThemedText>
          {sourceMeta ? (
            <ThemedText colorKey="textMuted" style={styles.meta}>
              {sourceMeta}
            </ThemedText>
          ) : null}
        </GlassPanel>

        <GlassPanel>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            Text
          </ThemedText>
          <ThemedText colorKey="textSecondary" style={styles.body}>
            {extractedTextMessage(data, apiObs)}
          </ThemedText>
        </GlassPanel>

        <ThemedButton
          label={deleting ? 'Deleting…' : 'Delete'}
          variant="outline"
          disabled={deleting || retrying}
          onPress={onDelete}
        />
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  titleBlock: { gap: 8 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  placeholder: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  sourceTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  inlineBtn: { marginTop: 8 },
});
