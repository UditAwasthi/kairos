import { ColorSchemeName, ImageSourcePropType } from 'react-native';

/**
 * Kairos Signal — product theme for trust, habit, and conversion.
 *
 * Principles (user POV):
 * 1. Trust first — personal memory needs calm neutrals + clear contrast
 * 2. One hero job — Ask is the flagship; accent color is reserved for CTAs
 * 3. Habit loop — Capture → see value → return tomorrow (soft “today” signal)
 * 4. Explore without overwhelm — secondary actions stay quieter than Ask
 * 5. Premium restraint — no rainbow chrome; color = meaning, not decoration
 */

const ink = {
  50: '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#1F2937',
  900: '#111827',
  950: '#0B0D10',
} as const;

const signal = {
  /** Brand CTA — teal reads as calm intelligence, not “AI purple” */
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#14B8A6',
  600: '#0D9488',
  700: '#0F766E',
  800: '#115E59',
} as const;

export type FontWeight = '400' | '500' | '600' | '700';

export type TypographyScale = {
  display: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
  title1: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
  title2: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
  title3: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
  body: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
  bodySmall: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
  caption: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
  overline: { size: number; lineHeight: number; weight: FontWeight; letterSpacing: number };
};

/** Readable product type — hierarchy over decoration */
export const typography: TypographyScale = {
  display: { size: 32, lineHeight: 38, weight: '600', letterSpacing: -0.6 },
  title1: { size: 24, lineHeight: 30, weight: '600', letterSpacing: -0.4 },
  title2: { size: 20, lineHeight: 26, weight: '600', letterSpacing: -0.3 },
  title3: { size: 17, lineHeight: 22, weight: '600', letterSpacing: -0.2 },
  body: { size: 16, lineHeight: 24, weight: '400', letterSpacing: -0.1 },
  bodySmall: { size: 14, lineHeight: 20, weight: '400', letterSpacing: -0.05 },
  caption: { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0.1 },
  overline: { size: 11, lineHeight: 14, weight: '600', letterSpacing: 0.5 },
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

/** Soft product radii — cards 16–20, pills only for chips/CTAs */
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

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: ink[950],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: ink[950],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: ink[950],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  xl: {
    shadowColor: ink[950],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  },
  glow: {
    shadowColor: signal[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 0,
  },
} as const;

/** Multi-stop color sets for LinearGradient — prefer these over flat fills */
export type ThemeGradients = {
  background: readonly [string, string, string];
  surface: readonly [string, string];
  accent: readonly [string, string];
  accentSoft: readonly [string, string];
  glass: readonly [string, string];
  composer: readonly [string, string];
};

export type AppTheme = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceGlass: string;

  /** Glassmorphism tokens */
  glassFill: string;
  glassBorder: string;
  glassHighlight: string;
  glassIntensity: number;

  text: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;

  accent: string;
  accentGlow: string;
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
  background: ['#EEF2F7', '#F3F4F6', '#E8F5F2'],
  surface: ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.42)'],
  accent: [signal[600], signal[800]],
  accentSoft: [`${signal[500]}33`, `${signal[700]}18`],
  glass: ['rgba(255,255,255,0.55)', 'rgba(240,253,250,0.28)'],
  composer: ['rgba(255,255,255,0.78)', 'rgba(243,244,246,0.55)'],
};

export const darkGradients: ThemeGradients = {
  background: ['#0B0D10', '#101820', '#0D1A18'],
  surface: ['rgba(28,34,44,0.72)', 'rgba(20,24,31,0.4)'],
  accent: [signal[500], signal[700]],
  accentSoft: [`${signal[400]}28`, `${signal[600]}12`],
  glass: ['rgba(255,255,255,0.1)', 'rgba(45,212,191,0.06)'],
  composer: ['rgba(20,24,31,0.82)', 'rgba(11,13,16,0.55)'],
};

export const lightTheme: AppTheme = {
  background: '#EEF2F7',
  surface: 'rgba(255,255,255,0.72)',
  surfaceElevated: 'rgba(255,255,255,0.88)',
  surfaceGlass: 'rgba(255,255,255,0.48)',

  glassFill: 'rgba(255,255,255,0.42)',
  glassBorder: 'rgba(255,255,255,0.65)',
  glassHighlight: 'rgba(255,255,255,0.9)',
  glassIntensity: 48,

  text: ink[900],
  textSecondary: ink[600],
  textMuted: ink[500],
  textDisabled: ink[300],

  accent: signal[700],
  accentGlow: 'rgba(15,118,110,0.14)',
  accentTeal: signal[600],
  accentGreen: '#15803D',
  accentPurple: '#5B6C8F',
  accentOrange: '#C2410C',
  accentYellow: '#A16207',
  accentCoral: '#BE123C',

  tintFrost: 'rgba(15,118,110,0.1)',
  tintTeal: 'rgba(13,148,136,0.1)',
  tintGreen: 'rgba(21,128,61,0.1)',
  tintPurple: 'rgba(91,108,143,0.1)',
  tintOrange: 'rgba(194,65,12,0.1)',
  tintYellow: 'rgba(161,98,7,0.1)',
  tintCoral: 'rgba(190,18,60,0.1)',

  border: 'rgba(17,24,39,0.08)',
  borderActive: signal[600],
  borderAccent: signal[500],

  buttonFill: 'transparent',
  buttonText: ink[900],
  buttonPressedFill: signal[800],
  buttonPressedText: '#FFFFFF',
  buttonDisabledFill: ink[200],
  buttonDisabledText: ink[400],

  inputFill: 'rgba(255,255,255,0.55)',
  inputBorder: 'rgba(17,24,39,0.1)',
  inputBorderFocused: signal[600],
  inputPlaceholder: ink[400],

  dot: signal[600],
  dotInactive: ink[300],
  divider: 'rgba(17,24,39,0.06)',
  overlay: 'rgba(15,118,110,0.04)',

  success: '#15803D',
  warning: '#A16207',
  error: '#BE123C',
  errorSurface: 'rgba(190,18,60,0.08)',

  shadow: shadows.sm,
  shadowElevated: shadows.md,

  scrim: 'rgba(11,13,16,0.4)',
  inverseText: '#FFFFFF',
};

