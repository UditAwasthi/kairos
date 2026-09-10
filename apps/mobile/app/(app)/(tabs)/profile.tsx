import { useAuth, useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '../../../components/ThemeToggleButton';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedText } from '../../../components/ThemedText';
import { useOnboarding } from '../../../providers/OnboardingProvider';
import { useAppTheme } from '../../../providers/ThemeProvider';

const LINKS = [
  { label: 'Settings', href: '/(app)/settings' },
  { label: 'Notifications', href: '/(app)/notifications' },
  { label: 'Connected devices', href: '/(app)/devices' },
  { label: 'Privacy', href: '/(app)/privacy' },
  { label: 'Data controls', href: '/(app)/data' },
  { label: 'Topics', href: '/(app)/topics' },
  { label: 'Projects', href: '/(app)/projects' },
  { label: 'Processing activity', href: '/(app)/activity' },
  { label: 'About', href: '/(app)/about' },
] as const;

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const { themeProgress, toggleTheme } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const name = user?.fullName || user?.firstName || 'Kairos user';
  const email = user?.primaryEmailAddress?.emailAddress ?? 'No email';

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
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        {user?.imageUrl ? (
          <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.avatarLetter}>
              {name.slice(0, 1).toUpperCase()}
            </ThemedText>
          </View>
        )}
        <View style={styles.headerText}>
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.name}>
            {name}
          </ThemedText>
          <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.email}>
            {email}
          </ThemedText>
        </View>
        <ThemeToggleButton themeProgress={themeProgress} onToggle={toggleTheme} />
      </View>

      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.kicker}>
          Account
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.row}>
          Authenticated with Clerk
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.meta}>
          Personal AI memory · mock services active
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Manage" />
      <SurfaceCard style={styles.linkCard}>
        {LINKS.map((link) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            style={styles.linkRow}
            accessibilityRole="button"
          >
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.linkLabel}>
              {link.label}
            </ThemedText>
            <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.chevron}>
              →
            </ThemedText>
          </Pressable>
        ))}
      </SurfaceCard>

      <ThemedButton
        disabled={isSigningOut}
        label={isSigningOut ? 'Signing out…' : 'Sign out'}
        onPress={() => void handleSignOut()}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontFamily: 'Inter_600SemiBold', fontSize: 22 },
  headerText: { flex: 1, gap: 4 },
  name: { fontFamily: 'DotGothic16_400Regular', fontSize: 22, letterSpacing: 1 },
  email: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  row: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  linkCard: { paddingVertical: 4 },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 8,
  },
  linkLabel: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  chevron: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  signOut: { marginTop: 8 },
});
