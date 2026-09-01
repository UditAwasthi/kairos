import { StyleSheet, View } from 'react-native';

import { ThemedText } from '../../components/ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';

type PlaceholderScreenProps = {
  title: string;
  subtitle: string;
};

export function PlaceholderScreen({ title, subtitle }: PlaceholderScreenProps) {
  const { themeProgress } = useAppTheme();

  return (
    <View style={styles.container}>
      <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText
        themeProgress={themeProgress}
        colorKey="textSecondary"
        style={styles.subtitle}
      >
        {subtitle}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 28,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
