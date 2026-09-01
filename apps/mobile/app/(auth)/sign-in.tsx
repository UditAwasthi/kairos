import { useAuth, useSignIn } from '@clerk/expo';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedInput } from '../../components/ui/ThemedInput';
import { ThemedLink } from '../../components/ui/ThemedLink';
import { ThemedText } from '../../components/ThemedText';
import { navigateToApp } from '../../lib/auth-navigation';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function SignInScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { themeProgress, isLight } = useAppTheme();
  const router = useRouter();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLoaded) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: isLight ? '#ffffff' : '#000000' },
        ]}
      >
        <ActivityIndicator size="large" color={isLight ? '#111111' : '#ffffff'} />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  const handleSignIn = async () => {
    if (!signIn) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signIn.password({ identifier, password });

      if (error) {
        setErrorMessage(error.message ?? 'Sign in failed');
        return;
      }

      const { error: finalizeError } = await signIn.finalize();

      if (finalizeError) {
        setErrorMessage(
          finalizeError.message ?? 'Sign in could not be completed',
        );
        return;
      }

      navigateToApp(router);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Sign in failed',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorTextColor = isLight ? '#D71921' : '#FF453A';

  return (
    <AuthScreenLayout
      title="Sign in"
      subtitle="Use your email or username, or continue with a connected provider."
      footer={
        <View style={styles.footerRow}>
          <ThemedText
            themeProgress={themeProgress}
            colorKey="textSecondary"
            style={styles.footerText}
          >
            Need an account?{' '}
          </ThemedText>
          <ThemedLink href="/(auth)/sign-up" label="Sign up" />
        </View>
      }
    >
      <ThemedInput
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        keyboardType="email-address"
        placeholder="Email or username"
        value={identifier}
        onChangeText={setIdentifier}
      />
      <ThemedInput
        editable={!isSubmitting}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {errorMessage ? (
        <Text style={[styles.errorText, { color: errorTextColor }]}>
          {errorMessage}
        </Text>
      ) : null}

      <ThemedButton
        disabled={isSubmitting}
        label={isSubmitting ? 'Signing in…' : 'Sign in'}
        onPress={() => void handleSignIn()}
      />

      <OAuthButtons disabled={isSubmitting} onError={setErrorMessage} />
      <View nativeID="clerk-captcha" />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginVertical: 4,
  },
  footerText: {
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});