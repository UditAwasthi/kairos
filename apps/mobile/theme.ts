import { ColorSchemeName, ImageSourcePropType } from 'react-native';

/**
 * Kairos design system — dark OLED foundation, charcoal cards,
 * one restrained lavender accent. All color, radius, space, and type live here.
 */

export const lavender = {
  50: '#F4F1FE',
  100: '#E6E0FC',
  200: '#D2C8F8',
  300: '#BDB0F6',
  400: '#A594F9',
  500: '#A594F9',
  600: '#8E7CE0',
  700: '#6E5CC4',
  800: '#4A3D86',
  900: '#2A1F4D',
  950: '#1A1428',
} as const;

export const plum = lavender;

export const mist = {
  50: '#FAF9FF',
  100: '#F4F2FA',
  200: '#EAE6F5',
  300: '#DDD8EC',
  400: '#B8B2D1',
  500: '#9D96B0',
  600: '#7C758F',
  700: '#6B6480',
  800: '#3D3650',
  900: '#262038',
  950: '#181226',
} as const;

/** Retained for backwards compatibility */
export const ink = mist;
export const signal = lavender;

export const nord = {
  polarNight: {
    0: '#181226',
    1: '#262038',
    2: '#3D3650',
    3: '#4E4666',
  },
  snowStorm: {
    0: '#DDD8EC',
    1: '#EDE9FE',
    2: '#FAF9FF',
  },
  frost: {
    0: '#A594F9',
    1: '#8E7CE0',
    2: '#C4B6F5',
    3: '#2A1F4D',
  },
  aurora: {
    red: '#E09A9A',
    orange: '#E6B25C',
    yellow: '#E6B25C',
    green: '#6CCBB8',
    purple: '#A594F9',
  },
} as const;

export type FontWeight = '400' | '500' | '600' | '700';

export type TypographyScale = {
  hero: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  display: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  title1: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  title2: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  title3: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  body: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  bodySmall: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  caption: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  overline: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  button: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  stat: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
};

export const typography: TypographyScale = {
  hero: { size: 32, lineHeight: 38, weight: '600', letterSpacing: -0.6, fontFamily: 'Inter_600SemiBold' },
  display: { size: 30, lineHeight: 36, weight: '600', letterSpacing: -0.5, fontFamily: 'Inter_600SemiBold' },
  title1: { size: 22, lineHeight: 28, weight: '600', letterSpacing: -0.3, fontFamily: 'Inter_600SemiBold' },
  title2: { size: 20, lineHeight: 26, weight: '600', letterSpacing: -0.2, fontFamily: 'Inter_600SemiBold' },
  title3: { size: 16, lineHeight: 22, weight: '600', letterSpacing: -0.15, fontFamily: 'Inter_600SemiBold' },
  body: { size: 15, lineHeight: 22, weight: '400', letterSpacing: -0.15, fontFamily: 'Inter_400Regular' },
  bodySmall: { size: 13, lineHeight: 18, weight: '400', letterSpacing: -0.1, fontFamily: 'Inter_400Regular' },
  caption: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0, fontFamily: 'Inter_500Medium' },
  overline: { size: 10, lineHeight: 14, weight: '500', letterSpacing: 0.6, fontFamily: 'Inter_500Medium' },
  button: { size: 15, lineHeight: 20, weight: '600', letterSpacing: -0.1, fontFamily: 'Inter_600SemiBold' },
  stat: { size: 26, lineHeight: 32, weight: '600', letterSpacing: -0.5, fontFamily: 'Inter_600SemiBold' },
};

export const spacing = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
  '16': 64,
  '20': 80,
  '24': 96,
} as const;

export type SpacingToken = keyof typeof spacing;

/** Ease-out motion. No spring overshoot. Durations in ms. */
export const motion = {
  instant: 80,
  fast: 140,
  normal: 280,
  smooth: 320,
  expressive: 340,
  page: 300,
  stagger: 50,
  pressScale: 0.97,
  subtleScale: 0.98,
} as const;

export type MotionToken = keyof typeof motion;

/** control 10 · icon 12 · small card 16 · major card 22 · pill 999 */
export const radius = {
  none: 0,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 22,
  '2xl': 24,
  full: 999,
} as const;

/** Touch targets meet 44. Icon buttons sit at 40 inside that hit area. */
export const control = {
  touch: 44,
  icon: 40,
  circular: 44,
  buttonSm: 44,
  buttonMd: 48,
  buttonLg: 52,
  dock: 64,
  insight: 56,
} as const;

export const mascotSize = {
  sm: 28,
  md: 48,
  lg: 72,
} as const;

