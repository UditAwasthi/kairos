import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { TextAction } from './TextAction';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  const { colors, typography, spacing, radius } = useAppTheme();

  return (
    <View style={[styles.row, { marginBottom: spacing['3'], gap: spacing['3'] }, style]}>
      <View
        style={{
          width: 3,
          alignSelf: 'stretch',
          borderRadius: radius.sm,
          marginTop: 2,
          minHeight: 20,
          backgroundColor: colors.accent,
        }}
      />
      <View style={[styles.textCol, { gap: spacing['1'] }]}>
        <ThemedText
          colorKey="text"
          style={{
            fontFamily: 'DotGothic16_400Regular',
            fontSize: typography.overline.size,
            lineHeight: typography.overline.lineHeight,
            letterSpacing: typography.overline.letterSpacing,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText
            colorKey="textSecondary"
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: typography.bodySmall.size,
              lineHeight: typography.bodySmall.lineHeight,
              letterSpacing: -0.1,
            }}
          >
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <TextAction label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
};

export function SurfaceCard({ children, style, elevated = false }: CardProps) {
  const { colors, spacing, radius } = useAppTheme();
  const shadow = elevated ? colors.shadowElevated : colors.shadow;

  return (
    <View
      style={[
        {
          borderWidth: 1,
          borderRadius: radius.lg,
          padding: spacing['4'],
          gap: spacing['2'],
          borderColor: colors.border,
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textCol: {
    flex: 1,
  },
});