import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '../../components/ThemeToggleButton';
import { SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';

const ITEMS = [
  { label: 'Account', href: '/(app)/(tabs)/profile' },
  { label: 'Notifications', note: 'Push notifications will be configurable when the backend is connected.' },
  { label: 'Privacy', href: '/(app)/privacy' },
  { label: 'Data', href: '/(app)/data' },
  { label: 'Subscription', href: '/(app)/subscription' },
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

      <SurfaceCard>
        {ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={styles.row}
            onPress={() => {
              if ('href' in item && item.href) router.push(item.href);
            }}
            disabled={!('href' in item)}
          >
            <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.rowLabel}>
              {item.label}
            </ThemedText>
            {'note' in item ? (
              <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.note}>
                {item.note}
              </ThemedText>
            ) : (
              <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.chevron}>
                →
              </ThemedText>
            )}
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
  rowLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  note: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 },
  chevron: { fontFamily: 'Inter_400Regular', fontSize: 16, position: 'absolute', right: 0 },
});