export type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/** Depth comes from surface shade. Shadows stay short and neutral. */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 5,
  },
  glow: {
    shadowColor: '#9678FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 2,
  },
} as const;

export type ThemeGradients = {
  background: readonly [string, string, string];
  surface: readonly [string, string];
  accent: readonly [string, string];
  accentSoft: readonly [string, string];
  glass: readonly [string, string];
  composer: readonly [string, string];
  vitality: readonly [string, string];
};

export type AppTheme = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;

  /** Glass & panel tokens */
  glassFill: string;
  glassBorder: string;
  glassHighlight: string;
  glassIntensity: number;

  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;

  primary: string;
  primaryPressed: string;
  primarySoft: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;

  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;

  tertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;

  accent: string;
  accentGlow: string;
  accentRose: string;
  accentLavender: string;
  accentPeach: string;
  accentMorningBlue: string;
  accentLilac: string;

  accentTeal: string;
  accentGreen: string;
  accentPurple: string;
  accentOrange: string;
  accentYellow: string;
  accentCoral: string;
  accentCream: string;

  tintFrost: string;
  tintTeal: string;
  tintGreen: string;
  tintPurple: string;
  tintOrange: string;
  tintYellow: string;
  tintCoral: string;

  border: string;
  borderSubtle: string;
  borderActive: string;
  borderAccent: string;

  successSurface: string;

  buttonFill: string;
  buttonText: string;
  buttonPressedFill: string;
  buttonPressedText: string;
  buttonDisabledFill: string;
  buttonDisabledText: string;
  buttonBottom: string;
  buttonSecondaryFill: string;
  buttonSecondaryText: string;
  buttonSecondaryBottom: string;

  inputFill: string;
  inputBorder: string;
  inputBorderFocused: string;
  inputPlaceholder: string;

  dot: string;
  dotInactive: string;
  divider: string;
  overlay: string;

  success: string;
  warning: string;
  error: string;
  errorSurface: string;

  shadow: ShadowToken;
  shadowElevated: ShadowToken;

  scrim: string;
  inverseText: string;
};

export const lightGradients: ThemeGradients = {
  background: ['#F3F4F2', '#F7F8F6', '#EEEFEA'],
  surface: ['#FFFFFF', '#FFFFFF'],
  accent: ['#A594F9', '#A594F9'],
  accentSoft: ['#E8E3FA', '#F4F1FE'],
  glass: ['#FFFFFF', '#F7F8F6'],
  composer: ['#FFFFFF', '#F7F8F6'],
  vitality: ['#E8E3FA', '#F3F4F2'],
};

export const darkGradients: ThemeGradients = {
  background: ['#0C0E0D', '#101211', '#0C0E0D'],
  surface: ['#171A18', '#1C1F1D'],
  accent: ['#A594F9', '#A594F9'],
  accentSoft: ['#2A1F4D', '#1C1F1D'],
  glass: ['#1C1F1D', '#171A18'],
  composer: ['#171A18', '#171A18'],
  vitality: ['#2A1F4D', '#0C0E0D'],
};

