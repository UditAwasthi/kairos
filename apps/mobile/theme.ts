import { ColorSchemeName, ImageSourcePropType } from 'react-native';

/**
 * Kairos — monochrome iOS.
 * System grouped backgrounds, label grays, no tint.
 * https://developer.apple.com/design/human-interface-guidelines/color
 */

export const nord = {
  polarNight: {
    0: '#2E3440',
    1: '#3B4252',
    2: '#434C5E',
    3: '#4C566A',
  },
  snowStorm: {
    0: '#D8DEE9',
    1: '#E5E9F0',
    2: '#ECEFF4',
  },
  frost: {
    0: '#8FBCBB',
    1: '#88C0D0',
    2: '#81A1C1',
    3: '#5E81AC',
  },
  aurora: {
    red: '#BF616A',
    orange: '#D08770',
    yellow: '#EBCB8B',
    green: '#A3BE8C',
    purple: '#B48EAD',
  },
} as const;

export const plum = {
  50: '#F8F9FA',
  100: '#E8F0FE',
  200: '#D2E3FC',
  300: '#AECBFA',
  400: '#8AB4F8',
  500: '#1A73E8',
  600: '#1967D2',
  700: '#174EA6',
  800: '#0B57D0',
  900: '#062E6F',
  950: '#041E49',
} as const;

export const mist = {
  50: '#F8F9FA',
  100: '#F1F3F4',
  200: '#E8EAED',
  300: '#DADCE0',
  400: '#BDC1C6',
  500: '#9AA0A6',
  600: '#80868B',
  700: '#5F6368',
  800: '#3C4043',
  900: '#202124',
  950: '#171717',
} as const;

/** Retained for backwards compatibility where ink / signal were imported */
export const ink = mist;
export const signal = plum;

export type FontWeight = '400' | '500' | '600' | '700';

export type TypographyScale = {
  display: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  title1: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  title2: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  title3: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  body: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  bodySmall: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  caption: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
  overline: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number; fontFamily: string };
};

export const typography: TypographyScale = {
  display: { size: 34, lineHeight: 41, weight: '700', letterSpacing: 0.4, fontFamily: 'Inter_600SemiBold' },
  title1: { size: 28, lineHeight: 34, weight: '700', letterSpacing: 0.36, fontFamily: 'Inter_600SemiBold' },
  title2: { size: 22, lineHeight: 28, weight: '700', letterSpacing: 0.35, fontFamily: 'Inter_600SemiBold' },
  title3: { size: 20, lineHeight: 25, weight: '600', letterSpacing: 0.38, fontFamily: 'Inter_600SemiBold' },
  body: { size: 17, lineHeight: 22, weight: '400', letterSpacing: -0.41, fontFamily: 'Inter_400Regular' },
  bodySmall: { size: 15, lineHeight: 20, weight: '400', letterSpacing: -0.24, fontFamily: 'Inter_400Regular' },
  caption: { size: 13, lineHeight: 18, weight: '400', letterSpacing: -0.08, fontFamily: 'Inter_400Regular' },
  overline: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0, fontFamily: 'Inter_500Medium' },
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

/** iOS-adjacent motion — short, standard easing. */
export const motion = {
  instant: 100,
  fast: 150,
  normal: 200,
  smooth: 300,
  expressive: 400,
  page: 300,
  pressScale: 0.98,
  subtleScale: 0.99,
} as const;

export type MotionToken = keyof typeof motion;

export const radius = {
  none: 0,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  full: 9999,
} as const;

export type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
  },
  glow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
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

  /** Glassmorphism tokens */
  glassFill: string;
  glassBorder: string;
  glassHighlight: string;
  glassIntensity: number;

  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;

  primary: string;
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

  tintFrost: string;
  tintTeal: string;
  tintGreen: string;
  tintPurple: string;
  tintOrange: string;
  tintYellow: string;
  tintCoral: string;

  border: string;
  borderActive: string;
  borderAccent: string;

  buttonFill: string;
  buttonText: string;
  buttonPressedFill: string;
  buttonPressedText: string;
  buttonDisabledFill: string;
  buttonDisabledText: string;

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
  background: ['#F2F2F7', '#F2F2F7', '#F2F2F7'],
  surface: ['#FFFFFF', '#FFFFFF'],
  accent: ['#000000', '#000000'],
  accentSoft: ['#E5E5EA', '#E5E5EA'],
  glass: ['#FFFFFF', '#FFFFFF'],
  composer: ['#FFFFFF', '#FFFFFF'],
  vitality: ['#E5E5EA', '#F2F2F7'],
};

