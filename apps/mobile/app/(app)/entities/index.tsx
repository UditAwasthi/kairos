import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { SoftPage } from '../../../components/ui/SoftScreen';
import { GlassPanel } from '../../../components/ui/Glass';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../../components/ui/EmptyState';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { fetchEntities, type ApiEntitySummary } from '../../../lib/api';

function groupByType(items: ApiEntitySummary[]) {
  const map = new Map<string, ApiEntitySummary[]>();
  for (const item of items) {
    const list = map.get(item.type) ?? [];
    list.push(item);
    map.set(item.type, list);
  }
  return [...map.entries()];
}

function typeLabel(type: string): string {
  switch (type) {
    case 'TECHNOLOGY':
      return 'Tech';
    case 'PERSON':
      return 'People';
    case 'ORGANIZATION':
      return 'Orgs';
    case 'PRODUCT':
      return 'Products';
    case 'LOCATION':
      return 'Places';
    case 'CONCEPT':
      return 'Concepts';
    default:
      return type;
  }
}

export default function EntitiesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchEntities({ token, limit: 100 });
  }, [getToken], { cacheKey: 'entities' });

  if (loading && !data) return <LoadingSkeleton rows={8} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }
  if (!data || data.items.length === 0) {
    return (
      <SoftPage>
        <EmptyState title="None yet" />
      </SoftPage>
    );
  }

  const groups = groupByType(data.items);

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        {groups.map(([type, items]) => (
          <View key={type} style={styles.group}>
            <ThemedText colorKey="textMuted" style={styles.kicker}>
              {typeLabel(type)}
            </ThemedText>
            {items.map((entity) => (
              <Pressable
                key={entity.id}
                onPress={() => router.push(`/(app)/entities/${entity.id}`)}
                style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
              >
                <GlassPanel padded={false} contentStyle={styles.row}>
                  <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
                    {entity.name}
                  </ThemedText>
                  <ThemedText colorKey="textMuted" style={styles.meta}>
                    {entity.observationCount}
                  </ThemedText>
                </GlassPanel>
              </Pressable>
            ))}
          </View>
        ))}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  kicker: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  title: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});