export const lightTheme: AppTheme = {
  background: '#F3F4F2',
  surface: '#FFFFFF',
  surfaceElevated: '#F7F8F6',
  surfaceGlass: 'rgba(255,255,255,0.94)',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F7F8F6',
  surfaceContainer: '#EEEFEA',
  surfaceContainerHigh: '#E4E6E1',

  glassFill: '#FFFFFF',
  glassBorder: 'rgba(20,22,21,0.08)',
  glassHighlight: 'rgba(255,255,255,0.9)',
  glassIntensity: 8,

  text: '#141615',
  textSecondary: '#4E534E',
  textMuted: '#6B716B',
  textDisabled: '#A3A8A3',

  primary: '#A594F9',
  primaryPressed: '#8E7CE0',
  primarySoft: '#E8E3FA',
  primaryContainer: '#E8E3FA',
  onPrimary: '#1A1428',
  onPrimaryContainer: '#2A1F4D',

  secondary: '#5C615C',
  secondaryContainer: '#EEEFEA',
  onSecondary: '#141615',
  onSecondaryContainer: '#141615',

  tertiary: '#8FA4F0',
  tertiaryContainer: '#E7EBF8',
  onTertiaryContainer: '#1A1428',

  accent: '#A594F9',
  accentGlow: 'rgba(150, 120, 255, 0.16)',
  accentRose: '#D98989',
  accentLavender: '#A594F9',
  accentPeach: '#E6B25C',
  accentMorningBlue: '#8FA4F0',
  accentLilac: '#C4B6F5',

  accentTeal: '#6CCBB8',
  accentGreen: '#6CCBB8',
  accentPurple: '#A594F9',
  accentOrange: '#E6B25C',
  accentYellow: '#E6B25C',
  accentCoral: '#D98989',
  accentCream: '#F7F1E8',

  tintFrost: 'rgba(165, 148, 249, 0.14)',
  tintTeal: 'rgba(108, 203, 184, 0.16)',
  tintGreen: 'rgba(108, 203, 184, 0.14)',
  tintPurple: 'rgba(165, 148, 249, 0.12)',
  tintOrange: 'rgba(230, 178, 92, 0.16)',
  tintYellow: 'rgba(230, 178, 92, 0.16)',
  tintCoral: 'rgba(217, 137, 137, 0.14)',

  border: 'rgba(20,22,21,0.08)',
  borderSubtle: 'rgba(20,22,21,0.05)',
  borderActive: '#A594F9',
  borderAccent: 'rgba(165,148,249,0.45)',

  successSurface: '#E7F6F2',

  buttonFill: '#A594F9',
  buttonText: '#1A1428',
  buttonPressedFill: '#8E7CE0',
  buttonPressedText: '#1A1428',
  buttonDisabledFill: '#E4E6E1',
  buttonDisabledText: '#8A8F8A',
  buttonBottom: '#A594F9',
  buttonSecondaryFill: '#EEEFEA',
  buttonSecondaryText: '#141615',
  buttonSecondaryBottom: '#E4E6E1',

  inputFill: '#F7F8F6',
  inputBorder: 'rgba(20,22,21,0.08)',
  inputBorderFocused: '#A594F9',
  inputPlaceholder: '#8A8F8A',

  dot: '#A594F9',
  dotInactive: '#D5D8D3',
  divider: 'rgba(20,22,21,0.06)',
  overlay: 'rgba(20,22,21,0.04)',

  success: '#2F7A6A',
  warning: '#9A7430',
  error: '#B55252',
  errorSurface: '#F8EEEE',

  shadow: shadows.sm,
  shadowElevated: shadows.md,

  scrim: 'rgba(12, 14, 13, 0.45)',
  inverseText: '#F5F6F4',
};

export const darkTheme: AppTheme = {
  background: '#0C0E0D',
  surface: '#171A18',
  surfaceElevated: '#202320',
  surfaceGlass: 'rgba(23, 26, 24, 0.94)',
  surfaceContainerLowest: '#0C0E0D',
  surfaceContainerLow: '#101211',
  surfaceContainer: '#1C1F1D',
  surfaceContainerHigh: '#252825',

  glassFill: '#1C1F1D',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'rgba(255,255,255,0.025)',
  glassIntensity: 8,

  text: '#F5F6F4',
  textSecondary: '#A0A49F',
  textMuted: '#6F746F',
  textDisabled: '#4E534E',

  primary: '#A594F9',
  primaryPressed: '#8E7CE0',
  primarySoft: '#2A1F4D',
  primaryContainer: '#2A1F4D',
  onPrimary: '#1A1428',
  onPrimaryContainer: '#E6E0FC',

  secondary: '#A0A49F',
  secondaryContainer: '#1C1F1D',
  onSecondary: '#0C0E0D',
  onSecondaryContainer: '#F5F6F4',

  tertiary: '#8FA4F0',
  tertiaryContainer: '#1A1E28',
  onTertiaryContainer: '#F5F6F4',

  accent: '#A594F9',
  accentGlow: 'rgba(150, 120, 255, 0.16)',
  accentRose: '#E09A9A',
  accentLavender: '#A594F9',
  accentPeach: '#E6B25C',
  accentMorningBlue: '#8FA4F0',
  accentLilac: '#C4B6F5',

  accentTeal: '#6CCBB8',
  accentGreen: '#6CCBB8',
  accentPurple: '#A594F9',
  accentOrange: '#E6B25C',
  accentYellow: '#E6B25C',
  accentCoral: '#E09A9A',
  accentCream: '#F3EDE4',

  tintFrost: 'rgba(150, 120, 255, 0.16)',
  tintTeal: 'rgba(108, 203, 184, 0.14)',
  tintGreen: 'rgba(108, 203, 184, 0.12)',
  tintPurple: 'rgba(165, 148, 249, 0.14)',
  tintOrange: 'rgba(230, 178, 92, 0.14)',
  tintYellow: 'rgba(230, 178, 92, 0.14)',
  tintCoral: 'rgba(224, 154, 154, 0.14)',

  border: 'rgba(255,255,255,0.06)',
  borderSubtle: 'rgba(255,255,255,0.05)',
  borderActive: '#A594F9',
  borderAccent: 'rgba(165,148,249,0.35)',

  successSurface: '#142420',

  buttonFill: '#A594F9',
  buttonText: '#1A1428',
  buttonPressedFill: '#8E7CE0',
  buttonPressedText: '#1A1428',
  buttonDisabledFill: '#1C1F1D',
  buttonDisabledText: '#6F746F',
  buttonBottom: '#A594F9',
  buttonSecondaryFill: '#202320',
  buttonSecondaryText: '#F5F6F4',
  buttonSecondaryBottom: '#171A18',

  inputFill: '#141716',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputBorderFocused: '#A594F9',
  inputPlaceholder: '#6F746F',

  dot: '#A594F9',
  dotInactive: '#2A2E2C',
  divider: 'rgba(255,255,255,0.06)',
  overlay: 'rgba(255,255,255,0.04)',

  success: '#6CCBB8',
  warning: '#E6B25C',
  error: '#E09A9A',
  errorSurface: '#2A1C1C',

  shadow: shadows.md,
  shadowElevated: shadows.md,

  scrim: 'rgba(0, 0, 0, 0.62)',
  inverseText: '#141615',
};

