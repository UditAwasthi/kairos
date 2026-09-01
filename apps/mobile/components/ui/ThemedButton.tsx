import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useAppTheme } from '../../providers/ThemeProvider';
import { themeColor } from '../../themeAnimation';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ThemedButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
};

export function ThemedButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: ThemedButtonProps) {
  const { themeProgress } = useAppTheme();
  const press = useSharedValue(0);
  const isOutline = variant === 'outline';

  const buttonStyle = useAnimatedStyle(() => {
    const t = themeProgress.value;

    return {
      transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.97]) }],
      backgroundColor: interpolateColor(
        press.value,
        [0, 1],
        [
          themeColor(t, isOutline ? 'buttonFill' : 'buttonFill'),
          themeColor(t, 'buttonPressedFill'),
        ],
      ),
      borderColor: interpolateColor(
        press.value,
        [0, 1],
        [themeColor(t, 'borderActive'), themeColor(t, 'buttonPressedFill')],
      ),
      opacity: disabled ? 0.6 : 1,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const t = themeProgress.value;

    return {
      color: interpolateColor(
        press.value,
        [0, 1],
        [themeColor(t, 'buttonText'), themeColor(t, 'buttonPressedText')],
      ),
    };
  });

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 14, stiffness: 280 });
      }}
      style={[styles.button, buttonStyle, style]}
    >
      <Animated.Text style={[styles.label, textStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    letterSpacing: 1.2,
  },
});
