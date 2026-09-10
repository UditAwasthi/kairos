import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { GlassPanel } from './Glass';
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
          width: 4,
          alignSelf: 'stretch',
          borderRadius: radius.full,
          marginTop: 2,
          minHeight: 20,
          backgroundColor: colors.accent,
          opacity: 0.9,
        }}
      />
      <View style={[styles.textCol, { gap: spacing['1'] }]}>
        <ThemedText
          colorKey="text"
          style={{
            fontFamily: 'Inter_600SemiBold',
            fontSize: typography.overline.size + 1,
            lineHeight: typography.overline.lineHeight + 2,
            letterSpacing: 0.4,
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

/** Glass card — default widget shell across the app */
export function SurfaceCard({ children, style, elevated = false }: CardProps) {
  return (
    <GlassPanel elevated={elevated} style={style}>
      {children}
    </GlassPanel>
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
