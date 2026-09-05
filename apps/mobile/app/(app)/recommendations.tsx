import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RecommendationCard } from '../../components/ui/Cards';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { recommendationsService } from '../../services';
import { Recommendation } from '../../types';

export default function RecommendationsScreen() {
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const [items, setItems] = useState<Recommendation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await recommendationsService.list());
    } catch {
      setError('Unable to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sendFeedback = async (id: string, value: 'helpful' | 'not_helpful') => {
    const updated = await recommendationsService.feedback(id, value);
    setItems((prev) => prev?.map((r) => (r.id === id ? updated : r)) ?? null);
  };

  if (loading && !items) return <LoadingSkeleton rows={6} />;
  if (error) {
    return (
      <ErrorState
        title="Unable to load recommendations"
        message={error}
        onRetry={() => void load()}
      />
    );
  }
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No recommendations yet"
        message="Record more observations to surface cautious suggestions."
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.lede}>
        Suggestions are tied to observed associations in your data — not causal claims.
      </ThemedText>
      <View style={styles.stack}>
        {items.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onHelpful={() => void sendFeedback(rec.id, 'helpful')}
            onNotHelpful={() => void sendFeedback(rec.id, 'not_helpful')}
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
