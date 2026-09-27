import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '../../providers/ThemeProvider';

type ScreenGradientProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Opaque page backdrop — gradients are no longer used as fills. */
export function ScreenGradient({ children, style }: ScreenGradientProps) {
  const { colors } = useAppTheme();
  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      {children}
    </View>
  );
}

type AccentGradientProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  soft?: boolean;
};

/** Flat accent wash — kept for existing call sites. */
export function AccentGradient({ children, style, soft = false }: AccentGradientProps) {
  const { colors, radius } = useAppTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius.xl,
          overflow: 'hidden',
          backgroundColor: soft ? colors.accentGlow : colors.surface,
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

/**
 * Deprecated alias for KairosSurface. Opaque — no blur.
 */
export function GlassPanel({
  children,
  style,
  contentStyle,
  elevated = false,
  padded = true,
}: GlassPanelProps) {
  const { colors, radius, spacing } = useAppTheme();

  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
        },
        style,
      ]}
    >
      <View
        style={[
          padded && { padding: spacing['5'], gap: spacing['2'] },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
