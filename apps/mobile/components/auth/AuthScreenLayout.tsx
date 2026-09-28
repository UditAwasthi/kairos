import React, { ReactNode } from 'react';
import {
  Image,
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
  const { toggleTheme, spacing, isLight, colors, typography, radius } = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}
      >
        <View style={[styles.topBar, { paddingHorizontal: spacing['5'] }]}>
          <Image
            source={isLight ? require('../../assets/logo-dark.png') : require('../../assets/logo-light.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Kairos"
          />
          <ThemeToggleButton onToggle={toggleTheme} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: spacing['6'], paddingBottom: spacing['8'], gap: spacing['4'] },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={[styles.markBadge, { backgroundColor: colors.primaryContainer, borderRadius: radius.full }]}>
              <ThemedText colorKey="primary" style={styles.markBadgeText}>
                WELCOME TO KAIROS
              </ThemedText>
            </View>
            <ThemedText
              colorKey="text"
              style={[
                styles.title,
                {
                  fontFamily: typography.display.fontFamily,
                  fontSize: 28,
                },
              ]}
            >
              {title}
            </ThemedText>
            {subtitle ? (
              <ThemedText colorKey="textSecondary" style={styles.subtitle}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.formCard}>{children}</View>

          {footer}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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
    paddingTop: 54,
    paddingBottom: 8,
  },
  logo: {
    width: 90,
    height: 32,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  markBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  markBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  formCard: {
    gap: 14,
  },
});
