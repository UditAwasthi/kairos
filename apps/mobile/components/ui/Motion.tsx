import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const material = Easing.bezier(0.2, 0, 0, 1);

export const pageEntering = (delay = 0) =>
  FadeInDown.duration(280).easing(material).delay(delay);

export const fadeEntering = (delay = 0) => FadeIn.duration(220).delay(delay);

export const itemEntering = (index: number) =>
  FadeInDown.duration(220)
    .easing(material)
    .delay(Math.min(index, 8) * 40);

export const messageEntering = () => FadeInUp.duration(200).easing(material);

export const popEntering = (delay = 160) => ZoomIn.duration(220).easing(material).delay(delay);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressScaleProps = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'search';
};

export function PressScale({
  children,
  onPress,
  onLongPress,
  disabled,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
}: PressScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={() => {
        if (!disabled) {
          scale.value = withTiming(0.97, { duration: 90, easing: material });
        }
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 180, easing: material });
      }}
      style={[animatedStyle, style]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </AnimatedPressable>
  );
}
