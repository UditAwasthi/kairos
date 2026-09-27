import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { SoftPage, SoftRow } from '../../components/ui/SoftScreen';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { ApiError, deleteMyData } from '../../lib/api';
import { useOnboarding } from '../../providers/OnboardingProvider';
import Recall from 'kairos-recall';

export default function DataScreen() {
  const router = useRouter();
  const { getToken, signOut } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onDeleteMyData = () => {
    Alert.alert('Delete all data?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setBusy(true);
              setMessage(null);
              const token = await getToken();
              if (!token) throw new ApiError('Sign in required.', 401);
              await Recall.stop().catch(() => undefined);
              await Recall.clearLocalData().catch(() => undefined);
              const result = await deleteMyData(token);
              setMessage(`Deleted ${result.deletedObservations}`);
              await signOut();
              await resetOnboarding();
              router.replace('/');
            } catch (err) {
              Alert.alert(
                'Unable to delete',
                err instanceof ApiError ? err.message : 'Try again.',
              );
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <SoftPage>
      <SoftRow icon="download" label="Export" meta="Soon" />
      <SoftRow icon="trash-2" label="Delete everything" />

      <ThemedButton
        label={busy ? '…' : 'Delete my data'}
        disabled={busy}
        onPress={onDeleteMyData}
      />

      {message ? (
        <ThemedText colorKey="textMuted" style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
  },
});
