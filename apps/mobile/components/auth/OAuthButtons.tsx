import type { OAuthStrategy } from '@clerk/expo/types';
import { useSSO } from '@clerk/expo/experimental';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useCallback, useEffect } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';

import { navigateToApp } from '../../lib/auth-navigation';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemedText } from '../ThemedText';
import { themeColor } from '../../themeAnimation';

WebBrowser.maybeCompleteAuthSession();

const redirectUrl = AuthSession.makeRedirectUri({
  scheme: 'kairos',
  path: 'sso-callback',
});

const OAUTH_PROVIDERS: { strategy: OAuthStrategy; label: string }[] = [
  { strategy: 'oauth_google', label: 'Continue with Google' },
  { strategy: 'oauth_github', label: 'Continue with GitHub' },
  { strategy: 'oauth_linkedin_oidc', label: 'Continue with LinkedIn' },
];

type OAuthButtonsProps = {
  disabled?: boolean;
  onError?: (message: string) => void;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function OAuthButton({
  label,
  disabled,
  onPress,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { themeProgress } = useAppTheme();
  const press = useSharedValue(0);

  const buttonStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      press.value,
      [0, 1],
      [themeColor(themeProgress.value, 'buttonFill'), themeColor(themeProgress.value, 'buttonPressedFill')],
    ),
    borderColor: interpolateColor(
      press.value,
      [0, 1],
      [themeColor(themeProgress.value, 'border'), themeColor(themeProgress.value, 'borderActive')],
    ),
    opacity: disabled ? 0.5 : 1,
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      press.value,
      [0, 1],
      [themeColor(themeProgress.value, 'buttonText'), themeColor(themeProgress.value, 'buttonPressedText')],
    ),
  }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        press.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      onPressOut={() => {
        press.value = withSpring(0, { damping: 14, stiffness: 280 });
      }}
      style={[styles.button, buttonStyle]}
    >
      <Animated.Text style={[styles.buttonText, textStyle]}>{label}</Animated.Text>
    </AnimatedPressable>
  );
}

export function OAuthButtons({ disabled = false, onError }: OAuthButtonsProps) {
  const { startSSOFlow } = useSSO();
  const { themeProgress } = useAppTheme();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android') {
      void WebBrowser.warmUpAsync();
      return () => {
        void WebBrowser.coolDownAsync();
      };
    }
  }, []);

  const handlePress = useCallback(
    async (strategy: OAuthStrategy) => {
      try {
        const result = await startSSOFlow({
          strategy,
          redirectUrl,
        });

        if (result.authSessionResult?.type === 'cancel') {
          return;
        }

        if (result.createdSessionId) {
          navigateToApp(router);
          return;
        }

        if (result.signUp?.status === 'complete') {
          const { error } = await result.signUp.finalize();
          if (error) {
            onError?.(error.message ?? 'Sign up could not be completed');
            return;
          }
          navigateToApp(router);
          return;
        }

        if (result.signIn?.status === 'complete') {
          const { error } = await result.signIn.finalize();
          if (error) {
            onError?.(error.message ?? 'Sign in could not be completed');
            return;
          }
          navigateToApp(router);
          return;
        }

        onError?.('OAuth sign-in did not complete. Please try again.');
      } catch (error) {
        onError?.(
          error instanceof Error ? error.message : 'OAuth sign-in failed',
        );
      }
    },
    [onError, router, startSSOFlow],
  );

  return (
    <View style={styles.container}>
      <ThemedText
        themeProgress={themeProgress}
        colorKey="textMuted"
        style={styles.dividerLabel}
      >
        OR CONTINUE WITH
      </ThemedText>
      {OAUTH_PROVIDERS.map(({ strategy, label }) => (
        <OAuthButton
          key={strategy}
          disabled={disabled}
          label={label}
          onPress={() => void handlePress(strategy)}
        />
      ))}
    </View>
  );
}

export function OAuthButtonsLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
  },
  dividerLabel: {
    textAlign: 'center',
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 4,
  },
  button: {
    borderWidth: 1,
    borderRadius: 27,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  loading: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
