import { useAuth, useUser } from '@clerk/expo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { SoftLinkList, SoftPage } from '../../../components/ui/SoftScreen';
import { KairosButton, KairosSurface, KairosText } from '../../../components/ui/Kairos';
import { listPendingCaptures } from '../../../lib/captureQueue';
import {
  profileSyncCopy,
  subscribeCaptureSync,
} from '../../../lib/syncStatus';
import { useOnboarding } from '../../../providers/OnboardingProvider';
import { useAppTheme } from '../../../providers/ThemeProvider';
import Recall from 'kairos-recall';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { colors } = useAppTheme();
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
    <SoftPage tabBar safeTop>
      <View style={styles.header}>
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarFallback, { backgroundColor: colors.surface }]}>
            <KairosText variant="title">{name.slice(0, 1).toUpperCase()}</KairosText>
          </View>
        )}
        <View style={styles.headerText}>
          <KairosText variant="heading">{name}</KairosText>
          {email ? (
            <KairosText variant="caption" color="textSecondary" numberOfLines={1}>
              {email}
            </KairosText>
          ) : null}
        </View>
      </View>

      <KairosSurface contentStyle={{ padding: 20, gap: 8 }}>
        <KairosText variant="label" color="textMuted">
          Sync
        </KairosText>
        <KairosText variant="title">{syncCopy.title}</KairosText>
        <KairosText variant="caption" color="textSecondary">
          {syncCopy.detail}
        </KairosText>
      </KairosSurface>

      <SoftLinkList
        items={[
          { label: 'Privacy & Recall', icon: 'shield', onPress: () => router.push('/(app)/privacy') },
          { label: 'Data', icon: 'database', onPress: () => router.push('/(app)/data') },
          { label: 'How it works', icon: 'book-open', onPress: () => router.push('/(app)/how-it-works') },
          { label: 'About', icon: 'info', onPress: () => router.push('/(app)/about') },
        ]}
      />

      <KairosButton
        disabled={isSigningOut}
        label={isSigningOut ? '…' : 'Sign out'}
        onPress={() => void handleSignOut()}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 4 },
});
