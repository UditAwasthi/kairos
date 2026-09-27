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
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

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
      <Circle cx="28" cy="54" r="13" stroke={color} fill={color} fillOpacity={0.1} {...stroke} />
      <Circle cx="24" cy="51" r="1.3" fill={color} />
      <Circle cx="32" cy="51" r="1.3" fill={color} />
      <Path d="M23 59c2 2.6 7.2 2.6 10 0" stroke={color} {...stroke} />
      <Path d="M18 70c2.4-6 8-9 16-9s13 3 16 9" stroke={color} {...stroke} />
      <Path
        d="M62 14h40a9 9 0 0 1 9 9v18a9 9 0 0 1-9 9H88l-8 8v-8H62a9 9 0 0 1-9-9V23a9 9 0 0 1 9-9z"
        stroke={color}
        fill={color}
        fillOpacity={0.08}
        {...stroke}
      />
      <Path d="M68 28c5-3 9-3 14 0s9 3 14 0" stroke={color} {...stroke} />
      <Path d="M68 37c5-3 9-3 14 0s9 3 14 0" stroke={color} {...stroke} />
    </Mark>
  );
}

export function BookScene({ color, size = 56 }: MarkProps) {
  return (
    <Mark color={color} size={size} viewBox="0 0 64 48" width={size} height={Math.round(size * 0.75)}>
      <Path d="M8 16c10-6 16-2 24 4v20c-8-6-14-10-24-4z" stroke={color} fill={color} fillOpacity={0.08} {...stroke} />
      <Path d="M56 16c-10-6-16-2-24 4v20c8-6 14-10 24-4z" stroke={color} fill={color} fillOpacity={0.12} {...stroke} />
      <Path d="M32 20v20" stroke={color} {...stroke} />
      <Path d="M40 10c4-1 8 1 9 5-4 0-7-1-9-5z" stroke={color} fill={color} fillOpacity={0.16} {...stroke} />
      <Path d="M22 11c-3-2-8-1-9 3 4 0 7-1 9-3z" stroke={color} fill={color} fillOpacity={0.16} {...stroke} />
    </Mark>
  );
}

export function GreetScene({ color, size = 120 }: MarkProps) {
  return (
    <Mark color={color} size={size} width={size} height={Math.round(size * 0.62)} viewBox="0 0 160 100">
      <Rect x="18" y="14" width="72" height="72" rx="36" stroke={color} fill={color} fillOpacity={0.08} {...stroke} />
      <Circle cx="54" cy="42" r="10" stroke={color} fill={color} fillOpacity={0.12} {...stroke} />
      <Path d="M28 68c8-10 16-10 26 0s18 10 26 0" stroke={color} {...stroke} />
      <Path d="M108 78h40" stroke={color} {...stroke} />
      <Rect x="122" y="46" width="16" height="32" rx="3" stroke={color} fill={color} fillOpacity={0.1} {...stroke} />
      <Path d="M130 46v-10" stroke={color} {...stroke} />
      <Path d="M130 38c-7-2-10-8-9-14 6 2 9 7 9 14z" stroke={color} fill={color} fillOpacity={0.16} {...stroke} />
      <Path d="M130 36c7-2 11-8 9-14-6 2-9 7-9 14z" stroke={color} fill={color} fillOpacity={0.16} {...stroke} />
    </Mark>
  );
}

export function WorldPath({ color, size = 88 }: MarkProps) {
  return (
    <Mark color={color} size={size} width={size} height={Math.round(size * 0.62)} viewBox="0 0 120 74">
      <Circle cx="96" cy="16" r="8" stroke={color} fill={color} fillOpacity={0.12} {...stroke} />
      <Path d="M6 58c18-16 28-10 40 0s26 12 40 0 20-10 28 2" stroke={color} {...stroke} />
      <Path d="M18 58c8-18 18-20 22-8" stroke={color} fill={color} fillOpacity={0.08} {...stroke} />
      <Path d="M70 58c6-14 16-16 20-6" stroke={color} fill={color} fillOpacity={0.08} {...stroke} />
      <Circle cx="48" cy="44" r="3" fill={color} />
      <Path d="M48 47v8" stroke={color} {...stroke} />
    </Mark>
  );
}

export function CaptureScene({ color, size = 72 }: MarkProps) {
  return (
    <Mark color={color} size={size} width={size} height={Math.round(size * 0.78)} viewBox="0 0 80 62">
      <Rect x="14" y="18" width="52" height="36" rx="10" stroke={color} fill={color} fillOpacity={0.08} {...stroke} />
      <Circle cx="40" cy="36" r="10" stroke={color} fill={color} fillOpacity={0.12} {...stroke} />
      <Circle cx="40" cy="36" r="4" fill={color} />
      <Path d="M28 18l4-6h16l4 6" stroke={color} {...stroke} />
      <Path d="M40 8v6" stroke={color} {...stroke} />
    </Mark>
  );
}

export function LeafScene({ color, size = 56 }: MarkProps) {
  return (
    <Mark color={color} size={size} viewBox="0 0 48 48">
      <Ellipse cx="24" cy="40" rx="10" ry="3" fill={color} fillOpacity={0.1} />
      <Path d="M18 38h12l-1.6-9h-8.8L18 38z" stroke={color} fill={color} fillOpacity={0.08} {...stroke} />
      <Path d="M24 29V16" stroke={color} {...stroke} />
      <Path d="M24 22c-7-1-11-7-11-12 8 1 11 7 11 12z" stroke={color} fill={color} fillOpacity={0.12} {...stroke} />
      <Path d="M24 20c7-2 12-7 11-13-8 2-11 7-11 13z" stroke={color} fill={color} fillOpacity={0.12} {...stroke} />
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
