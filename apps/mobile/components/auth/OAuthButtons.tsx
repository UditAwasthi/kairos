import type { OAuthStrategy } from '@clerk/expo/types';
import { useSSO } from '@clerk/expo/experimental';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as WebBrowser from 'expo-web-browser';

import {
  beginSsoFlow,
  classifyOAuthResult,
  endSsoFlow,
  logOAuthDevEvent,
  navigateToAppWhenSignedIn,
  getOAuthRedirectUrl,
} from '../../lib/auth-oauth';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemedText } from '../ThemedText';
import { themeColor } from '../../themeAnimation';

WebBrowser.maybeCompleteAuthSession();

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
  const [activeStrategy, setActiveStrategy] = useState<OAuthStrategy | null>(null);

  const isOAuthBusy = activeStrategy !== null;
  const buttonsDisabled = disabled || isOAuthBusy;

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
      if (isOAuthBusy) {
        return;
      }

      setActiveStrategy(strategy);
      beginSsoFlow();

      try {
        const result = await startSSOFlow({
          strategy,
          redirectUrl: getOAuthRedirectUrl(),
        });

        if (
          result.authSessionResult?.type === 'cancel' ||
          result.authSessionResult?.type === 'dismiss'
        ) {
          logOAuthDevEvent('cancelled', { strategy });
          return;
        }

        const outcome = classifyOAuthResult(result);

        if (outcome.type === 'error') {
          logOAuthDevEvent(outcome.kind, { strategy });
          onError?.(outcome.message);
          return;
        }

        const navigated = await navigateToAppWhenSignedIn(router);

        if (navigated) {
          logOAuthDevEvent('success', { strategy });
          return;
        }

        if (outcome.type === 'pending') {
          logOAuthDevEvent('incomplete_flow', { strategy });
          onError?.('OAuth sign-in did not complete. Please try again.');
          return;
        }

        onError?.('Sign-in completed but the session could not be activated. Please try again.');
      } catch (error) {
        logOAuthDevEvent('clerk_auth_failure', {
          strategy,
          message: error instanceof Error ? error.message : 'unknown',
        });
        onError?.(
          error instanceof Error ? error.message : 'OAuth sign-in failed',
        );
      } finally {
        endSsoFlow();
        setActiveStrategy(null);
      }
    },
    [isOAuthBusy, onError, router, startSSOFlow],
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
          disabled={buttonsDisabled}
          label={label}
          onPress={() => void handlePress(strategy)}
        />
      ))}
      {isOAuthBusy ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : null}
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
