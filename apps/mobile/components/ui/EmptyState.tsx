import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { fadeEntering, pageEntering } from './Motion';
import { ThemedButton } from './ThemedButton';

type EmptyStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
};

export function EmptyState({ title, message, actionLabel, onAction, style }: EmptyStateProps) {
  const { spacing } = useAppTheme();

  return (
    <Animated.View
      entering={fadeEntering(40)}
      style={[styles.container, { padding: spacing['8'], gap: spacing['3'] }, style]}
    >
      <ThemedText colorKey="textMuted" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText colorKey="textMuted" style={styles.emptyMessage}>
          {message}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <ThemedButton
          label={actionLabel}
          onPress={onAction}
          style={{ marginTop: spacing['2'], minWidth: 140 }}
        />
      ) : null}
    </Animated.View>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return <ErrorState title="Offline" onRetry={onRetry} />;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorStateProps) {
  const { spacing } = useAppTheme();

  return (
    <Animated.View
      entering={fadeEntering()}
      style={[styles.container, { padding: spacing['8'], gap: spacing['4'] }]}
    >
      <ThemedText colorKey="text" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      {message ? (
        <ThemedText colorKey="textMuted" style={styles.emptyMessage}>
          {message}
        </ThemedText>
      ) : null}
      {onRetry ? <ThemedButton label="Retry" onPress={onRetry} style={{ minWidth: 140 }} /> : null}
    </Animated.View>
  );
}

type LoadingSkeletonProps = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 4 }: LoadingSkeletonProps) {
  const { colors, spacing, radius } = useAppTheme();
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <Animated.View
      style={{ padding: spacing['6'], gap: spacing['3'], flex: 1 }}
      accessibilityLabel="Loading"
    >
      {Array.from({ length: rows }).map((_, i) => {
        const isBlock = i % 3 === 0;
        return (
          <Animated.View
            key={i}
            style={[
              {
                height: isBlock ? 64 : 10,
                borderRadius: isBlock ? radius.xl : radius.full,
                backgroundColor: colors.border,
                width: isBlock ? '100%' : (`${88 - (i % 4) * 12}%` as `${number}%`),
              },
              pulseStyle,
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

type FadeInContentProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function FadeInContent({ children, style }: FadeInContentProps) {
  return (
    <Animated.View entering={pageEntering()} style={[{ flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}

type SoftRefreshProps = {
  active: boolean;
};

export function SoftRefreshBar({ active }: SoftRefreshProps) {
  if (!active) return null;
  return (
    <View
      pointerEvents="none"
      style={styles.refreshOverlay}
      accessibilityLabel="Refreshing"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  emptyMessage: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 240,
    opacity: 0.85,
  },
  refreshOverlay: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
});
