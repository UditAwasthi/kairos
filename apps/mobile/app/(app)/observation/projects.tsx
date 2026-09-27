import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../../components/ThemedText';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../../components/ui/EmptyState';
import { GlassPanel } from '../../../components/ui/Glass';
import { SoftPage } from '../../../components/ui/SoftScreen';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import {
  ApiError,
  addObservationToProject,
  fetchObservation,
  fetchProjects,
  removeObservationFromProject,
} from '../../../lib/api';
import { useAppTheme } from '../../../providers/ThemeProvider';

export default function ManageObservationProjectsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    const [observation, projects] = await Promise.all([
      fetchObservation(token, String(id)),
      fetchProjects({ token, limit: 100 }),
    ]);
    return { observation, projects: projects.items };
  }, [getToken, id]);

  const { data, error, loading, refreshing, reload } = useAsync(load, [id], {
    resetKey: String(id),
    cacheKey: 'observation-projects',
  });

  const memberIds = useMemo(
    () => new Set(data?.observation.projects?.map((p) => p.id) ?? []),
    [data],
  );

  if (loading && !data) return <LoadingSkeleton rows={8} />;
  if ((error && !data) || !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }

  const toggle = async (projectId: string, currentlyMember: boolean) => {
    setBusyId(projectId);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('You must be signed in.', 401);
      if (currentlyMember) {
        await removeObservationFromProject({
          token,
          projectId,
          observationId: data.observation.id,
        });
      } else {
        await addObservationToProject({
          token,
          projectId,
          observationId: data.observation.id,
        });
      }
      await reload();
    } catch (err) {
      Alert.alert(
        'Unable to update',
        err instanceof ApiError ? err.message : 'Try again.',
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        {data.projects.length === 0 ? (
          <>
            <EmptyState title="None yet" />
            <ThemedButton
              label="New"
              onPress={() => router.push('/(app)/projects/new')}
            />
          </>
        ) : (
          data.projects.map((project) => {
            const isMember = memberIds.has(project.id);
            const busy = busyId === project.id;
            return (
              <Pressable
                key={project.id}
                disabled={busy}
                onPress={() => void toggle(project.id, isMember)}
                style={({ pressed }) => [{ opacity: busy ? 0.5 : pressed ? 0.88 : 1 }]}
              >
                <GlassPanel padded={false} contentStyle={styles.row}>
                  <View
                    style={[
                      styles.check,
                      {
                        borderColor: colors.textMuted,
                        backgroundColor: isMember ? colors.accent : 'transparent',
                      },
                    ]}
                  />
                  <View style={styles.flex}>
                    <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
                      {project.name}
                    </ThemedText>
                    <ThemedText colorKey="textMuted" style={styles.meta}>
                      {project.observationCount}
                      {busy ? ' · …' : ''}
                    </ThemedText>
                  </View>
                </GlassPanel>
              </Pressable>
            );
          })
        )}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
  },
  flex: { flex: 1 },
  title: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
});
