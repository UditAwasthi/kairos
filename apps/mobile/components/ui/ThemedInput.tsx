import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useState } from 'react';

import { useAppTheme } from '../../providers/ThemeProvider';

export function ThemedInput(props: TextInputProps) {
  const { colors, radius, typography, spacing, isLight } = useAppTheme();
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      placeholderTextColor={colors.inputPlaceholder}
      keyboardAppearance={isLight ? 'light' : 'dark'}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        styles.input,
        {
          color: colors.text,
          borderColor: focused ? colors.inputBorderFocused : colors.inputBorder,
          backgroundColor: colors.inputFill,
          borderRadius: radius.md,
          paddingHorizontal: spacing['4'],
          paddingVertical: spacing['3'] + 2,
          fontSize: typography.bodySmall.size,
          lineHeight: typography.bodySmall.lineHeight,
        },
        props.style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    fontFamily: 'Inter_400Regular',
  },
});