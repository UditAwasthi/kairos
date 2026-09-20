import { useRouter } from 'expo-router';

import { ThemeToggleButton } from '../../components/ThemeToggleButton';
import { SoftLinkList, SoftPage } from '../../components/ui/SoftScreen';
import { GlassPanel } from '../../components/ui/Glass';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { StyleSheet } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { themeProgress, toggleTheme } = useAppTheme();

  return (
    <SoftPage>
      <GlassPanel contentStyle={styles.appearance} padded={false}>
        <ThemedText colorKey="text" style={styles.rowLabel}>
          Theme
        </ThemedText>
        <ThemeToggleButton themeProgress={themeProgress} onToggle={toggleTheme} />
      </GlassPanel>

      <SoftLinkList
        items={[
          {
            label: 'Account',
            icon: 'user',
            onPress: () => router.push('/(app)/(tabs)/profile'),
          },
          {
            label: 'Recall',
            icon: 'eye',
            onPress: () => router.push('/(app)/(tabs)/recall'),
          },
          {
            label: 'Notifications',
            icon: 'bell',
            onPress: () => router.push('/(app)/notifications'),
          },
          {
            label: 'Devices',
            icon: 'smartphone',
            onPress: () => router.push('/(app)/devices'),
          },
          {
            label: 'Privacy',
            icon: 'shield',
            onPress: () => router.push('/(app)/privacy'),
          },
          {
            label: 'Data',
            icon: 'database',
            onPress: () => router.push('/(app)/data'),
          },
          {
            label: 'About',
            icon: 'info',
            onPress: () => router.push('/(app)/about'),
          },
        ]}
      />
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  appearance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
});
