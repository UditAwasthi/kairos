import { StyleProp, View, ViewStyle } from 'react-native';

import { useAppTheme } from '../../providers/ThemeProvider';

type ScreenGradientProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Flat Material surface behind page content. */
export function ScreenGradient({ children, style }: ScreenGradientProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>{children}</View>
  );
}

type AccentGradientProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  soft?: boolean;
};

/** Filled Material primary / primary-container block. */
export function AccentGradient({ children, style, soft = false }: AccentGradientProps) {
  const { colors, radius } = useAppTheme();

  return (
    <View
      style={[
        {
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: soft ? colors.primaryContainer : colors.primary,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

type GlassPanelProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  elevated?: boolean;
  padded?: boolean;
};

/** Material 3 surface card. */
export function GlassPanel({
  children,
  style,
  contentStyle,
  elevated = false,
  padded = true,
}: GlassPanelProps) {
  const { colors, radius, spacing } = useAppTheme();
  const shadow = elevated ? colors.shadowElevated : colors.shadow;

  return (
    <View
      style={[
        {
          borderRadius: radius.md,
          overflow: 'hidden',
          backgroundColor: colors.surfaceElevated,
          ...shadow,
        },
        style,
      ]}
    >
      <View style={[padded && { padding: spacing['4'], gap: spacing['2'] }, contentStyle]}>
        {children}
      </View>
    </View>
  );
}
