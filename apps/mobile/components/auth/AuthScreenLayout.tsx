import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemeToggleButton } from '../ThemeToggleButton';
import { ThemedText } from '../ThemedText';
import { ScreenGradient } from '../ui/Glass';

type AuthScreenLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenLayoutProps) {
  const { themeProgress, toggleTheme, spacing } = useAppTheme();

  return (
    <ScreenGradient>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <View style={[styles.topBar, { paddingHorizontal: spacing['6'] }]}>
          <ThemedText colorKey="textMuted" style={styles.glyphLabel}>
            Kairos
          </ThemedText>
          <ThemeToggleButton themeProgress={themeProgress} onToggle={toggleTheme} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { padding: spacing['6'], gap: spacing['4'] }]}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews
        >
          <View style={[styles.header, { gap: spacing['1'] }]}>
            <ThemedText colorKey="text" style={styles.title}>
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText colorKey="textMuted" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          {children}
          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 4,
  },
  glyphLabel: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 4,
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 30,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
});
