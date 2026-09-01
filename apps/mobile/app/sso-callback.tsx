import { useAuth } from '@clerk/expo';
import { getClerkInstance } from '@clerk/expo';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '../components/ThemedText';
import { navigateToApp } from '../lib/auth-navigation';
import { useAppTheme } from '../providers/ThemeProvider';

function sanitizeNonce(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.replace(/#.*$/, '').trim() || undefined;
}

export default function SsoCallbackScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const params = useLocalSearchParams<{ rotating_token_nonce?: string }>();
  const router = useRouter();
  const { themeProgress, isLight } = useAppTheme();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isLoaded || hasRun.current) {
      return;
    }

    hasRun.current = true;

    void (async () => {
      if (isSignedIn) {
        navigateToApp(router);
        return;
      }

      const nonce = sanitizeNonce(
        typeof params.rotating_token_nonce === 'string'
          ? params.rotating_token_nonce
          : undefined,
      );

      if (!nonce) {
        router.replace('/(auth)/sign-in');
        return;
      }

      try {
        const clerk = getClerkInstance();

        if (!clerk.client) {
          router.replace('/(auth)/sign-in');
          return;
        }

        const signIn = await clerk.client.signIn.reload({ rotatingTokenNonce: nonce });

        if (signIn.status === 'complete' && signIn.createdSessionId) {
          await clerk.setActive({ session: signIn.createdSessionId });
          navigateToApp(router);
          return;
        }

        if (signIn.firstFactorVerification?.status === 'transferable') {
          const signUp = await clerk.client.signUp.create({ transfer: true });

          if (signUp.createdSessionId) {
            await clerk.setActive({ session: signUp.createdSessionId });
            navigateToApp(router);
            return;
          }
        }

        router.replace('/(auth)/sign-in');
      } catch {
        router.replace('/(auth)/sign-in');
      }
    })();
  }, [isLoaded, isSignedIn, params.rotating_token_nonce, router]);

  if (isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={isLight ? '#111' : '#fff'} />
      <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.label}>
        Completing sign in…
      </ThemedText>
      <View nativeID="clerk-captcha" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  label: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
});
