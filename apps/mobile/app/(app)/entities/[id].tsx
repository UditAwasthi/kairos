import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '../../../components/ThemedText';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../../components/ui/EmptyState';
import { GlassPanel } from '../../../components/ui/Glass';
import { SoftLinkList, SoftPage, SoftTitle } from '../../../components/ui/SoftScreen';
import { useAsync } from '../../../hooks/useAsync';
import { fetchEntity } from '../../../lib/api';

export default function EntityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(
    async () => {
      const token = await getToken();
      if (!token) throw new Error('Sign in required');
      return fetchEntity({ token, id: String(id) });
    },
    [getToken, id],
    { resetKey: String(id), cacheKey: 'entity' },
  );

  if (loading && !data) return <LoadingSkeleton rows={8} />;
  if ((error && !data) || !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        <SoftTitle>{data.name}</SoftTitle>

        <GlassPanel padded={false} contentStyle={styles.metaRow}>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {data.type} · {data.observationCount}
          </ThemedText>
        </GlassPanel>

        <SoftLinkList
          items={[
            {
              label: 'Ask',
              icon: 'message-circle',
              onPress: () =>
                router.push({
                  pathname: '/(app)/(tabs)/ask',
                  params: { scopeType: 'entity', scopeId: data.id, scopeName: data.name },
                }),
            },
            {
              label: 'Search',
              icon: 'search',
              onPress: () =>
                router.push({
                  pathname: '/(app)/search',
                  params: { entityId: data.id, entityName: data.name },
                }),
            },
          ]}
        />

        <ThemedText colorKey="textMuted" style={styles.kicker}>
          Observations
        </ThemedText>

        {data.observations.length === 0 ? (
          <EmptyState title="None yet" />
        ) : (
          data.observations.map((observation) => (
            <Pressable
              key={observation.id}
              onPress={() => router.push(`/(app)/observation/${observation.id}`)}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
            >
              <GlassPanel padded={false} contentStyle={styles.row}>
                <ThemedText colorKey="text" style={styles.rowTitle} numberOfLines={2}>
                  {observation.filename}
                </ThemedText>
              </GlassPanel>
            </Pressable>
          ))
        )}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
});
