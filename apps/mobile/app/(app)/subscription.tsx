import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/MetricCard';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { useAsync } from '../../hooks/useAsync';
import { useAppTheme } from '../../providers/ThemeProvider';
import { subscriptionsService } from '../../services';

export default function SubscriptionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const plans = useAsync(() => subscriptionsService.listPlans(), []);
  const entitlement = useAsync(() => subscriptionsService.getEntitlement(), []);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const onRestore = async () => {
    setRestoring(true);
    try {
      const result = await subscriptionsService.restorePurchases();
      setRestoreMessage(result.message);
    } finally {
      setRestoring(false);
    }
  };

  if (plans.loading || entitlement.loading) return <LoadingSkeleton rows={6} />;
  if (plans.error || entitlement.error || !plans.data || !entitlement.data) {
    return (
      <ErrorState
        title="Unable to load subscription"
        message={plans.error ?? entitlement.error ?? undefined}
        onRetry={() => {
          plans.reload();
          entitlement.reload();
        }}
      />
    );
  }

  const currentEntitlement = entitlement.data;
  const planList = plans.data;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.kicker}>
          Current plan
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.planName}>
          {currentEntitlement.plan.toUpperCase()}
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Mock entitlement state. RevenueCat can replace this service later.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Compare plans" />
      {planList.map((plan) => (
        <SurfaceCard key={plan.id} style={styles.planCard}>
          <View style={styles.planHeader}>
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.planTitle}>
              {plan.name}
            </ThemedText>
            {plan.highlighted ? <Badge label="Popular" tone="accent" /> : null}
            {currentEntitlement.plan === plan.id ? <Badge label="Current" /> : null}
          </View>
          <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.price}>
            {plan.priceLabel}
          </ThemedText>
          {plan.features.map((feature) => (
            <ThemedText
              key={feature}
              themeProgress={themeProgress}
              colorKey="textSecondary"
              style={styles.feature}
            >
              • {feature}
            </ThemedText>
          ))}
          {currentEntitlement.plan !== plan.id && plan.id !== 'free' ? (
            <ThemedButton
              label={`Upgrade to ${plan.name}`}
              variant="outline"
              onPress={() =>
                router.push({
                  pathname: '/(app)/paywall',
                  params: {
                    feature: plan.name,
                    requiredPlan: plan.name,
                  },
                })
              }
              style={styles.upgrade}
            />
          ) : null}
        </SurfaceCard>
      ))}

      <ThemedButton
        label={restoring ? 'Restoring…' : 'Restore purchases'}
        variant="text"
        disabled={restoring}
        onPress={() => void onRestore()}
      />
      {restoreMessage ? (
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.body}>
          {restoreMessage}
        </ThemedText>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  kicker: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  planName: { fontFamily: 'DotGothic16_400Regular', fontSize: 28, letterSpacing: 2 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  planCard: { gap: 6 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, flex: 1 },
  price: { fontFamily: 'DotGothic16_400Regular', fontSize: 16, letterSpacing: 1 },
  feature: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  upgrade: { marginTop: 8 },
});
