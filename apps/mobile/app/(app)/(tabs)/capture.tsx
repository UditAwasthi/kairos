import { useAuth } from '@clerk/expo';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ProcessingIndicator } from '../../../components/ui/MemoryCards';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import {
  ApiError,
  observationStatusLabel,
  pollObservationUntilSettled,
  uploadObservation,
  type ApiObservation,
} from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { captureService } from '../../../services';
import type { CaptureStage, ProcessingJob, SourceType } from '../../../types';

const CAPTURE_TYPES: { type: SourceType; label: string; hint: string }[] = [
  { type: 'screenshot', label: 'Screenshot', hint: 'Capture a screen observation' },
  { type: 'photo', label: 'Photo', hint: 'Whiteboard, page, or scene' },
  { type: 'document', label: 'Document', hint: 'PDF or long-form file' },
  { type: 'note', label: 'Text note', hint: 'Quick thought or summary' },
  { type: 'link', label: 'Link', hint: 'Article or reference URL' },
  { type: 'audio', label: 'Audio', hint: 'Voice memo (mock)' },
];

const FILE_CAPTURE_TYPES: SourceType[] = ['document', 'photo', 'screenshot'];

function statusLabel(status: ApiObservation['status'] | 'UPLOADING'): string {
  if (status === 'UPLOADING') return 'Uploading document…';
  return observationStatusLabel(status);
}

function guessMimeType(name: string, fallback?: string | null): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'text/plain';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return fallback || 'application/octet-stream';
}

export default function CaptureScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [selected, setSelected] = useState<SourceType | null>(null);
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [job, setJob] = useState<ProcessingJob | null>(null);
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [observationId, setObservationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMockPipeline = async (type: SourceType) => {
    setBusy(true);
    setError(null);
    setMemoryId(null);
    setObservationId(null);
    setStageLabel('Capture confirmed…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await captureService.capture({
        sourceType: type,
        text: note.trim() || undefined,
        url: url.trim() || undefined,
        title: note.trim() ? note.trim().slice(0, 60) : undefined,
      });
      setJob(result.job);
      setObservationId(result.observation.id);
      setStageLabel('Processing observation…');

      const stages: CaptureStage[] = ['UPLOADING', 'PROCESSING', 'READY'];
      let current = result.job;
      for (const _ of stages) {
        current = await captureService.advanceJob(current.id);
        setJob({ ...current });
        if (current.stage === 'UPLOADING') setStageLabel('Uploading…');
        if (current.stage === 'PROCESSING') setStageLabel('Processing observation…');
        if (current.stage === 'READY') {
          setStageLabel('Memory created');
          setMemoryId(current.resultMemoryId ?? null);
        }
      }
    } catch {
      setError('Capture failed in the mock layer. Try again.');
      setStageLabel(null);
    } finally {
      setBusy(false);
    }
  };

  const runFileUpload = async (type: SourceType) => {
    setBusy(true);
    setError(null);
    setMemoryId(null);
    setObservationId(null);
    setJob(null);
    setStageLabel('Choose a file…');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type:
          type === 'document'
            ? ['application/pdf', 'text/plain', 'text/markdown']
            : ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (picked.canceled || !picked.assets?.[0]) {
        setStageLabel(null);
        return;
      }

      const asset = picked.assets[0];
      const token = await getToken();
      if (!token) {
        throw new ApiError('You must be signed in to upload.', 401);
      }

      setStageLabel(statusLabel('UPLOADING'));
      const uploaded = await uploadObservation({
        token,
        uri: asset.uri,
        name: asset.name || `capture-${Date.now()}`,
        mimeType: guessMimeType(asset.name || '', asset.mimeType),
      });
      setObservationId(uploaded.id);
      setStageLabel(statusLabel(uploaded.status));

      const settled = await pollObservationUntilSettled({
        token,
        id: uploaded.id,
        onUpdate: (obs) => setStageLabel(statusLabel(obs.status)),
      });

      setStageLabel(statusLabel(settled.status));
      if (settled.status === 'FAILED') {
        setError(
          settled.processingError ||
            'Kairos could not process this file. Try another PDF or text file.',
        );
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Upload failed. Check your connection and try again.';
      setError(message);
      setStageLabel(null);
    } finally {
      setBusy(false);
    }
  };

  const onSelect = (type: SourceType) => {
    setSelected(type);
    const isFile = FILE_CAPTURE_TYPES.includes(type);
    Alert.alert(
      `Capture ${CAPTURE_TYPES.find((c) => c.type === type)?.label}?`,
      isFile
        ? 'Pick a file to upload to Kairos. Text will be extracted for PDFs and TXT files.'
        : 'This simulates capture only — no real OCR or upload runs.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isFile ? 'Choose file' : 'Capture',
          onPress: () =>
            void (isFile ? runFileUpload(type) : runMockPipeline(type)),
        },
      ],
    );
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
      keyboardShouldPersistTaps="handled"
    >
      <SectionHeader
        title="Capture"
        subtitle="Save an observation into Kairos"
      />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          Documents, photos, and screenshots upload to the Kairos backend. Notes,
          links, and audio still use the local mock pipeline.
        </ThemedText>
      </SurfaceCard>

      <ThemedInput
        value={note}
        onChangeText={setNote}
        placeholder="Optional note or title"
        accessibilityLabel="Capture note"
      />
      <ThemedInput
        value={url}
        onChangeText={setUrl}
        placeholder="Optional link URL"
        autoCapitalize="none"
        accessibilityLabel="Capture URL"
      />

      <View style={styles.grid}>
        {CAPTURE_TYPES.map((item) => (
          <Pressable
            key={item.type}
            disabled={busy}
            onPress={() => onSelect(item.type)}
            style={[
              styles.tile,
              {
                borderColor: selected === item.type ? colors.text : colors.border,
                backgroundColor: colors.surface,
                opacity: busy ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <ThemedText colorKey="text" style={styles.tileTitle}>
              {item.label}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.tileHint}>
              {item.hint}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {busy || stageLabel ? (
        <SurfaceCard>
          <View style={styles.statusRow}>
            {busy ? <ActivityIndicator color={colors.text} /> : null}
            <ThemedText colorKey="text" style={styles.status}>
              {stageLabel}
            </ThemedText>
          </View>
        </SurfaceCard>
      ) : null}

      {job ? <ProcessingIndicator job={job} /> : null}

      {error ? (
        <SurfaceCard>
          <ThemedText colorKey="error" style={styles.body}>
            {error}
          </ThemedText>
        </SurfaceCard>
      ) : null}

      {observationId ? (
        <ThemedButton
          label="View observation"
          onPress={() => router.push(`/(app)/observation/${observationId}`)}
        />
      ) : null}

      {memoryId ? (
        <ThemedButton
          label="Open memory"
          variant="outline"
          onPress={() => router.push(`/(app)/memory/${memoryId}`)}
        />
      ) : null}

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
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: {
    width: '48%',
    flexGrow: 1,
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  tileTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  tileHint: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 16 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  status: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
