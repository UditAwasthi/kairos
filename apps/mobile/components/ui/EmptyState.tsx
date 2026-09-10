import { StyleSheet, View } from 'react-native';

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

  return (
    <View style={{ padding: spacing['6'], gap: spacing['3'] }} accessibilityLabel="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 12,
            borderRadius: radius.sm,
            backgroundColor: colors.border,
            width: `${92 - i * 10}%` as `${number}%`,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});