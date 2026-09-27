import { type AppTheme, type ShadowToken, ice, iceDeep, motion, shadows } from '../theme';

/** Folded into theme.ts — kept so existing imports keep compiling. */
export const homeFont = {
  serif: 'Roboto_500Medium',
  serifMed: 'Roboto_500Medium',
  sans: 'Roboto_400Regular',
  sansMedium: 'Roboto_500Medium',
  sansSemi: 'Roboto_600SemiBold',
  sansBold: 'Roboto_700Bold',
} as const;

export const homeShape = {
  ovalW: 40,
  ovalH: 40,
  ovalRadius: 20,
  poster: 24,
  pressScale: motion.pressScale,
} as const;

export type HomeSurface = {
  canvas: string;
  panel: string;
  well: string;
  text: string;
  muted: string;
  faint: string;
  ink: string;
  inverse: string;
  border: string;
  cyan: string;
  azure: string;
  glow: string;
  line: string;
  shadow: ShadowToken;
  pressScale: number;
};

export function homeSurface(colors: AppTheme, isLight: boolean): HomeSurface {
  return {
    canvas: colors.background,
    panel: colors.surface,
    well: isLight ? colors.surfaceContainer : colors.surfaceContainerLow,
    text: colors.text,
    muted: colors.textSecondary,
    faint: colors.textMuted,
    ink: colors.text,
    inverse: colors.inverseText,
    border: colors.border,
    cyan: ice,
    azure: iceDeep,
    glow: colors.accentGlow,
    line: colors.divider,
    shadow: shadows.sm,
    pressScale: homeShape.pressScale,
  };
}
