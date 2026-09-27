import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Platform,
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

/** Full-bleed atmospheric gradient behind glass widgets */
export function ScreenGradient({ children, style }: ScreenGradientProps) {
  const { colors, gradients } = useAppTheme();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={[...gradients.background]}
        locations={[0, 0.48, 1]}
        start={{ x: 0.05, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

type AccentGradientProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  soft?: boolean;
};

/** Brand CTA / hero fill — always a gradient, never a flat solid */
export function AccentGradient({ children, style, soft = false }: AccentGradientProps) {
  const { gradients, radius } = useAppTheme();
  const colors = soft ? gradients.accentSoft : gradients.accent;

  return (
    <LinearGradient
      colors={[...colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ borderRadius: radius.xl, overflow: 'hidden' }, style]}
    >
      {children}
    </LinearGradient>
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
 * Glassmorphism widget shell: blur + translucent gradient wash + edge highlight.
 * Use for cards, chips, composer bars, and Ask surfaces.
 */
export function GlassPanel({
  children,
  style,
  contentStyle,
  intensity,
  elevated = false,
  padded = true,
}: GlassPanelProps) {
  const { colors, gradients, radius, spacing, isLight } = useAppTheme();
  const blur = intensity ?? colors.glassIntensity;
  const shadow = elevated ? colors.shadowElevated : colors.shadow;

  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          overflow: 'hidden',
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: colors.glassBorder,
          ...shadow,
        },
        style,
      ]}
    >
      <BlurView
        intensity={blur}
        tint={isLight ? 'systemUltraThinMaterialLight' : 'systemUltraThinMaterialDark'}
        experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[...(elevated ? gradients.surface : gradients.glass)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View
        pointerEvents="none"
        style={[styles.highlight, { backgroundColor: colors.glassHighlight }]}
      />
      <View
        style={[
          padded && { padding: spacing['4'], gap: spacing['2'] },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: StyleSheet.hairlineWidth,
    opacity: 0.9,
  },
});
