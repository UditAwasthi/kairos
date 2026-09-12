import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { fetchProjects } from '../../../lib/api';

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in to view projects.');
    return fetchProjects({ token, limit: 100 });
  }, [getToken]);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) {
    return <ErrorState title="Unable to load projects" message={error} onRetry={reload} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Projects" subtitle="Group observations by workstream" />
      <ThemedButton
        label="New project"
        onPress={() => router.push('/(app)/projects/new')}
      />

      {!data || data.items.length === 0 ? (
        <EmptyState
          title="No projects yet"
          message="Create a project to organize related observations."
        />
      ) : (
        data.items.map((project) => (
          <Pressable
            key={project.id}
            onPress={() => router.push(`/(app)/projects/${project.id}`)}
          >
            <SurfaceCard>
              <View style={styles.row}>
                <ThemedText colorKey="text" style={styles.title}>
                  {project.name}
                </ThemedText>
                <ThemedText colorKey="textMuted" style={styles.count}>
                  {project.observationCount}
                </ThemedText>
              </View>
              {project.description ? (
                <ThemedText colorKey="textSecondary" style={styles.body} numberOfLines={2}>
                  {project.description}
                </ThemedText>
              ) : null}
            </SurfaceCard>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17, flex: 1 },
  count: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 4 },
});
