import { SoftPage, SoftRow } from '../../components/ui/SoftScreen';
import { ThemedText } from '../../components/ThemedText';
import { StyleSheet } from 'react-native';

export default function DevicesScreen() {
  return (
    <SoftPage>
      <ThemedText colorKey="textMuted" style={styles.lead}>
        This phone can receive Kairos notifications when a capture uploads and
        when a memory is ready.
      </ThemedText>
      <SoftRow icon="smartphone" label="This device" />
      <SoftRow icon="bell" label="Upload and memory alerts" />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
});
