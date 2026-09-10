import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { SurfaceCard } from './SectionHeader';

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  style?: StyleProp<ViewStyle>;
};

export function MetricCard({ label, value, hint, style }: MetricCardProps) {
  const { typography, spacing } = useAppTheme();

  return (
    <SurfaceCard style={[styles.metric, style]}>
      <ThemedText
        colorKey="textMuted"
        style={{
          fontFamily: 'DotGothic16_400Regular',
          fontSize: typography.overline.size,
          lineHeight: typography.overline.lineHeight,
          letterSpacing: typography.overline.letterSpacing,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </ThemedText>
      <ThemedText
        colorKey="text"
        style={{
          fontFamily: 'Inter_700Bold',
          fontSize: typography.title2.size,
          letterSpacing: typography.title2.letterSpacing,
          lineHeight: typography.title2.lineHeight,
          marginTop: spacing['1'],
        }}
      >
        {value}
      </ThemedText>
      {hint ? (
        <ThemedText
          colorKey="textSecondary"
          style={{
            fontFamily: 'Inter_400Regular',
            fontSize: typography.caption.size,
            lineHeight: typography.caption.lineHeight,
            marginTop: spacing['1'],
          }}
        >
          {hint}
        </ThemedText>
      ) : null}
    </SurfaceCard>
  );
}

type BadgeProps = {
  label: string;
  tone?: 'neutral' | 'accent' | 'success';
};

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors, radius, typography, spacing } = useAppTheme();
  const borderColor =
    tone === 'accent'
      ? colors.borderAccent
      : tone === 'success'
        ? colors.success
        : colors.borderActive;
  const backgroundColor = tone === 'accent' ? colors.accentGlow : 'transparent';
  const colorKey = tone === 'accent' ? 'accent' : tone === 'success' ? 'success' : 'text';

  return (
    <View
      style={{
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: spacing['2'],
        paddingVertical: spacing['0.5'],
        borderColor,
        backgroundColor,
      }}
    >
      <ThemedText
        colorKey={colorKey}
        style={{
          fontFamily: 'DotGothic16_400Regular',
          fontSize: typography.overline.size,
          letterSpacing: typography.overline.letterSpacing,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

type ProgressBarProps = {
  progress: number;
};

export function ProgressBar({ progress }: ProgressBarProps) {
  const { colors, radius } = useAppTheme();
  const width = `${Math.max(0, Math.min(100, progress * 100))}%` as `${number}%`;

  return (
    <View
      style={{
        height: 4,
        borderRadius: radius.sm,
        overflow: 'hidden',
        backgroundColor: colors.border,
      }}
    >
      <View
        style={{
          height: '100%',
          borderRadius: radius.sm,
          backgroundColor: colors.text,
          width,
        }}
      />
    </View>
  );
}

type InsightCardProps = {
  title: string;
  body: string;
  meta?: string;
  badge?: string;
  onPress?: () => void;
};

export function InsightCard({ title, body, meta, badge }: InsightCardProps) {
  const { typography, spacing } = useAppTheme();

  return (
    <SurfaceCard>
      <View style={[styles.insightHeader, { gap: spacing['2'], marginBottom: spacing['1'] }]}>
        <ThemedText
          colorKey="text"
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: typography.bodySmall.size + 1,
            flex: 1,
            letterSpacing: -0.2,
            lineHeight: typography.bodySmall.lineHeight + 2,
          }}
        >
          {title}
        </ThemedText>
        {badge ? <Badge label={badge} /> : null}
      </View>
      <ThemedText
        colorKey="textSecondary"
        style={{
          fontFamily: 'Inter_400Regular',
          fontSize: typography.bodySmall.size,
          lineHeight: typography.bodySmall.lineHeight + 2,
          letterSpacing: -0.1,
        }}
      >
        {body}
      </ThemedText>
      {meta ? (
        <ThemedText
          colorKey="textMuted"
          style={{
            fontFamily: 'DotGothic16_400Regular',
            fontSize: typography.overline.size,
            letterSpacing: typography.overline.letterSpacing,
            marginTop: spacing['2'],
          }}
        >
          {meta}
        </ThemedText>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  metric: {
    minWidth: 120,
    flexGrow: 1,
    flexBasis: '30%',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
});