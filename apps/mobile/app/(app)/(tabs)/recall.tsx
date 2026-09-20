import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SoftAurora } from '../../../components/SoftAurora';
import { ThemedText } from '../../../components/ThemedText';
import { FLOATING_TAB_BAR_CONTENT } from '../../../components/FloatingTabBar';
import { GlassPanel, ScreenGradient } from '../../../components/ui/Glass';
import {
  ApiError,
  deleteRecallData,
  type RecallEntitlement,
} from '../../../lib/api';
import {
  ensureRecallReady,
  getCachedRecallEntitlement,
} from '../../../lib/recallSync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import Recall, { type RecallStatus } from 'kairos-recall';

function relativeTime(ts: number | null | undefined): string {
  if (!ts) return '—';
  const diff = Math.max(0, Date.now() - ts);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 48) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

function statusWord(status: RecallStatus | null, entitlement: RecallEntitlement | null): string {
  if (!Recall.isAvailable() || Platform.OS !== 'android') return 'Android';
  if (entitlement && !entitlement.allowed) return 'Locked';
  if (!status) return '…';
  if (status.capturing || status.on) return 'On';
  if (status.state === 'needs_consent' || status.userEnabled) return 'Resume';
  if (status.state === 'paused') return 'Paused';
  return 'Off';
}

function PulseOrb({
  active,
  busy,
  disabled,
  onPress,
}: {
  active: boolean;
  busy: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors, isLight } = useAppTheme();
  const pulse = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    if (active) {
      pulse.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0, { duration: 320 });
    }
  }, [active, pulse]);

  const ringA = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.18, 0.42], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.18]) }],
  }));

  const ringB = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.1, 0.28], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.32]) }],
  }));

  const core = useAnimatedStyle(() => {
    const pressScale = interpolate(press.value, [0, 1], [1, 0.94]);
    const pulseScale = interpolate(pulse.value, [0, 1], [1, 1.03]);
    return {
      transform: [{ scale: pressScale * pulseScale }],
    };
  });

  return (
    <Pressable
      disabled={disabled || busy}
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 16, stiffness: 280 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 14, stiffness: 240 });
      }}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Turn Recall off' : 'Turn Recall on'}
      style={styles.orbHit}
    >
      <View style={styles.orbStack}>
        <Animated.View
          style={[
            styles.orbRing,
            {
              borderColor: isLight ? `${colors.accent}33` : `${colors.accent}44`,
            },
            ringB,
          ]}
        />
        <Animated.View
          style={[
            styles.orbRing,
            styles.orbRingMid,
            {
              borderColor: isLight ? `${colors.accent}55` : `${colors.accent}66`,
            },
            ringA,
          ]}
        />
        <Animated.View
          style={[
            styles.orbCore,
            {
              backgroundColor: active ? colors.buttonFill : colors.surfaceElevated,
              borderColor: colors.glassBorder,
            },
            colors.shadowElevated,
            core,
          ]}
        >
          <Feather
            name={active ? 'eye' : 'eye-off'}
            size={36}
            color={active ? colors.buttonText : colors.accent}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

export default function RecallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [entitlement, setEntitlement] = useState<RecallEntitlement | null>(
    () => getCachedRecallEntitlement(),
  );
  const [status, setStatus] = useState<RecallStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (force = false) => {
    try {
      const ent = await ensureRecallReady(getToken, { force });
      if (ent) setEntitlement(ent);
      if (Recall.isAvailable()) {
        await Recall.setConfig({
          sampleIntervalMs: 700,
          maxOcrPerMinute: 14,
        });
        const st = await Recall.getStatus();
        setStatus(st);
      }
    } catch {
      /* keep last good status */
    }
  }, [getToken]);

  useEffect(() => {
    void refresh(false);
    const id = setInterval(() => {
      void Recall.getStatus().then(setStatus).catch(() => undefined);
    }, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  const run = async (action: () => Promise<unknown>) => {
    try {
      setBusy(true);
      await action();
      await refresh();
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
  const canUse = Recall.isAvailable() && entitlement?.allowed === true && !busy;
  const word = statusWord(status, entitlement);
  const queued = status?.queuedCount ?? 0;
  const lastSync = relativeTime(status?.lastUploadAt);

  const toggle = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isOn) {
      void run(async () => {
        await Recall.turnOff();
      });
    } else {
      void run(async () => {
        await Recall.turnOn();
      });
    }
  };

  return (
    <ScreenGradient>
      <View
        style={[
          styles.screen,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + FLOATING_TAB_BAR_CONTENT + 24,
          },
        ]}
      >
        <View style={styles.top}>
          <ThemedText colorKey="text" style={styles.title}>
            Recall
          </ThemedText>
          <View style={[styles.pill, { backgroundColor: colors.accentGlow }]}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isOn
                    ? colors.success
                    : word === 'Locked'
                      ? colors.warning
                      : colors.textMuted,
                },
              ]}
            />
            <ThemedText colorKey="textMuted" style={styles.pillText}>
              {word}
            </ThemedText>
          </View>
        </View>

        <View style={styles.hero}>
          <SoftAurora />
          <PulseOrb
            active={isOn}
            busy={busy}
            disabled={!canUse && !isOn}
            onPress={toggle}
          />
        </View>

        <View style={styles.metrics}>
          <GlassPanel style={styles.metric} contentStyle={styles.metricInner} padded={false}>
            <Feather name="layers" size={16} color={colors.accent} />
            <ThemedText colorKey="text" style={styles.metricValue}>
              {queued}
            </ThemedText>
          </GlassPanel>
          <GlassPanel style={styles.metric} contentStyle={styles.metricInner} padded={false}>
            <Feather name="upload-cloud" size={16} color={colors.accent} />
            <ThemedText colorKey="text" style={styles.metricValue}>
              {lastSync}
            </ThemedText>
          </GlassPanel>
          <GlassPanel style={styles.metric} contentStyle={styles.metricInner} padded={false}>
            <Feather
              name={entitlement?.allowed ? 'shield' : 'shield-off'}
              size={16}
              color={colors.accent}
            />
            <ThemedText colorKey="text" style={styles.metricValue}>
              {entitlement?.allowed ? 'OK' : '—'}
            </ThemedText>
          </GlassPanel>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(app)/(tabs)/ask');
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityLabel="Ask"
          >
            <Feather name="message-circle" size={18} color={colors.accent} />
          </Pressable>
          <Pressable
            disabled={busy || !Recall.isAvailable()}
            onPress={() =>
              void run(async () => {
                await Recall.clearLocalData();
              })
            }
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityLabel="Clear queue"
          >
            <Feather name="trash" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => {
              Alert.alert('Delete?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () =>
                    void run(async () => {
                      const token = await getToken();
                      if (!token) throw new ApiError('Sign in required.', 401);
                      await Recall.turnOff().catch(() => undefined);
                      await Recall.clearLocalData().catch(() => undefined);
                      await deleteRecallData(token);
                    }),
                },
              ]);
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityLabel="Delete server data"
          >
            <Feather name="cloud-off" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => void run(async () => { await refresh(true); })}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.surfaceElevated, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityLabel="Refresh"
          >
            <Feather name="refresh-cw" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {status?.lastError ? (
          <ThemedText colorKey="warning" style={styles.error} numberOfLines={2}>
            {status.lastError}
          </ThemedText>
        ) : null}
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 32,
    letterSpacing: -0.6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
    overflow: 'hidden',
    borderRadius: 32,
  },
  orbHit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbStack: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
  },
  orbRingMid: {
    width: 168,
    height: 168,
    borderRadius: 84,
  },
  orbCore: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
  },
  metricInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  metricValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
});