export const darkGradients: ThemeGradients = {
  background: ['#000000', '#000000', '#000000'],
  surface: ['#1C1C1E', '#1C1C1E'],
  accent: ['#FFFFFF', '#FFFFFF'],
  accentSoft: ['#2C2C2E', '#2C2C2E'],
  glass: ['#1C1C1E', '#1C1C1E'],
  composer: ['#1C1C1E', '#1C1C1E'],
  vitality: ['#2C2C2E', '#000000'],
};

export const lightTheme: AppTheme = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2F2F7',
  surfaceContainer: '#E5E5EA',
  surfaceContainerHigh: '#D1D1D6',

  glassFill: '#FFFFFF',
  glassBorder: 'rgba(60,60,67,0.18)',
  glassHighlight: 'transparent',
  glassIntensity: 0,

  text: '#000000',
  textSecondary: 'rgba(60,60,67,0.60)',
  textMuted: 'rgba(60,60,67,0.30)',
  textDisabled: 'rgba(60,60,67,0.18)',

  primary: '#000000',
  primaryContainer: '#E5E5EA',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#000000',

  secondary: '#8E8E93',
  secondaryContainer: '#E5E5EA',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#000000',

  tertiary: '#636366',
  tertiaryContainer: '#F2F2F7',
  onTertiaryContainer: '#000000',

  accent: '#000000',
  accentGlow: 'rgba(0,0,0,0.06)',
  accentRose: '#3A3A3C',
  accentLavender: '#E5E5EA',
  accentPeach: '#F2F2F7',
  accentMorningBlue: '#E5E5EA',
  accentLilac: '#F2F2F7',

  accentTeal: '#636366',
  accentGreen: '#48484A',
  accentPurple: '#3A3A3C',
  accentOrange: '#636366',
  accentYellow: '#8E8E93',
  accentCoral: '#3A3A3C',

  tintFrost: 'rgba(120,120,128,0.12)',
  tintTeal: 'rgba(120,120,128,0.12)',
  tintGreen: 'rgba(120,120,128,0.16)',
  tintPurple: 'rgba(60,60,67,0.10)',
  tintOrange: 'rgba(120,120,128,0.14)',
  tintYellow: 'rgba(120,120,128,0.18)',
  tintCoral: 'rgba(60,60,67,0.12)',

  border: 'rgba(60,60,67,0.29)',
  borderActive: '#000000',
  borderAccent: '#8E8E93',

  buttonFill: '#000000',
  buttonText: '#FFFFFF',
  buttonPressedFill: '#3A3A3C',
  buttonPressedText: '#FFFFFF',
  buttonDisabledFill: '#E5E5EA',
  buttonDisabledText: '#C7C7CC',

  inputFill: '#E5E5EA',
  inputBorder: 'transparent',
  inputBorderFocused: '#000000',
  inputPlaceholder: 'rgba(60,60,67,0.30)',

  dot: '#000000',
  dotInactive: '#C7C7CC',
  divider: 'rgba(60,60,67,0.29)',
  overlay: 'rgba(0,0,0,0.04)',

  success: '#8E8E93',
  warning: '#636366',
  error: '#3A3A3C',
  errorSurface: '#E5E5EA',

  shadow: shadows.sm,
  shadowElevated: shadows.md,

  scrim: 'rgba(0,0,0,0.36)',
  inverseText: '#FFFFFF',
};

