import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemedButton } from './ThemedButton';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
};

export function EmptyState({ title, message, actionLabel, onAction, style }: EmptyStateProps) {
  const { colors, typography, spacing, radius } = useAppTheme();

  return (
    <View style={[styles.container, { padding: spacing['8'], gap: spacing['4'] }, style]}>
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: radius.sm,
          backgroundColor: colors.accent,
          marginBottom: spacing['2'],
        }}
      />
      <ThemedText
        colorKey="text"
        style={{
          fontFamily: 'DotGothic16_400Regular',
          fontSize: typography.title3.size,
          letterSpacing: 2,
          textAlign: 'center',
          lineHeight: typography.title3.lineHeight,
        }}
      >
        {title}
      </ThemedText>
      <ThemedText
        colorKey="textSecondary"
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: typography.bodySmall.size,
          lineHeight: typography.bodySmall.lineHeight + 2,
          textAlign: 'center',
          maxWidth: 280,
          letterSpacing: -0.1,
        }}
      >
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <ThemedButton label={actionLabel} onPress={onAction} style={{ marginTop: spacing['2'], minWidth: 180 }} />
      ) : null}
    </View>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="You're offline"
      message="Kairos needs a connection to load memories. Changes will sync when you are back online."
      onRetry={onRetry}
    />
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to load this view. Please try again.',
  onRetry,
}: ErrorStateProps) {
  const { colors, typography, spacing, radius } = useAppTheme();

  return (
    <View style={[styles.container, { padding: spacing['8'], gap: spacing['4'] }]}>
      <View
        style={{
          padding: spacing['5'],
          borderRadius: radius.lg,
          backgroundColor: colors.errorSurface,
          borderWidth: 1,
          borderColor: colors.borderAccent,
          gap: spacing['3'],
          maxWidth: 320,
          width: '100%',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: radius.md,
            backgroundColor: colors.borderAccent,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing['1'],
          }}
        >
          <ThemedText colorKey="inverseText" style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}>
            !
          </ThemedText>
        </View>
        <ThemedText
          colorKey="error"
          style={{
            fontFamily: 'DotGothic16_400Regular',
            fontSize: typography.title3.size - 2,
            letterSpacing: 2,
            textAlign: 'center',
          }}
        >
          {title}
        </ThemedText>
        <ThemedText
          colorKey="textSecondary"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: typography.bodySmall.size,
            lineHeight: typography.bodySmall.lineHeight + 1,
            textAlign: 'center',
            letterSpacing: -0.1,
          }}
        >
          {message}
        </ThemedText>
      </View>
      {onRetry ? <ThemedButton label="Retry" onPress={onRetry} style={{ minWidth: 180 }} /> : null}
    </View>
  );
}

type LoadingSkeletonProps = {
  rows?: number;
};

export function LoadingSkeleton({ rows = 4 }: LoadingSkeletonProps) {
  const { colors, spacing, radius } = useAppTheme();
  const pulse = useSharedValue(0.42);

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
      entering={FadeIn.duration(180)}
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
                height: isBlock ? 76 : 12,
                borderRadius: isBlock ? radius.lg : radius.sm,
                backgroundColor: colors.border,
                width: isBlock ? '100%' : (`${90 - (i % 4) * 14}%` as `${number}%`),
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

/** Soft entrance once real content is ready — avoids hard pop-in. */
export function FadeInContent({ children, style }: FadeInContentProps) {
  return (
    <Animated.View entering={FadeIn.duration(220)} style={[{ flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}

type SoftRefreshProps = {
  active: boolean;
};

/** Tiny top indicator while stale data stays on screen. */
export function SoftRefreshBar({ active }: SoftRefreshProps) {
  const { colors, spacing } = useAppTheme();
  if (!active) return null;
  return (
    <View
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing['2'],
        minHeight: 28,
      }}
      accessibilityLabel="Refreshing"
    >
      <ActivityIndicator size="small" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
