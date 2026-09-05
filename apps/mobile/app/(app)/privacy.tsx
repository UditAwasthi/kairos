import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { SectionHeader, SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedButton } from '../../components/ui/ThemedButton';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeProgress } = useAppTheme();

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <SectionHeader title="Data collected" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Behavioral events you record (study, sleep, exercise, habits, tasks, productivity, mood,
          screen time, spending, observations), account identity via Clerk, and optional feedback on
          recommendations.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Data usage" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Used to compute analytics, observational patterns, mock predictions, scenario estimates,
          and evidence summaries. Production AI inference and server-side retention policies will be
          documented when the backend ships.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="Controls" />
      <ThemedButton label="Manage data" variant="outline" onPress={() => router.push('/(app)/data')} />
      <ThemedButton
        label="AI / data controls"
        variant="outline"
        onPress={() => router.push('/(app)/data')}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
});
