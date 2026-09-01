import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { ApiError, fetchAuthMe } from '../../lib/api';
import { useOnboarding } from '../../providers/OnboardingProvider';
import { useAppTheme } from '../../providers/ThemeProvider';
import { themeColor } from '../../themeAnimation';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export default function ProfileScreen() {
  const { getToken, signOut, userId } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { themeProgress } = useAppTheme();
  const [backendIdentity, setBackendIdentity] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: themeColor(themeProgress.value, 'border'),
  }));

  const loadBackendIdentity = useCallback(async () => {
    setIsLoadingApi(true);
    setApiError(null);

    try {
      const token = await getToken();

      if (!token) {
        throw new ApiError('Missing session token', 401);
      }

      const response = await fetchAuthMe(token);
      setBackendIdentity(response.id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setApiError('Backend rejected the session (401).');
      } else if (error instanceof Error) {
        setApiError(error.message);
      } else {
        setApiError('Could not reach the backend.');
      }
      setBackendIdentity(null);
    } finally {
      setIsLoadingApi(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadBackendIdentity();
  }, [loadBackendIdentity]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await signOut();
      await resetOnboarding();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.title}>
        Profile
      </ThemedText>

      <Animated.View style={[styles.card, cardStyle]}>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.label}>
          Clerk user id
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.value}>
          {userId ?? 'Unknown'}
        </ThemedText>
      </Animated.View>

      <Animated.View style={[styles.card, cardStyle]}>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.label}>
          Backend /auth/me
        </ThemedText>
        {isLoadingApi ? (
          <ActivityIndicator />
        ) : backendIdentity ? (
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.value}>
            {backendIdentity}
          </ThemedText>
        ) : (
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.error}>
            {apiError ?? 'Not verified'}
          </ThemedText>
        )}
      </Animated.View>

      <ThemedButton
        disabled={isSigningOut}
        label="Refresh backend identity"
        variant="outline"
        onPress={() => void loadBackendIdentity()}
      />

      <ThemedButton
        disabled={isSigningOut}
        label={isSigningOut ? 'Signing out…' : 'Sign out'}
        onPress={() => void handleSignOut()}
        style={styles.signOutButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 16,
  },
  title: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 28,
    letterSpacing: 2,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  label: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  error: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#D71921',
  },
  signOutButton: {
    marginTop: 'auto',
  },
});
