import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

type MarkProps = {
  color: string;
  size?: number;
};

function Mark({
  size = 44,
  viewBox = '0 0 48 48',
  width,
  height,
  children,
}: MarkProps & {
  viewBox?: string;
  width?: number;
  height?: number;
  children: ReactNode;
}) {
  return (
    <Svg
      width={width ?? size}
      height={height ?? size}
      viewBox={viewBox}
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {children}
    </Svg>
  );
}

const stroke = {
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.5,
};

export function TalkScene({ color, size = 88 }: MarkProps) {
  return (
    <Mark color={color} size={size} width={size} height={Math.round(size * 0.72)} viewBox="0 0 120 86">
      <Circle cx="34" cy="50" r="16" stroke={color} {...stroke} />
      <Circle cx="29" cy="47" r="1.4" stroke={color} {...stroke} />
      <Circle cx="39" cy="47" r="1.4" stroke={color} {...stroke} />
      <Path d="M28 56c2.4 3 8.4 3 12 0" stroke={color} {...stroke} />
      <Path
        d="M64 16h36a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10H86l-8 8v-8H64A10 10 0 0 1 54 42V26a10 10 0 0 1 10-10z"
        stroke={color}
        {...stroke}
      />
      <Path d="M68 30c5-3 9-3 14 0s9 3 14 0" stroke={color} {...stroke} />
      <Path d="M68 38c5-3 9-3 14 0s9 3 14 0" stroke={color} {...stroke} />
    </Mark>
  );
}

export function BookScene({ color, size = 56 }: MarkProps) {
  return (
    <Mark color={color} size={size} viewBox="0 0 64 48" width={size} height={Math.round(size * 0.75)}>
      <Path d="M8 16c10-6 16-2 24 4v20c-8-6-14-10-24-4z" stroke={color} {...stroke} />
      <Path d="M56 16c-10-6-16-2-24 4v20c8-6 14-10 24-4z" stroke={color} {...stroke} />
      <Path d="M32 20v20" stroke={color} {...stroke} />
      <Path d="M40 10c4-1 8 1 9 5-4 0-7-1-9-5z" stroke={color} {...stroke} />
      <Path d="M22 11c-3-2-8-1-9 3 4 0 7-1 9-3z" stroke={color} {...stroke} />
    </Mark>
  );
}

export function PlantMark({ color, size }: MarkProps) {
  return (
    <Mark color={color} size={size}>
      <Path d="M18 38h12l-1.5-8h-9L18 38z" stroke={color} {...stroke} />
      <Path d="M24 30V18" stroke={color} {...stroke} />
      <Path d="M24 22c-5-1-8-5-8-9 5 1 8 5 8 9z" stroke={color} {...stroke} />
      <Path d="M24 20c5-2 9-6 8-11-5 2-8 6-8 11z" stroke={color} {...stroke} />
    </Mark>
  );
}

export function PlusMark({ color, size = 22 }: MarkProps) {
  return (
    <Mark color={color} size={size}>
      <Path d="M24 14v20M14 24h20" stroke={color} {...stroke} />
    </Mark>
  );
}

export function BarsMark({ color, size = 28 }: MarkProps) {
  return (
    <Mark color={color} size={size}>
      <Path d="M12 34V22M20 34V16M28 34V24M36 34V14" stroke={color} {...stroke} />
      <Path d="M10 36h28" stroke={color} {...stroke} />
    </Mark>
  );
}

export function HorizonMark({ color, size = 28 }: MarkProps) {
  return (
    <Mark color={color} size={size}>
      <Circle cx="24" cy="18" r="6" stroke={color} {...stroke} />
      <Path d="M8 32c6-6 10-6 16 0s10 6 16 0" stroke={color} {...stroke} />
    </Mark>
  );
}

export function WindowMark({ color, size = 28 }: MarkProps) {
  return (
    <Mark color={color} size={size}>
      <Path d="M12 12h24v24H12z" stroke={color} {...stroke} />
      <Path d="M24 12v24M12 24h24" stroke={color} {...stroke} />
      <Path d="M12 38h24" stroke={color} {...stroke} />
    </Mark>
  );
}

export function StackMark({ color, size = 28 }: MarkProps) {
  return (
    <Mark color={color} size={size}>
      <Path d="M14 18h20v18H14z" stroke={color} {...stroke} />
      <Path d="M18 14h20v18" stroke={color} {...stroke} />
    </Mark>
  );
}

function WaveBar({
  color,
  delay,
  max,
}: {
  color: string;
  delay: number;
  max: number;
}) {
  const wave = useSharedValue(0);

  useEffect(() => {
    wave.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 720, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [delay, wave]);

  const style = useAnimatedStyle(() => ({
    height: interpolate(wave.value, [0, 1], [8, max]),
    backgroundColor: color,
  }));

  return <Animated.View style={[styles.bar, style]} />;
}

export function TalkWave({ color }: { color: string }) {
  return (
    <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[18, 28, 36, 24, 16].map((max, index) => (
        <WaveBar key={index} color={color} delay={index * 110} max={max} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wave: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 36,
  },
  bar: {
    width: 3,
    borderRadius: 99,
    opacity: 0.7,
  },
});
