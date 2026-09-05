import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Paywall } from '../../components/ui/Paywall';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { subscriptionsService } from '../../services';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();
  const params = useLocalSearchParams<{ feature?: string; requiredPlan?: string }>();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <Paywall
        feature={params.feature ?? 'Advanced Kairos features'}
        value="Unlock deeper analytics, predictions, scenarios, and evidence inspection."
        requiredPlan={params.requiredPlan ?? 'Pro'}
        onUpgrade={() => router.push('/(app)/subscription')}
        onRestore={() => {
          void subscriptionsService.restorePurchases().then((result) => {
            setRestoreMessage(result.message);
          });
        }}
        restoreMessage={restoreMessage}
      />
      <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.note}>
        Purchases are not processed in this build. Upgrade CTAs navigate to plan comparison only.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
