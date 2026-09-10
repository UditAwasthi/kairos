import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { useAsync } from '../../hooks/useAsync';
import { notificationsService } from '../../services';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => notificationsService.list(), []);

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error) {
    return <ErrorState title="Unable to load notifications" message={error} onRetry={reload} />;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="All caught up"
        message="Memory creations and processing updates will appear here."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Notifications" subtitle="Activity from your library" />
      {data.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            void notificationsService.markRead(item.id);
            if (item.href) router.push(item.href as `/${string}`);
            reload();
          }}
          accessibilityRole="button"
        >
          <SurfaceCard>
            <Badge label={item.read ? 'Read' : 'New'} tone={item.read ? 'neutral' : 'accent'} />
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
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
