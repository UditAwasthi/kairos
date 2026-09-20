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

function statusLabel(status: RecallStatus | null): string {
  if (!status) return '—';
  if (status.capturing || status.on) return 'On — running in background';
  if (status.state === 'needs_consent' || status.userEnabled) {
    return 'Interrupted — turn on again';
  }
  if (status.state === 'paused') return 'Paused';
  return 'Off';
}

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
        sampleIntervalMs: 700,
        maxOcrPerMinute: 14,
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
      setMessage(label);
    } catch (err) {
      Alert.alert(
        'Recall',
        err instanceof Error ? err.message : 'Something went wrong.',
      );
    } finally {
      setBusy(false);
    }
  };

  const isOn = Recall.isOn(status);
  const canUse =
    Recall.isAvailable() && entitlement?.allowed === true && !busy;

  const entitlementLabel = entitlement
    ? entitlement.allowed
      ? `${entitlement.status} (allowed)`
      : `${entitlement.status} (not allowed)`
    : 'Loading…';

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader
        title="Recall"
        subtitle="Remembers what you see on screen as searchable text"
      />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          When Recall is on, Kairos keeps reading your screen in the background
          (other apps included) until you turn it off. Raw pixels stay on this
          device; only derived text may be uploaded.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Status" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.row}>
          {statusLabel(status)}
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.meta}>
          Entitlement: {entitlementLabel}
        </ThemedText>
        <Row label="Queued uploads" value={String(status?.queuedCount ?? 0)} />
        <Row
          label="Last upload"
          value={
            status?.lastUploadAt
              ? new Date(status.lastUploadAt).toLocaleString()
              : '—'
          }
        />
        {status?.lastError ? (
          <Row label="Note" value={status.lastError} />
        ) : null}
        {Platform.OS !== 'android' || !Recall.isAvailable() ? (
          <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
            Recall requires an Android development build with the Kairos Recall
            native module.
          </ThemedText>
        ) : null}
        {entitlement && !entitlement.allowed ? (
          <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
            Recall entitlement is not active, so capture cannot start.
          </ThemedText>
        ) : null}
      </SurfaceCard>

      <SectionHeader title="Controls" />
      {isOn ? (
        <ThemedButton
          label="Turn off"
          disabled={busy || !Recall.isAvailable()}
          onPress={() =>
            void run('Recall is off', async () => {
              await Recall.turnOff();
            })
          }
        />
      ) : (
        <ThemedButton
          label="Turn on"
          disabled={!canUse}
          onPress={() =>
            void run('Recall is on', async () => {
              await Recall.turnOn();
            })
          }
        />
      )}
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.meta}>
          Turn on asks for notification and screen-capture permission once, then
          keeps running while the Kairos notification is shown. Turn off ends
          capture completely.
        </ThemedText>
      </SurfaceCard>

      <ThemedButton
        label="Refresh status"
        variant="outline"
        disabled={busy}
        onPress={() => void run('Status updated', refresh)}
      />

      <SectionHeader title="Data" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Clearing local data only removes the upload queue on this device. Server
          delete removes Recall observations from your account.
        </ThemedText>
      </SurfaceCard>
      <ThemedButton
        label="Clear local upload queue"
        variant="outline"
        disabled={busy || !Recall.isAvailable()}
        onPress={() =>
          void run('Local queue cleared', async () => {
            await Recall.clearLocalData();
          })
        }
      />
      <ThemedButton
        label="Delete Recall memories on server"
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
                  void run('Server Recall data deleted', async () => {
                    const token = await getToken();
                    if (!token) throw new ApiError('Sign in required.', 401);
                    await Recall.turnOff().catch(() => undefined);
                    await Recall.clearLocalData().catch(() => undefined);
                    const result = await deleteRecallData(token);
                    setMessage(
                      `Deleted ${result.deletedObservations} Recall observation(s).`,
                    );
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
});
