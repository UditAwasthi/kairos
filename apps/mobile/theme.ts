import { ColorSchemeName, ImageSourcePropType } from 'react-native';

/**
 * Kairos — Material 3 / Google product tokens.
 * Surfaces, type, and elevation follow Google apps (Search, Keep, Drive, Photos).
 */

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

/** Material 3 type scale, Inter standing in for Google Sans / Roboto. */
export const typography: TypographyScale = {
  display: { size: 36, lineHeight: 44, weight: '400', letterSpacing: 0, fontFamily: 'Inter_400Regular' },
  title1: { size: 28, lineHeight: 36, weight: '400', letterSpacing: 0, fontFamily: 'Inter_400Regular' },
  title2: { size: 22, lineHeight: 28, weight: '400', letterSpacing: 0, fontFamily: 'Inter_400Regular' },
  title3: { size: 16, lineHeight: 24, weight: '500', letterSpacing: 0.15, fontFamily: 'Inter_500Medium' },
  body: { size: 16, lineHeight: 24, weight: '400', letterSpacing: 0.5, fontFamily: 'Inter_400Regular' },
  bodySmall: { size: 14, lineHeight: 20, weight: '400', letterSpacing: 0.25, fontFamily: 'Inter_400Regular' },
  caption: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0.5, fontFamily: 'Inter_500Medium' },
  overline: { size: 11, lineHeight: 16, weight: '500', letterSpacing: 0.5, fontFamily: 'Inter_500Medium' },
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

/** Material motion — short, standard easing. */
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

/** Material 3 shape scale */
export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
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

/** Material elevation — neutral key shadow */
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
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
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
  background: ['#F8F9FA', '#F8F9FA', '#F8F9FA'],
  surface: ['#FFFFFF', '#FFFFFF'],
  accent: ['#1A73E8', '#1A73E8'],
  accentSoft: ['#E8F0FE', '#E8F0FE'],
  glass: ['#FFFFFF', '#FFFFFF'],
  composer: ['#FFFFFF', '#FFFFFF'],
  vitality: ['#E8F0FE', '#F8F9FA'],
};

export const darkGradients: ThemeGradients = {
  background: ['#202124', '#202124', '#202124'],
  surface: ['#292A2D', '#292A2D'],
  accent: ['#8AB4F8', '#8AB4F8'],
  accentSoft: ['#174EA6', '#174EA6'],
  glass: ['#292A2D', '#292A2D'],
  composer: ['#303134', '#303134'],
  vitality: ['#303134', '#202124'],
};

export const lightTheme: AppTheme = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: '#FFFFFF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F1F3F4',
  surfaceContainer: '#E8EAED',
  surfaceContainerHigh: '#DADCE0',

  glassFill: '#FFFFFF',
  glassBorder: '#DADCE0',
  glassHighlight: 'transparent',
  glassIntensity: 0,

  text: '#202124',
  textSecondary: '#5F6368',
  textMuted: '#80868B',
  textDisabled: '#9AA0A6',

  primary: '#1A73E8',
  primaryContainer: '#D2E3FC',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#041E49',

  secondary: '#5F6368',
  secondaryContainer: '#E8F0FE',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#174EA6',

  tertiary: '#188038',
  tertiaryContainer: '#CEFAD0',
  onTertiaryContainer: '#0D652D',

  accent: '#1A73E8',
  accentGlow: 'rgba(26,115,232,0.12)',
  accentRose: '#EA4335',
  accentLavender: '#E8F0FE',
  accentPeach: '#FCE8E6',
  accentMorningBlue: '#E8F0FE',
  accentLilac: '#F3E8FD',

  accentTeal: '#1A73E8',
  accentGreen: '#34A853',
  accentPurple: '#A142F4',
  accentOrange: '#FA7B17',
  accentYellow: '#FBBC04',
  accentCoral: '#EA4335',

  tintFrost: 'rgba(26,115,232,0.08)',
  tintTeal: 'rgba(26,115,232,0.08)',
  tintGreen: 'rgba(52,168,83,0.10)',
  tintPurple: 'rgba(161,66,244,0.10)',
  tintOrange: 'rgba(250,123,23,0.10)',
  tintYellow: 'rgba(251,188,4,0.14)',
  tintCoral: 'rgba(234,67,53,0.10)',

  border: '#DADCE0',
  borderActive: '#1A73E8',
  borderAccent: '#1A73E8',

  buttonFill: '#1A73E8',
  buttonText: '#FFFFFF',
  buttonPressedFill: '#1558B0',
  buttonPressedText: '#FFFFFF',
  buttonDisabledFill: '#E8EAED',
  buttonDisabledText: '#9AA0A6',

  inputFill: '#F1F3F4',
  inputBorder: '#DADCE0',
  inputBorderFocused: '#1A73E8',
  inputPlaceholder: '#80868B',

  dot: '#1A73E8',
  dotInactive: '#DADCE0',
  divider: '#DADCE0',
  overlay: 'rgba(26,115,232,0.06)',

  success: '#188038',
  warning: '#F9AB00',
  error: '#D93025',
  errorSurface: '#FCE8E6',

  shadow: shadows.sm,
  shadowElevated: shadows.md,

  scrim: 'rgba(32,33,36,0.40)',
  inverseText: '#FFFFFF',
};

