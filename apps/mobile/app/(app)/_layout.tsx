import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, View } from 'react-native';

import { fetchRecallEntitlement } from '../../lib/api';
import { apiBaseUrl } from '../../lib/config';
import { useAppTheme } from '../../providers/ThemeProvider';
import Recall from 'kairos-recall';

export default function AppLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { colors } = useAppTheme();

  // Keep a fresh auth token in the native Recall service so background uploads
  // do not 401 and (previously) tear down MediaProjection.
  useEffect(() => {
    if (!isSignedIn || Platform.OS !== 'android' || !Recall.isAvailable()) {
      return;
    }

    let cancelled = false;

    const sync = async () => {
      try {
        const token = await getToken();
        if (cancelled || !token) return;
        await Recall.setAuthToken(token);
        const ent = await fetchRecallEntitlement(token).catch(() => null);
        await Recall.setConfig({
          apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
          ...(ent ? { entitlementAllowed: ent.allowed } : {}),
        });
      } catch {
        // Ignore — capture should keep running; uploads retry later.
      }
    };

    void sync();
    const interval = setInterval(() => void sync(), 3 * 60_000);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void sync();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      sub.remove();
    };
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter_600SemiBold',
          fontSize: 17,
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        animationDuration: 280,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
        gestureDirection: 'horizontal',
        animationTypeForReplace: 'push',
        ...(Platform.OS === 'ios'
          ? {
              headerBackButtonDisplayMode: 'minimal' as const,
            }
          : null),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="memory/[id]" options={{ title: 'Memory' }} />
      <Stack.Screen name="observation/[id]" options={{ title: 'Observation' }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="topics/index" options={{ title: 'Topics' }} />
      <Stack.Screen name="topics/[id]" options={{ title: 'Topic' }} />
      <Stack.Screen name="entities/index" options={{ title: 'Entities' }} />
      <Stack.Screen name="entities/[id]" options={{ title: 'Entity' }} />
      <Stack.Screen name="projects/index" options={{ title: 'Projects' }} />
      <Stack.Screen name="projects/new" options={{ title: 'New project' }} />
      <Stack.Screen name="projects/[id]/index" options={{ title: 'Project' }} />
      <Stack.Screen name="projects/[id]/add" options={{ title: 'Add observations' }} />
      <Stack.Screen name="observation/projects" options={{ title: 'Add to project' }} />
      <Stack.Screen name="related/[id]" options={{ title: 'Related' }} />
      <Stack.Screen name="activity" options={{ title: 'Processing' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="devices" options={{ title: 'Devices' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="recall" options={{ title: 'Recall' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="data" options={{ title: 'Data' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
