import { useAuth } from '@clerk/expo';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import {
  ApiError,
  createNoteObservation,
  createUrlObservation,
  observationStatusLabel,
  pollObservationUntilSettled,
  uploadObservation,
  type ApiObservation,
} from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';
import type { SourceType } from '../../../types';

const CAPTURE_TYPES: { type: SourceType; label: string; hint: string }[] = [
  { type: 'screenshot', label: 'Screenshot', hint: 'Image upload' },
  { type: 'photo', label: 'Photo', hint: 'Image upload' },
  { type: 'document', label: 'Document', hint: 'PDF or text file' },
  { type: 'note', label: 'Text note', hint: 'Title optional · text required' },
  { type: 'link', label: 'URL', hint: 'Fetch page text into Kairos' },
  { type: 'audio', label: 'Audio', hint: 'Not supported yet' },
];

const FILE_CAPTURE_TYPES: SourceType[] = ['document', 'photo', 'screenshot'];
const TEXT_CAPTURE_TYPES: SourceType[] = ['note', 'link'];

function statusLabel(status: ApiObservation['status'] | 'UPLOADING'): string {
  if (status === 'UPLOADING') return 'Uploading…';
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
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [stageLabel, setStageLabel] = useState<string | null>(null);
  const [observationId, setObservationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);

  const settle = async (token: string, id: string) => {
    const settled = await pollObservationUntilSettled({
      token,
      id,
      intervalMs: 2000,
      shouldContinue: () => activeRef.current,
      onUpdate: (obs) => setStageLabel(statusLabel(obs.status)),
    });
    setStageLabel(statusLabel(settled.status));
    if (settled.status === 'FAILED') {
      setError(
        settled.processingError ||
          'Kairos could not process this file. Try another supported file.',
      );
    }
  };

  const runFileUpload = async (type: SourceType) => {
    setBusy(true);
    setError(null);
    setObservationId(null);
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
      await settle(token, uploaded.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) {
        setStageLabel('Upload saved. Open the observation to follow processing.');
        return;
      }
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

  const runTextUpload = async (type: 'note' | 'link') => {
    setBusy(true);
    setError(null);
    setObservationId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getToken();
      if (!token) {
        throw new ApiError('You must be signed in to upload.', 401);
      }

      setStageLabel(statusLabel('UPLOADING'));
      let uploaded: ApiObservation;
      if (type === 'note') {
        const text = note.trim();
        if (!text) {
          throw new ApiError('Write a note before uploading.', 400);
        }
        uploaded = await createNoteObservation({
          token,
          text,
          title: title.trim() || undefined,
        });
      } else {
        const link = url.trim();
        if (!link) {
          throw new ApiError('Enter a URL before capturing.', 400);
        }
        uploaded = await createUrlObservation({ token, url: link });
      }

      setObservationId(uploaded.id);
      setStageLabel(statusLabel(uploaded.status));
      await settle(token, uploaded.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) {
        setStageLabel('Capture saved. Open the observation to follow processing.');
        return;
      }
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Capture failed. Check your connection and try again.';
      setError(message);
      setStageLabel(null);
    } finally {
      setBusy(false);
    }
  };

  const onSelect = (type: SourceType) => {
    setSelected(type);
    if (type === 'audio') {
      Alert.alert(
        'Audio not supported yet',
        'Kairos currently accepts PDF, text, and image uploads.',
      );
      return;
    }

    const isFile = FILE_CAPTURE_TYPES.includes(type);
    const isText = TEXT_CAPTURE_TYPES.includes(type);
    Alert.alert(
      `Capture ${CAPTURE_TYPES.find((c) => c.type === type)?.label}?`,
      isFile
        ? 'Pick a file to upload to Kairos.'
        : isText
          ? type === 'link'
            ? 'Kairos will fetch readable text from the URL and process it.'
            : 'This creates a real note observation on the Kairos backend.'
          : 'Unsupported capture type.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isFile ? 'Choose file' : 'Upload',
          onPress: () => {
            if (isFile) void runFileUpload(type);
            else if (type === 'note' || type === 'link') void runTextUpload(type);
          },
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
          Documents, photos, screenshots, notes, and URLs go through the Kairos
          observation pipeline. Audio is not supported yet.
        </ThemedText>
      </SurfaceCard>

      <ThemedInput
        value={title}
        onChangeText={setTitle}
        placeholder="Optional note title"
        accessibilityLabel="Note title"
      />
      <ThemedInput
        value={note}
        onChangeText={setNote}
        placeholder="Note text"
        accessibilityLabel="Capture note"
      />
      <ThemedInput
        value={url}
        onChangeText={setUrl}
        placeholder="https://example.com/article"
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
                opacity: busy || item.type === 'audio' ? 0.55 : 1,
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
