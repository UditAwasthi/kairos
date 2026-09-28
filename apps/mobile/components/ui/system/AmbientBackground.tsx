import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '../../../providers/ThemeProvider';

type AmbientBackgroundProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Red falling into black. Light mode falls into the light field so body text stays readable. */
export function AmbientBackground({ children, style }: AmbientBackgroundProps) {
  const { colors, isLight } = useAppTheme();
  const wash = isLight
    ? ([colors.primary, colors.background, colors.background] as const)
    : ([colors.primary, '#2A1214', colors.background] as const);

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, style]}>
      <LinearGradient
        colors={wash}
        locations={[0, 0.32, 0.62]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
