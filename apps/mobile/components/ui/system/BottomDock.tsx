import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { control } from '../../../theme';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

export type DockItem = {
  key: string;
  label: string;
  icon: FeatherName;
  active: boolean;
  onPress: () => void;
  onLongPress?: () => void;
};

type BottomDockProps = {
  items: DockItem[];
};

/**
 * Embedded bottom dock. Selected icon and label use lavender; everything else stays grey.
 *
 * ```tsx
 * <BottomDock
 *   items={[{ key: 'today', label: 'Today', icon: 'sun', active: true, onPress: goToday }]}
 * />
 * ```
 */
export function BottomDock({ items }: BottomDockProps) {
  const { colors, radius, spacing, typography } = useAppTheme();

  return (
    <View
      style={[
        styles.dock,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          paddingTop: spacing['2'],
          paddingBottom: spacing['2'],
          minHeight: control.dock,
        },
      ]}
    >
      {items.map((item) => (
        <DockButton key={item.key} item={item} />
      ))}
    </View>
  );
}

function DockButton({ item }: { item: DockItem }) {
  const { colors, typography, motion } = useAppTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const color = item.active ? colors.primary : colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={item.active ? { selected: true } : {}}
      accessibilityLabel={item.label}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        item.onPress();
      }}
      onLongPress={item.onLongPress}
      onPressIn={() => {
        scale.value = withTiming(motion.pressScale, {
          duration: reduced ? 0 : motion.fast,
          easing: Easing.out(Easing.cubic),
        });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, {
          duration: reduced ? 0 : motion.normal,
          easing: Easing.out(Easing.cubic),
        });
      }}
      style={styles.item}
    >
      <Animated.View style={[styles.itemInner, style]}>
        <Feather name={item.icon} size={20} color={color} />
        <Text
          style={{
            color,
            fontFamily: typography.overline.fontFamily,
            fontSize: typography.overline.size,
            lineHeight: typography.overline.lineHeight,
            letterSpacing: 0,
          }}
        >
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  item: {
    flex: 1,
    minHeight: control.touch,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
