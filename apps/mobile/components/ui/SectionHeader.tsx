import { StyleSheet, StyleProp, View, ViewStyle } from 'react-native';

import { ThemedText } from '../ThemedText';
import { GlassPanel } from './Glass';
import { TextAction } from './TextAction';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Minimal section label — single word preferred. */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.textCol}>
        <ThemedText colorKey="textMuted" style={styles.title}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText colorKey="textMuted" style={styles.subtitle}>
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
  return (
    <GlassPanel elevated={elevated} style={style}>
      {children}
    </GlassPanel>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: -4,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    opacity: 0.8,
  },
});