export function getThemeGradients(isLight: boolean): ThemeGradients {
  return isLight ? lightGradients : darkGradients;
}

export type AuroraTone = 'frost' | 'teal' | 'green' | 'purple' | 'orange' | 'yellow' | 'coral';

export function auroraToneColors(theme: AppTheme, tone: AuroraTone) {
  switch (tone) {
    case 'teal':
      return { accent: theme.accentTeal, tint: theme.tintTeal };
    case 'frost':
      return { accent: theme.accent, tint: theme.tintFrost };
    case 'green':
      return { accent: theme.accentGreen, tint: theme.tintGreen };
    case 'purple':
      return { accent: theme.accentPurple, tint: theme.tintPurple };
    case 'orange':
      return { accent: theme.accentOrange, tint: theme.tintOrange };
    case 'yellow':
      return { accent: theme.accentYellow, tint: theme.tintYellow };
    case 'coral':
      return { accent: theme.accentCoral, tint: theme.tintCoral };
    default:
      return { accent: theme.accent, tint: theme.tintFrost };
  }
}

export const AURORA_TONES: AuroraTone[] = [
  'purple',
  'frost',
  'teal',
  'green',
  'orange',
  'yellow',
  'coral',
];

const logos = {
  light: require('./assets/logo-dark.png') as ImageSourcePropType,
  dark: require('./assets/logo-light.png') as ImageSourcePropType,
};

export function getDeviceTheme(scheme: ColorSchemeName): AppTheme {
  return scheme === 'dark' ? darkTheme : lightTheme;
}

export function getLogoForScheme(scheme: ColorSchemeName): ImageSourcePropType {
  return scheme === 'dark' ? logos.dark : logos.light;
}

export function isDarkScheme(scheme: ColorSchemeName): boolean {
  return scheme === 'dark';
}

export function getGlassSurface(scheme: ColorSchemeName) {
  const isDark = scheme === 'dark';
  const theme = isDark ? darkTheme : lightTheme;
  return {
    backgroundColor: theme.surfaceElevated,
    borderColor: theme.border,
    borderWidth: 1,
  };
}

export function shouldUseAccent(isInterrupt: boolean): string | undefined {
  return isInterrupt ? lavender[400] : undefined;
}

export function getTextColor(
  theme: AppTheme,
  level: 'primary' | 'secondary' | 'muted' | 'disabled',
): string {
  switch (level) {
    case 'primary':
      return theme.text;
    case 'secondary':
      return theme.textSecondary;
    case 'muted':
      return theme.textMuted;
    case 'disabled':
      return theme.textDisabled;
  }
}

export const nothing = {
  red: lavender[500],
} as const;

export const nordPalette = {
  frost: {
    0: nord.frost[0],
    1: nord.frost[1],
    2: nord.frost[2],
    3: nord.frost[3],
  },
  aurora: {
    red: nord.aurora.red,
    orange: nord.aurora.orange,
    yellow: nord.aurora.yellow,
    green: nord.aurora.green,
    purple: nord.aurora.purple,
  },
  polarNight: {
    0: nord.polarNight[0],
    1: nord.polarNight[1],
    2: nord.polarNight[2],
    3: nord.polarNight[3],
  },
} as const;

export const tokyoPalette = {
  accent: {
    blue: lavender[500],
    cyan: lavender[400],
    magenta: '#A142F4',
    green: '#6CCBB8',
    orange: '#F97316',
    red: '#EF4444',
    yellow: '#F59E0B',
    teal: '#14B8A6',
  },
} as const;

export const kairosPalette = { ink: mist, signal: lavender } as const;

export type ThemeColorKey = {
  [K in keyof AppTheme]: AppTheme[K] extends string ? K : never;
}[keyof AppTheme];
