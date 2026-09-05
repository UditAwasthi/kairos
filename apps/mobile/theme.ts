import { ColorSchemeName, ImageSourcePropType } from 'react-native';

// ─────────────────────────────────────────────────────────────
// PRIMITIVE TOKENS — Raw values, never used directly in UI
// ─────────────────────────────────────────────────────────────

const primitive = {
  // Nothing's signature red — used ONLY as an interrupt
  red: {
    50: '#FFEBEB',
    100: '#FFC5C5',
    200: '#FF9E9E',
    300: '#FF6B6B',
    400: '#FF3B3B',
    500: '#D71921', // Nothing Red
    600: '#B3141B',
    700: '#8F1016',
    800: '#6B0C10',
    900: '#47080B',
  },

  // Monochrome scale — the hierarchy IS the design
  gray: {
    0: '#FFFFFF',
    50: '#F7F7F7',
    100: '#E8E8E8',
    200: '#D1D1D1',
    300: '#B4B4B4',
    400: '#8A8A8A',
    500: '#5C5C5C',
    600: '#3D3D3D',
    700: '#2A2A2A',
    800: '#1A1A1A',
    900: '#0F0F0F',
    950: '#050505',
    1000: '#000000',
  },

  // Functional colors (data encoding only — not decorative)
  functional: {
    success: '#34C759',
    warning: '#FF9F0A',
    error: '#D71921',
    info: '#0A84FF',
  },
} as const;

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE — Nothing uses NDot / Inter with tight leading
// ─────────────────────────────────────────────────────────────

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

export const typography: TypographyScale = {
  display:   { size: 48, lineHeight: 52, weight: '700', letterSpacing: -1.5 },
  title1:    { size: 32, lineHeight: 36, weight: '700', letterSpacing: -0.8 },
  title2:    { size: 24, lineHeight: 28, weight: '600', letterSpacing: -0.5 },
  title3:    { size: 20, lineHeight: 24, weight: '600', letterSpacing: -0.3 },
  body:      { size: 16, lineHeight: 22, weight: '400', letterSpacing: -0.2 },
  bodySmall: { size: 14, lineHeight: 20, weight: '400', letterSpacing: -0.1 },
  caption:   { size: 12, lineHeight: 16, weight: '500', letterSpacing: 0 },
  overline:  { size: 10, lineHeight: 12, weight: '600', letterSpacing: 0.8 },
};

// ─────────────────────────────────────────────────────────────
// SPACING SCALE — 4px base grid, Nothing uses tight padding
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// RADIUS TOKENS — Nothing uses sharp corners with subtle rounding
// ─────────────────────────────────────────────────────────────

export const radius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// SHADOW / ELEVATION TOKENS — Subtle, never heavy
// ─────────────────────────────────────────────────────────────

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
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: primitive.red[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 0,
  },
} as const;

// ─────────────────────────────────────────────────────────────
// SEMANTIC THEME — The actual tokens used in components
// ─────────────────────────────────────────────────────────────

export type AppTheme = {
  // ── Background layers ──
  background: string;           // Deepest layer (screen bg)
  surface: string;              // Cards, sheets
  surfaceElevated: string;      // Floating elements
  surfaceGlass: string;         // Frosted glass overlay

  // ── Text hierarchy (max 4 levels per screen) ──
  text: string;                 // Primary — body, headings
  textSecondary: string;        // Secondary — labels, captions
  textMuted: string;            // Tertiary — hints, timestamps
  textDisabled: string;         // Disabled states

  // ── Accent (Red = interrupt only) ──
  accent: string;
  accentGlow: string;           // Subtle red glow for active states

  // ── Borders ──
  border: string;
  borderActive: string;
  borderAccent: string;

  // ── Interactive surfaces ──
  buttonFill: string;
  buttonText: string;
  buttonPressedFill: string;
  buttonPressedText: string;
  buttonDisabledFill: string;
  buttonDisabledText: string;

  // ── Input fields ──
  inputFill: string;
  inputBorder: string;
  inputBorderFocused: string;
  inputPlaceholder: string;

  // ── Navigation / Indicators ──
  dot: string;
  dotInactive: string;
  divider: string;
  overlay: string;              // Modal/backdrop overlay

  // ── Status / Feedback ──
  success: string;
  warning: string;
  error: string;
  errorSurface: string;         // Subtle red bg for error states

  // ── Elevation ──
  shadow: ShadowToken;
  shadowElevated: ShadowToken;

  // ── Misc ──
  scrim: string;                // Backdrop dimming
  inverseText: string;          // Text on dark surfaces
};

// ─────────────────────────────────────────────────────────────
// LIGHT THEME — Clean, airy, high contrast
// ─────────────────────────────────────────────────────────────

