import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
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
      return 'Technologies';
    case 'PERSON':
      return 'People';
    case 'ORGANIZATION':
      return 'Organizations';
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
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to view entities.');
    return fetchEntities({ token, limit: 100 });
  }, [getToken]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) return <ErrorState title="Unable to load entities" message={error} onRetry={reload} />;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No entities yet"
        message="Entities appear after Kairos analyzes your uploaded documents."
      />
    );
  }

  const groups = groupByType(data.items);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Entities" subtitle="People, tools, and concepts you captured" />
      {groups.map(([type, items]) => (
        <View key={type} style={styles.group}>
          <ThemedText colorKey="textMuted" style={styles.kicker}>
            {typeLabel(type)}
          </ThemedText>
          {items.map((entity) => (
            <Pressable
              key={entity.id}
              onPress={() => router.push(`/(app)/entities/${entity.id}`)}
            >
              <SurfaceCard>
                <ThemedText colorKey="text" style={styles.title}>
                  {entity.name}
                </ThemedText>
                <ThemedText colorKey="textMuted" style={styles.meta}>
                  {entity.observationCount} observations
                </ThemedText>
              </SurfaceCard>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  group: { gap: 8 },
  kicker: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 8,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
});
