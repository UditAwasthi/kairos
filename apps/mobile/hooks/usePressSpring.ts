import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { motion } from '../theme';

export function usePressSpring(scale = motion.pressScale) {
  const press = useSharedValue(0);

  const onPressIn = useCallback(() => {
    press.value = withSpring(1, motion.springTap);
  }, [press]);

  const onPressOut = useCallback(() => {
    press.value = withSpring(0, motion.springTap);
  }, [press]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * (1 - scale) }],
  }));

  return { style, onPressIn, onPressOut };
}
