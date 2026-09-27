import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../ThemedText';
import { useAppTheme } from '../../providers/ThemeProvider';
import { FLOATING_TAB_BAR_CONTENT } from '../FloatingTabBar';
import { GlassPanel, ScreenGradient } from './Glass';

type IconName = React.ComponentProps<typeof Feather>['name'];

type SoftPageProps = {
  children: React.ReactNode;
  /** Extra bottom space for floating tab bar */
  tabBar?: boolean;
  /** Include top safe-area (only for headerless screens) */
  safeTop?: boolean;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/** Soft atmospheric page shell — gradient + generous padding. */
export function SoftPage({
  children,
  tabBar = false,
  safeTop = false,
  scroll = true,
  style,
  contentStyle,
}: SoftPageProps) {
  const insets = useSafeAreaInsets();
  const bottom = tabBar
    ? insets.bottom + FLOATING_TAB_BAR_CONTENT + 16
    : insets.bottom + 24;

  const pad = [
    styles.content,
    {
      paddingTop: safeTop ? insets.top + 12 : 8,
      paddingBottom: bottom,
    },
    contentStyle,
  ];

  return (
    <ScreenGradient style={style}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={pad}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, pad]}>{children}</View>
      )}
    </ScreenGradient>
  );
}

type SoftTitleProps = {
  children: string;
  trailing?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SoftTitle({ children, trailing, style }: SoftTitleProps) {
  return (
    <View style={[styles.titleRow, style]}>
      <ThemedText colorKey="text" style={styles.title} numberOfLines={1}>
        {children}
      </ThemedText>
      {trailing}
    </View>
  );
}

type SoftRowProps = {
  label: string;
  icon?: IconName;
  meta?: string;
  onPress?: () => void;
  destructive?: boolean;
};

export function SoftRow({ label, icon, meta, onPress, destructive }: SoftRowProps) {
  const { colors } = useAppTheme();
  const content = (
    <View style={styles.rowInner}>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: colors.accentGlow }]}>
          <Feather
            name={icon}
            size={16}
            color={destructive ? colors.error : colors.accent}
          />
        </View>
      ) : null}
      <ThemedText
        colorKey={destructive ? 'error' : 'text'}
        style={styles.rowLabel}
        numberOfLines={1}
      >
        {label}
      </ThemedText>
      {meta ? (
        <ThemedText colorKey="textMuted" style={styles.rowMeta}>
          {meta}
        </ThemedText>
      ) : null}
      {onPress ? (
        <Feather name="chevron-right" size={16} color={colors.textMuted} />
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <GlassPanel padded={false} contentStyle={styles.rowPanel}>
        {content}
      </GlassPanel>
    );
  }

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
    >
      <GlassPanel padded={false} contentStyle={styles.rowPanel}>
        {content}
      </GlassPanel>
    </Pressable>
  );
}

type SoftLink = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

type SoftLinkListProps = {
  items: SoftLink[];
};

/** Grouped soft list — one glass panel, hairline dividers. */
export function SoftLinkList({ items }: SoftLinkListProps) {
  const { colors } = useAppTheme();
  return (
    <GlassPanel padded={false} contentStyle={styles.linkList}>
      {items.map((item, index) => (
        <Pressable
          key={item.label}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            item.onPress();
          }}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          style={({ pressed }) => [
            styles.linkRow,
            index < items.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.divider,
            },
            { opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <View style={[styles.rowIcon, { backgroundColor: colors.accentGlow }]}>
            <Feather name={item.icon} size={16} color={colors.accent} />
          </View>
          <ThemedText colorKey="text" style={styles.rowLabel} numberOfLines={1}>
            {item.label}
          </ThemedText>
          <Feather name="chevron-right" size={16} color={colors.textMuted} />
        </Pressable>
      ))}
    </GlassPanel>
  );
}

type SoftTileProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  width?: number | `${number}%`;
};

export function SoftTile({ icon, label, onPress, width = '48%' }: SoftTileProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.9 : 1 }]}
    >
      <GlassPanel padded={false} contentStyle={styles.tileInner}>
        <View style={[styles.tileIcon, { backgroundColor: colors.accentGlow }]}>
          <Feather name={icon} size={20} color={colors.accent} />
        </View>
        <ThemedText colorKey="text" style={styles.tileLabel}>
          {label}
        </ThemedText>
      </GlassPanel>
    </Pressable>
  );
}

type SoftIconBtnProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function SoftIconBtn({ icon, label, onPress, disabled }: SoftIconBtnProps) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: colors.surfaceElevated,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
      ]}
    >
      <Feather name={icon} size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    gap: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 40,
  },
  title: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 30,
    letterSpacing: -0.5,
    flex: 1,
  },
  rowPanel: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  rowMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  linkList: {
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 52,
  },
  tileInner: {
    minHeight: 92,
    padding: 16,
    justifyContent: 'space-between',
    gap: 12,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    letterSpacing: -0.1,
  },
  iconBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
