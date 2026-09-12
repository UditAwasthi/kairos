import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '../../components/ThemeToggleButton';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';

const LINKS = [
  { label: 'Account', href: '/(app)/(tabs)/profile' },
  { label: 'Activity updates', href: '/(app)/notifications' },
  { label: 'Connected devices', href: '/(app)/devices' },
  { label: 'Privacy', href: '/(app)/privacy' },
  { label: 'Data controls', href: '/(app)/data' },
  { label: 'About', href: '/(app)/about' },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress, toggleTheme } = useAppTheme();

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SurfaceCard style={styles.appearance}>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.rowLabel}>
          Appearance
        </ThemedText>
        <ThemeToggleButton themeProgress={themeProgress} onToggle={toggleTheme} />
      </SurfaceCard>

      <SectionHeader
        title="Preferences"
        subtitle="Server-backed preference APIs are not available yet"
      />
      <SurfaceCard>
        <ThemedText colorKey="textSecondary" style={styles.body}>
          AI and notification preference toggles will appear here when the backend
          supports them. Theme preference is stored on this device.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="More" />
      <SurfaceCard>
        {LINKS.map((item) => (
          <Pressable
            key={item.label}
            style={styles.row}
            onPress={() => router.push(item.href)}
            accessibilityRole="button"
          >
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.rowLabel}>
              {item.label}
            </ThemedText>
            <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.chevron}>
              →
            </ThemedText>
          </Pressable>
        ))}
      </SurfaceCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  appearance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  rowLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flex: 1 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  chevron: { fontFamily: 'Inter_400Regular', fontSize: 16, position: 'absolute', right: 0 },
});
