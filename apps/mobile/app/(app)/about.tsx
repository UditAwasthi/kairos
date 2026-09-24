import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { GlassPanel } from '../../components/ui/Glass';
import { SoftPage } from '../../components/ui/SoftScreen';
import { ThemedButton } from '../../components/ui/ThemedButton';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SoftPage>
      <GlassPanel contentStyle={styles.card} padded={false}>
        <ThemedText colorKey="text" style={styles.brand}>
          Kairos
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          Personal memory
        </ThemedText>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          Capture a thought. Kairos keeps it, finds it later, and answers from
          what you actually saved.
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.version}>
          1.0.0
        </ThemedText>
      </GlassPanel>

      <ThemedButton
        label="How it works"
        onPress={() => router.push('/(app)/how-it-works')}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  brand: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 28,
    letterSpacing: -0.3,
  },
  meta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
