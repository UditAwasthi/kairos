import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { ThemedText } from '../../../components/ThemedText';
import { useAsync } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { eventsService } from '../../../services';
import { EVENT_TYPE_LABELS } from '../../../services/mock/store';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const [busy, setBusy] = useState(false);
  const { data, error, loading, reload } = useAsync(
    () => eventsService.get(String(id)),
    [id],
  );

  const handleDelete = () => {
    Alert.alert('Delete event', 'Remove this observation from your timeline?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await eventsService.remove(String(id));
              router.back();
            } catch {
              Alert.alert('Unable to delete', 'Please try again.');
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  if (loading) return <LoadingSkeleton />;
  if (error || !data) {
    return <ErrorState title="Unable to load event" message={error ?? undefined} onRetry={reload} />;
  }

  const metaEntries = Object.entries(data.meta as Record<string, unknown>);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <Badge label={EVENT_TYPE_LABELS[data.type]} tone="accent" />
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.title}>
        {data.title}
      </ThemedText>
      <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.time}>
        {new Date(data.timestamp).toLocaleString()}
      </ThemedText>

      <SurfaceCard>
        {metaEntries.map(([key, value]) => (
          <View key={key} style={styles.row}>
            <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.key}>
              {key}
            </ThemedText>
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.val}>
              {String(value)}
            </ThemedText>
          </View>
        ))}
      </SurfaceCard>

      <ThemedButton
        label="Edit event"
        variant="outline"
        disabled={busy}
        onPress={() =>
          router.push({
            pathname: '/(app)/event/add',
            params: { editId: data.id },
          })
        }
      />
      <ThemedButton label="Delete event" disabled={busy} onPress={handleDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'DotGothic16_400Regular', fontSize: 24, letterSpacing: 1 },
  time: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  key: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  val: { fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1, textAlign: 'right' },
});
