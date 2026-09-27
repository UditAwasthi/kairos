import type { AppTheme, ShadowToken } from '../theme';
import { shadows } from '../theme';

export const homeFont = {
  serif: 'PlayfairDisplay_400Regular',
  serifMedium: 'PlayfairDisplay_500Medium',
  sans: 'Roboto_400Regular',
  sansMedium: 'Roboto_500Medium',
} as const;

export type HomeSurface = {
  canvas: string;
  text: string;
  muted: string;
  ink: string;
  ask: readonly [string, string];
  recall: string;
  panel: string;
  pill: string;
  chipFills: readonly [string, string, string, string, string];
  fab: string;
  blob: string;
  line: string;
  shadow: ShadowToken;
  pressScale: number;
};

/** Soft SaaS Home: dusty lavender, sand, blush — never ink-on-white. */
export function homeSurface(colors: AppTheme, isLight: boolean): HomeSurface {
  return {
    canvas: isLight ? colors.surfaceElevated : colors.background,
    text: colors.textSecondary,
    muted: colors.textMuted,
    ink: isLight ? colors.accentPurple : colors.accentRose,
    ask: isLight
      ? [colors.accentLavender, colors.accentLilac]
      : [colors.accentLilac, colors.surfaceContainer],
    recall: isLight ? colors.surfaceContainer : colors.surfaceContainer,
    panel: isLight ? colors.accentPeach : colors.surfaceContainerLow,
    pill: isLight ? colors.surfaceContainer : colors.surfaceContainerHigh,
    chipFills: isLight
      ? [
          colors.accentLavender,
          colors.accentPeach,
          colors.surfaceContainer,
          colors.accentLilac,
          colors.accentMorningBlue,
        ]
      : [
          colors.accentLavender,
          colors.accentPeach,
          colors.surfaceContainer,
          colors.accentLilac,
          colors.accentMorningBlue,
        ],
    fab: isLight ? colors.surfaceContainer : colors.surfaceContainerHigh,
    blob: isLight ? colors.accentLilac : colors.accentLavender,
    line: colors.divider,
    shadow: shadows.sm,
    pressScale: 0.97,
  };
}
