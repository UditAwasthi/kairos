import { useAuth } from '@clerk/expo';
import * as Notifications from 'expo-notifications';
import { Redirect, Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, View } from 'react-native';

import { fetchDashboard } from '../../lib/api';
import { flushCaptureQueue } from '../../lib/capture';
import {
  flushedCopy,
  hrefFromNotificationData,
  presentLocalNotification,
  registerPushForSignedInUser,
} from '../../lib/notifications';
import { recordCaptureSync, setCaptureSyncInflight } from '../../lib/syncStatus';
import { consumePendingOsCapture, KairosOs } from '../../lib/osIntegrations';
import { ensureRecallReady } from '../../lib/recallSync';
import { useAppTheme } from '../../providers/ThemeProvider';
import Recall from 'kairos-recall';

export default function AppLayout() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { colors } = useAppTheme();
  const router = useRouter();
  const handledResponseRef = useRef<string | null>(null);

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
          const dashboard = await fetchDashboard(token);
          await KairosOs.refreshWidget(
            dashboard.insight.empty
              ? dashboard.insight.body
              : `You've captured ${dashboard.todayCount} memories today.\n\n${dashboard.insight.body}`,
          );
        } catch {
          // Widget keeps its last cached insight.
        }
      });
      if (Platform.OS === 'android' && Recall.isAvailable()) {
        void ensureRecallReady(getToken, { force });
      }
    };

    const flush = async () => {
      setCaptureSyncInflight(true);
      try {
        const token = await getToken();
        if (token) {
          const result = await flushCaptureQueue(token);
          recordCaptureSync(result.flushed, result.remaining);
          const flushed = flushedCopy(result.flushed);
          if (flushed) void presentLocalNotification(flushed);
        }
      } catch {
        // Queue remains local until the next successful flush.
      } finally {
        setCaptureSyncInflight(false);
      }
    };

    void registerPushForSignedInUser(getToken);
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

  useEffect(() => {
    if (!isSignedIn) return;

    const openFromData = (data: Record<string, unknown> | undefined) => {
      const href = hrefFromNotificationData(data);
      if (!href) return;
      const key = `${href}:${JSON.stringify(data ?? {})}`;
      if (handledResponseRef.current === key) return;
      handledResponseRef.current = key;
      router.push(href as `/${string}`);
    };

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromData(response.notification.request.content.data as Record<string, unknown>);
    });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      openFromData(response.notification.request.content.data as Record<string, unknown>);
    });

    return () => {
      sub.remove();
    };
  }, [isSignedIn, router]);

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
      <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Stack.Screen name="predictions" options={{ title: 'Predictions' }} />
      <Stack.Screen name="brief" options={{ title: 'Brief' }} />
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
      <Stack.Screen name="how-it-works/index" options={{ title: 'How it works' }} />
      <Stack.Screen name="how-it-works/[id]" options={{ title: 'How it works' }} />
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
