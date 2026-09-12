import { useAuth } from '@clerk/expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../../components/ui/ThemedButton';
import { useAsync } from '../../../../hooks/useAsync';
import {
  ApiError,
  addObservationToProject,
  fetchObservations,
  fetchProject,
} from '../../../../lib/api';
import { useAppTheme } from '../../../../providers/ThemeProvider';

export default function AddProjectObservationsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to manage project membership.');
    const [project, observations] = await Promise.all([
      fetchProject({ token, id: String(id), limit: 200 }),
      fetchObservations(token),
    ]);
    return { project, observations };
  }, [getToken, id]);

  const { data, error, loading, reload } = useAsync(load, [id]);

  const memberIds = useMemo(
    () => new Set(data?.project.observations.map((o) => o.id) ?? []),
    [data],
  );

  const candidates = useMemo(
    () =>
      (data?.observations ?? []).filter(
        (o) => o.status === 'COMPLETED' && !memberIds.has(o.id),
      ),
    [data, memberIds],
  );

  if (loading) return <LoadingSkeleton rows={10} />;
  if (error || !data) {
    return (
      <ErrorState title="Unable to load observations" message={error ?? undefined} onRetry={reload} />
    );
  }

  const toggle = (observationId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(observationId)) next.delete(observationId);
      else next.add(observationId);
      return next;
    });
  };

  const save = async () => {
    if (selected.size === 0) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new ApiError('You must be signed in.', 401);
      for (const observationId of selected) {
        await addObservationToProject({
          token,
          projectId: data.project.id,
          observationId,
        });
      }
      router.back();
    } catch (err) {
      Alert.alert(
        'Unable to add',
        err instanceof ApiError ? err.message : 'Try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader
        title={`Add to ${data.project.name}`}
        subtitle="Select completed observations"
      />

      {candidates.length === 0 ? (
        <EmptyState
          title="Nothing to add"
          message="All completed observations are already in this project, or you have none yet."
        />
      ) : (
        candidates.map((observation) => {
          const isOn = selected.has(observation.id);
          return (
            <Pressable key={observation.id} onPress={() => toggle(observation.id)}>
              <SurfaceCard>
                <View style={styles.row}>
                  <View
                    style={[
                      styles.check,
                      {
                        borderColor: colors.textMuted,
                        backgroundColor: isOn ? colors.accent : 'transparent',
                      },
                    ]}
                  />
                  <View style={styles.flex}>
                    <ThemedText colorKey="text" style={styles.title}>
                      {observation.filename}
                    </ThemedText>
                    <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={2}>
                      {observation.summary || observation.extractedText || observation.mimeType}
                    </ThemedText>
                  </View>
                </View>
              </SurfaceCard>
            </Pressable>
          );
        })
      )}

      <ThemedButton
        label={saving ? 'Adding…' : `Add ${selected.size || ''}`.trim()}
        disabled={saving || selected.size === 0}
        onPress={() => void save()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    marginTop: 2,
  },
  flex: { flex: 1 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, marginTop: 4 },
});
