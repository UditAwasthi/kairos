import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../../components/ui/SectionHeader';
import { useAsync } from '../../../hooks/useAsync';
import { projectsService } from '../../../services';

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => projectsService.list(), []);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) return <ErrorState title="Unable to load projects" message={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No projects yet"
        message="Projects group memories around ongoing work."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Projects" subtitle="Active workstreams" />
      {data.map((project) => (
        <Pressable key={project.id} onPress={() => router.push(`/(app)/projects/${project.id}`)}>
          <SurfaceCard>
            <Badge label={project.status} tone={project.status === 'active' ? 'success' : 'neutral'} />
            <ThemedText colorKey="text" style={styles.title}>
              {project.name}
            </ThemedText>
            <ThemedText colorKey="textSecondary" style={styles.body}>
              {project.description}
            </ThemedText>
            <ThemedText colorKey="textMuted" style={styles.meta}>
              {project.memoryCount} memories
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
