import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { SoftPage, SoftTitle } from '../../../components/ui/SoftScreen';
import { GlassPanel } from '../../../components/ui/Glass';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedInput } from '../../../components/ui/ThemedInput';
import { ThemedText } from '../../../components/ThemedText';
import {
  ApiError,
  observationStatusLabel,
  pollObservationUntilSettled,
  type ApiObservation,
} from '../../../lib/api';
import { submitCapture } from '../../../lib/capture';
import { useAppTheme } from '../../../providers/ThemeProvider';
import type { SourceType } from '../../../types';

type CaptureItem = {
  type: SourceType;
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
};

const CAPTURE_TYPES: CaptureItem[] = [
  { type: 'screenshot', label: 'Shot', icon: 'tablet' },
  { type: 'photo', label: 'Photo', icon: 'camera' },
  { type: 'document', label: 'File', icon: 'file-text' },
  { type: 'note', label: 'Note', icon: 'edit-3' },
  { type: 'link', label: 'Link', icon: 'link' },
  { type: 'audio', label: 'Voice', icon: 'mic' },
];

const FILE_CAPTURE_TYPES: SourceType[] = ['document', 'photo', 'screenshot'];

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
      setError(settled.processingError || 'Failed');
    }
  };

  const runFileUpload = async (type: SourceType) => {
    setBusy(true);
    setError(null);
    setObservationId(null);
    setStageLabel('…');
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
      if (!token) throw new ApiError('Sign in required.', 401);

      setStageLabel(statusLabel('UPLOADING'));
      const submitted = await submitCapture({
        token,
        source: 'MANUAL',
        fileUri: asset.uri,
        fileName: asset.name || `capture-${Date.now()}`,
        mimeType: guessMimeType(asset.name || '', asset.mimeType),
      });
      if (submitted.queued) {
        setStageLabel('Saved offline');
        return;
      }
      const uploaded = submitted.observation;
      if (!uploaded) throw new ApiError('Capture failed.', 500);
      setObservationId(uploaded.id);
      setStageLabel(statusLabel(uploaded.status));
      await settle(token, uploaded.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) {
        setStageLabel('Saved');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Upload failed');
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
      if (!token) throw new ApiError('Sign in required.', 401);

      setStageLabel(statusLabel('UPLOADING'));
      let uploaded: ApiObservation | undefined;
      if (type === 'note') {
        const text = note.trim();
        if (!text) throw new ApiError('Write a note first.', 400);
        const submitted = await submitCapture({
          token,
          source: 'MANUAL',
          content: text,
          title: title.trim() || undefined,
        });
        if (submitted.queued) {
          setStageLabel('Saved offline');
          return;
        }
        uploaded = submitted.observation;
      } else {
        const link = url.trim();
        if (!link) throw new ApiError('Enter a URL.', 400);
        const submitted = await submitCapture({
          token,
          source: 'MANUAL',
          url: link,
        });
        if (submitted.queued) {
          setStageLabel('Saved offline');
          return;
        }
        uploaded = submitted.observation;
      }
      if (!uploaded) throw new ApiError('Capture failed.', 500);

      setObservationId(uploaded.id);
      setStageLabel(statusLabel(uploaded.status));
      await settle(token, uploaded.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) {
        setStageLabel('Saved');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Failed');
      setStageLabel(null);
    } finally {
      setBusy(false);
    }
  };

  const onSelect = (type: SourceType) => {
    setSelected(type);
    if (FILE_CAPTURE_TYPES.includes(type)) {
      void runFileUpload(type);
      return;
    }
    if (type === 'audio') {
      router.push('/(app)/voice-capture');
      return;
    }
    if (type === 'note' || type === 'link') {
      return;
    }
    Alert.alert('Not supported');
  };

  return (
    <SoftPage tabBar safeTop>
      <SoftTitle>Capture</SoftTitle>

      <View style={styles.grid}>
        {CAPTURE_TYPES.map((item) => {
          const active = selected === item.type;
          return (
            <Pressable
              key={item.type}
              disabled={busy}
              onPress={() => onSelect(item.type)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={({ pressed }) => [
                styles.tileWrap,
                { opacity: busy ? 0.5 : pressed ? 0.9 : 1 },
              ]}
            >
              <GlassPanel
                padded={false}
                contentStyle={[
                  styles.tile,
                  active && { borderColor: colors.accent, borderWidth: 1 },
                ]}
              >
                <View style={[styles.tileIcon, { backgroundColor: colors.accentGlow }]}>
                  <Feather name={item.icon} size={20} color={colors.accent} />
                </View>
                <ThemedText colorKey="text" style={styles.tileLabel}>
                  {item.label}
                </ThemedText>
              </GlassPanel>
            </Pressable>
          );
        })}
      </View>

      {selected === 'note' ? (
        <View style={styles.form}>
          <ThemedInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            accessibilityLabel="Note title"
          />
          <ThemedInput
            value={note}
            onChangeText={setNote}
            placeholder="Note"
            accessibilityLabel="Note"
          />
          <ThemedButton
            label={busy ? '…' : 'Save'}
            disabled={busy || !note.trim()}
            onPress={() => void runTextUpload('note')}
          />
        </View>
      ) : null}

      {selected === 'link' ? (
        <View style={styles.form}>
          <ThemedInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://"
            autoCapitalize="none"
            accessibilityLabel="URL"
          />
          <ThemedButton
            label={busy ? '…' : 'Save'}
            disabled={busy || !url.trim()}
            onPress={() => void runTextUpload('link')}
          />
        </View>
      ) : null}

      {busy || stageLabel ? (
        <GlassPanel contentStyle={styles.statusRow} padded={false}>
          {busy ? <ActivityIndicator color={colors.accent} /> : null}
          <ThemedText colorKey="textMuted" style={styles.status}>
            {stageLabel}
          </ThemedText>
        </GlassPanel>
      ) : null}

      {error ? (
        <ThemedText colorKey="error" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      {observationId ? (
        <ThemedButton
          label="Open"
          onPress={() => router.push(`/(app)/observation/${observationId}`)}
        />
      ) : null}
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tileWrap: {
    width: '30%',
    flexGrow: 1,
    minWidth: 96,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
    paddingHorizontal: 12,
    minHeight: 100,
  },
  tileIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  form: { gap: 12 },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  status: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
});
