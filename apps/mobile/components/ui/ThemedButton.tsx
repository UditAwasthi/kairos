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
import { TextAction } from './TextAction';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ThemedButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** `text` = accent red text-only action (no border / fill). */
  variant?: 'primary' | 'outline' | 'text';
  style?: ViewStyle;
};

export function ThemedButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
  style,
}: ThemedButtonProps) {
  const { colors, radius, typography } = useAppTheme();
  const press = useSharedValue(0);

  if (variant === 'text') {
    return <TextAction label={label} onPress={onPress} disabled={disabled} />;
  }

  const isPrimary = variant === 'primary';

  const restingBg = isPrimary ? colors.text : colors.buttonFill;
  const restingBorder = isPrimary ? colors.text : colors.border;
  const restingText = isPrimary ? colors.inverseText : colors.buttonText;

  const pressedBg = isPrimary
    ? colors.textSecondary
    : colors.buttonPressedFill;
  const pressedBorder = isPrimary
    ? colors.textSecondary
    : colors.buttonPressedFill;
  const pressedText = isPrimary
    ? colors.inverseText
    : colors.buttonPressedText;

  const currentBg = disabled ? colors.buttonDisabledFill : restingBg;
  const currentBorder = disabled ? colors.border : restingBorder;
  const currentText = disabled ? colors.buttonDisabledText : restingText;

  const targetBg = disabled ? colors.buttonDisabledFill : pressedBg;
  const targetBorder = disabled ? colors.border : pressedBorder;
  const targetText = disabled ? colors.buttonDisabledText : pressedText;

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.96]) }],
    backgroundColor: interpolateColor(press.value, [0, 1], [currentBg, targetBg]),
    borderColor: interpolateColor(press.value, [0, 1], [currentBorder, targetBorder]),
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(press.value, [0, 1], [currentText, targetText]),
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      onPressIn={() => {
        if (!disabled) {
          press.value = withSpring(1, { damping: 12, stiffness: 320 });
        }
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 12, stiffness: 280 });
      }}
      style={[
        styles.button,
        {
          borderRadius: radius.md,
          borderWidth: isPrimary ? 0 : 1,
          opacity: disabled ? 0.5 : 1,
        },
        buttonStyle,
        style,
      ]}
    >
      <Animated.Text
        style={[
          styles.label,
          {
            fontSize: typography.bodySmall.size,
            lineHeight: typography.bodySmall.lineHeight,
            letterSpacing: 1.5,
          },
          textStyle,
        ]}
      >
        {label.toUpperCase()}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
  },
});
