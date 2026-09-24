import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { GlassPanel } from '../../components/ui/Glass';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { ThemedButton } from '../../components/ui/ThemedButton';
import {
  ApiError,
  observationStageLabel,
  pollObservationUntilSettled,
  reprocessObservation,
  type ApiObservation,
} from '../../lib/api';
import { submitCapture } from '../../lib/capture';
import { useAppTheme } from '../../providers/ThemeProvider';

type VoiceState =
  | 'idle'
  | 'permission_denied'
  | 'recording'
  | 'saving'
  | 'saved'
  | 'queued'
  | 'transcribing'
  | 'ready'
  | 'transcribe_failed'
  | 'failed';

export default function VoiceCaptureScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [observation, setObservation] = useState<ApiObservation | null>(null);

  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        void recorder.stop();
      }
    };
  }, [recorder]);

  const requestMic = async (): Promise<boolean> => {
    const permission = await AudioModule.requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setState('permission_denied');
      setError('Microphone permission was denied. Enable it in system settings to use voice capture.');
      return false;
    }
    await setAudioModeAsync({
      allowsRecording: true,
      playsInSilentMode: true,
    });
    return true;
  };

  const startRecording = async () => {
    setError(null);
    try {
      const allowed = await requestMic();
      if (!allowed) return;
      await recorder.prepareToRecordAsync();
      recorder.record();
      setState('recording');
    } catch {
      setState('failed');
      setError('Could not start recording. Try again.');
    }
  };

  const cancelRecording = async () => {
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
    } catch {
      // ignore
    }
    setState('idle');
    setError(null);
  };

  const saveRecording = async () => {
    setState('saving');
    setError(null);
    try {
      if (recorder.isRecording) {
        await recorder.stop();
      }
      const uri = recorder.uri;
      if (!uri) {
        setState('failed');
        setError('The recording was empty. Try speaking again.');
        return;
      }
      const token = await getToken();
      if (!token) throw new ApiError('Sign in required.', 401);
      const result = await submitCapture({
        token,
        source: 'VOICE',
        fileUri: uri,
        fileName: `voice-${Date.now()}.m4a`,
        mimeType: 'audio/mp4',
      });
      if (result.queued) {
        setState('queued');
        return;
      }
      setState('saved');
      if (!result.observation) return;
      setObservation(result.observation);
      setState('transcribing');
      try {
        const settled = await pollObservationUntilSettled({
          token,
          id: result.observation.id,
          onUpdate: (next) => {
            setObservation(next);
            if (next.status === 'EXTRACTING' || next.status === 'PENDING') {
              setState('transcribing');
            }
          },
        });
        setObservation(settled);
        setState(settled.status === 'FAILED' ? 'transcribe_failed' : 'ready');
      } catch {
        setState('transcribe_failed');
      }
    } catch (err) {
      setState('failed');
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Voice capture failed. Your recording was not discarded if it could be queued.');
      }
    }
  };

  return (
    <SoftPage>
      <SoftTitle>Voice</SoftTitle>
      <ThemedText colorKey="textMuted" style={styles.lead}>
        Speak a thought. Kairos transcribes it and files it as memory.
      </ThemedText>

      <GlassPanel contentStyle={styles.orbWrap}>
        <Pressable
          onPress={() => {
            if (state === 'recording') {
              void saveRecording();
              return;
            }
            if (
              state === 'idle' ||
              state === 'failed' ||
              state === 'transcribe_failed' ||
              state === 'permission_denied'
            ) {
              void startRecording();
            }
          }}
          disabled={state === 'saving'}
          accessibilityRole="button"
          accessibilityLabel={state === 'recording' ? 'Stop and save' : 'Start recording'}
          style={[
            styles.orb,
            { backgroundColor: state === 'recording' ? colors.accent : colors.accentGlow },
          ]}
        >
          {state === 'saving' ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Feather
              name="mic"
              size={32}
              color={state === 'recording' ? colors.inverseText : colors.accent}
            />
          )}
        </Pressable>
        <ThemedText colorKey="text" style={styles.status}>
          {state === 'recording'
            ? recorderState.durationMillis
              ? `Recording… ${Math.round(recorderState.durationMillis / 1000)}s`
              : 'Recording…'
            : state === 'saving'
              ? 'Saving…'
              : state === 'saved'
                ? 'Saved'
                : state === 'transcribing'
                  ? observation
                    ? observationStageLabel(observation)
                    : 'Transcribing…'
                  : state === 'ready'
                    ? 'Memory ready'
                    : state === 'transcribe_failed'
                      ? "Couldn't transcribe"
                    : state === 'queued'
                      ? 'Saved on this device. Will sync when you are online.'
                      : state === 'permission_denied'
                        ? 'Microphone blocked'
                        : 'Tap to record'}
        </ThemedText>
      </GlassPanel>

      {error ? (
        <ThemedText colorKey="error" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}

      <View style={styles.actions}>
        {state === 'recording' ? (
          <>
            <ThemedButton label="Save" onPress={() => void saveRecording()} />
            <ThemedButton label="Cancel" variant="outline" onPress={() => void cancelRecording()} />
          </>
        ) : state === 'transcribe_failed' ? (
          <>
            <ThemedButton
              label="Try again"
              onPress={() => {
                void (async () => {
                  if (!observation) {
                    void startRecording();
                    return;
                  }
                  try {
                    const token = await getToken();
                    if (!token) return;
                    setState('transcribing');
                    const retried = await reprocessObservation(token, observation.id);
                    setObservation(retried);
                    const settled = await pollObservationUntilSettled({
                      token,
                      id: retried.id,
                      onUpdate: setObservation,
                    });
                    setObservation(settled);
                    setState(settled.status === 'FAILED' ? 'transcribe_failed' : 'ready');
                  } catch {
                    setState('transcribe_failed');
                  }
                })();
              }}
            />
            <ThemedButton
              label="Done"
              variant="outline"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)'))}
            />
          </>
        ) : (
          <ThemedButton
            label="Done"
            variant="outline"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(app)'))}
          />
        )}
      </View>
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  orbWrap: { alignItems: 'center', gap: 16, paddingVertical: 28 },
  orb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { fontFamily: 'Inter_500Medium', fontSize: 15, textAlign: 'center' },
  error: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
  actions: { gap: 10 },
});