export const lightTheme: AppTheme = {
  background: primitive.gray[0],
  surface: primitive.gray[50],
  surfaceElevated: primitive.gray[0],
  surfaceGlass: 'rgba(255,255,255,0.72)',

  text: primitive.gray[950],
  textSecondary: primitive.gray[500],
  textMuted: primitive.gray[400],
  textDisabled: primitive.gray[300],

  accent: primitive.red[500],
  accentGlow: 'rgba(215,25,33,0.15)',

  border: primitive.gray[200],
  borderActive: primitive.gray[600],
  borderAccent: primitive.red[500],

  buttonFill: 'transparent',
  buttonText: primitive.gray[950],
  buttonPressedFill: primitive.gray[950],
  buttonPressedText: primitive.gray[0],
  buttonDisabledFill: primitive.gray[100],
  buttonDisabledText: primitive.gray[300],

  inputFill: primitive.gray[50],
  inputBorder: primitive.gray[200],
  inputBorderFocused: primitive.gray[950],
  inputPlaceholder: primitive.gray[400],

  dot: primitive.gray[950],
  dotInactive: primitive.gray[300],
  divider: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.04)',

  success: primitive.functional.success,
  warning: primitive.functional.warning,
  error: primitive.functional.error,
  errorSurface: primitive.red[50],

  shadow: shadows.sm,
  shadowElevated: shadows.md,

  scrim: 'rgba(0,0,0,0.32)',
  inverseText: primitive.gray[0],
};

// ─────────────────────────────────────────────────────────────
// DARK THEME — Deep blacks, subtle grays, glass surfaces
// ─────────────────────────────────────────────────────────────

export const darkTheme: AppTheme = {
  background: primitive.gray[1000],
  surface: primitive.gray[900],
  surfaceElevated: primitive.gray[800],
  surfaceGlass: 'rgba(26,26,26,0.72)',

  text: primitive.gray[0],
  textSecondary: primitive.gray[400],
  textMuted: primitive.gray[600],
  textDisabled: primitive.gray[700],

  accent: primitive.red[500],
  accentGlow: 'rgba(215,25,33,0.25)',

  border: 'rgba(255,255,255,0.08)',
  borderActive: 'rgba(255,255,255,0.35)',
  borderAccent: primitive.red[500],

  buttonFill: 'transparent',
  buttonText: primitive.gray[0],
  buttonPressedFill: primitive.gray[0],
  buttonPressedText: primitive.gray[1000],
  buttonDisabledFill: primitive.gray[800],
  buttonDisabledText: primitive.gray[700],

  inputFill: primitive.gray[900],
  inputBorder: 'rgba(255,255,255,0.08)',
  inputBorderFocused: 'rgba(255,255,255,0.50)',
  inputPlaceholder: primitive.gray[600],

  dot: primitive.gray[0],
  dotInactive: primitive.gray[700],
  divider: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(255,255,255,0.04)',

  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  errorSurface: 'rgba(215,25,33,0.15)',

  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  shadowElevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },

  scrim: 'rgba(0,0,0,0.60)',
  inverseText: primitive.gray[950],
};

// ─────────────────────────────────────────────────────────────
// ASSETS & HELPERS
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// NOTHING-SPECIFIC UTILITIES
// ─────────────────────────────────────────────────────────────

/**
 * Returns a subtle glass surface style for overlays, sheets, etc.
 * Use with react-native's blur view or backdrop-filter equivalent.
 */
export function getGlassSurface(scheme: ColorSchemeName) {
  const isDark = scheme === 'dark';
  return {
    backgroundColor: isDark ? 'rgba(20,20,20,0.65)' : 'rgba(255,255,255,0.72)',
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    borderWidth: 1,
  };
}

/**
 * Nothing OS uses red sparingly — only for interrupts.
 * Use this to determine if a component should show accent color.
 */
export function shouldUseAccent(isInterrupt: boolean): string | undefined {
  return isInterrupt ? primitive.red[500] : undefined;
}

/**
 * Text color based on hierarchy level (Nothing rule: max 4 per screen)
 */
export function getTextColor(
  theme: AppTheme,
  level: 'primary' | 'secondary' | 'muted' | 'disabled'
): string {
  switch (level) {
    case 'primary': return theme.text;
    case 'secondary': return theme.textSecondary;
    case 'muted': return theme.textMuted;
    case 'disabled': return theme.textDisabled;
  }
}

/** @deprecated Prefer `colors.accent` from ThemeContext — kept for existing call sites. */
export const nothing = {
  red: primitive.red[500],
} as const;

/** String color keys only (excludes shadow objects). */
export type ThemeColorKey = {
  [K in keyof AppTheme]: AppTheme[K] extends string ? K : never;
}[keyof AppTheme];
