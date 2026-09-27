import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardState } from 'react-native-keyboard-controller';

import { useAppTheme } from '../providers/ThemeProvider';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TAB_META: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Home', icon: 'home', iconActive: 'home' },
  recall: { label: 'Recall', icon: 'visibility', iconActive: 'visibility' },
  ask: { label: 'Ask', icon: 'chat-bubble-outline', iconActive: 'chat-bubble' },
  capture: { label: 'Capture', icon: 'add-circle-outline', iconActive: 'add-circle' },
  profile: { label: 'Profile', icon: 'person-outline', iconActive: 'person' },
};

/** Space screens should leave clear above the bar (excluding safe area). */
export const FLOATING_TAB_BAR_CONTENT = 80;

function TabItem({
  icon,
  iconActive,
  label,
  focused,
  accessibilityLabel,
  onPress,
  onLongPress,
}: {
  icon: IconName;
  iconActive: IconName;
  label: string;
  focused: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useAppTheme();
  const press = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.92]) }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 16, stiffness: 280 });
      }}
      accessibilityRole="button"
      accessibilityState={focused ? { selected: true } : {}}
      accessibilityLabel={accessibilityLabel}
      style={styles.item}
    >
      <Animated.View style={[styles.itemInner, pressStyle]}>
      <View
        style={[
          styles.indicator,
          { backgroundColor: focused ? colors.primaryContainer : 'transparent' },
        ]}
      >
        <MaterialIcons
          name={focused ? iconActive : icon}
          size={24}
          color={focused ? colors.primary : colors.textMuted}
        />
      </View>
      <Text
        style={[
          styles.label,
          { color: focused ? colors.primary : colors.textMuted },
        ]}
      >
        {label}
      </Text>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const keyboardVisible = useKeyboardState((s) => s.isVisible);
  const visibility = useSharedValue(1);

  useEffect(() => {
    visibility.value = withTiming(keyboardVisible ? 0 : 1, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
    });
  }, [keyboardVisible, visibility]);

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
    transform: [{ translateY: interpolate(visibility.value, [0, 1], [24, 0]) }],
  }));

  return (
    <Animated.View
      pointerEvents={keyboardVisible ? 'none' : 'auto'}
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        shellStyle,
      ]}
    >
      <GestureDetector gesture={swipe}>
        <View style={styles.inner}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const meta = TAB_META[route.name] ?? {
              label: descriptors[route.key]?.options.title ?? route.name,
              icon: 'lens' as IconName,
              iconActive: 'lens' as IconName,
            };
            const { options } = descriptors[route.key];
            const accessibilityLabel = options.tabBarAccessibilityLabel ?? meta.label;

            return (
              <TabItem
                key={route.key}
                icon={meta.icon}
                iconActive={meta.iconActive}
                label={meta.label}
                focused={focused}
                accessibilityLabel={accessibilityLabel}
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
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
    minHeight: 64,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  indicator: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
