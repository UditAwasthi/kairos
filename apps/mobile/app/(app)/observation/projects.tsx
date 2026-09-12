import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
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
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to manage projects.');
    const [observation, projects] = await Promise.all([
      fetchObservation(token, String(id)),
      fetchProjects({ token, limit: 100 }),
    ]);
    return { observation, projects: projects.items };
  }, [getToken, id]);

  const { data, error, loading, reload } = useAsync(load, [id]);

  const memberIds = useMemo(
    () => new Set(data?.observation.projects?.map((p) => p.id) ?? []),
    [data],
  );

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return (
      <ErrorState title="Unable to load projects" message={error ?? undefined} onRetry={reload} />
    );
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
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader
        title="Add to project"
        subtitle={data.observation.filename}
      />

      {data.projects.length === 0 ? (
        <SurfaceCard>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            No projects yet.
          </ThemedText>
          <ThemedButton
            label="Create project"
            onPress={() => router.push('/(app)/projects/new')}
          />
        </SurfaceCard>
      ) : (
        data.projects.map((project) => {
          const isMember = memberIds.has(project.id);
          const busy = busyId === project.id;
          return (
            <Pressable
              key={project.id}
              disabled={busy}
              onPress={() => void toggle(project.id, isMember)}
            >
              <SurfaceCard>
                <View style={styles.row}>
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
                    <ThemedText colorKey="text" style={styles.title}>
                      {project.name}
                    </ThemedText>
                    <ThemedText colorKey="textMuted" style={styles.meta}>
                      {project.observationCount} observations
                      {busy ? ' · Updating…' : ''}
                    </ThemedText>
                  </View>
                </View>
              </SurfaceCard>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  flex: { flex: 1 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
});
