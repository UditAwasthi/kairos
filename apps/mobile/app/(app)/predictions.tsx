import { useAuth } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import {
  EmptyState,
  ErrorState,
  FadeInContent,
  LoadingSkeleton,
  SoftRefreshBar,
} from '../../components/ui/EmptyState';
import { GlassPanel } from '../../components/ui/Glass';
import { EvidenceRow } from '../../components/ui/InsightCard';
import { SoftPage, SoftTitle } from '../../components/ui/SoftScreen';
import { useAsync } from '../../hooks/useAsync';
import { fetchPredictions, type PredictionItem } from '../../lib/api';
import { useAppTheme } from '../../providers/ThemeProvider';

function iconForKind(kind: PredictionItem['kind']): React.ComponentProps<typeof Feather>['name'] {
  switch (kind) {
    case 'revisit':
      return 'rotate-ccw';
    case 'focus':
      return 'crosshair';
    case 'emerging':
      return 'trending-up';
    case 'next':
    default:
      return 'zap';
  }
}

export default function PredictionsScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { getToken } = useAuth();
  const { data, error, loading, refreshing, reload } = useAsync(async () => {
    const token = await getToken();
    if (!token) throw new Error('Sign in required');
    return fetchPredictions(token);
  }, [getToken]);

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error && !data) {
    return <ErrorState title="Unable to load" onRetry={reload} />;
  }
  if (!data || data.items.length === 0) {
    return (
      <SoftPage>
        <EmptyState
          title="No patterns yet"
          actionLabel="Capture something"
          onAction={() => router.push('/(app)/quick-capture')}
        />
      </SoftPage>
    );
  }

  return (
    <FadeInContent>
      <SoftRefreshBar active={refreshing} />
      <SoftPage>
        <SoftTitle>Predictions</SoftTitle>
        <ThemedText colorKey="textMuted" style={styles.lead}>
          These are cautious patterns from your memories — not claims about the future.
        </ThemedText>
        {data.items.map((item, index) => {
          const href = item.observationId
            ? `/(app)/observation/${item.observationId}`
            : item.topicId
              ? `/(app)/topics/${item.topicId}`
              : '/(app)/quick-capture';
          return (
            <Pressable
              key={`${item.kind}-${index}`}
              onPress={() => router.push(href)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
            >
              <GlassPanel>
                <View style={styles.header}>
                  <View style={[styles.icon, { backgroundColor: colors.accentGlow }]}>
                    <Feather name={iconForKind(item.kind)} size={16} color={colors.accent} />
                  </View>
                  <ThemedText colorKey="text" style={styles.title}>
                    {item.title}
                  </ThemedText>
                </View>
                <ThemedText colorKey="textMuted" style={styles.body}>
                  {item.body}
                </ThemedText>
                <ThemedText colorKey="textMuted" style={styles.why}>
                  Why this appeared · {item.why}
                </ThemedText>
                {item.evidence.slice(0, 3).map((evidence) => (
                  <EvidenceRow
                    key={evidence.observationId}
                    item={evidence}
                    onPress={() => router.push(`/(app)/observation/${evidence.observationId}`)}
                  />
                ))}
                {item.evidence.length > 0 ? (
                  <ThemedText colorKey="accent" style={styles.explore}>
                    Explore related memories
                  </ThemedText>
                ) : null}
              </GlassPanel>
            </Pressable>
          );
        })}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 16, letterSpacing: -0.2 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  why: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 10 },
  explore: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 12 },
});
