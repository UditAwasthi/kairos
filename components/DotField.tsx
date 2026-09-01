import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';

import { themeColor } from '../themeAnimation';

const COLS = 8;
const ROWS = 6;
const DOT_COUNT = COLS * ROWS;

type DotProps = {
  index: number;
  phase: SharedValue<number>;
  themeProgress: SharedValue<number>;
};

function Dot({ index, phase, themeProgress }: DotProps) {
  const style = useAnimatedStyle(() => {
    const wave = (phase.value + index * 0.06) % 1;
    const opacity = interpolate(wave, [0, 0.45, 1], [0.06, 0.32, 0.06]);
    const scale = interpolate(wave, [0, 0.45, 1], [0.85, 1.15, 0.85]);

    return {
      opacity,
      transform: [{ scale }],
      backgroundColor: themeColor(themeProgress.value, 'dot'),
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

type DotFieldProps = {
  phase: SharedValue<number>;
  themeProgress: SharedValue<number>;
};

export function DotField({ phase, themeProgress }: DotFieldProps) {
  return (
    <View style={styles.grid} pointerEvents="none">
      {Array.from({ length: DOT_COUNT }, (_, index) => (
        <Dot key={index} index={index} phase={phase} themeProgress={themeProgress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 168,
    gap: 12,
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
