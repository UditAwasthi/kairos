import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { MemoryCard, TopicChip } from '../../../components/ui/MemoryCards';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { SOURCE_TYPE_LABELS, memoriesService } from '../../../services';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const { data, error, loading, reload } = useAsync(
    () => memoriesService.get(String(id)),
    [id],
  );
  const [busy, setBusy] = useState(false);

  if (loading) return <LoadingSkeleton rows={10} />;
  if (error || !data) {
    return <ErrorState title="Memory unavailable" message={error ?? undefined} onRetry={reload} />;
  }

  const captured = new Date(data.capturedAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const onFavorite = async () => {
    setBusy(true);
    try {
      await memoriesService.toggleFavorite(data.id);
      reload();
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    await Share.share({
      message: `${data.title}\n\n${data.summary}`,
    });
  };

  const onDelete = () => {
    Alert.alert('Delete memory?', 'This removes the memory from the mock library.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await memoriesService.remove(data.id);
              router.back();
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.topRow}>
        <Badge label={SOURCE_TYPE_LABELS[data.sourceType]} tone="accent" />
        {data.favorite ? <Badge label="Saved" /> : null}
      </View>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.title}>
        {data.title}
      </ThemedText>
      <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.meta}>
        Captured {captured}
      </ThemedText>
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.kicker}>
          Summary
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {data.summary}
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Topics" />
      <View style={styles.chips}>
        {data.topics.map((topic) => (
          <TopicChip
            key={topic.id}
            label={topic.name}
            onPress={() => router.push(`/(app)/topics/${topic.id}`)}
          />
        ))}
      </View>

      <SectionHeader title="Entities" />
      <View style={styles.chips}>
        {data.entities.length === 0 ? (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            No entities extracted
          </ThemedText>
        ) : (
          data.entities.map((entity) => (
            <TopicChip key={entity.id} label={`${entity.name}`} />
          ))
        )}
      </View>

      <SectionHeader title="Projects" />
      {data.projects.map((project) => (
        <Pressable key={project.id} onPress={() => router.push(`/(app)/projects/${project.id}`)}>
          <SurfaceCard>
            <ThemedText colorKey="text" style={styles.cardTitle}>
              {project.name}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={2}>
              {project.description}
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}

      <SectionHeader
        title="Related memories"
        actionLabel="All"
        onAction={() => router.push(`/(app)/related/${data.id}`)}
      />
      {data.relatedMemories.map((memory) => (
        <MemoryCard
          key={memory.id}
          memory={memory}
          onPress={() => router.push(`/(app)/memory/${memory.id}`)}
        />
      ))}

      <SectionHeader title="Source observations" />
      {data.observations.map((obs) => (
        <Pressable key={obs.id} onPress={() => router.push(`/(app)/observation/${obs.id}`)}>
          <SurfaceCard>
            <Badge label={obs.status} tone={obs.status === 'READY' ? 'success' : 'accent'} />
            <ThemedText colorKey="text" style={styles.cardTitle}>
              {obs.title}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {obs.previewText}
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}

      <SectionHeader title="Original source" />
      <SurfaceCard>
        <ThemedText colorKey="text" style={styles.cardTitle}>
          {data.source.label}
        </ThemedText>
        {data.source.previewText ? (
          <ThemedText colorKey="textSecondary" style={styles.body}>
            {data.source.previewText}
          </ThemedText>
        ) : null}
        {data.source.url ? (
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {data.source.url}
          </ThemedText>
        ) : null}
      </SurfaceCard>

      <View style={styles.actions}>
        <ThemedButton
          label={data.favorite ? 'Unsave' : 'Save'}
          variant="outline"
          disabled={busy}
          onPress={() => void onFavorite()}
        />
        <ThemedButton label="Share" variant="outline" onPress={() => void onShare()} />
        <ThemedButton label="Delete" disabled={busy} onPress={onDelete} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  topRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  title: { fontFamily: 'DotGothic16_400Regular', fontSize: 26, letterSpacing: 1 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  actions: { gap: 10, marginTop: 8 },
});
