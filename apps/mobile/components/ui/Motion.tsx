import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ReduceMotion,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '../../hooks/useReducedMotion';
import { motion } from '../../theme';

const easeOut = Easing.out(Easing.cubic);

export const pageEntering = (delay = 0) =>
  FadeInDown.duration(motion.page)
    .easing(easeOut)
    .delay(delay)
    .reduceMotion(ReduceMotion.System);

export const fadeEntering = (delay = 0) =>
  FadeIn.duration(motion.normal).delay(delay).reduceMotion(ReduceMotion.System);

export const itemEntering = (index: number) =>
  FadeInDown.duration(motion.normal)
    .easing(easeOut)
    .delay(Math.min(index, 8) * motion.stagger)
    .reduceMotion(ReduceMotion.System);

export const messageEntering = () =>
  FadeInUp.duration(motion.normal).easing(easeOut).reduceMotion(ReduceMotion.System);

export const popEntering = (delay = 160) =>
  ZoomIn.duration(motion.normal)
    .easing(easeOut)
    .delay(delay)
    .reduceMotion(ReduceMotion.System);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressScaleProps = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'search';
};

export function PressScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PressScaleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withTiming(motion.pressScale, {
            duration: reduced ? 0 : motion.fast,
            easing: easeOut,
          });
        }
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: reduced ? 0 : motion.normal,
          easing: easeOut,
        });
      }}
      style={[animatedStyle, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedPressable>
  );
}
