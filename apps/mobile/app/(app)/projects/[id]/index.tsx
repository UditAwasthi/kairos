import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../../components/ui/ThemedButton';
import { useAsync } from '../../../../hooks/useAsync';
import {
  ApiError,
  deleteProject,
  fetchProject,
  removeObservationFromProject,
} from '../../../../lib/api';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to view this project.');
    return fetchProject({ token, id: String(id), limit: 50 });
  }, [getToken, id]);

  const { data, error, loading, reload } = useAsync(load, [id]);

  if (loading) return <LoadingSkeleton rows={10} />;
  if (error || !data) {
    return <ErrorState title="Project unavailable" message={error ?? undefined} onRetry={reload} />;
  }

  const removeObservation = (observationId: string, filename: string) => {
    Alert.alert('Remove from project?', `Remove “${filename}” from this project?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              const token = await getToken();
              if (!token) throw new ApiError('You must be signed in.', 401);
              await removeObservationFromProject({
                token,
                projectId: data.id,
                observationId,
              });
              await reload();
            } catch (err) {
              Alert.alert(
                'Unable to remove',
                err instanceof ApiError ? err.message : 'Try again.',
              );
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete project?',
      'Observations stay in your library. Only this project grouping is removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                const token = await getToken();
                if (!token) throw new ApiError('You must be signed in.', 401);
                await deleteProject({ token, id: data.id });
                router.replace('/(app)/projects');
              } catch (err) {
                Alert.alert(
                  'Unable to delete',
                  err instanceof ApiError ? err.message : 'Try again.',
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText colorKey="text" style={styles.title}>
        {data.name}
      </ThemedText>
      {data.description ? (
        <ThemedText colorKey="textSecondary" style={styles.body}>
          {data.description}
        </ThemedText>
      ) : null}
      <SurfaceCard>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          {data.observationCount} observations
        </ThemedText>
      </SurfaceCard>

      <ThemedButton
        label="Ask about this project"
        onPress={() =>
          router.push({
            pathname: '/(app)/(tabs)/ask',
            params: {
              scopeType: 'project',
              scopeId: data.id,
              scopeName: data.name,
            },
          })
        }
      />
      <ThemedButton
        label="Search in this project"
        variant="outline"
        onPress={() =>
          router.push({
            pathname: '/(app)/search',
            params: { projectId: data.id, projectName: data.name },
          })
        }
      />
      <ThemedButton
        label="Add observations"
        variant="outline"
        disabled={busy}
        onPress={() => router.push(`/(app)/projects/${data.id}/add`)}
      />

      <SectionHeader title="Observations" />
      {data.observations.length === 0 ? (
        <EmptyState
          title="No observations yet"
          message="Add completed observations to this project."
          actionLabel="Add observations"
          onAction={() => router.push(`/(app)/projects/${data.id}/add`)}
        />
      ) : (
        data.observations.map((observation) => (
          <View key={observation.id} style={styles.cardWrap}>
            <Pressable
              onPress={() => router.push(`/(app)/observation/${observation.id}`)}
              style={styles.flex}
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
            <Pressable
              onPress={() => removeObservation(observation.id, observation.filename)}
              disabled={busy}
              style={styles.remove}
            >
              <ThemedText colorKey="textMuted" style={styles.removeText}>
                Remove
              </ThemedText>
            </Pressable>
          </View>
        ))
      )}

      <ThemedButton
        label="Delete project"
        variant="outline"
        disabled={busy}
        onPress={confirmDelete}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'DotGothic16_400Regular', fontSize: 28, letterSpacing: 1 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  cardTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  cardWrap: { gap: 4 },
  flex: { flexGrow: 1 },
  remove: { alignSelf: 'flex-end', paddingHorizontal: 4, paddingVertical: 2 },
  removeText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
