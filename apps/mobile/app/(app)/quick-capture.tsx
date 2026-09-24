import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { GlassPanel } from '../../components/ui/Glass';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedInput } from '../../components/ui/ThemedInput';
import { ApiError } from '../../lib/api';
import { submitCapture } from '../../lib/capture';
import { useAppTheme } from '../../providers/ThemeProvider';

type Mode = 'text' | 'voice';

export default function QuickCaptureScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const params = useLocalSearchParams<{
    mode?: string;
    text?: string;
    url?: string;
    title?: string;
    source?: string;
  }>();

  const initialMode: Mode = params.mode === 'voice' ? 'voice' : 'text';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [text, setText] = useState(params.text || '');
  const [url, setUrl] = useState(params.url || '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.text) setText(String(params.text));
    if (params.url) setUrl(String(params.url));
    if (params.mode === 'voice') setMode('voice');
  }, [params.text, params.url, params.mode]);

  const onSave = async () => {
    const content = text.trim();
    const link = url.trim();
    if (!content && !link) {
      setError('Write a thought or paste a link.');
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('Sign in required.', 401);
      const source =
        params.source === 'WIDGET'
          ? 'WIDGET'
          : params.source === 'SHARE'
            ? 'SHARE'
            : 'QUICK_CAPTURE';
      const result = await submitCapture({
        token,
        source,
        content: content || undefined,
        url: link || undefined,
        title: params.title ? String(params.title) : undefined,
      });
      if (result.queued) {
        setMessage('Saved locally. Kairos will sync when you are back online.');
      } else {
        setMessage(
          result.observation
            ? 'Saved. Processing memory…'
            : 'Saved.',
        );
        setText('');
        setUrl('');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save that capture.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SoftPage>
      <SoftTitle>Capture</SoftTitle>
      <ThemedText colorKey="textMuted" style={styles.lead}>
        Type or speak. Kairos will infer topics and meaning later.
      </ThemedText>

      <View style={styles.modes}>
        <Pressable
          onPress={() => setMode('text')}
          style={[
            styles.mode,
            { borderColor: mode === 'text' ? colors.accent : colors.border },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Text capture"
        >
          <Feather name="edit-3" size={16} color={colors.accent} />
          <ThemedText colorKey="text">Text</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(app)/voice-capture')}
          style={[styles.mode, { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Voice capture"
        >
          <Feather name="mic" size={16} color={colors.accent} />
          <ThemedText colorKey="text">Voice</ThemedText>
        </Pressable>
      </View>

      <ThemedInput
        value={text}
        onChangeText={setText}
        placeholder="What's on your mind?"
        multiline
        autoFocus
        accessibilityLabel="Capture text"
        style={styles.note}
      />
      <ThemedInput
        value={url}
        onChangeText={setUrl}
        placeholder="Optional link"
        autoCapitalize="none"
        accessibilityLabel="Optional URL"
      />

      {busy ? <ActivityIndicator color={colors.accent} /> : null}
      {message ? (
        <GlassPanel>
          <ThemedText colorKey="text">{message}</ThemedText>
        </GlassPanel>
      ) : null}
      {error ? (
        <ThemedText colorKey="error" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <ThemedButton
        label={busy ? 'Saving…' : 'Save'}
        disabled={busy || (!text.trim() && !url.trim())}
        onPress={() => void onSave()}
      />
      <ThemedButton
        label="Cancel"
        variant="outline"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)'))}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: 'Inter_400Regular', fontSize: 15, marginBottom: 8 },
  modes: { flexDirection: 'row', gap: 10 },
  mode: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
  },
  note: { minHeight: 140, textAlignVertical: 'top' },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
