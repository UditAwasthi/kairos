import { useAuth } from '@clerk/expo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { ObservationStatusCard } from '../../components/ui/ObservationStatusCard';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import {
  fetchObservations,
  isProcessingObservationStatus,
  reprocessObservation,
  type ApiObservation,
} from '../../lib/api';

const POLL_MS = 3000;

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [observations, setObservations] = useState<ApiObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const focusedRef = useRef(true);
  const observationsRef = useRef<ApiObservation[]>([]);
  observationsRef.current = observations;

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in required');
      const data = await fetchObservations(token);
      setObservations(data);
    } catch {
      setError('Unable to load activity.');
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      let cancelled = false;
      void (async () => {
        setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();

      const timer = setInterval(() => {
        if (!focusedRef.current) return;
        if (
          observationsRef.current.some((o) =>
            isProcessingObservationStatus(o.status),
          )
        ) {
          void load();
        }
      }, POLL_MS);

      return () => {
        cancelled = true;
        focusedRef.current = false;
        clearInterval(timer);
      };
    }, [load]),
  );

  const active = observations.filter((o) =>
    isProcessingObservationStatus(o.status),
  );
  const failed = observations.filter((o) => o.status === 'FAILED');
  const recentReady = observations
    .filter((o) => o.status === 'COMPLETED')
    .slice(0, 5);
  const visible = [...active, ...failed, ...recentReady];

  const onRetry = async (id: string) => {
    try {
      setRetryingId(id);
      const token = await getToken();
      if (!token) return;
      const updated = await reprocessObservation(token, id);
      setObservations((prev) =>
        prev.map((item) => (item.id === id ? updated : item)),
      );
    } catch {
      setError('Retry failed. Try again.');
    } finally {
      setRetryingId(null);
    }
  };

  if (loading && observations.length === 0) return <LoadingSkeleton rows={8} />;
  if (error && observations.length === 0) {
    return <ErrorState title="Unable to load activity" message={error} onRetry={() => void load()} />;
  }
  if (visible.length === 0) {
    return (
      <EmptyState
        title="Nothing processing"
        message="New captures show live processing status here while Kairos extracts, chunks, and embeds them."
        actionLabel="Capture"
        onAction={() => router.push('/(app)/(tabs)/capture')}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SurfaceCard>
        <ThemedText colorKey="text" style={styles.hero}>
          Processing {active.length} observation{active.length === 1 ? '' : 's'}
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          Status comes from the real observation pipeline. No fake percentages.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Activity" />
      {visible.map((observation) => (
        <ObservationStatusCard
          key={observation.id}
          observation={observation}
          retrying={retryingId === observation.id}
          onPress={() => router.push(`/(app)/observation/${observation.id}`)}
          onRetry={
            observation.status === 'FAILED'
              ? () => void onRetry(observation.id)
              : undefined
          }
        />
      ))}

      <ThemedButton label="Refresh" variant="outline" onPress={() => void load()} />
      <ThemedButton
        label="Capture another"
        onPress={() => router.push('/(app)/(tabs)/capture')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  hero: { fontFamily: 'DotGothic16_400Regular', fontSize: 20, letterSpacing: 1 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
});
