import { useAuth, useUser } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { ThemeToggleButton } from '../../../components/ThemeToggleButton';
import { SoftLinkList, SoftPage } from '../../../components/ui/SoftScreen';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { useOnboarding } from '../../../providers/OnboardingProvider';
import { useAppTheme } from '../../../providers/ThemeProvider';
import Recall from 'kairos-recall';

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { colors, themeProgress, toggleTheme } = useAppTheme();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

      <SoftLinkList
        items={[
          { label: 'Settings', icon: 'settings', onPress: () => router.push('/(app)/settings') },
          { label: 'Timeline', icon: 'clock', onPress: () => router.push('/(app)/timeline') },
          {
            label: 'Notifications',
            icon: 'bell',
            onPress: () => router.push('/(app)/notifications'),
          },
          { label: 'Devices', icon: 'smartphone', onPress: () => router.push('/(app)/devices') },
          { label: 'Privacy', icon: 'shield', onPress: () => router.push('/(app)/privacy') },
          { label: 'Data', icon: 'database', onPress: () => router.push('/(app)/data') },
          { label: 'Topics', icon: 'hash', onPress: () => router.push('/(app)/topics') },
          { label: 'Projects', icon: 'folder', onPress: () => router.push('/(app)/projects') },
          { label: 'Activity', icon: 'layers', onPress: () => router.push('/(app)/activity') },
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
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 24,
    letterSpacing: -0.3,
  },
  email: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  signOut: { marginTop: 4 },
});