export const darkTheme: AppTheme = {
  background: '#202124',
  surface: '#292A2D',
  surfaceElevated: '#303134',
  surfaceGlass: '#303134',
  surfaceContainerLowest: '#202124',
  surfaceContainerLow: '#292A2D',
  surfaceContainer: '#35363A',
  surfaceContainerHigh: '#3C4043',

  glassFill: '#303134',
  glassBorder: '#3C4043',
  glassHighlight: 'transparent',
  glassIntensity: 0,

  text: '#E8EAED',
  textSecondary: '#9AA0A6',
  textMuted: '#80868B',
  textDisabled: '#5F6368',

  primary: '#8AB4F8',
  primaryContainer: '#174EA6',
  onPrimary: '#202124',
  onPrimaryContainer: '#D2E3FC',

  secondary: '#9AA0A6',
  secondaryContainer: '#3C4043',
  onSecondary: '#202124',
  onSecondaryContainer: '#D2E3FC',

  tertiary: '#81C995',
  tertiaryContainer: '#0D652D',
  onTertiaryContainer: '#CEFAD0',

  accent: '#8AB4F8',
  accentGlow: 'rgba(138,180,248,0.16)',
  accentRose: '#F28B82',
  accentLavender: '#174EA6',
  accentPeach: '#5C2B29',
  accentMorningBlue: '#174EA6',
  accentLilac: '#46255C',

  accentTeal: '#8AB4F8',
  accentGreen: '#81C995',
  accentPurple: '#D7AEFB',
  accentOrange: '#FCAD70',
  accentYellow: '#FDD663',
  accentCoral: '#F28B82',

  tintFrost: 'rgba(138,180,248,0.12)',
  tintTeal: 'rgba(138,180,248,0.12)',
  tintGreen: 'rgba(129,201,149,0.14)',
  tintPurple: 'rgba(215,174,251,0.14)',
  tintOrange: 'rgba(252,173,112,0.14)',
  tintYellow: 'rgba(253,214,99,0.14)',
  tintCoral: 'rgba(242,139,130,0.14)',

  border: '#3C4043',
  borderActive: '#8AB4F8',
  borderAccent: '#8AB4F8',

  buttonFill: '#8AB4F8',
  buttonText: '#202124',
  buttonPressedFill: '#AECBFA',
  buttonPressedText: '#202124',
  buttonDisabledFill: '#3C4043',
  buttonDisabledText: '#80868B',

  inputFill: '#303134',
  inputBorder: '#5F6368',
  inputBorderFocused: '#8AB4F8',
  inputPlaceholder: '#9AA0A6',

  dot: '#8AB4F8',
  dotInactive: '#5F6368',
  divider: '#3C4043',
  overlay: 'rgba(138,180,248,0.08)',

  success: '#81C995',
  warning: '#FDD663',
  error: '#F28B82',
  errorSurface: '#5C2B29',

  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 1,
  },
  shadowElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },

  scrim: 'rgba(0,0,0,0.6)',
  inverseText: '#202124',
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
  return isInterrupt ? plum[500] : undefined;
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
    0: plum[300],
    1: plum[400],
    2: plum[600],
    3: plum[700],
  },
  aurora: {
    red: '#EA4335',
    orange: '#FA7B17',
    yellow: '#FBBC04',
    green: '#34A853',
    purple: '#A142F4',
  },
  polarNight: {
    0: mist[950],
    1: '#202124',
    2: '#292A2D',
    3: mist[700],
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
