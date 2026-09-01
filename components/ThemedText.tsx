import { StyleSheet, TextProps, TextStyle } from 'react-native';
import Animated, {
  AnimatedStyle,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { ImageStyle } from 'react-native';

import { AppTheme } from '../theme';
import { themeColor } from '../themeAnimation';

type ThemedTextProps = TextProps & {
  themeProgress: SharedValue<number>;
  colorKey: keyof AppTheme;
  style?: TextStyle | TextStyle[];
};

export function ThemedText({
  themeProgress,
  colorKey,
  style,
  ...props
}: ThemedTextProps) {
  const colorStyle = useAnimatedStyle(() => ({
    color: themeColor(themeProgress.value, colorKey),
  }));

  return <Animated.Text style={[style, colorStyle]} {...props} />;
}

type ThemedLogoProps = {
  themeProgress: SharedValue<number>;
  logoStyle: AnimatedStyle<ImageStyle>;
};

export function ThemedLogo({ themeProgress, logoStyle }: ThemedLogoProps) {
  const darkLogoStyle = useAnimatedStyle(() => ({
    opacity: 1 - themeProgress.value,
  }));

  const lightLogoStyle = useAnimatedStyle(() => ({
    opacity: themeProgress.value,
  }));

  return (
    <Animated.View style={styles.logoWrap}>
      <Animated.Image
        source={require('../assets/logo-light.png')}
        style={[styles.logo, logoStyle, darkLogoStyle]}
        resizeMode="contain"
      />
      <Animated.Image
        source={require('../assets/logo-dark.png')}
        style={[styles.logo, styles.logoOverlay, logoStyle, lightLogoStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    width: 120,
    height: 120,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  logoOverlay: {
    position: 'absolute',
  },
});
