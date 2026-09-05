import { useAuth, useSignUp } from '@clerk/expo';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthScreenLayout } from '../../components/auth/AuthScreenLayout';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedInput } from '../../components/ui/ThemedInput';
import { ThemedLink } from '../../components/ui/ThemedLink';
import { ThemedText } from '../../components/ThemedText';
import { navigateToApp } from '../../lib/auth-navigation';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function SignUpScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signUp } = useSignUp();
  const { themeProgress, isLight, colors } = useAppTheme();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (isSignedIn) {
      navigateToApp(router);
    }
  }, [isSignedIn, router]);

  if (!isLoaded) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(app)" />;
  }

  const errorTextColor = colors.error;

  const handleSignUp = async () => {
    if (!signUp) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signUp.password({
        username: username.trim() || undefined,
        emailAddress: emailAddress.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message ?? 'Sign up failed');
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();

      if (sendError) {
        setErrorMessage(sendError.message ?? 'Could not send verification code');
        return;
      }

      setIsVerifying(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Sign up failed',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!signUp) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      if (error) {
        setErrorMessage(error.message ?? 'Verification failed');
        return;
      }

      const { error: finalizeError } = await signUp.finalize();

      if (finalizeError) {
        setErrorMessage(finalizeError.message ?? 'Sign up could not be completed');
        return;
      }

      navigateToApp(router);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Verification failed',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <View style={styles.footerRow}>
      <ThemedText
        themeProgress={themeProgress}
        colorKey="textSecondary"
        style={styles.footer}
      >
        Already have an account?{' '}
      </ThemedText>
      <ThemedLink href="/(auth)/sign-in" label="Sign in" />
    </View>
  );

  if (isVerifying) {
    return (
      <AuthScreenLayout
        title="Verify email"
        subtitle="Enter the verification code sent to your email address."
        footer={footer}
      >
        <ThemedInput
          editable={!isSubmitting}
          keyboardType="number-pad"
          placeholder="Verification code"
          value={verificationCode}
          onChangeText={setVerificationCode}
        />

        {errorMessage ? (
          <Text style={[styles.errorText, { color: errorTextColor }]}>
            {errorMessage}
          </Text>
        ) : null}

        <ThemedButton
          disabled={isSubmitting}
          label={isSubmitting ? 'Verifying…' : 'Verify and continue'}
          onPress={() => void handleVerify()}
        />
        <View nativeID="clerk-captcha" />
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout
      title="Create account"
      subtitle="Sign up with email and username, or continue with a connected provider."
      footer={footer}
    >
      <ThemedInput
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <ThemedInput
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
        keyboardType="email-address"
        placeholder="Email address"
        value={emailAddress}
        onChangeText={setEmailAddress}
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
        label={isSubmitting ? 'Creating account…' : 'Sign up'}
        onPress={() => void handleSignUp()}
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
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
