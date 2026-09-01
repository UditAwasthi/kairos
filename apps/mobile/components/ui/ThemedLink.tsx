import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemedText } from '../ThemedText';

type ThemedLinkProps = {
  href: string;
  label: string;
};

export function ThemedLink({ href, label }: ThemedLinkProps) {
  const { themeProgress } = useAppTheme();

  return (
    <Link href={href} asChild>
      <Pressable>
        <ThemedText themeProgress={themeProgress} colorKey="text" style={styles.link}>
          {label}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
