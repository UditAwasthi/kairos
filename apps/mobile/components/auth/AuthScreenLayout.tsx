import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { DotField } from '../DotField';
import { useAppTheme } from '../../providers/ThemeProvider';
import { ThemeToggleButton } from '../ThemeToggleButton';
import { ThemedText } from '../ThemedText';
import { nothing } from '../../theme';

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
  const { themeProgress, toggleTheme, dotPhase, isLight } = useAppTheme();
  const backgroundColor = isLight ? '#ffffff' : '#000000';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor }]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor }]} pointerEvents="none">
        <DotField phase={dotPhase} themeProgress={themeProgress} />
      </View>
      <View style={styles.topBar}>
        <View style={styles.glyphRow}>
          <View style={styles.redDot} />
          <ThemedText
            themeProgress={themeProgress}
            colorKey="textSecondary"
            style={styles.glyphLabel}
          >
            KAIROS
          </ThemedText>
        </View>
        <ThemeToggleButton
          themeProgress={themeProgress}
          onToggle={toggleTheme}
        />
      </View>

      <ScrollView
        style={[styles.scroll, { backgroundColor }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <ThemedText
            themeProgress={themeProgress}
            colorKey="text"
            style={styles.title}
          >
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
    paddingHorizontal: 28,
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
    backgroundColor: nothing.red,
  },
  glyphLabel: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 13,
    letterSpacing: 2,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 28,
    gap: 16,
  },
  header: {
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'DotGothic16_400Regular',
    fontSize: 32,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    lineHeight: 22,
  },
});
