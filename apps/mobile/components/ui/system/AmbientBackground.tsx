import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useAppTheme } from '../../../providers/ThemeProvider';

type AmbientBackgroundProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Screen wash: app background plus one soft lavender glow behind the focal area.
 *
 * ```tsx
 * <AmbientBackground>
 *   <HeroStatusWidget value="12" label="Memory health" progress={0.6} />
 * </AmbientBackground>
 * ```
 */
export function AmbientBackground({ children, style }: AmbientBackgroundProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id="kairosGlow" cx="50%" cy="42%" r="45%">
              <Stop offset="0" stopColor={colors.accent} stopOpacity={0.18} />
              <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#kairosGlow)" opacity={0.9} />
        </Svg>
      </View>
      {children}
    </View>
  );
}
