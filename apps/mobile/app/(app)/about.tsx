import { SoftPage } from '../../components/ui/SoftScreen';
import { GlassPanel } from '../../components/ui/Glass';
import { ThemedText } from '../../components/ThemedText';
import { StyleSheet } from 'react-native';

export default function AboutScreen() {
  return (
    <SoftPage>
      <GlassPanel contentStyle={styles.card} padded={false}>
        <ThemedText colorKey="text" style={styles.brand}>
          Kairos
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.meta}>
          Personal memory
        </ThemedText>
        <ThemedText colorKey="textMuted" style={styles.version}>
          1.0.0
        </ThemedText>
      </GlassPanel>
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 36,
    paddingHorizontal: 20,
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
  version: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
