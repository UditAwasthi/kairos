import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedText } from '../../components/ThemedText';

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Connected devices" subtitle="Sync status" />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          Device sync is not available yet. Kairos currently uses your signed-in
          Clerk account on this device.
        </ThemedText>
      </SurfaceCard>
      <EmptyState
        title="No synced devices"
        message="Multi-device sync will appear here when the backend supports it."
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});
