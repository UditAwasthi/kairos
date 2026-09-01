import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, useColorScheme } from 'react-native';
import {
  useFonts,
  DotGothic16_400Regular,
} from '@expo-google-fonts/dotgothic16';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OnboardingCarousel } from './components/OnboardingCarousel';
import { useThemeTransition } from './hooks/useThemeTransition';
import { darkTheme, lightTheme } from './theme';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    DotGothic16_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const { themeProgress, toggleTheme } = useThemeTransition();
  const [statusBarStyle, setStatusBarStyle] = useState<'light' | 'dark'>(
    colorScheme === 'dark' ? 'light' : 'dark'
  );

  const screenOpacity = useSharedValue(0);
  const dotPhase = useSharedValue(0);
  const logoFloat = useSharedValue(0);

  const updateStatusBar = useCallback((isLightTheme: boolean) => {
    setStatusBarStyle(isLightTheme ? 'dark' : 'light');
  }, []);

  useAnimatedReaction(
    () => themeProgress.value > 0.5,
    (isLightTheme, prev) => {
      if (isLightTheme !== prev) {
        runOnJS(updateStatusBar)(isLightTheme);
      }
    },
    [updateStatusBar]
  );

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    SplashScreen.hideAsync();

    screenOpacity.value = withTiming(1, { duration: 500 });

    dotPhase.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.linear }),
      -1,
      false
    );

    logoFloat.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [fontsLoaded, dotPhase, logoFloat, screenOpacity]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [darkTheme.background, lightTheme.background]
    ),
  }));

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Animated.View style={[styles.container, screenStyle]}>
        <StatusBar style={statusBarStyle} />
        <OnboardingCarousel
          dotPhase={dotPhase}
          logoFloat={logoFloat}
          themeProgress={themeProgress}
          onToggleTheme={toggleTheme}
        />
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
