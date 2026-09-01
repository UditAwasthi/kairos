import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { themeColor } from '../themeAnimation';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ThemeToggleButtonProps = {
  themeProgress: SharedValue<number>;
  onToggle: () => void;
};

export function ThemeToggleButton({
  themeProgress,
  onToggle,
}: ThemeToggleButtonProps) {
  const press = useSharedValue(0);

  const buttonStyle = useAnimatedStyle(() => {
    const t = themeProgress.value;

    return {
      transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.92]) }],
      borderColor: themeColor(t, 'borderActive'),
      backgroundColor: press.value > 0.5
        ? themeColor(t, 'buttonPressedFill')
        : themeColor(t, 'buttonFill'),
    };
  });

  const iconStyle = useAnimatedStyle(() => ({
    color: press.value > 0.5
      ? themeColor(themeProgress.value, 'buttonPressedText')
      : themeColor(themeProgress.value, 'text'),
  }));

  const handlePressIn = () => {
    press.value = withSpring(1, { damping: 14, stiffness: 280 });
  };

  const handlePressOut = () => {
    press.value = withSpring(0, { damping: 14, stiffness: 280 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, buttonStyle]}
      accessibilityLabel="Toggle theme"
      accessibilityRole="button"
    >
      <Animated.Text style={[styles.icon, iconStyle]}>◐</Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 16,
    lineHeight: 18,
  },
});
