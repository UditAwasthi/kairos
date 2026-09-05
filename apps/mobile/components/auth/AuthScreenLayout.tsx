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

type AuthScreenLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthScreenLayoutProps) {
  const { colors, themeProgress, toggleTheme, spacing, typography } = useAppTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <View style={[styles.topBar, { paddingHorizontal: spacing['6'] }]}>
        <View style={styles.glyphRow}>
          <View style={[styles.redDot, { backgroundColor: colors.accent }]} />
          <ThemedText colorKey="textSecondary" style={styles.glyphLabel}>
            KAIROS
          </ThemedText>
        </View>
        <ThemeToggleButton themeProgress={themeProgress} onToggle={toggleTheme} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { padding: spacing['6'], gap: spacing['4'] }]}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews
      >
        <View style={[styles.header, { gap: spacing['2'] }]}>
          <ThemedText
            colorKey="text"
            style={{
              fontFamily: 'DotGothic16_400Regular',
              fontSize: typography.title1.size,
              letterSpacing: 2,
            }}
          >
            {title}
          </ThemedText>
          <ThemedText
            colorKey="textSecondary"
            style={{
              fontFamily: 'Inter_400Regular',
              fontSize: typography.bodySmall.size + 1,
              lineHeight: typography.body.lineHeight,
            }}
          >
            {subtitle}
          </ThemedText>
        </View>
        {children}
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 64,
    paddingBottom: 8,
  },
  glyphRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  glyphLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 13,
    letterSpacing: 2,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 8,
  },
});
