import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { useAsync } from '../../hooks/useAsync';
import { devicesService } from '../../services';

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => devicesService.list(), []);

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error || !data) {
    return <ErrorState title="Unable to load devices" message={error ?? undefined} onRetry={reload} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader
        title="Connected devices"
        subtitle="Sync and capture status (mock)"
      />
      {data.map((device) => (
        <SurfaceCard key={device.id}>
          <Badge
            label={device.connectionStatus}
            tone={device.connectionStatus === 'connected' ? 'success' : 'neutral'}
          />
          <ThemedText colorKey="text" style={styles.title}>
            {device.name}
            {device.isCurrent ? ' · This device' : ''}
          </ThemedText>
          <ThemedText colorKey="textSecondary" style={styles.body}>
            Platform: {device.platform}
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            Last sync {new Date(device.lastSyncAt).toLocaleString()}
          </ThemedText>
          <ThemedText colorKey="textMuted" style={styles.meta}>
            Capture {device.captureEnabled ? 'enabled' : 'disabled'}
          </ThemedText>
        </SurfaceCard>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
});
