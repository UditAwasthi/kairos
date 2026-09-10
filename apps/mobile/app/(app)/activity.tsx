import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { ProcessingIndicator } from '../../components/ui/MemoryCards';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { useAsync } from '../../hooks/useAsync';
import { processingService } from '../../services';

export default function ActivityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => processingService.listJobs(), []);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) {
    return <ErrorState title="Unable to load activity" message={error} onRetry={reload} />;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Nothing processing"
        message="New captures will show upload, OCR, extraction, and embedding stages here."
        actionLabel="Capture"
        onAction={() => router.push('/(app)/(tabs)/capture')}
      />
    );
  }

  const active = data.filter((j) => j.stage !== 'READY' && j.stage !== 'FAILED');

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SurfaceCard>
        <ThemedText colorKey="text" style={styles.hero}>
          Processing {active.length} observation{active.length === 1 ? '' : 's'}
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          This view previews the future async AI pipeline. Stages are simulated in the mock layer.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Jobs" />
      {data.map((job) => (
        <ProcessingIndicator key={job.id} job={job} />
      ))}

      <ThemedButton label="Refresh" variant="outline" onPress={reload} />
      <ThemedButton
        label="Capture another"
        onPress={() => router.push('/(app)/(tabs)/capture')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  hero: { fontFamily: 'DotGothic16_400Regular', fontSize: 20, letterSpacing: 1 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
});
