import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, View } from 'react-native';

import { fetchTodayInsight } from '../../lib/api';
import { flushCaptureQueue } from '../../lib/capture';
import { consumePendingOsCapture, KairosOs } from '../../lib/osIntegrations';
import { ensureRecallReady } from '../../lib/recallSync';
import { useAppTheme } from '../../providers/ThemeProvider';
import Recall from 'kairos-recall';

export default function AppLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { colors } = useAppTheme();

  // Keep a fresh auth token in the native Recall service so background uploads
  // do not 401 and (previously) tear down MediaProjection.
  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    const syncNative = (force = false) => {
      if (cancelled) return;
      void getToken().then(async (token) => {
        if (!token) return;
        await KairosOs.setAuthToken(token);
        try {
          const insight = await fetchTodayInsight(token);
          await KairosOs.refreshWidget(insight.body);
        } catch {
          // Widget keeps its last cached insight.
        }
      });
      if (Platform.OS === 'android' && Recall.isAvailable()) {
        void ensureRecallReady(getToken, { force });
      }
    };

    const flush = async () => {
      try {
        const token = await getToken();
        if (token) await flushCaptureQueue(token);
      } catch {
        // Queue remains local until the next successful flush.
      }
    };

    syncNative();
    void consumePendingOsCapture(getToken);
    void flush();
    const interval = setInterval(() => syncNative(true), 3 * 60_000);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        syncNative();
        void consumePendingOsCapture(getToken);
        void flush();
      }
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
          fontFamily: 'PlayfairDisplay_400Regular',
          fontSize: 18,
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
      <Stack.Screen
        name="quick-capture"
        options={{ title: 'Capture', presentation: 'modal' }}
      />
      <Stack.Screen
        name="voice-capture"
        options={{ title: 'Voice', presentation: 'modal' }}
      />
      <Stack.Screen name="insight" options={{ title: 'Today' }} />
      <Stack.Screen name="timeline" options={{ title: 'Timeline' }} />
      <Stack.Screen name="memory/[id]" options={{ title: 'Memory' }} />
      <Stack.Screen name="observation/[id]" options={{ title: 'Memory' }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="topics/index" options={{ title: 'Topics' }} />
      <Stack.Screen name="topics/[id]" options={{ title: 'Topic' }} />
      <Stack.Screen name="entities/index" options={{ title: 'Entities' }} />
      <Stack.Screen name="entities/[id]" options={{ title: 'Entity' }} />
      <Stack.Screen name="projects/index" options={{ title: 'Projects' }} />
      <Stack.Screen name="projects/new" options={{ title: 'New' }} />
      <Stack.Screen name="projects/[id]/index" options={{ title: 'Project' }} />
      <Stack.Screen name="projects/[id]/add" options={{ title: 'Add' }} />
      <Stack.Screen name="observation/projects" options={{ title: 'Projects' }} />
      <Stack.Screen name="related/[id]" options={{ title: 'Related' }} />
      <Stack.Screen name="activity" options={{ title: 'Activity' }} />
      <Stack.Screen name="notifications" options={{ title: 'Updates' }} />
      <Stack.Screen name="devices" options={{ title: 'Devices' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
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
