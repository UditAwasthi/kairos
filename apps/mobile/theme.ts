import { ColorSchemeName, ImageSourcePropType } from 'react-native';

/**
 * Kairos — personal memory OS.
 * Dark-first, ~92% monochrome, ice accent. No gradient fills.
 */

export const inkBlack = '#101010';
export const panelGray = '#2C2C2C';
export const paper = '#F3EDE4';
export const paperRaised = '#FFFBF6';
export const ice = '#9DD8E8';
export const iceBright = '#A9E6E8';
export const iceDeep = '#8FC9E8';
export const cyan = ice;
export const azure = iceDeep;
export const charcoal = inkBlack;
export const smoke = '#FFFFFF';

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
 * Roboto only on product screens. Playfair remains loaded for onboarding.
 */
export const typography: TypographyScale = {
  display: { size: 32, lineHeight: 38, weight: '500', letterSpacing: -0.6, fontFamily: 'Roboto_500Medium' },
  title1: { size: 24, lineHeight: 30, weight: '500', letterSpacing: -0.4, fontFamily: 'Roboto_500Medium' },
  title2: { size: 18, lineHeight: 24, weight: '500', letterSpacing: -0.2, fontFamily: 'Roboto_500Medium' },
  title3: { size: 16, lineHeight: 24, weight: '500', letterSpacing: -0.05, fontFamily: 'Roboto_500Medium' },
  body: { size: 16, lineHeight: 24, weight: '400', letterSpacing: -0.05, fontFamily: 'Roboto_400Regular' },
  bodySmall: { size: 13, lineHeight: 18, weight: '400', letterSpacing: 0, fontFamily: 'Roboto_400Regular' },
  caption: { size: 13, lineHeight: 18, weight: '400', letterSpacing: 0, fontFamily: 'Roboto_400Regular' },
  overline: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0.6, fontFamily: 'Roboto_500Medium' },
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

export const motion = {
  instant: 140,
  fast: 180,
  normal: 240,
  smooth: 380,
  expressive: 380,
  page: 380,
  ambient: 6000,
  pressScale: 0.97,
  subtleScale: 0.992,
  springTap: { damping: 18, stiffness: 260, mass: 0.7 },
  springLayout: { damping: 22, stiffness: 180 },
} as const;

export type MotionToken = keyof typeof motion;

/** Sweeping pebble contours (28px - 32px) and circular pills (full) */
export const radius = {
  none: 0,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 30,
  '2xl': 30,
  pill: 999,
  full: 9999,
} as const;

export type ShadowToken = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

/** Soft charcoal shadows — no color tint. */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: charcoal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 1,
  },
  md: {
    shadowColor: charcoal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 3,
  },
  lg: {
    shadowColor: charcoal,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 36,
    elevation: 6,
  },
  xl: {
    shadowColor: charcoal,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.16,
    shadowRadius: 44,
    elevation: 10,
  },
  glow: {
    shadowColor: charcoal,
    shadowOffset: { width: 0, height: 4 },
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
  background: [paper, paper, paper],
  surface: [paperRaised, paperRaised],
  accent: [ice, ice],
  accentSoft: ['rgba(157,216,232,0.12)', 'rgba(157,216,232,0.12)'],
  glass: [paperRaised, paperRaised],
  composer: [paperRaised, paperRaised],
  vitality: [paper, paper],
};

export const darkGradients: ThemeGradients = {
  background: [inkBlack, inkBlack, inkBlack],
  surface: ['#202020', '#202020'],
  accent: [ice, ice],
  accentSoft: ['rgba(157,216,232,0.12)', 'rgba(157,216,232,0.12)'],
  glass: ['#202020', '#202020'],
  composer: ['#202020', '#202020'],
  vitality: ['#181818', '#181818'],
};

