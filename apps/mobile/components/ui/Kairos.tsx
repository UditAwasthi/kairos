import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePressSpring } from '../../hooks/usePressSpring';
import { useReducedMotionPref } from '../../hooks/useReducedMotionPref';
import { useAppTheme } from '../../providers/ThemeProvider';
import { memoryTitle } from '../../lib/homeSummary';
import { ThemedButton } from './ThemedButton';

type KairosTextVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'body'
  | 'caption'
  | 'label'
  | 'meta';

const VARIANT_MAP: Record<
  KairosTextVariant,
  'display' | 'title1' | 'title2' | 'body' | 'caption' | 'overline' | 'bodySmall'
> = {
  display: 'display',
  heading: 'title1',
  title: 'title2',
  body: 'body',
  caption: 'caption',
  label: 'overline',
  meta: 'bodySmall',
};

export function KairosText({
  children,
  variant = 'body',
  color = 'text',
  style,
  numberOfLines,
  accessibilityRole,
}: {
  children: React.ReactNode;
  variant?: KairosTextVariant;
  color?: 'text' | 'textSecondary' | 'textMuted' | 'accent' | 'error';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityRole?: 'header' | 'text';
}) {
  const { colors, typography } = useAppTheme();
  const token = typography[VARIANT_MAP[variant]];
  return (
    <Text
      accessibilityRole={accessibilityRole}
      numberOfLines={numberOfLines}
      maxFontSizeMultiplier={1.3}
      allowFontScaling
      style={[
        {
          color: colors[color],
          fontFamily: token.fontFamily,
          fontSize: token.size,
          lineHeight: token.lineHeight,
          letterSpacing: token.letterSpacing,
          textTransform: variant === 'label' ? 'uppercase' : 'none',
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function KairosSurface({
  children,
  tone = 'raised',
  radiusToken = 'lg',
  bordered = true,
  style,
  contentStyle,
}: {
  children: React.ReactNode;
  tone?: 'base' | 'raised' | 'elevated';
  radiusToken?: 'sm' | 'md' | 'lg' | 'xl';
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const { colors, radius } = useAppTheme();
  const bg =
    tone === 'base'
      ? colors.background
      : tone === 'elevated'
        ? colors.surfaceElevated
        : colors.surface;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius[radiusToken],
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

export function KairosCard({
  children,
  onPress,
  accessibilityLabel,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { spacing } = useAppTheme();
  const press = usePressSpring();
  const body = (
    <KairosSurface style={style} contentStyle={{ padding: spacing['5'] }}>
      {children}
    </KairosSurface>
  );
  if (!onPress) return body;
  return (
    <Animated.View style={press.style}>
      <Pressable
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
      >
        {body}
      </Pressable>
    </Animated.View>
  );
}

export function KairosPill({
  label,
  selected = false,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors, radius, spacing } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        {
          minHeight: 36,
          paddingHorizontal: spacing['3'],
          paddingVertical: 8,
          borderRadius: radius.pill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? colors.accent : colors.border,
          backgroundColor: selected ? colors.accentGlow : colors.surfaceContainerLow,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <KairosText variant="caption" color={selected ? 'accent' : 'textSecondary'}>
        {label}
      </KairosText>
    </Pressable>
  );
}

export function KairosIconButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const { colors, radius } = useAppTheme();
  const press = usePressSpring();
  return (
    <Animated.View style={press.style}>
      <Pressable
        disabled={disabled}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [
          {
            width: 44,
            height: 44,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.surface,
            opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          },
        ]}
      >
        <Feather name={icon} size={18} color={colors.text} />
      </Pressable>
    </Animated.View>
  );
}

export function KairosInput({
  style,
  ...props
}: TextInputProps) {
  const { colors, radius, typography, spacing, isLight } = useAppTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.inputPlaceholder}
      keyboardAppearance={isLight ? 'light' : 'dark'}
      maxFontSizeMultiplier={1.3}
      allowFontScaling
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[
        {
          borderWidth: 1,
          borderColor: focused ? colors.accent : colors.inputBorder,
          backgroundColor: colors.inputFill,
          borderRadius: radius.md,
          color: colors.text,
          paddingHorizontal: spacing['4'],
          paddingVertical: spacing['3'] + 2,
          fontFamily: typography.body.fontFamily,
          fontSize: typography.body.size,
          lineHeight: typography.body.lineHeight,
          minHeight: 52,
        },
        style,
      ]}
    />
  );
}

export function KairosSectionHeader({
  label,
  action,
  onAction,
}: {
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <KairosText variant="label" color="textMuted">
        {label}
      </KairosText>
      {action && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={action}>
          <KairosText variant="caption" color="accent">
            {action}
          </KairosText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function KairosButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'text';
  style?: ViewStyle;
}) {
  return <ThemedButton {...props} />;
}

export function KairosState({
  kind,
  title,
  message,
  actionLabel,
  onAction,
}: {
  kind: 'loading' | 'empty' | 'error' | 'offline';
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colors, spacing } = useAppTheme();
  return (
    <View style={{ padding: spacing['8'], gap: spacing['3'], alignItems: 'center' }}>
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: kind === 'error' ? colors.text : colors.accent,
        }}
      />
      <KairosText variant="title">{title}</KairosText>
      {message ? (
        <KairosText variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
          {message}
        </KairosText>
      ) : null}
      {actionLabel && onAction ? (
        <KairosButton label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

export function KairosMemoryCard({
  title,
  date,
  snippet,
  pills,
  onPress,
}: {
  title: string;
  date: string;
  snippet?: string;
  pills?: string[];
  onPress: () => void;
}) {
  return (
    <KairosCard onPress={onPress} accessibilityLabel={title}>
      <KairosText variant="title" numberOfLines={2}>
        {title}
      </KairosText>
      <KairosText variant="meta" color="textMuted" style={{ marginTop: 6 }}>
        {date}
      </KairosText>
      {snippet ? (
        <KairosText variant="caption" color="textSecondary" numberOfLines={3} style={{ marginTop: 8 }}>
          {snippet}
        </KairosText>
      ) : null}
      {pills && pills.length > 0 ? (
        <View style={styles.pillRow}>
          {pills.slice(0, 3).map((pill) => (
            <KairosPill key={pill} label={pill} />
          ))}
        </View>
      ) : null}
    </KairosCard>
  );
}

export function KairosMemoryRow({
  filename,
  summary,
  capturedAt,
  meta,
  onPress,
}: {
  filename: string;
  summary?: string | null;
  capturedAt: string;
  meta?: string;
  onPress: () => void;
}) {
  const title = memoryTitle(filename, summary);
  const date = new Date(capturedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${date}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
    >
      <KairosSurface contentStyle={styles.memoryRow} radiusToken="md">
        <View style={{ flex: 1, gap: 4 }}>
          <KairosText variant="title" numberOfLines={1}>
            {title}
          </KairosText>
          <KairosText variant="meta" color="textMuted">
            {[date, meta].filter(Boolean).join(' · ')}
          </KairosText>
        </View>
        <Feather name="chevron-right" size={16} color="#686868" />
      </KairosSurface>
    </Pressable>
  );
}

export function KairosBottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { colors, radius, spacing } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotionPref();
  return (
    <Modal visible={visible} transparent animationType={reduced ? 'none' : 'fade'} onRequestClose={onClose}>
      <Pressable style={styles.sheetScrim} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xl,
              borderTopRightRadius: radius.xl,
              paddingBottom: insets.bottom + spacing['4'],
              borderColor: colors.border,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <KairosText variant="title">{title}</KairosText>
              <KairosIconButton icon="x" label="Close" onPress={onClose} />
            </View>
            {children}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export function KairosEnter({
  children,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return <View>{children}</View>;
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    minHeight: 64,
  },
  sheetScrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 8,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
