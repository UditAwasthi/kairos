import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';
import { motion } from '../../theme';

export const enterTiming = { duration: 480, easing: Easing.out(Easing.cubic) };

export function FadeRise({
  active = true,
  delay = 0,
  children,
  style,
}: {
  active?: boolean;
  delay?: number;
  children: React.ReactNode;
  style?: object;
}) {
  const reduced = useReducedMotionPref();
  const progress = useSharedValue(active || reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = active ? 1 : 0.16;
      return;
    }
    progress.value = withDelay(delay, withTiming(active ? 1 : 0.16, enterTiming));
  }, [active, delay, progress, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [16, 0]) }],
  }));

  return (
    <Animated.View style={[styles.fade, style, animated]}>{children}</Animated.View>
  );
}

export function DriftBlob({
  color,
  style,
}: {
  color: string;
  style?: object;
}) {
  const reduced = useReducedMotionPref();
  const drift = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: 7400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: 0.55,
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [0, 12]) },
      { translateY: interpolate(drift.value, [0, 1], [0, -10]) },
      { scale: interpolate(drift.value, [0, 1], [1, 1.05]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.blob, style, { backgroundColor: color }, animated]}
    />
  );
}

export function usePressScale() {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, motion.pressScale]) }],
  }));

  return {
    style,
    onPressIn: () => {
      press.value = withSpring(1, { damping: 16, stiffness: 260 });
    },
    onPressOut: () => {
      press.value = withSpring(0, { damping: 16, stiffness: 260 });
    },
  };
}

const styles = StyleSheet.create({
  fade: {
    width: '100%',
    alignSelf: 'stretch',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
});
