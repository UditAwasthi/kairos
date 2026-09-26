import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../../../components/ThemedText';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../../../components/ui/EmptyState';
import { GlassPanel } from '../../../../components/ui/Glass';
import { SoftLinkList, SoftPage, SoftTitle } from '../../../../components/ui/SoftScreen';
import { ThemedButton } from '../../../../components/ui/ThemedButton';
import { useAsync } from '../../../../hooks/useAsync';
import {
  ApiError,
  deleteProject,
  fetchProject,
  removeObservationFromProject,
} from '../../../../lib/api';
import { useAppTheme } from '../../../../providers/ThemeProvider';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchProject({ token, id: String(id), limit: 50 });
  }, [getToken, id]);

  const { data, error, loading, refreshing, reload } = useAsync(load, [id], {
    resetKey: String(id),
    cacheKey: 'project',
  });

  if (loading && !data) return <LoadingSkeleton rows={10} />;
  if ((error && !data) || !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }

  const removeObservation = (observationId: string, filename: string) => {
    Alert.alert('Remove?', filename, [
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
    Alert.alert('Delete project?', data.name, [
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
    ]);
  };

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        <SoftTitle>{data.name}</SoftTitle>

        <GlassPanel padded={false} contentStyle={styles.metaRow}>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            {data.observationCount}
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
                  params: {
                    scopeType: 'project',
                    scopeId: data.id,
                    scopeName: data.name,
                  },
                }),
            },
            {
              label: 'Search',
              icon: 'search',
              onPress: () =>
                router.push({
                  pathname: '/(app)/search',
                  params: { projectId: data.id, projectName: data.name },
                }),
            },
            {
              label: 'Add',
              icon: 'plus',
              onPress: () => router.push(`/(app)/projects/${data.id}/add`),
            },
          ]}
        />

        <ThemedText colorKey="textMuted" style={styles.kicker}>
          Observations
        </ThemedText>

        {data.observations.length === 0 ? (
          <EmptyState
            title="None yet"
            actionLabel="Add"
            onAction={() => router.push(`/(app)/projects/${data.id}/add`)}
          />
        ) : (
          data.observations.map((observation) => (
            <View key={observation.id} style={styles.obsRow}>
              <Pressable
                onPress={() => router.push(`/(app)/observation/${observation.id}`)}
                style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.88 : 1 }]}
              >
                <GlassPanel padded={false} contentStyle={styles.row}>
                  <ThemedText colorKey="text" style={styles.rowTitle} numberOfLines={2}>
                    {observation.filename}
                  </ThemedText>
                </GlassPanel>
              </Pressable>
              <Pressable
                onPress={() => removeObservation(observation.id, observation.filename)}
                disabled={busy}
                accessibilityLabel="Remove from project"
                style={({ pressed }) => [
                  styles.removeBtn,
                  { backgroundColor: colors.surfaceElevated, opacity: busy ? 0.4 : pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="x" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          ))
        )}

        <ThemedButton
          label="Delete"
          variant="outline"
          disabled={busy}
          onPress={confirmDelete}
        />
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
  obsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTitle: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
