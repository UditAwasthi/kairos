import { useAuth } from '@clerk/expo';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import {
  fetchObservations,
  isProcessingObservationStatus,
  observationStageLabel,
  type ApiObservation,
} from '../../lib/api';

type ActivityItem = {
  id: string;
  title: string;
  body: string;
  href: string;
  tone: 'accent' | 'success' | 'neutral';
  createdAt: string;
};

function toActivity(observations: ApiObservation[]): ActivityItem[] {
  return observations
    .filter(
      (o) =>
        isProcessingObservationStatus(o.status) ||
        o.status === 'FAILED' ||
        o.status === 'COMPLETED',
    )
    .slice(0, 20)
    .map((o) => {
      const failed = o.status === 'FAILED';
      const ready = o.status === 'COMPLETED';
      return {
        id: o.id,
        title: o.filename,
        body: observationStageLabel(o),
        href: `/(app)/observation/${o.id}`,
        tone: ready ? 'success' : failed ? 'accent' : 'neutral',
        createdAt: o.updatedAt,
      };
    });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const token = await getToken();
      if (!token) throw new Error('Sign in required');
      const observations = await fetchObservations(token);
      setItems(toActivity(observations));
    } catch {
      setError('Unable to load activity updates.');
    }
  }, [getToken]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        setLoading(true);
        await load();
        if (!cancelled) setLoading(false);
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  if (loading && items.length === 0) return <LoadingSkeleton rows={6} />;
  if (error && items.length === 0) {
    return <ErrorState title="Unable to load notifications" message={error} onRetry={() => void load()} />;
  }
  if (items.length === 0) {
    return (
      <EmptyState
        title="All caught up"
        message="Processing updates for your observations will appear here."
        actionLabel="Capture"
        onAction={() => router.push('/(app)/(tabs)/capture')}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader
        title="Activity"
        subtitle="Live updates from your observation pipeline"
      />
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(item.href as `/${string}`)}
          accessibilityRole="button"
        >
          <SurfaceCard>
            <Badge
              label={
                item.tone === 'success'
                  ? 'Ready'
                  : item.tone === 'accent'
                    ? 'Failed'
                    : 'Processing'
              }
              tone={item.tone}
            />
            <ThemedText colorKey="text" style={styles.title}>
              {item.title}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {item.body}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.meta}>
              {new Date(item.createdAt).toLocaleString()}
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 8 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 4 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 8 },
});
