import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { GlassPanel } from './ui/Glass';
import { useAppTheme } from '../providers/ThemeProvider';
import { kairosPalette } from '../theme';

type IconName = React.ComponentProps<typeof Feather>['name'];

const TAB_META: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Home', icon: 'home' },
  timeline: { label: 'Timeline', icon: 'clock' },
  ask: { label: 'Ask', icon: 'message-circle' },
  capture: { label: 'Capture', icon: 'plus' },
  profile: { label: 'Profile', icon: 'user' },
};

/** Space screens should leave clear above the floating bar (excluding safe area). */
export const FLOATING_TAB_BAR_CONTENT = 64;

const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

function FlowLayer({ width }: { width: number }) {
  const { isLight } = useAppTheme();
  const s = kairosPalette.signal;
  const drift = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 7200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [drift, pulse]);

  const blobA = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-18, width * 0.42], Extrapolation.CLAMP) },
      { translateY: interpolate(drift.value, [0, 1], [4, -10], Extrapolation.CLAMP) },
      { scale: interpolate(pulse.value, [0, 1], [0.92, 1.12]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.35, 0.55]),
  }));

  const blobB = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(drift.value, [0, 1], [width * 0.55, width * 0.12], Extrapolation.CLAMP),
      },
      { translateY: interpolate(drift.value, [0, 1], [-6, 8], Extrapolation.CLAMP) },
      { scale: interpolate(pulse.value, [0, 1], [1.08, 0.9]) },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.28, 0.48]),
  }));

  const blobC = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(drift.value, [0, 1], [width * 0.2, width * 0.68], Extrapolation.CLAMP),
      },
      { translateY: interpolate(pulse.value, [0, 1], [10, -4], Extrapolation.CLAMP) },
      { scale: interpolate(drift.value, [0, 1], [0.85, 1.15]) },
    ],
    opacity: interpolate(drift.value, [0, 1], [0.22, 0.4]),
  }));

  const shimmer = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(drift.value, [0, 1], [-width * 0.35, width * 0.75], Extrapolation.CLAMP),
      },
    ],
    opacity: interpolate(pulse.value, [0, 1], [0.12, 0.28]),
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.flowBlob,
          styles.flowA,
          { backgroundColor: isLight ? `${s[500]}33` : `${s[400]}28` },
          blobA,
        ]}
      />
      <Animated.View
        style={[
          styles.flowBlob,
          styles.flowB,
          { backgroundColor: isLight ? `${s[600]}28` : `${s[300]}22` },
          blobB,
        ]}
      />
      <Animated.View
        style={[
          styles.flowBlob,
          styles.flowC,
          { backgroundColor: isLight ? `${s[400]}24` : `${s[500]}1A` },
          blobC,
        ]}
      />
      <Animated.View
        style={[
          styles.shimmer,
          { backgroundColor: isLight ? `${s[300]}40` : `${s[400]}30` },
          shimmer,
        ]}
      />
    </View>
  );
}

function TabItem({
  icon,
  focused,
  accessibilityLabel,
  onPress,
  onLongPress,
  onLayout,
}: {
  icon: IconName;
  focused: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onLongPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const { colors } = useAppTheme();
  const press = useSharedValue(0);
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = withSpring(focused ? 1 : 0, SPRING);
  }, [focused, active]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.92]) }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(active.value, [0, 1], [0.5, 1]),
    transform: [{ scale: interpolate(active.value, [0, 1], [0.94, 1]) }],
  }));

  return (
    <Pressable
      onLayout={onLayout}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 14, stiffness: 280 });
      }}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      style={styles.item}
    >
      <Animated.View style={[styles.itemInner, wrapStyle]}>
        <Animated.View style={[styles.icon, iconStyle]}>
          <Feather
            name={icon}
            size={20}
            color={focused ? colors.accent : colors.textMuted}
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const keyboardVisible = useKeyboardState((s) => s.isVisible);
  const [barWidth, setBarWidth] = useState(0);
  const [layouts, setLayouts] = useState<Record<number, { x: number; width: number }>>({});

  const visibility = useSharedValue(1);
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const indicatorReady = useSharedValue(0);

  useEffect(() => {
    visibility.value = withTiming(keyboardVisible ? 0 : 1, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [keyboardVisible, visibility]);

  useEffect(() => {
    const layout = layouts[state.index];
    if (!layout) return;
    indicatorX.value = withSpring(layout.x, SPRING);
    indicatorW.value = withSpring(layout.width, SPRING);
    indicatorReady.value = withTiming(1, { duration: 180 });
  }, [state.index, layouts, indicatorX, indicatorW, indicatorReady]);

  const goToIndex = (next: number) => {
    const route = state.routes[next];
    if (!route || next === state.index) return;
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(route.name, route.params);
    }
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) < 48 && Math.abs(e.velocityX) < 600) return;
      const dir = e.translationX < 0 || e.velocityX < -400 ? 1 : -1;
      const next = Math.max(0, Math.min(state.routes.length - 1, state.index + dir));
      if (next !== state.index) {
        runOnJS(goToIndex)(next);
      }
    });

  const shellStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [
      { translateY: interpolate(visibility.value, [0, 1], [28, 0]) },
      { scale: interpolate(visibility.value, [0, 1], [0.96, 1]) },
    ],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorReady.value,
    width: indicatorW.value,
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <Animated.View
      pointerEvents={keyboardVisible ? 'none' : 'box-none'}
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, 10) },
        shellStyle,
      ]}
    >
      <GestureDetector gesture={swipe}>
        <View
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          collapsable={false}
        >
          <GlassPanel
            elevated
            padded={false}
            intensity={Math.min(colors.glassIntensity + 12, 88)}
            style={styles.bar}
            contentStyle={styles.inner}
          >
            {barWidth > 0 ? <FlowLayer width={barWidth} /> : null}

            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                { backgroundColor: colors.accentGlow },
                indicatorStyle,
              ]}
            />

            {state.routes.map((route, index) => {
              const focused = state.index === index;
              const meta = TAB_META[route.name] ?? {
                label: descriptors[route.key]?.options.title ?? route.name,
                icon: 'circle' as IconName,
              };
              const { options } = descriptors[route.key];
              const accessibilityLabel =
                options.tabBarAccessibilityLabel ?? meta.label;

              return (
                <TabItem
                  key={route.key}
                  icon={meta.icon}
                  focused={focused}
                  accessibilityLabel={accessibilityLabel}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    setLayouts((prev) => {
                      const cur = prev[index];
                      if (cur && cur.x === x && cur.width === width) return prev;
                      return { ...prev, [index]: { x, width } };
                    });
                  }}
                  onPress={() => goToIndex(index)}
                  onLongPress={() => {
                    navigation.emit({
                      type: 'tabLongPress',
                      target: route.key,
                    });
                  }}
                />
              );
            })}
          </GlassPanel>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  bar: {
    borderRadius: 28,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    left: 0,
    borderRadius: 16,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    minWidth: 48,
    zIndex: 1,
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowBlob: {
    position: 'absolute',
    borderRadius: 999,
  },
  flowA: {
    width: 90,
    height: 90,
    top: -28,
    left: 0,
  },
  flowB: {
    width: 70,
    height: 70,
    top: 18,
    left: 0,
  },
  flowC: {
    width: 56,
    height: 56,
    top: -8,
    left: 0,
  },
  shimmer: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    width: 56,
    borderRadius: 28,
  },
});
