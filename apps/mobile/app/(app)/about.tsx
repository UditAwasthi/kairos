import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SurfaceCard } from '../../components/ui/SectionHeader';
import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { themeProgress } = useAppTheme();

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.title}>
        KAIROS
      </ThemedText>
      <SurfaceCard>
        <ThemedText themeProgress={themeProgress} colorKey="textSecondary" style={styles.body}>
          Personal AI memory for your digital life. Capture observations, browse a timeline, search
          what you saved, and ask Kairos questions grounded in your own memories.
        </ThemedText>
        <ThemedText themeProgress={themeProgress} colorKey="textMuted" style={styles.meta}>
          Version 1.0.0 · Connected to Kairos backend
        </ThemedText>
      </SurfaceCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 12 },
  title: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 32,
    letterSpacing: 4,
  },
  body: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 21 },
  meta: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
