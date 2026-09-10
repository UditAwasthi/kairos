import { interpolateColor } from 'react-native-reanimated';

import { darkTheme, lightTheme, ThemeColorKey } from './theme';

/** 0 = dark, 1 = light */
export type ThemeProgress = number;

/** Keep short — only root/onboarding animate; app chrome uses static colors. */
export const THEME_TRANSITION_DURATION_MS = 320;

const pairs: Record<ThemeColorKey, [string, string]> = {
  background: [darkTheme.background, lightTheme.background],
  surface: [darkTheme.surface, lightTheme.surface],
  surfaceElevated: [darkTheme.surfaceElevated, lightTheme.surfaceElevated],
  surfaceGlass: [darkTheme.surfaceGlass, lightTheme.surfaceGlass],
  glassFill: [darkTheme.glassFill, lightTheme.glassFill],
  glassBorder: [darkTheme.glassBorder, lightTheme.glassBorder],
  glassHighlight: [darkTheme.glassHighlight, lightTheme.glassHighlight],
  text: [darkTheme.text, lightTheme.text],
  textSecondary: [darkTheme.textSecondary, lightTheme.textSecondary],
  textMuted: [darkTheme.textMuted, lightTheme.textMuted],
  textDisabled: [darkTheme.textDisabled, lightTheme.textDisabled],
  accent: [darkTheme.accent, lightTheme.accent],
  accentGlow: [darkTheme.accentGlow, lightTheme.accentGlow],
  accentTeal: [darkTheme.accentTeal, lightTheme.accentTeal],
  accentGreen: [darkTheme.accentGreen, lightTheme.accentGreen],
  accentPurple: [darkTheme.accentPurple, lightTheme.accentPurple],
  accentOrange: [darkTheme.accentOrange, lightTheme.accentOrange],
  accentYellow: [darkTheme.accentYellow, lightTheme.accentYellow],
  accentCoral: [darkTheme.accentCoral, lightTheme.accentCoral],
  tintFrost: [darkTheme.tintFrost, lightTheme.tintFrost],
  tintTeal: [darkTheme.tintTeal, lightTheme.tintTeal],
  tintGreen: [darkTheme.tintGreen, lightTheme.tintGreen],
  tintPurple: [darkTheme.tintPurple, lightTheme.tintPurple],
  tintOrange: [darkTheme.tintOrange, lightTheme.tintOrange],
  tintYellow: [darkTheme.tintYellow, lightTheme.tintYellow],
  tintCoral: [darkTheme.tintCoral, lightTheme.tintCoral],
  border: [darkTheme.border, lightTheme.border],
  borderActive: [darkTheme.borderActive, lightTheme.borderActive],
  borderAccent: [darkTheme.borderAccent, lightTheme.borderAccent],
  buttonFill: [darkTheme.buttonFill, lightTheme.buttonFill],
  buttonText: [darkTheme.buttonText, lightTheme.buttonText],
  buttonPressedFill: [darkTheme.buttonPressedFill, lightTheme.buttonPressedFill],
  buttonPressedText: [darkTheme.buttonPressedText, lightTheme.buttonPressedText],
  buttonDisabledFill: [darkTheme.buttonDisabledFill, lightTheme.buttonDisabledFill],
  buttonDisabledText: [darkTheme.buttonDisabledText, lightTheme.buttonDisabledText],
  inputFill: [darkTheme.inputFill, lightTheme.inputFill],
  inputBorder: [darkTheme.inputBorder, lightTheme.inputBorder],
  inputBorderFocused: [darkTheme.inputBorderFocused, lightTheme.inputBorderFocused],
  inputPlaceholder: [darkTheme.inputPlaceholder, lightTheme.inputPlaceholder],
  dot: [darkTheme.dot, lightTheme.dot],
  dotInactive: [darkTheme.dotInactive, lightTheme.dotInactive],
  divider: [darkTheme.divider, lightTheme.divider],
  overlay: [darkTheme.overlay, lightTheme.overlay],
  success: [darkTheme.success, lightTheme.success],
  warning: [darkTheme.warning, lightTheme.warning],
  error: [darkTheme.error, lightTheme.error],
  errorSurface: [darkTheme.errorSurface, lightTheme.errorSurface],
  scrim: [darkTheme.scrim, lightTheme.scrim],
  inverseText: [darkTheme.inverseText, lightTheme.inverseText],
};

/** For onboarding / toggle transitions only — do not use on list rows. */
export function themeColor(progress: ThemeProgress, key: ThemeColorKey): string {
  'worklet';
  const [dark, light] = pairs[key];
  return interpolateColor(progress, [0, 1], [dark, light]);
}
