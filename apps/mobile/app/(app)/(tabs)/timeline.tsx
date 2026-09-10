import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { TimelineMemoryItem } from '../../../components/ui/MemoryCards';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { timelineService } from '../../../services';
import type { Memory, TimelineGroup } from '../../../types';

type ListItem =
  | { kind: 'header'; dateKey: string; label: string }
  | { kind: 'memory'; memory: Memory; isFirst: boolean; isLast: boolean };

function flatten(groups: TimelineGroup[]): ListItem[] {
  const items: ListItem[] = [];
  for (const group of groups) {
    items.push({ kind: 'header', dateKey: group.dateKey, label: group.label });
    group.memories.forEach((memory, index) => {
      items.push({
        kind: 'memory',
        memory,
        isFirst: index === 0,
        isLast: index === group.memories.length - 1,
      });
    });
  }
  return items;
}

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (nextCursor: string | null, replace: boolean) => {
    try {
      if (replace) setError(null);
      const page = await timelineService.getPage(nextCursor, 6);
      setGroups((prev) => {
        if (replace) return page.groups;
        const map = new Map<string, { label: string; memories: Memory[] }>();
        for (const g of [...prev, ...page.groups]) {
          const existing = map.get(g.dateKey) ?? { label: g.label, memories: [] };
          const ids = new Set(existing.memories.map((m) => m.id));
          for (const m of g.memories) {
            if (!ids.has(m.id)) existing.memories.push(m);
          }
          existing.label = g.label || existing.label;
          map.set(g.dateKey, existing);
        }
        return [...map.entries()].map(([dateKey, value]) => ({
          dateKey,
          label: value.label,
          memories: value.memories,
        }));
      });
      setCursor(page.nextCursor);
      setHasMore(page.hasMore);
    } catch {
      setError('Unable to load timeline.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      await load(null, true);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (loading) return <LoadingSkeleton rows={10} />;

  if (error && groups.length === 0) {
    return (
      <ErrorState
        title="Timeline unavailable"
        message={error}
        onRetry={() => {
          setLoading(true);
          void load(null, true).finally(() => setLoading(false));
        }}
      />
    );
  }

  const items = flatten(groups);

  if (items.length === 0) {
    return (
      <EmptyState
        title="No memories yet"
        message="Capture notes, links, or screenshots and they will appear here chronologically."
        actionLabel="Capture"
        onAction={() => router.push('/(app)/(tabs)/capture')}
      />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) =>
        item.kind === 'header' ? `h-${item.dateKey}` : `m-${item.memory.id}-${index}`
      }
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.text}
          onRefresh={() => {
            void (async () => {
              setRefreshing(true);
              await load(null, true);
              setRefreshing(false);
            })();
          }}
        />
      }
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (!hasMore || loadingMore || !cursor) return;
        void (async () => {
          setLoadingMore(true);
          await load(cursor, false);
          setLoadingMore(false);
        })();
      }}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.text} />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        if (item.kind === 'header') {
          return (
            <View style={styles.dayHeader}>
              <ThemedText colorKey="text" style={styles.dayLabel}>
                {item.label}
              </ThemedText>
            </View>
          );
        }
        return (
          <TimelineMemoryItem
            memory={item.memory}
            isFirst={item.isFirst}
            isLast={item.isLast}
            onPress={() => router.push(`/(app)/memory/${item.memory.id}`)}
          />
        );
      }}
      ListHeaderComponent={
        <Pressable
          onPress={() => router.push('/(app)/activity')}
          style={styles.activityLink}
          accessibilityRole="button"
        >
          <ThemedText colorKey="textMuted" style={styles.activityText}>
            View processing activity →
          </ThemedText>
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8 },
  dayHeader: { paddingTop: 16, paddingBottom: 8 },
  dayLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: { paddingVertical: 16, alignItems: 'center' },
  activityLink: { minHeight: 44, justifyContent: 'center', marginBottom: 4 },
  activityText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
});