export const lightTheme: AppTheme = {
  background: paper,
  surface: paper,
  surfaceElevated: paperRaised,
  surfaceGlass: 'rgba(255,251,246,0.9)',
  surfaceContainerLowest: paperRaised,
  surfaceContainerLow: '#EBE3D6',
  surfaceContainer: '#E4DCCE',
  surfaceContainerHigh: '#D8CFC0',

  glassFill: 'rgba(255,251,246,0.9)',
  glassBorder: 'rgba(20,17,14,0.08)',
  glassHighlight: 'rgba(255,255,255,0.7)',
  glassIntensity: 24,

  text: '#14110E',
  textSecondary: '#5C564E',
  textMuted: '#5C564E',
  textDisabled: '#B4ADA4',

  primary: inkBlack,
  primaryContainer: panelGray,
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#FFFFFF',

  secondary: '#5C564E',
  secondaryContainer: '#E4DCCE',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: inkBlack,

  tertiary: inkBlack,
  tertiaryContainer: '#202020',
  onTertiaryContainer: '#FFFFFF',

  accent: azure,
  accentGlow: 'rgba(87,236,178,0.16)',
  accentRose: azure,
  accentLavender: '#EBE3D6',
  accentPeach: '#E4DCCE',
  accentMorningBlue: azure,
  accentLilac: '#E8E0D4',

  accentTeal: cyan,
  accentGreen: cyan,
  accentPurple: azure,
  accentOrange: '#5A5A5A',
  accentYellow: '#707070',
  accentCoral: azure,

  tintFrost: 'rgba(80,182,255,0.08)',
  tintTeal: 'rgba(87,236,178,0.1)',
  tintGreen: 'rgba(87,236,178,0.1)',
  tintPurple: 'rgba(80,182,255,0.08)',
  tintOrange: 'rgba(16,16,16,0.06)',
  tintYellow: 'rgba(16,16,16,0.06)',
  tintCoral: 'rgba(80,182,255,0.08)',

  border: 'rgba(20,17,14,0.08)',
  borderActive: azure,
  borderAccent: cyan,

  buttonFill: inkBlack,
  buttonText: '#FFFFFF',
  buttonPressedFill: '#202020',
  buttonPressedText: '#FFFFFF',
  buttonDisabledFill: '#E4DCCE',
  buttonDisabledText: '#9A9388',

  inputFill: paperRaised,
  inputBorder: 'rgba(20,17,14,0.1)',
  inputBorderFocused: azure,
  inputPlaceholder: '#7A736A',

  dot: azure,
  dotInactive: '#C8BFB2',
  divider: 'rgba(20,17,14,0.08)',
  overlay: 'rgba(20,17,14,0.04)',

  success: cyan,
  warning: '#7A736A',
  error: inkBlack,
  errorSurface: '#E4DCCE',

  shadow: shadows.sm,
  shadowElevated: shadows.md,

  scrim: 'rgba(16,16,16,0.4)',
  inverseText: '#FFFFFF',
};

export const darkTheme: AppTheme = {
  background: inkBlack,
  surface: '#202020',
  surfaceElevated: panelGray,
  surfaceGlass: '#202020',
  surfaceContainerLowest: inkBlack,
  surfaceContainerLow: '#181818',
  surfaceContainer: '#202020',
  surfaceContainerHigh: panelGray,

  glassFill: '#202020',
  glassBorder: 'rgba(255,255,255,0.06)',
  glassHighlight: 'transparent',
  glassIntensity: 0,

  text: '#F5F5F5',
  textSecondary: '#A0A0A0',
  textMuted: '#686868',
  textDisabled: '#4A4A4A',

  primary: '#FFFFFF',
  primaryContainer: panelGray,
  onPrimary: inkBlack,
  onPrimaryContainer: '#FFFFFF',

  secondary: '#A0A0A0',
  secondaryContainer: '#202020',
  onSecondary: inkBlack,
  onSecondaryContainer: '#FFFFFF',

  tertiary: '#FFFFFF',
  tertiaryContainer: '#202020',
  onTertiaryContainer: '#FFFFFF',

  accent: ice,
  accentGlow: 'rgba(157,216,232,0.12)',
  accentRose: ice,
  accentLavender: '#202020',
  accentPeach: '#202020',
  accentMorningBlue: iceBright,
  accentLilac: '#181818',

  accentTeal: ice,
  accentGreen: ice,
  accentPurple: iceDeep,
  accentOrange: '#A0A0A0',
  accentYellow: '#686868',
  accentCoral: ice,

  tintFrost: 'rgba(157,216,232,0.12)',
  tintTeal: 'rgba(157,216,232,0.12)',
  tintGreen: 'rgba(157,216,232,0.12)',
  tintPurple: 'rgba(157,216,232,0.12)',
  tintOrange: 'rgba(255,255,255,0.06)',
  tintYellow: 'rgba(255,255,255,0.06)',
  tintCoral: 'rgba(157,216,232,0.12)',

  border: 'rgba(255,255,255,0.06)',
  borderActive: 'rgba(255,255,255,0.10)',
  borderAccent: ice,

  buttonFill: '#FFFFFF',
  buttonText: inkBlack,
  buttonPressedFill: '#E8E8E8',
  buttonPressedText: inkBlack,
  buttonDisabledFill: '#202020',
  buttonDisabledText: '#707070',

  inputFill: '#181818',
  inputBorder: 'rgba(255,255,255,0.08)',
  inputBorderFocused: azure,
  inputPlaceholder: '#707070',

  dot: azure,
  dotInactive: '#3A3A3A',
  divider: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(255,255,255,0.04)',

  success: cyan,
  warning: '#A8A8A8',
  error: '#FFFFFF',
  errorSurface: '#202020',

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
  inverseText: charcoal,
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
  return isInterrupt ? charcoal : undefined;
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
