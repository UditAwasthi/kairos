import {
  DotGothic16_400Regular,
  useFonts,
} from '@expo-google-fonts/dotgothic16';
import {
  Inter_400Regular,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Animated, {
  interpolateColor,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useThemeTransition } from '../hooks/useThemeTransition';
import {
  AppTheme,
  darkTheme,
  lightTheme,
  radius,
  shadows,
  spacing,
  typography,
  TypographyScale,
} from '../theme';

SplashScreen.preventAutoHideAsync();

type ThemeContextValue = {
  /** Resolved semantic palette — edit theme.ts light/dark to restyle the app. */
  colors: AppTheme;
  typography: TypographyScale;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  themeProgress: SharedValue<number>;
  toggleTheme: () => void;
  isLight: boolean;
  fontsLoaded: boolean;
  dotPhase: SharedValue<number>;
  logoFloat: SharedValue<number>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    DotGothic16_400Regular,
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const { themeProgress, toggleTheme } = useThemeTransition();
  const [isLight, setIsLight] = useState(() => themeProgress.value > 0.5);
  const [statusBarStyle, setStatusBarStyle] = useState<'light' | 'dark'>(
    colorScheme === 'dark' ? 'light' : 'dark',
  );

  const screenOpacity = useSharedValue(0);
  const dotPhase = useSharedValue(0);
  const logoFloat = useSharedValue(0);

  const colors = isLight ? lightTheme : darkTheme;

  const updateThemeUi = useCallback((nextIsLight: boolean) => {
    setIsLight(nextIsLight);
    setStatusBarStyle(nextIsLight ? 'dark' : 'light');
  }, []);

  useAnimatedReaction(
    () => themeProgress.value > 0.5,
    (nextIsLight, prev) => {
      if (nextIsLight !== prev) {
        runOnJS(updateThemeUi)(nextIsLight);
      }
    },
    [updateThemeUi],
  );

  useEffect(() => {
    updateThemeUi(themeProgress.value > 0.5);
  }, [themeProgress, updateThemeUi]);

  useEffect(() => {
    if (!fontsLoaded) {
      return;
    }

    void SplashScreen.hideAsync();
    screenOpacity.value = withTiming(1, { duration: 280 });
    // No infinite logoFloat/dotPhase loops — they burned CPU on auth/onboarding.
  }, [fontsLoaded, screenOpacity]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    backgroundColor: interpolateColor(
      themeProgress.value,
      [0, 1],
      [darkTheme.background, lightTheme.background],
    ),
  }));

  const value = useMemo(
    () => ({
      colors,
      typography,
      spacing,
      radius,
      shadows,
      themeProgress,
      toggleTheme,
      isLight,
      fontsLoaded,
      dotPhase,
      logoFloat,
    }),
    [colors, dotPhase, fontsLoaded, isLight, logoFloat, themeProgress, toggleTheme],
  );

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      <Animated.View style={[styles.root, screenStyle]}>
        <StatusBar style={statusBarStyle} />
        {children}
      </Animated.View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
