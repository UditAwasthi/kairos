import { useAuth } from '@clerk/expo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { SoftPage } from '../../components/ui/SoftScreen';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
} from '../../components/ui/EmptyState';
import { ObservationStatusCard } from '../../components/ui/ObservationStatusCard';
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
  const { getToken } = useAuth();
  const [observations, setObservations] = useState<ApiObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const focusedRef = useRef(true);
  const observationsRef = useRef<ApiObservation[]>([]);
  const hasDataRef = useRef(false);
  observationsRef.current = observations;

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in required');
      const data = await fetchObservations(token);
      setObservations(data);
      hasDataRef.current = true;
    } catch {
      setError('Unable to load');
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      let cancelled = false;
      void (async () => {
        if (!hasDataRef.current) setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();

      const timer = setInterval(() => {
        if (!focusedRef.current) return;
        if (
          observationsRef.current.some((o) => isProcessingObservationStatus(o.status))
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

  const active = observations.filter((o) => isProcessingObservationStatus(o.status));
  const failed = observations.filter((o) => o.status === 'FAILED');
  const recentReady = observations.filter((o) => o.status === 'COMPLETED').slice(0, 5);
  const visible = [...active, ...failed, ...recentReady];

  const onRetry = async (id: string) => {
    try {
      setRetryingId(id);
      const token = await getToken();
      if (!token) return;
      const updated = await reprocessObservation(token, id);
      setObservations((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch {
      setError('Retry failed');
    } finally {
      setRetryingId(null);
    }
  };

  if (loading && observations.length === 0) return <LoadingSkeleton rows={8} />;
  if (error && observations.length === 0) {
    return <ErrorState title="Unable to load" onRetry={() => void load()} />;
  }
  if (visible.length === 0) {
    return (
      <SoftPage>
        <EmptyState
          title="Quiet"
          actionLabel="Capture something"
          onAction={() => router.push('/(app)/quick-capture')}
        />
      </SoftPage>
    );
  }

  return (
    <FadeInContent>
      <SoftPage>
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

        <ThemedButton
          label="Capture something"
          onPress={() => router.push('/(app)/quick-capture')}
        />
      </SoftPage>
    </FadeInContent>
  );
}
