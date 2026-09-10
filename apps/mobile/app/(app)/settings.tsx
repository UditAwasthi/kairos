import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemeToggleButton } from '../../components/ThemeToggleButton';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedText } from '../../components/ThemedText';
import { useAsync } from '../../hooks/useAsync';
import { useAppTheme } from '../../providers/ThemeProvider';
import { settingsService } from '../../services';

const LINKS = [
  { label: 'Account', href: '/(app)/(tabs)/profile' },
  { label: 'Notifications inbox', href: '/(app)/notifications' },
  { label: 'Connected devices', href: '/(app)/devices' },
  { label: 'Privacy', href: '/(app)/privacy' },
  { label: 'Data controls', href: '/(app)/data' },
  { label: 'About', href: '/(app)/about' },
] as const;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeProgress, toggleTheme, colors } = useAppTheme();
  const { data, error, loading, reload } = useAsync(() => settingsService.get(), []);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return <ErrorState title="Unable to load settings" message={error ?? undefined} onRetry={reload} />;
  }

  const patchAi = async (key: keyof typeof data.ai, value: boolean) => {
    setSaving(true);
    try {
      await settingsService.update({ ai: { ...data.ai, [key]: value } });
      reload();
    } finally {
      setSaving(false);
    }
  };

  const patchNotifications = async (
    key: keyof typeof data.notifications,
    value: boolean,
  ) => {
    setSaving(true);
    try {
      await settingsService.update({
        notifications: { ...data.notifications, [key]: value },
      });
      reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SurfaceCard style={styles.appearance}>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.rowLabel}>
          Appearance
        </ThemedText>
        <ThemeToggleButton themeProgress={themeProgress} onToggle={toggleTheme} />
      </SurfaceCard>

      <SectionHeader title="AI preferences" subtitle="Mock toggles for future backend" />
      <SurfaceCard>
        {(
          [
            ['autoCapture', 'Auto capture'],
            ['suggestRelated', 'Suggest related memories'],
            ['allowBackgroundProcessing', 'Background processing'],
            ['retainRawObservations', 'Retain raw observations'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.switchRow}>
            <ThemedText colorKey="text" style={styles.rowLabel}>
              {label}
            </ThemedText>
            <Switch
              value={data.ai[key]}
              disabled={saving}
              onValueChange={(value) => void patchAi(key, value)}
              trackColor={{ true: colors.text, false: colors.border }}
              accessibilityLabel={label}
            />
          </View>
        ))}
      </SurfaceCard>

      <SectionHeader title="Notification preferences" />
      <SurfaceCard>
        {(
          [
            ['memoryCreated', 'Memory created'],
            ['processingComplete', 'Processing complete'],
            ['weeklyDigest', 'Weekly digest'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.switchRow}>
            <ThemedText colorKey="text" style={styles.rowLabel}>
              {label}
            </ThemedText>
            <Switch
              value={data.notifications[key]}
              disabled={saving}
              onValueChange={(value) => void patchNotifications(key, value)}
              trackColor={{ true: colors.text, false: colors.border }}
              accessibilityLabel={label}
            />
          </View>
        ))}
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
  switchRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  rowLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, flex: 1 },
  chevron: { fontFamily: 'Inter_400Regular', fontSize: 16, position: 'absolute', right: 0 },
});
