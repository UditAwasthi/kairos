import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { fetchEntity } from '../../../lib/api';

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to view this entity.');
    return fetchEntity({ token, id: String(id) });
  }, [getToken, id]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return <ErrorState title="Entity unavailable" message={error ?? undefined} onRetry={reload} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText colorKey="text" style={styles.title}>
        {data.name}
      </ThemedText>
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          {data.type} · {data.observationCount} observations
        </ThemedText>
      </SurfaceCard>

      <ThemedButton
        label="Ask about this entity"
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/ask',
            params: { scopeType: 'entity', scopeId: data.id, scopeName: data.name },
          })
        }
      />
      <ThemedButton
        label="Search this entity"
        variant="outline"
        onPress={() =>
          router.push({
            pathname: '/(app)/search',
            params: { entityId: data.id, entityName: data.name },
          })
        }
      />

      <SectionHeader title="Observations" />
      {data.observations.length === 0 ? (
        <EmptyState
          title="No observations"
          message="No completed observations are linked to this entity yet."
        />
      ) : (
        data.observations.map((observation) => (
          <Pressable
            key={observation.id}
            onPress={() => router.push(`/(app)/observation/${observation.id}`)}
          >
            <SurfaceCard>
              <ThemedText colorKey="text" style={styles.cardTitle}>
                {observation.filename}
              </ThemedText>
              <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={3}>
                {observation.summary || observation.extractedText || observation.mimeType}
              </ThemedText>
            </SurfaceCard>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'DotGothic16_400Regular', fontSize: 28, letterSpacing: 1 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 4 },
});
