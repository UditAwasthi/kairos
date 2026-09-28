import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '../../components/ThemedText';
import { SurfaceCard } from '../../components/ui/SectionHeader';
import { SoftLinkList, SoftPage } from '../../components/ui/SoftScreen';
import { useAppTheme } from '../../providers/ThemeProvider';

const PRIVACY_FACTS = [
  { icon: 'archive' as const, label: 'Stores uploads & memory', desc: 'Captures are saved securely on Kairos servers.' },
  { icon: 'cpu' as const, label: 'Processes on Kairos', desc: 'AI processing runs on Kairos infrastructure.' },
  { icon: 'bell' as const, label: 'Push alerts use device token', desc: 'Your device token is used only for notifications.' },
  { icon: 'eye' as const, label: 'Recall stays on-device first', desc: 'Screen analysis happens locally when possible.' },
];

export default function PrivacyScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();

  return (
    <SoftPage>
      <ThemedText colorKey="textMuted" style={styles.lead}>
        Kairos is built with your privacy in mind. Here's how your data is handled.
      </ThemedText>

      <SurfaceCard style={styles.factsCard}>
        {PRIVACY_FACTS.map((fact, index) => (
          <View key={fact.icon}>
            <View style={styles.factRow}>
              <View style={[styles.factIcon, { backgroundColor: colors.primaryContainer }]}>
                <Feather name={fact.icon} size={16} color={colors.primary} />
              </View>
              <View style={styles.factText}>
                <ThemedText colorKey="text" style={styles.factLabel}>{fact.label}</ThemedText>
                <ThemedText colorKey="textMuted" style={styles.factDesc}>{fact.desc}</ThemedText>
              </View>
            </View>
            {index < PRIVACY_FACTS.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />
            ) : null}
          </View>
        ))}
      </SurfaceCard>

      <SoftLinkList
        items={[
          {
            label: 'Screen Recall',
            icon: 'eye',
            onPress: () => router.push('/(app)/screen-memory'),
          },
          {
            label: 'Your Data',
            icon: 'database',
            onPress: () => router.push('/(app)/data'),
          },
          {
            label: 'Connected Devices',
            icon: 'smartphone',
            onPress: () => router.push('/(app)/devices'),
          },
        ]}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  factsCard: {
    padding: 16,
    gap: 4,
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  factIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  factText: {
    flex: 1,
    gap: 2,
  },
  factLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  factDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
});
