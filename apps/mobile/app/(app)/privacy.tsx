import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { ErrorState, LoadingSkeleton } from '../../components/ui/EmptyState';
import { useAsync } from '../../hooks/useAsync';
import { useAppTheme } from '../../providers/ThemeProvider';
import { settingsService } from '../../services';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeProgress, colors } = useAppTheme();
  const { data, error, loading, reload } = useAsync(() => settingsService.get(), []);
  const [saving, setSaving] = useState(false);

  if (loading) return <LoadingSkeleton rows={8} />;
  if (error || !data) {
    return <ErrorState title="Unable to load privacy" message={error ?? undefined} onRetry={reload} />;
  }

  const patchPrivacy = async (key: keyof typeof data.privacy, value: boolean | number) => {
    setSaving(true);
    try {
      await settingsService.update({
        privacy: { ...data.privacy, [key]: value },
      });
      reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="What Kairos stores" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Observations you capture (screenshots, photos, documents, notes, links, audio), derived
          memories and summaries, topic/project organization, account identity via Clerk, and
          processing job status.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="What is processed" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Captures move through upload, extraction, memory creation, and indexing. Today these stages
          are simulated in the mock layer so you can understand the future async pipeline without
          sending personal data to an AI provider.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="AI processing preferences" />
      <SurfaceCard>
        {(
          [
            ['storeScreenshots', 'Store screenshot originals'],
            ['storeAudioTranscripts', 'Store audio transcripts'],
            ['shareAnonymousTelemetry', 'Anonymous product telemetry'],
          ] as const
        ).map(([key, label]) => (
          <View key={key} style={styles.switchRow}>
            <ThemedText colorKey="text" style={styles.rowLabel}>
              {label}
            </ThemedText>
            <Switch
              value={Boolean(data.privacy[key])}
              disabled={saving}
              onValueChange={(value) => void patchPrivacy(key, value)}
              trackColor={{ true: colors.text, false: colors.border }}
              accessibilityLabel={label}
            />
          </View>
        ))}
        <ThemedText colorKey="textMuted" style={styles.meta}>
          Retention: {data.privacy.retentionDays} days (mock preference)
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Controls" />
      <ThemedButton label="Manage data" variant="outline" onPress={() => router.push('/(app)/data')} />
      <ThemedButton
        label="Connected devices"
        variant="outline"
        onPress={() => router.push('/(app)/devices')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  switchRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, flex: 1 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 8 },
});
