import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { ApiError, deleteMyData } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';
import { useOnboarding } from '../../providers/OnboardingProvider';

export default function DataScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeProgress } = useAppTheme();
  const { getToken, signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onDeleteMyData = () => {
    Alert.alert(
      'Delete all Kairos data?',
      'This permanently deletes your observations, chunks, embeddings, projects, conversations, topics, entities, and uploaded files from Kairos. Your Clerk login is not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my data',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setBusy(true);
                setMessage(null);
                const token = await getToken();
                if (!token) throw new ApiError('Sign in required.', 401);
                const result = await deleteMyData(token);
                setMessage(
                  `Deleted ${result.deletedObservations} observation${
                    result.deletedObservations === 1 ? '' : 's'
                  } and related Kairos data.`,
                );
                await signOut();
                await resetOnboarding();
                router.replace('/');
              } catch (err) {
                Alert.alert(
                  'Unable to delete data',
                  err instanceof ApiError ? err.message : 'Try again.',
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Export" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Data export is not available yet.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Delete my Kairos data" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Permanently erase observations, derived records, conversations, projects,
          and uploaded media owned by your account. This cannot be undone.
        </ThemedText>
      </SurfaceCard>
      <ThemedButton
        label={busy ? 'Deleting…' : 'Delete my data'}
        disabled={busy}
        onPress={onDeleteMyData}
      />

      <SectionHeader title="Clerk account" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Deleting Kairos data does not close your Clerk identity. Use Clerk
          account settings if you also need to remove the login itself.
        </ThemedText>
      </SurfaceCard>

      {message ? (
        <SurfaceCard>
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.body}>
            {message}
          </ThemedText>
        </SurfaceCard>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});
