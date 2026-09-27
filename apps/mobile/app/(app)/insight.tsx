import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
} from '../../components/ui/EmptyState';
import { InsightCard } from '../../components/ui/InsightCard';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { useAsync } from '../../hooks/useAsync';
import { fetchTodayInsight } from '../../lib/api';
import { KairosOs } from '../../lib/osIntegrations';

export default function InsightScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { data, error, loading, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    const insight = await fetchTodayInsight(token);
    void KairosOs.refreshWidget(
      insight.empty
        ? insight.body
        : `${insight.observationCount} memories this week.\n\n${insight.body}`,
    );
    return insight;
  }, [getToken], { cacheKey: 'today-insight' });

  if (loading && !data) return <LoadingSkeleton rows={5} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }

  return (
    <FadeInContent>
      <SoftPage>
        <SoftTitle>Today</SoftTitle>
        {data ? (
          <InsightCard
            insight={data}
            onExplore={
              data.evidence[0]
                ? () => router.push(`/(app)/observation/${data.evidence[0].observationId}`)
                : undefined
            }
          />
        ) : (
          <EmptyState
            title="No memories yet"
            actionLabel="Capture something"
            onAction={() => router.push('/(app)/quick-capture')}
          />
        )}
        <ThemedButton
          label="Capture"
          onPress={() => router.push('/(app)/quick-capture?source=WIDGET')}
        />
        <ThemedButton
          label="Ask Kairos"
          variant="outline"
          onPress={() => router.push('/(app)/(tabs)/ask')}
        />
      </SoftPage>
    </FadeInContent>
  );
}
