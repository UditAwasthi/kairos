import { ColorSchemeName, ImageSourcePropType } from 'react-native';

/**
 * Kairos — Equilibrium "Serene Sanctuary" Design System
 * Rooted in ethereal minimalism, organic tactility, gentle lavender mists,
 * grounded deep plum anchors, and poetic Playfair Display editorial typography.
 */

export const plum = {
  50: '#FBF7FA',
  100: '#F5EDF4',
  200: '#EBDCE8',
  300: '#DEC2D8',
  400: '#C984A2', // Dusty Rose
  500: '#7D5070',
  600: '#511F39',
  700: '#4A2341', // Signature Plum Container
  800: '#380923',
  900: '#320E2B', // Deep Plum Primary
  950: '#1D0819',
} as const;

export const mist = {
  50: '#F6F1EA', // Canvas base — onboarding ivory
  100: '#EFE8DE', // Container low
  200: '#E8DFD4', // Container mid
  300: '#E2D8CC', // Container high
  400: '#E3E2E4',
  500: '#E7E0EF', // Lavender interactive fill
  600: '#CAC4D2',
  700: '#80747A',
  800: '#615C69', // Secondary text
  900: '#1A1C1D', // Primary text
  950: '#0F1011',
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

/**
 * Poetic editorial headings in Playfair Display paired with legible Inter body
 */
export const typography: TypographyScale = {
  display: { size: 36, lineHeight: 44, weight: '400', letterSpacing: -0.8, fontFamily: 'PlayfairDisplay_400Regular' },
  title1: { size: 28, lineHeight: 36, weight: '400', letterSpacing: -0.4, fontFamily: 'PlayfairDisplay_400Regular' },
  title2: { size: 22, lineHeight: 30, weight: '500', letterSpacing: -0.25, fontFamily: 'PlayfairDisplay_500Medium' },
  title3: { size: 18, lineHeight: 25, weight: '500', letterSpacing: -0.12, fontFamily: 'PlayfairDisplay_500Medium' },
  body: { size: 16, lineHeight: 25, weight: '400', letterSpacing: -0.05, fontFamily: 'Inter_400Regular' },
  bodySmall: { size: 14, lineHeight: 21, weight: '400', letterSpacing: 0, fontFamily: 'Inter_400Regular' },
  caption: { size: 12, lineHeight: 17, weight: '500', letterSpacing: 0.1, fontFamily: 'Inter_500Medium' },
  overline: { size: 11, lineHeight: 15, weight: '600', letterSpacing: 1.0, fontFamily: 'Inter_600SemiBold' },
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

/** Motion tokens — keep interactions soft and deliberate rather than springy or abrupt. */
export const motion = {
  instant: 120,
  fast: 180,
  normal: 260,
  smooth: 360,
  expressive: 480,
  page: 520,
  pressScale: 0.985,
  subtleScale: 0.992,
} as const;

export type MotionToken = keyof typeof motion;

/** Sweeping pebble contours (28px - 32px) and circular pills (full) */
export const radius = {
  none: 0,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 32,
  full: 9999,
} as const;

export type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/** Hyper-diffused plum-tinted ambient soft shadows */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#4A2341',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  md: {
    shadowColor: '#4A2341',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  },
  lg: {
    shadowColor: '#4A2341',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 6,
  },
  xl: {
    shadowColor: '#4A2341',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 44,
    elevation: 10,
  },
  glow: {
    shadowColor: '#4A2341',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
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
  background: ['#F6F1EA', '#EEE4F2', '#F6F1EA'],
  surface: ['rgba(251,247,242,0.94)', 'rgba(246,241,234,0.72)'],
  accent: [plum[700], plum[900]],
  accentSoft: ['rgba(196,179,224,0.32)', 'rgba(246,241,234,0.5)'],
  glass: ['rgba(251,247,242,0.88)', 'rgba(234,227,242,0.55)'],
  composer: ['rgba(251,247,242,0.94)', 'rgba(246,241,234,0.82)'],
  vitality: ['#EAE3F2', '#F6F1EA'],
};

export const darkGradients: ThemeGradients = {
  background: ['#100C12', '#18111A', '#120E14'],
  surface: ['rgba(35,27,38,0.90)', 'rgba(21,16,23,0.78)'],
  accent: ['#D28EAA', '#6A3454'],
  accentSoft: ['rgba(210,142,170,0.18)', 'rgba(81,39,63,0.12)'],
  glass: ['rgba(36,28,40,0.78)', 'rgba(20,15,22,0.56)'],
  composer: ['rgba(35,27,38,0.92)', 'rgba(20,15,22,0.78)'],
  vitality: ['#2D202F', '#1B141D'],
};

export const lightTheme: AppTheme = {
  background: '#F6F1EA',
  surface: '#F6F1EA',
  surfaceElevated: '#FBF7F2',
  surfaceGlass: 'rgba(251,247,242,0.86)',
  surfaceContainerLowest: '#FBF7F2',
  surfaceContainerLow: '#EFE8DE',
  surfaceContainer: '#E8DFD4',
  surfaceContainerHigh: '#E2D8CC',

  glassFill: 'rgba(251,247,242,0.84)',
  glassBorder: 'rgba(196,179,224,0.28)',
  glassHighlight: 'rgba(255,255,255,0.72)',
  glassIntensity: 28,

  text: mist[900], // #1A1C1D
  textSecondary: mist[800], // #615C69
  textMuted: mist[700], // #80747A
  textDisabled: '#D2C2CA',

  primary: plum[900], // #320E2B
  primaryContainer: plum[700], // #4A2341
  onPrimary: '#FFFFFF',
  onPrimaryContainer: plum[400], // #C984A2

  secondary: mist[800], // #615C69
  secondaryContainer: '#EAE3F2',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#67626F',

  tertiary: plum[800], // #380923
  tertiaryContainer: plum[600], // #511F39
  onTertiaryContainer: '#C984A2',

  accent: plum[700], // #4A2341
  accentGlow: 'rgba(196,179,224,0.22)',
  accentRose: '#C783A1',
  accentLavender: '#EAE3F2',
  accentPeach: '#F6DDD9',
  accentMorningBlue: '#DDE7F5',
  accentLilac: '#E5DCF2',

  accentTeal: '#4A2341',
  accentGreen: '#427055',
  accentPurple: '#7D5070',
  accentOrange: '#B85D43',
  accentYellow: '#A6732B',
  accentCoral: '#C783A1',

  tintFrost: 'rgba(74,35,65,0.06)',
  tintTeal: 'rgba(74,35,65,0.06)',
  tintGreen: 'rgba(66,112,85,0.08)',
  tintPurple: 'rgba(125,80,112,0.08)',
  tintOrange: 'rgba(184,93,67,0.08)',
  tintYellow: 'rgba(166,115,43,0.08)',
  tintCoral: 'rgba(199,131,161,0.08)',

  border: 'rgba(74,35,65,0.06)',
  borderActive: plum[700],
  borderAccent: plum[400],

  buttonFill: mist[900],
  buttonText: '#F6F1EA',
  buttonPressedFill: plum[900],
  buttonPressedText: '#F6F1EA',
  buttonDisabledFill: '#E8DFD4',
  buttonDisabledText: '#9CA3AF',

  inputFill: '#FBF7F2',
  inputBorder: 'rgba(74,35,65,0.08)',
  inputBorderFocused: plum[700],
  inputPlaceholder: '#9A8E94',

  dot: plum[700],
  dotInactive: '#D2C2CA',
  divider: 'rgba(74,35,65,0.06)',
  overlay: 'rgba(74,35,65,0.04)',

  success: '#3B6B4F',
  warning: '#A6732B',
  error: '#BA1A1A',
  errorSurface: '#FFDAD6',

  shadow: shadows.sm,
  shadowElevated: shadows.md,

  scrim: 'rgba(29,8,25,0.35)',
  inverseText: '#FFFFFF',
};

export const darkTheme: AppTheme = {
  background: '#100C12',
  surface: '#151016',
  surfaceElevated: '#211923',
  surfaceGlass: 'rgba(31,24,34,0.78)',
  surfaceContainerLowest: '#151016',
  surfaceContainerLow: '#1C151F',
  surfaceContainer: '#241A27',
  surfaceContainerHigh: '#302232',

  glassFill: 'rgba(32,25,35,0.76)',
  glassBorder: 'rgba(255,255,255,0.075)',
  glassHighlight: 'rgba(255,255,255,0.12)',
  glassIntensity: 42,

  text: '#F8F2F7',
  textSecondary: '#D2C8D1',
  textMuted: '#9E919B',
  textDisabled: '#5B4F58',

  primary: '#D28EAA', // #C984A2
  primaryContainer: '#51273F', // #4A2341
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#F0D7E3',

  secondary: '#CAC4D2',
  secondaryContainer: '#302332',
  onSecondary: '#141016',
  onSecondaryContainer: plum[300],

  tertiary: '#E0B7C8',
  tertiaryContainer: '#51273F',
  onTertiaryContainer: plum[200],

  accent: '#D28EAA',
  accentGlow: 'rgba(210,142,170,0.20)',
  accentRose: '#C783A1',
  accentLavender: '#35283D',
  accentPeach: '#472B31',
  accentMorningBlue: '#263747',
  accentLilac: '#3A2A45',

  accentTeal: plum[400],
  accentGreen: '#72A888',
  accentPurple: '#C984A2',
  accentOrange: '#DE8B72',
  accentYellow: '#D4A459',
  accentCoral: '#FBB1D1',

  tintFrost: 'rgba(210,142,170,0.11)',
  tintTeal: 'rgba(210,142,170,0.10)',
  tintGreen: 'rgba(114,168,136,0.12)',
  tintPurple: 'rgba(210,142,170,0.11)',
  tintOrange: 'rgba(222,139,114,0.12)',
  tintYellow: 'rgba(212,164,89,0.12)',
  tintCoral: 'rgba(251,177,209,0.12)',

  border: 'rgba(255,255,255,0.075)',
  borderActive: plum[400],
  borderAccent: '#DDAFC2',

  buttonFill: '#5A2A45',
  buttonText: '#FFFFFF',
  buttonPressedFill: '#6C3655',
  buttonPressedText: '#FFFFFF',
  buttonDisabledFill: '#29202C',
  buttonDisabledText: '#615C69',

  inputFill: '#1D1720',
  inputBorder: 'rgba(255,255,255,0.085)',
  inputBorderFocused: plum[400],
  inputPlaceholder: '#756A74',

  dot: plum[400],
  dotInactive: '#4E444A',
  divider: 'rgba(255,255,255,0.055)',
  overlay: 'rgba(210,142,170,0.045)',

  success: '#72A888',
  warning: '#D4A459',
  error: '#FFB4AB',
  errorSurface: '#93000A',

  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 4,
  },
  shadowElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 8,
  },

  scrim: 'rgba(0,0,0,0.6)',
  inverseText: '#141016',
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
    backgroundColor: theme.glassFill,
    borderColor: theme.glassBorder,
    borderWidth: 1,
  };
}

export function shouldUseAccent(isInterrupt: boolean): string | undefined {
  return isInterrupt ? plum[700] : undefined;
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
  red: plum[700],
} as const;

export const nordPalette = {
  frost: {
    0: plum[300],
    1: plum[400],
    2: plum[600],
    3: plum[700],
  },
  aurora: {
    red: '#C783A1',
    orange: '#DE8B72',
    yellow: '#D4A459',
    green: '#72A888',
    purple: '#7D5070',
  },
  polarNight: {
    0: mist[950],
    1: '#1F1A22',
    2: '#28212C',
    3: mist[700],
  },
} as const;

export const tokyoPalette = {
  accent: {
    blue: plum[700],
    cyan: plum[400],
    magenta: '#7D5070',
    green: '#72A888',
    orange: '#DE8B72',
    red: '#C783A1',
    yellow: '#D4A459',
    teal: plum[500],
  },
} as const;

export const kairosPalette = { ink: mist, signal: plum } as const;

export type ThemeColorKey = {
  [K in keyof AppTheme]: AppTheme[K] extends string ? K : never;
}[keyof AppTheme];
