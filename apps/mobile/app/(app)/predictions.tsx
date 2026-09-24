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
          title="No predictions yet"
          actionLabel="Capture"
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
              <GlassPanel padded={false} contentStyle={styles.card}>
                <View style={[styles.icon, { backgroundColor: colors.accentGlow }]}>
                  <Feather name={iconForKind(item.kind)} size={16} color={colors.accent} />
                </View>
                <View style={styles.copy}>
                  <ThemedText colorKey="text" style={styles.title}>
                    {item.title}
                  </ThemedText>
                  <ThemedText colorKey="textMuted" style={styles.body}>
                    {item.body}
                  </ThemedText>
                </View>
              </GlassPanel>
            </Pressable>
          );
        })}
      </SoftPage>
    </FadeInContent>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  copy: { flex: 1, gap: 6 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16, letterSpacing: -0.2 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});
