import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Switch, View } from 'react-native';

import Recall, { type RecallStatus } from 'kairos-recall';
import {
  ApiError,
  deleteRecallData,
  type RecallEntitlement,
} from '../../lib/api';
import {
  ensureRecallReady,
  getCachedRecallEntitlement,
} from '../../lib/recallSync';
import { useAppTheme } from '../../providers/ThemeProvider';
import { KairosButton, KairosSurface, KairosText } from '../ui/Kairos';

export function ScreenRecallCard({ compact = false }: { compact?: boolean }) {
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [entitlement, setEntitlement] = useState<RecallEntitlement | null>(
    () => getCachedRecallEntitlement(),
  );
  const [status, setStatus] = useState<RecallStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(
    async (force = false) => {
      try {
        const ent = await ensureRecallReady(getToken, { force });
        if (ent) setEntitlement(ent);
        if (Recall.isAvailable()) {
          const st = await Recall.getStatus();
          setStatus(st);
        }
      } catch {
        /* keep last */
      }
    },
    [getToken],
  );

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    if (!Recall.isAvailable()) return;
    const id = setInterval(() => {
      void Recall.getStatus()
        .then(setStatus)
        .catch(() => undefined);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  if (Platform.OS !== 'android' || !Recall.isAvailable()) {
    return compact ? null : (
      <KairosSurface contentStyle={{ padding: 20, gap: 8 }}>
        <KairosText variant="title">Always-on screen</KairosText>
        <KairosText variant="caption" color="textSecondary">
          Screen capture is available on Android.
        </KairosText>
      </KairosSurface>
    );
  }

  const isOn = Recall.isOn(status);
  const canUse = entitlement?.allowed === true && !busy;
  const queued = status?.queuedCount ?? 0;

  return (
    <KairosSurface contentStyle={{ padding: 20, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12, gap: 4 }}>
          <KairosText variant="title">Always-on screen</KairosText>
          <KairosText variant="caption" color="textSecondary">
            {entitlement && !entitlement.allowed
              ? 'Not available on this account.'
              : isOn
                ? queued > 0
                  ? `On · ${queued} waiting to sync`
                  : 'On · capturing on this device'
                : 'Off · memories stay until you turn this on'}
          </KairosText>
        </View>
        <Switch
          value={isOn}
          disabled={!canUse && !isOn}
          onValueChange={(next) => {
            void (async () => {
              setBusy(true);
              try {
                if (next) await Recall.turnOn();
                else await Recall.turnOff();
                await refresh();
              } catch (err) {
                Alert.alert('Screen recall', err instanceof Error ? err.message : 'Could not change.');
              } finally {
                setBusy(false);
              }
            })();
          }}
          trackColor={{ false: colors.surfaceContainer, true: colors.accent }}
          thumbColor={colors.inverseText}
          accessibilityLabel="Always-on screen recall"
        />
      </View>
      {!compact ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <KairosButton
            label="Clear queue"
            variant="outline"
            disabled={busy}
            onPress={() =>
              void (async () => {
                setBusy(true);
                try {
                  await Recall.clearLocalData();
                  await refresh();
                } finally {
                  setBusy(false);
                }
              })()
            }
          />
          <KairosButton
            label="Delete server copies"
            variant="outline"
            disabled={busy}
            onPress={() => {
              Alert.alert('Delete screen-recall data?', 'This removes server copies from this device.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    void (async () => {
                      setBusy(true);
                      try {
                        const token = await getToken();
                        if (!token) throw new ApiError('Sign in required.', 401);
                        await Recall.turnOff().catch(() => undefined);
                        await Recall.clearLocalData().catch(() => undefined);
                        await deleteRecallData(token);
                        await refresh(true);
                      } catch (err) {
                        Alert.alert(
                          'Delete failed',
                          err instanceof ApiError ? err.message : 'Try again.',
                        );
                      } finally {
                        setBusy(false);
                      }
                    })(),
                },
              ]);
            }}
          />
        </View>
      ) : null}
    </KairosSurface>
  );
}
