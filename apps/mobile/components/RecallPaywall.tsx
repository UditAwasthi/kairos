import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedButton } from './ui/ThemedButton';
import { ThemedText } from './ThemedText';
import { GlassPanel, ScreenGradient } from './ui/Glass';
import { useAppTheme } from '../providers/ThemeProvider';
import { useSubscription } from '../providers/SubscriptionProvider';

function billingPeriod(period: string | null): string {
  if (!period) return 'Subscription';
  const match = /^P(\d+)?(D|W|M|Y)$/.exec(period);
  if (!match) return 'Subscription';
  const count = Number(match[1] ?? 1);
  const unit = { D: 'day', W: 'week', M: 'month', Y: 'year' }[
    match[2] as 'D' | 'W' | 'M' | 'Y'
  ];
  return `Billed every ${count > 1 ? `${count} ` : ''}${unit}${count > 1 ? 's' : ''}`;
}

export function RecallPaywall({
  onClose,
  onUnlocked,
}: {
  onClose: () => void;
  onUnlocked: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { offering, error, purchase, purchaseWithCard, restorePurchases, refresh } =
    useSubscription();
  const [busy, setBusy] = useState(false);
  const selected = offering?.availablePackages[0] ?? null;

  const finish = async (outcome: 'active' | 'inactive' | 'cancelled' | 'store_unavailable' | 'error') => {
    if (outcome === 'active') {
      await refresh();
      onUnlocked();
      return;
    }
    if (outcome === 'inactive') {
      Alert.alert(
        'Kairos Pro',
        'The Recall entitlement is not active yet. Please try again shortly.',
      );
    }
  };

  const buy = async () => {
    if (busy) return;
    setBusy(true);
    if (selected) {
      const outcome = await purchase(selected);
      if (outcome !== 'store_unavailable') {
        await finish(outcome);
        setBusy(false);
        return;
      }
    }
    await finish(await purchaseWithCard());
    setBusy(false);
  };

  const restore = async () => {
    if (busy) return;
    setBusy(true);
    const outcome = await restorePurchases();
    if (outcome === 'active') {
      await refresh();
      onUnlocked();
    } else if (outcome === 'inactive') {
      Alert.alert(
        'No purchases found',
        'There is no active Kairos Pro subscription to restore.',
      );
    }
    setBusy(false);
  };

  return (
    <ScreenGradient>
      <View
        style={[
          styles.page,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close paywall"
          style={styles.close}
        >
          <Feather name="x" size={22} color={colors.textSecondary} />
        </Pressable>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.mark, { backgroundColor: colors.accentGlow }]}>
            <Feather name="clock" size={27} color={colors.accent} />
          </View>
          <ThemedText colorKey="accent" style={styles.kicker}>
            RECALL
          </ThemedText>
          <ThemedText colorKey="text" style={styles.headline}>
            Your memories, when you need them.
          </ThemedText>
          <View style={styles.features}>
            {[
              'Find things you’ve captured before',
              'Rediscover forgotten context',
              'Search across your memory',
              'Connect moments across time',
            ].map((label) => (
              <View key={label} style={styles.feature}>
                <Feather name="check" size={17} color={colors.accent} />
                <ThemedText colorKey="textSecondary" style={styles.featureText}>
                  {label}
                </ThemedText>
              </View>
            ))}
          </View>
          <GlassPanel style={styles.product}>
            <View style={styles.productRow}>
              <View>
                <ThemedText colorKey="text" style={styles.productName}>
                  Kairos Pro
                </ThemedText>
                <ThemedText colorKey="textMuted" style={styles.period}>
                  {selected
                    ? billingPeriod(selected.product.subscriptionPeriod)
                    : 'Subscription details unavailable'}
                </ThemedText>
              </View>
              <ThemedText colorKey="text" style={styles.price}>
                {selected ? selected.product.priceString : '—'}
              </ThemedText>
            </View>
          </GlassPanel>
          {error ? (
            <ThemedText colorKey="warning" style={styles.error}>
              {error}
            </ThemedText>
          ) : null}
          <ThemedButton
            label={busy ? 'Please wait…' : selected ? 'Start Kairos Pro' : 'Continue with card'}
            onPress={() => void buy()}
            disabled={busy}
          />
          <ThemedButton
            label="Restore Purchases"
            variant="text"
            onPress={() => void restore()}
            disabled={busy}
          />
          <ThemedText colorKey="textMuted" style={styles.note}>
            {selected
              ? 'Billed by the App Store or Google Play. Pro is saved to your Kairos account.'
              : 'App Store and Google Play are not available here. Continue with card, billed through Stripe. Pro is saved to your Kairos account.'}
          </ThemedText>
        </ScrollView>
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24 },
  close: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexGrow: 1, justifyContent: 'center', gap: 17 },
  mark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  kicker: {
    textAlign: 'center',
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 12,
    letterSpacing: 2.4,
  },
  headline: {
    textAlign: 'center',
    fontFamily: 'Roboto_600SemiBold',
    fontSize: 29,
    lineHeight: 36,
    marginBottom: 4,
  },
  features: { gap: 12, marginVertical: 3 },
  feature: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  featureText: { fontFamily: 'Roboto_400Regular', fontSize: 14 },
  product: { marginTop: 3 },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  productName: { fontFamily: 'Roboto_600SemiBold', fontSize: 17 },
  period: { fontFamily: 'Roboto_400Regular', fontSize: 12, marginTop: 4 },
  price: { fontFamily: 'Roboto_600SemiBold', fontSize: 17 },
  error: { textAlign: 'center', fontSize: 13 },
  note: { textAlign: 'center', fontSize: 11 },
});