export const darkTheme: AppTheme = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  surfaceGlass: '#1C1C1E',
  surfaceContainerLowest: '#000000',
  surfaceContainerLow: '#1C1C1E',
  surfaceContainer: '#2C2C2E',
  surfaceContainerHigh: '#3A3A3C',

  glassFill: '#2C2C2E',
  glassBorder: 'rgba(84,84,88,0.65)',
  glassHighlight: 'transparent',
  glassIntensity: 0,

  text: '#FFFFFF',
  textSecondary: 'rgba(235,235,245,0.60)',
  textMuted: 'rgba(235,235,245,0.30)',
  textDisabled: 'rgba(235,235,245,0.16)',

  primary: '#FFFFFF',
  primaryContainer: '#2C2C2E',
  onPrimary: '#000000',
  onPrimaryContainer: '#FFFFFF',

  secondary: '#8E8E93',
  secondaryContainer: '#2C2C2E',
  onSecondary: '#000000',
  onSecondaryContainer: '#FFFFFF',

  tertiary: '#AEAEB2',
  tertiaryContainer: '#1C1C1E',
  onTertiaryContainer: '#FFFFFF',

  accent: '#FFFFFF',
  accentGlow: 'rgba(255,255,255,0.08)',
  accentRose: '#EBEBF5',
  accentLavender: '#2C2C2E',
  accentPeach: '#1C1C1E',
  accentMorningBlue: '#2C2C2E',
  accentLilac: '#1C1C1E',

  accentTeal: '#AEAEB2',
  accentGreen: '#C7C7CC',
  accentPurple: '#EBEBF5',
  accentOrange: '#AEAEB2',
  accentYellow: '#8E8E93',
  accentCoral: '#EBEBF5',

  tintFrost: 'rgba(120,120,128,0.24)',
  tintTeal: 'rgba(120,120,128,0.24)',
  tintGreen: 'rgba(120,120,128,0.28)',
  tintPurple: 'rgba(235,235,245,0.08)',
  tintOrange: 'rgba(120,120,128,0.26)',
  tintYellow: 'rgba(120,120,128,0.32)',
  tintCoral: 'rgba(235,235,245,0.10)',

  border: 'rgba(84,84,88,0.65)',
  borderActive: '#FFFFFF',
  borderAccent: '#8E8E93',

  buttonFill: '#FFFFFF',
  buttonText: '#000000',
  buttonPressedFill: '#EBEBF0',
  buttonPressedText: '#000000',
  buttonDisabledFill: '#2C2C2E',
  buttonDisabledText: '#636366',

  inputFill: '#1C1C1E',
  inputBorder: 'transparent',
  inputBorderFocused: '#FFFFFF',
  inputPlaceholder: 'rgba(235,235,245,0.30)',

  dot: '#FFFFFF',
  dotInactive: '#48484A',
  divider: 'rgba(84,84,88,0.65)',
  overlay: 'rgba(255,255,255,0.06)',

  success: '#8E8E93',
  warning: '#AEAEB2',
  error: '#EBEBF5',
  errorSurface: '#2C2C2E',

  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 1,
  },
  shadowElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 4,
  },

  scrim: 'rgba(0,0,0,0.72)',
  inverseText: '#000000',
};

export function getThemeGradients(isLight: boolean): ThemeGradients {
  return isLight ? lightGradients : darkGradients;
}

export type AuroraTone = 'frost' | 'teal' | 'green' | 'purple' | 'orange' | 'yellow' | 'coral';

export function auroraToneColors(theme: AppTheme, tone: AuroraTone) {
  switch (tone) {
    case 'teal':
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
  'frost',
  'teal',
  'green',
  'purple',
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
    borderWidth: StyleSheetHairline,
  };
}

const StyleSheetHairline = 1;

export function shouldUseAccent(isInterrupt: boolean): string | undefined {
  return isInterrupt ? '#000000' : undefined;
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
  red: plum[500],
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
    blue: plum[500],
    cyan: plum[400],
    magenta: '#A142F4',
    green: '#34A853',
    orange: '#FA7B17',
    red: '#EA4335',
    yellow: '#FBBC04',
    teal: plum[600],
  },
} as const;

export const kairosPalette = { ink: mist, signal: plum } as const;

export type ThemeColorKey = {
  [K in keyof AppTheme]: AppTheme[K] extends string ? K : never;
}[keyof AppTheme];
