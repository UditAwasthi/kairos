import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '../../../components/ThemedText';
import { useAppTheme } from '../../../providers/ThemeProvider';
import { useSubscription } from '../../../providers/SubscriptionProvider';
import Recall from 'kairos-recall';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const OPTIONS = [
  { label: 'Note', icon: 'edit-note' as const, href: '/(app)/quick-capture?mode=note' },
  { label: 'Voice', icon: 'mic-none' as const, href: '/(app)/voice-capture' },
  { label: 'Photo or file', icon: 'attach-file' as const, href: '/(app)/capture-file' },
  { label: 'Link', icon: 'link' as const, href: '/(app)/quick-capture?mode=link' },
];

export default function CaptureTab() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const subscription = useSubscription();

  const close = () => router.replace('/(app)/(tabs)/index');

  return (
    <Modal transparent animationType="slide" visible onRequestClose={close}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={close} accessibilityRole="button" accessibilityLabel="Close capture options">
        <Pressable style={[styles.sheet, { backgroundColor: colors.surfaceElevated, paddingBottom: insets.bottom + 24 }]} onPress={(event) => event.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ThemedText colorKey="text" style={styles.title}>Capture something</ThemedText>
          {OPTIONS.map((option) => (
            <Pressable key={option.label} style={[styles.option, { borderColor: colors.divider }]} onPress={() => router.push(option.href as never)} accessibilityRole="button" accessibilityLabel={option.label}>
              <MaterialIcons name={option.icon} size={24} color={colors.text} />
              <ThemedText colorKey="text" style={styles.label}>{option.label}</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
            </Pressable>
          ))}
          {Platform.OS === 'android' && Recall.isAvailable() && subscription.isPro ? (
            <Pressable style={[styles.option, { borderColor: colors.divider }]} onPress={() => router.push('/(app)/screen-memory')} accessibilityRole="button" accessibilityLabel="Open Screen memory">
              <MaterialIcons name="visibility" size={24} color={colors.text} />
              <ThemedText colorKey="text" style={styles.label}>Screen memory</ThemedText>
              <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
            </Pressable>
          ) : null}
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Cancel capture">
            <ThemedText colorKey="textMuted" style={styles.cancel}>Cancel</ThemedText>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 38, gap: 10 },
  handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 22, marginBottom: 6 },
  option: { minHeight: 56, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 16 },
  cancel: { textAlign: 'center', padding: 10, fontSize: 15 },
});
