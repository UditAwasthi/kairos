import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoalCard } from '../../../components/ui/Cards';
import { EmptyState, ErrorState, LoadingSkeleton } from '../../../components/ui/EmptyState';
import { ThemedButton } from '../../../components/ui/ThemedButton';
import { useAsync } from '../../../hooks/useAsync';
import { goalsService } from '../../../services';

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, error, loading, reload } = useAsync(() => goalsService.list(), []);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (error) {
    return <ErrorState title="Unable to load goals" message={error} onRetry={reload} />;
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Create a measurable goal."
        message="Goals help you track progress against a clear target and deadline."
        actionLabel="New goal"
        onAction={() => router.push('/(app)/goals/create')}
      />
    );
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]}>
        <View style={styles.stack}>
          {data.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onPress={() => router.push(`/(app)/goals/${goal.id}`)}
            />
          ))}
        </View>
      </ScrollView>
      <View style={[styles.fab, { bottom: insets.bottom + 16 }]}>
        <ThemedButton label="New goal" onPress={() => router.push('/(app)/goals/create')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  stack: { gap: 10 },
  fab: { position: 'absolute', left: 20, right: 20 },
});
