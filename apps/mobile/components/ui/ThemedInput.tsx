import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useAppTheme } from '../../providers/ThemeProvider';
import { themeColor } from '../../themeAnimation';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function ThemedInput(props: TextInputProps) {
  const { themeProgress, isLight } = useAppTheme();

  const inputStyle = useAnimatedStyle(() => ({
    color: themeColor(themeProgress.value, 'text'),
    borderColor: themeColor(themeProgress.value, 'borderActive'),
    backgroundColor: themeColor(themeProgress.value, 'background'),
  }));

  return (
    <AnimatedTextInput
      placeholderTextColor={
        isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)'
      }
      keyboardAppearance={isLight ? 'light' : 'dark'}
      {...props}
      style={[styles.input, inputStyle, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 27,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
});
