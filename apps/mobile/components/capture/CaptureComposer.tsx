import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import {
  ApiError,
  observationStatusLabel,
  pollObservationUntilSettled,
  type ApiObservation,
} from '../../lib/api';
import { submitCapture } from '../../lib/capture';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ScreenRecallCard } from '../recall/ScreenRecallCard';
import { KairosButton, KairosInput, KairosText } from '../ui/Kairos';

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

export function CaptureComposer({
  initialText = '',
  initialUrl = '',
  source = 'MANUAL',
  autoFocus = true,
}: {
  initialText?: string;
  initialUrl?: string;
  source?: 'MANUAL' | 'QUICK_CAPTURE' | 'WIDGET' | 'SHARE';
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [note, setNote] = useState(initialText);
  const [url, setUrl] = useState(initialUrl);
  const [showLink, setShowLink] = useState(Boolean(initialUrl));
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
      onUpdate: (obs) => setStageLabel(observationStatusLabel(obs.status)),
    });
    setStageLabel(
      settled.status === 'COMPLETED'
        ? 'Memory ready'
        : observationStatusLabel(settled.status),
    );
    if (settled.status === 'FAILED') {
      setError(settled.processingError || 'Failed');
    }
  };

  const finish = async (submitted: Awaited<ReturnType<typeof submitCapture>>) => {
    if (submitted.queued) {
      setStageLabel('Saved on this device');
      return;
    }
    const uploaded = submitted.observation;
    if (!uploaded) throw new ApiError('Capture failed.', 500);
    setObservationId(uploaded.id);
    setStageLabel(observationStatusLabel(uploaded.status));
    const token = await getToken();
    if (token) await settle(token, uploaded.id);
  };

  const sendNote = async () => {
    const text = note.trim();
    const link = url.trim();
    if (!text && !link) {
      setError('Write a thought or paste a link.');
      return;
    }
    setBusy(true);
    setError(null);
    setObservationId(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('Sign in required.', 401);
      setStageLabel('Captured');
      const submitted = await submitCapture({
        token,
        source,
        content: text || undefined,
        url: link || undefined,
      });
      await finish(submitted);
      setNote('');
      setUrl('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) {
        setStageLabel('Saved on this device');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Could not save.');
      setStageLabel(null);
    } finally {
      setBusy(false);
    }
  };

  const runFile = async (kind: 'photo' | 'file') => {
    setBusy(true);
    setError(null);
    setObservationId(null);
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: kind === 'file' ? ['application/pdf', 'text/plain', 'text/markdown'] : ['image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      const token = await getToken();
      if (!token) throw new ApiError('Sign in required.', 401);
      setStageLabel('Captured');
      const submitted = await submitCapture({
        token,
        source,
        fileUri: asset.uri,
        fileName: asset.name || `capture-${Date.now()}`,
        mimeType: guessMimeType(asset.name || '', asset.mimeType),
      });
      await finish(submitted);
    } catch (err) {
      if (err instanceof ApiError && err.status === 499) {
        setStageLabel('Saved on this device');
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <KairosInput
        value={note}
        onChangeText={setNote}
        placeholder="Write what you want to remember…"
        accessibilityLabel="Capture note"
        autoFocus={autoFocus}
        multiline
        style={styles.composer}
      />
      {showLink ? (
        <KairosInput
          value={url}
          onChangeText={setUrl}
          placeholder="https://"
          autoCapitalize="none"
          accessibilityLabel="Link"
        />
      ) : null}

      <View style={styles.tools}>
        {(
          [
            { icon: 'mic' as const, label: 'Voice', onPress: () => router.push('/(app)/voice-capture') },
            { icon: 'image' as const, label: 'Photo', onPress: () => void runFile('photo') },
            { icon: 'file' as const, label: 'File', onPress: () => void runFile('file') },
            { icon: 'link' as const, label: 'Link', onPress: () => setShowLink((value) => !value) },
          ] as const
        ).map((item) => (
          <Pressable
            key={item.label}
            disabled={busy}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.tool,
              { backgroundColor: colors.surface, opacity: busy ? 0.45 : pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name={item.icon} size={16} color={colors.text} />
            <KairosText variant="meta">{item.label}</KairosText>
          </Pressable>
        ))}
      </View>

      {Platform.OS === 'android' ? <ScreenRecallCard compact /> : null}

      <KairosButton
        label={busy ? 'Saving…' : 'Save memory'}
        disabled={busy || (!note.trim() && !url.trim())}
        onPress={() => void sendNote()}
      />

      {busy || stageLabel ? (
        <View style={styles.status}>
          {busy ? <ActivityIndicator color={colors.accent} /> : null}
          <KairosText variant="caption" color="textSecondary">
            {stageLabel}
          </KairosText>
        </View>
      ) : null}

      {error ? (
        <KairosText variant="caption" color="error">
          {error}
        </KairosText>
      ) : null}

      {observationId ? (
        <KairosButton
          label="Open memory"
          variant="outline"
          onPress={() => router.push(`/(app)/observation/${observationId}`)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  composer: { minHeight: 180, textAlignVertical: 'top' },
  tools: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tool: {
    minHeight: 44,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