export const darkTheme: AppTheme = {
  background: '#0B0D10',
  surface: 'rgba(28,34,44,0.72)',
  surfaceElevated: 'rgba(28,34,44,0.88)',
  surfaceGlass: 'rgba(20,24,31,0.45)',

  glassFill: 'rgba(20,24,31,0.45)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassHighlight: 'rgba(255,255,255,0.22)',
  glassIntensity: 56,

  text: ink[50],
  textSecondary: ink[300],
  textMuted: ink[400],
  textDisabled: ink[600],

  accent: signal[400],
  accentGlow: 'rgba(45,212,191,0.16)',
  accentTeal: signal[300],
  accentGreen: '#4ADE80',
  accentPurple: '#94A3B8',
  accentOrange: '#FB923C',
  accentYellow: '#FBBF24',
  accentCoral: '#FB7185',

  tintFrost: 'rgba(45,212,191,0.12)',
  tintTeal: 'rgba(94,234,212,0.1)',
  tintGreen: 'rgba(74,222,128,0.1)',
  tintPurple: 'rgba(148,163,184,0.12)',
  tintOrange: 'rgba(251,146,60,0.1)',
  tintYellow: 'rgba(251,191,36,0.1)',
  tintCoral: 'rgba(251,113,133,0.1)',

  border: 'rgba(243,244,246,0.1)',
  borderActive: signal[400],
  borderAccent: signal[300],

  buttonFill: 'transparent',
  buttonText: ink[50],
  buttonPressedFill: signal[300],
  buttonPressedText: ink[950],
  buttonDisabledFill: '#1C222C',
  buttonDisabledText: ink[600],

  inputFill: 'rgba(20,24,31,0.55)',
  inputBorder: 'rgba(243,244,246,0.12)',
  inputBorderFocused: signal[400],
  inputPlaceholder: ink[500],

  dot: signal[400],
  dotInactive: ink[700],
  divider: 'rgba(243,244,246,0.08)',
  overlay: 'rgba(45,212,191,0.05)',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#FB7185',
  errorSurface: 'rgba(251,113,133,0.12)',

  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  shadowElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },

  scrim: 'rgba(0,0,0,0.6)',
  inverseText: ink[950],
};

export function getThemeGradients(isLight: boolean): ThemeGradients {
  return isLight ? lightGradients : darkGradients;
}

/** Semantic tones — muted on purpose; used for status/categories, not decoration */
export type AuroraTone = 'frost' | 'teal' | 'green' | 'purple' | 'orange' | 'yellow' | 'coral';

export function auroraToneColors(theme: AppTheme, tone: AuroraTone) {
  switch (tone) {
    case 'teal':
      return { accent: theme.accentTeal, tint: theme.tintTeal };
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
    case 'frost':
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
  return isInterrupt ? signal[500] : undefined;
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

/** @deprecated Prefer `colors.accent`. */
export const nothing = {
  red: signal[500],
} as const;

/** Soft aurora / dots — brand signal only */
export const nordPalette = {
  frost: {
    0: signal[300],
    1: signal[400],
    2: signal[500],
    3: signal[600],
  },
  aurora: {
    red: '#FB7185',
    orange: '#FB923C',
    yellow: '#FBBF24',
    green: '#4ADE80',
    purple: '#94A3B8',
  },
  polarNight: {
    0: ink[950],
    1: '#14181F',
    2: '#1C222C',
    3: ink[500],
  },
} as const;

export const tokyoPalette = {
  accent: {
    blue: signal[500],
    cyan: signal[300],
    magenta: '#94A3B8',
    green: '#4ADE80',
    orange: '#FB923C',
    red: '#FB7185',
    yellow: '#FBBF24',
    teal: signal[400],
  },
} as const;

export const kairosPalette = { ink, signal } as const;

export type ThemeColorKey = {
  [K in keyof AppTheme]: AppTheme[K] extends string ? K : never;
}[keyof AppTheme];
