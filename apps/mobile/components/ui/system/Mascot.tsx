import { useEffect, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { mascotSize } from '../../../theme';

export type MascotState = 'idle' | 'happy' | 'thinking' | 'celebrating';

type MascotProps = {
  state?: MascotState;
  /** Pixel size. Prefer `mascotSize` from theme.ts. */
  size?: number;
  /** Idle drift. Turn off for off-screen copies. */
  animate?: boolean;
};

/**
 * Soft clay mascot. Final art can replace the SVG slot.
 *
 * ```tsx
 * <Mascot state="thinking" size={mascotSize.md} />
 * ```
 */
export function Mascot({ state = 'idle', size = mascotSize.md, animate = true }: MascotProps) {
  const { colors } = useAppTheme();
  const gradientId = `clay${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduced || !animate) {
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [animate, drift, reduced]);

  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateY: drift.value * 2 },
      { scale: 1 + drift.value * 0.015 },
    ],
  }));

  const smile =
    state === 'happy' || state === 'celebrating'
      ? 'M38 62 Q50 72 62 62'
      : state === 'thinking'
        ? 'M42 64 Q50 66 58 63'
        : 'M42 64 Q50 68 58 64';
  const eyeY = state === 'thinking' ? 48 : 50;

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ width: size, height: size }, motion]}
    >
      <View
        style={[
          styles.shadow,
          {
            shadowColor: colors.shadow.shadowColor,
            shadowOpacity: 0.22,
            shadowRadius: size / 6,
            shadowOffset: { width: 0, height: 4 },
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={gradientId} cx="38%" cy="32%" r="68%">
              <Stop offset="0" stopColor={colors.accentCream} />
              <Stop offset="0.55" stopColor={colors.accentLilac} />
              <Stop offset="1" stopColor={colors.primary} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="50" cy="86" rx="22" ry="5" fill={colors.background} opacity={0.35} />
          <Circle cx="50" cy="50" r="34" fill={`url(#${gradientId})`} />
          <Ellipse cx="38" cy="38" rx="12" ry="8" fill={colors.accentCream} opacity={0.45} />
          <Circle cx="40" cy={eyeY} r="3.2" fill={colors.onPrimary} />
          <Circle cx="60" cy={eyeY + (state === 'thinking' ? -2 : 0)} r="3.2" fill={colors.onPrimary} />
          <Circle cx="41" cy={eyeY - 1} r="1" fill={colors.accentCream} />
          <Circle cx="61" cy={eyeY - 1} r="1" fill={colors.accentCream} />
          <Path d={smile} stroke={colors.onPrimary} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {state === 'celebrating' ? (
            <Circle cx="28" cy="58" r="3" fill={colors.accentPeach} opacity={0.7} />
          ) : null}
        </Svg>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    elevation: 2,
  },
});
