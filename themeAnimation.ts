import { interpolateColor } from 'react-native-reanimated';

import { AppTheme, darkTheme, lightTheme } from './theme';

/** 0 = dark, 1 = light */
export type ThemeProgress = number;

export const THEME_TRANSITION_DURATION_MS = 1000;

const pairs: Record<keyof AppTheme, [string, string]> = {
  background: [darkTheme.background, lightTheme.background],
  text: [darkTheme.text, lightTheme.text],
  textSecondary: [darkTheme.textSecondary, lightTheme.textSecondary],
  textMuted: [darkTheme.textMuted, lightTheme.textMuted],
  border: [darkTheme.border, lightTheme.border],
  borderActive: [darkTheme.borderActive, lightTheme.borderActive],
  buttonFill: [darkTheme.buttonFill, lightTheme.buttonFill],
  buttonText: [darkTheme.buttonText, lightTheme.buttonText],
  buttonPressedFill: [darkTheme.buttonPressedFill, lightTheme.buttonPressedFill],
  buttonPressedText: [darkTheme.buttonPressedText, lightTheme.buttonPressedText],
  dot: [darkTheme.dot, lightTheme.dot],
  dotInactive: [darkTheme.dotInactive, lightTheme.dotInactive],
  divider: [darkTheme.divider, lightTheme.divider],
};

export function themeColor(progress: ThemeProgress, key: keyof AppTheme): string {
  'worklet';
  const [dark, light] = pairs[key];
  return interpolateColor(progress, [0, 1], [dark, light]);
}
