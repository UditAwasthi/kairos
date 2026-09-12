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
      <SectionHeader title="What Kairos stores" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Observations you upload (documents, images, notes), extracted text,
          summaries, topics, entities, project memberships, conversation history,
          and your Clerk account identity.
        </ThemedText>
      </SurfaceCard>

      <SectionHeader title="What is processed" />
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Uploads move through extraction, chunking, metadata analysis, and
          embedding on the Kairos backend. Search and Ask use your completed
          observations only.
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
});
