import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import {
  ApiError,
  deleteRecallData,
  fetchRecallEntitlement,
  type RecallEntitlement,
} from '../../lib/api';
import { apiBaseUrl } from '../../lib/config';
import { useAppTheme } from '../../providers/ThemeProvider';
import Recall, { type RecallStatus } from 'kairos-recall';

export default function RecallScreen() {
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const { getToken } = useAuth();
  const [entitlement, setEntitlement] = useState<RecallEntitlement | null>(null);
  const [status, setStatus] = useState<RecallStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) throw new ApiError('Sign in required.', 401);

      const ent = await fetchRecallEntitlement(token);
      setEntitlement(ent);

      await Recall.setAuthToken(token);
      await Recall.setConfig({
        apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
        entitlementAllowed: ent.allowed,
        sampleIntervalMs: 1000,
        maxOcrPerMinute: 6,
      });
      const st = await Recall.getStatus();
      setStatus(st);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Unable to refresh Recall status.');
    }
  }, [getToken]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      void Recall.getStatus().then(setStatus).catch(() => undefined);
    }, 4000);
    return () => clearInterval(id);
  }, [refresh]);

  const run = async (label: string, action: () => Promise<unknown>) => {
    try {
      setBusy(true);
      setMessage(null);
      await action();
      await refresh();
      setMessage(`${label} ok`);
    } catch (err) {
      Alert.alert(
        'Recall',
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    } finally {
      setBusy(false);
    }
  };

  const entitlementLabel = entitlement
    ? entitlement.allowed
      ? `${entitlement.status} (allowed)`
      : `${entitlement.status} (not allowed)`
    : 'Loading…';

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader
        title="Recall"
        subtitle="Android screen memory — derived text only"
      />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Raw screen pixels stay on this device in temporary memory, are processed
          locally, and are discarded. Derived OCR text may be uploaded to Kairos
          when you are signed in with an active Recall entitlement. Durable memory
          and embeddings live on the server.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Entitlement" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.row}>
          {entitlementLabel}
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.meta}>
          Source: {entitlement?.source ?? '—'} · Server is authoritative
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Status" />
      <SurfaceCard>
        <Row label="Platform" value={Platform.OS} />
        <Row label="Native module" value={Recall.isAvailable() ? 'available' : 'unavailable'} />
        <Row label="State" value={status?.state ?? '—'} />
        <Row label="Permission" value={status?.permission ?? '—'} />
        <Row label="Capturing" value={String(status?.capturing ?? false)} />
        <Row label="Queued" value={String(status?.queuedCount ?? 0)} />
        <Row
          label="Last upload"
          value={
            status?.lastUploadAt
              ? new Date(status.lastUploadAt).toLocaleString()
              : '—'
          }
        />
        <Row label="Last error" value={status?.lastError ?? '—'} />
      </SurfaceCard>

      <SectionHeader title="Controls" />
      {!Recall.isAvailable() ? (
        <SurfaceCard>
          <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
            Recall capture requires a development build with the Kairos Recall
            Android native module. Expo Go cannot run MediaProjection capture.
          </ThemedText>
        </SurfaceCard>
      ) : null}

      <ThemedButton
        label="Refresh status"
        variant="outline"
        disabled={busy}
        onPress={() => void run('Refresh', refresh)}
      />
      <ThemedButton
        label="Request screen capture consent"
        variant="outline"
        disabled={busy || !Recall.isAvailable() || !entitlement?.allowed}
        onPress={() =>
          void run('Consent', async () => {
            const result = await Recall.requestConsent();
            if (!result.granted) {
              throw new Error('Screen capture permission was denied.');
            }
          })
        }
      />
      <ThemedButton
        label="Start Recall"
        disabled={busy || !Recall.isAvailable() || !entitlement?.allowed}
        onPress={() => void run('Start', () => Recall.start())}
      />
      <View style={styles.rowBtns}>
        <ThemedButton
          label="Pause"
          variant="outline"
          disabled={busy || !Recall.isAvailable()}
          onPress={() => void run('Pause', () => Recall.pause())}
          style={styles.half}
        />
        <ThemedButton
          label="Resume"
          variant="outline"
          disabled={busy || !Recall.isAvailable()}
          onPress={() => void run('Resume', () => Recall.resume())}
          style={styles.half}
        />
      </View>
      <ThemedButton
        label="Stop Recall"
        variant="outline"
        disabled={busy || !Recall.isAvailable()}
        onPress={() => void run('Stop', () => Recall.stop())}
      />

      <SectionHeader title="Local transport buffer" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          The encrypted outbox only holds derived events waiting to upload. It is
          not a local memory database. Clearing it does not delete server memories.
        </ThemedText>
      </SurfaceCard>
      <ThemedButton
        label="Clear local Recall data"
        variant="outline"
        disabled={busy || !Recall.isAvailable()}
        onPress={() =>
          void run('Clear local', async () => {
            await Recall.clearLocalData();
          })
        }
      />

      <SectionHeader title="Server Recall data" />
      <ThemedButton
        label="Delete Recall observations on server"
        variant="outline"
        disabled={busy}
        onPress={() => {
          Alert.alert(
            'Delete Recall memories?',
            'Deletes observations with captureKind=recall for your account. Other memories are kept.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () =>
                  void run('Delete server Recall', async () => {
                    const token = await getToken();
                    if (!token) throw new ApiError('Sign in required.', 401);
                    await Recall.stop().catch(() => undefined);
                    await Recall.clearLocalData().catch(() => undefined);
                    const result = await deleteRecallData(token);
                    setMessage(`Deleted ${result.deletedObservations} Recall observation(s).`);
                  }),
              },
            ],
          );
        }}
      />

      {message ? (
        <SurfaceCard>
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.body}>
            {message}
          </ThemedText>
        </SurfaceCard>
      ) : null}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { themeProgress } = useAppTheme();
  return (
    <View style={styles.kv}>
      <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.k}>
        {label}
      </ThemedText>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.v}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  row: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  kv: { paddingVertical: 6, gap: 2 },
  k: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  v: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  rowBtns: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
});
