import { useAuth, useUser } from '@clerk/expo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { ThemeToggleButton } from '../../../components/ThemeToggleButton';
import { GlassPanel } from '../../../components/ui/Glass';
import { TabScreenSwipe } from '../../../components/TabScreenSwipe';
import { SoftLinkList, SoftPage, SoftRow } from '../../../components/ui/SoftScreen';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { listPendingCaptures } from '../../../lib/captureQueue';
import {
  profileSyncCopy,
  subscribeCaptureSync,
} from '../../../lib/syncStatus';
import { useOnboarding } from '../../../providers/OnboardingProvider';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useSubscription } from '../../../providers/SubscriptionProvider';
import Recall from 'kairos-recall';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { colors, themeProgress, toggleTheme } = useAppTheme();
  const subscription = useSubscription();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [syncCopy, setSyncCopy] = useState(() => profileSyncCopy(0));

  const refreshQueue = useCallback(() => {
    void listPendingCaptures()
      .then((items) => setSyncCopy(profileSyncCopy(items.length)))
      .catch(() => setSyncCopy(profileSyncCopy(0)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshQueue();
      return subscribeCaptureSync(refreshQueue);
    }, [refreshQueue]),
  );

  const name = user?.fullName || user?.firstName || 'Kairos';
  const email = user?.primaryEmailAddress?.emailAddress;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await Recall.stop().catch(() => undefined);
      await Recall.clearLocalData().catch(() => undefined);
      await Recall.setAuthToken(null).catch(() => undefined);
      await signOut();
      await resetOnboarding();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <TabScreenSwipe>
    <SoftPage tabBar safeTop>
      <View style={styles.header}>
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.accentGlow }]}>
            <ThemedText colorKey="accent" style={styles.avatarLetter}>
              {name.slice(0, 1).toUpperCase()}
            </ThemedText>
          </View>
        )}
        <View style={styles.headerText}>
          <ThemedText colorKey="text" style={styles.name} numberOfLines={1}>
            {name}
          </ThemedText>
          {email ? (
            <ThemedText colorKey="textMuted" style={styles.email} numberOfLines={1}>
              {email}
            </ThemedText>
          ) : null}
        </View>
        <ThemeToggleButton themeProgress={themeProgress} onToggle={toggleTheme} />
      </View>

      <View>
        <ThemedText colorKey="textMuted" style={styles.subscriptionLabel}>Subscription</ThemedText>
        <SoftRow
          label="Kairos Pro"
          icon="clock"
          meta={subscription.isLoading ? 'Loading' : Platform.OS !== 'android' || !Recall.isAvailable() ? 'Screen memory is Android only' : subscription.isPro ? 'Active' : 'Unlock Screen memory'}
          onPress={Platform.OS === 'android' && Recall.isAvailable() && !subscription.isPro ? () => router.push('/(app)/screen-memory') : undefined}
        />
        {subscription.isPro ? (
          <SoftRow label="Manage Subscription" icon="external-link" onPress={() => void subscription.manageSubscriptions()} />
        ) : null}
      </View>

      <GlassPanel>
        <ThemedText colorKey="textMuted" style={styles.syncKicker}>
          Offline captures
        </ThemedText>
        <ThemedText colorKey="text" style={styles.syncTitle}>
          {syncCopy.title}
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.syncDetail}>
          {syncCopy.detail}
        </ThemedText>
      </GlassPanel>

      <SoftLinkList
        items={[
          { label: 'Progress', icon: 'award', onPress: () => router.push('/(app)/progress') },
          { label: 'Insights', icon: 'bar-chart-2', onPress: () => router.push('/(app)/insights') },
          ...(Platform.OS === 'android' && Recall.isAvailable() ? [
            { label: 'Screen memory', icon: 'eye' as const, onPress: () => router.push('/(app)/screen-memory') },
          ] : []),
          { label: 'Devices', icon: 'smartphone', onPress: () => router.push('/(app)/devices') },
          { label: 'Privacy & Data', icon: 'shield', onPress: () => router.push('/(app)/privacy') },
          { label: 'Settings', icon: 'settings', onPress: () => router.push('/(app)/settings') },
          {
            label: 'How it works',
            icon: 'book-open',
            onPress: () => router.push('/(app)/how-it-works'),
          },
          { label: 'About', icon: 'info', onPress: () => router.push('/(app)/about') },
        ]}
      />

      <ThemedButton
        disabled={isSigningOut}
        label={isSigningOut ? '…' : 'Sign out'}
        onPress={() => void handleSignOut()}
        style={styles.signOut}
      />
    </SoftPage>
    </TabScreenSwipe>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  headerText: { flex: 1, gap: 2 },
  name: {
    fontFamily: 'Inter_400Regular',
    fontSize: 22,
    letterSpacing: 0,
  },
  email: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  syncKicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  subscriptionLabel: { fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  syncTitle: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  syncDetail: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  signOut: { marginTop: 4 },
});
