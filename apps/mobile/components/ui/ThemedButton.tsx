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
  /** `text` = accent text-only action (no border / fill). */
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

  const restingBg = isPrimary ? colors.buttonFill : colors.surface;
  const restingBorder = isPrimary ? colors.buttonFill : colors.border;
  const restingText = isPrimary ? colors.buttonText : colors.text;

  const pressedBg = isPrimary ? colors.buttonPressedFill : colors.accentGlow;
  const pressedBorder = isPrimary ? colors.buttonPressedFill : colors.borderAccent;
  const pressedText = isPrimary ? colors.buttonPressedText : colors.text;

  const currentBg = disabled ? colors.buttonDisabledFill : restingBg;
  const currentBorder = disabled ? colors.border : restingBorder;
  const currentText = disabled ? colors.buttonDisabledText : restingText;

  const targetBg = disabled ? colors.buttonDisabledFill : pressedBg;
  const targetBorder = disabled ? colors.border : pressedBorder;
  const targetText = disabled ? colors.buttonDisabledText : pressedText;

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(press.value, [0, 1], [1, 0.97]) }],
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
          press.value = withSpring(1, { damping: 20, stiffness: 220 });
        }
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 20, stiffness: 200 });
      }}
      style={[
        styles.button,
        {
          borderRadius: radius.full,
          borderWidth: isPrimary ? 0 : 1,
          opacity: disabled ? 0.5 : 1,
          ...(!isPrimary && !disabled ? colors.shadow : null),
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
            letterSpacing: 0.2,
          },
          textStyle,
        ]}
      >
        {label}
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingHorizontal: 18,
  },
  label: {
    fontFamily: 'Inter_600SemiBold',
  },
});
