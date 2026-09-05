import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { InsightCard, evidenceLabel } from '../../components/ui/MetricCard';
import { ThemedText } from '../../components/ThemedText';
import { useAsync } from '../../hooks/useAsync';
import { useAppTheme } from '../../providers/ThemeProvider';
import { patternsService } from '../../services';

export default function PatternsScreen() {
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const { data, error, loading, reload } = useAsync(() => patternsService.list(), []);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error) {
    return <ErrorState title="Unable to load patterns" message={error} onRetry={reload} />;
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.lede}>
        Patterns are observational. Wording stays cautious: associated with, observed in your data,
        limited evidence.
      </ThemedText>
      <View style={styles.stack}>
        {data?.map((pattern) => (
          <InsightCard
            key={pattern.id}
            title={pattern.title}
            body={pattern.observation}
            meta={`${pattern.supportingMetric} · ${pattern.observationWindow} · n=${pattern.sampleSize}`}
            badge={evidenceLabel(pattern.evidenceStrength)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  lede: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  stack: { gap: 10 },
});
