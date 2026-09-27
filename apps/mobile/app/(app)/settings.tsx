import { useUser } from '@clerk/expo';
import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ComponentProps } from 'react';

import { SoftPage } from '../../components/ui/SoftScreen';
import { itemEntering, PressScale } from '../../components/ui/Motion';
import { useAppTheme } from '../../providers/ThemeProvider';
import Animated from 'react-native-reanimated';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type SettingsItem = {
  label: string;
  icon: IconName;
  onPress: () => void;
  meta?: string;
};

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

function SettingsGroup({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.group}>
      {title ? (
        <Text style={[styles.groupTitle, { color: colors.textMuted }]}>{title}</Text>
      ) : null}
      <View style={[styles.groupCard, { backgroundColor: colors.surfaceElevated }]}>
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  item,
  last,
  index,
}: {
  item: SettingsItem;
  last: boolean;
  index: number;
}) {
  const { colors } = useAppTheme();

  return (
    <Animated.View entering={itemEntering(index)}>
      <PressScale
        onPress={item.onPress}
        accessibilityLabel={item.label}
        style={[
          styles.row,
          !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
        ]}
      >
        <View style={[styles.rowIcon, { backgroundColor: colors.primaryContainer }]}>
          <MaterialIcons name={item.icon} size={18} color={colors.text} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.text }]} numberOfLines={1}>
          {item.label}
        </Text>
        {item.meta ? (
          <Text style={[styles.rowMeta, { color: colors.textMuted }]} numberOfLines={1}>
            {item.meta}
          </Text>
        ) : null}
        <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
      </PressScale>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { colors, isLight, toggleTheme } = useAppTheme();

  const name =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Account';
  const email = user?.primaryEmailAddress?.emailAddress;

  const setLight = () => {
    if (!isLight) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleTheme();
    }
  };

  const setDark = () => {
    if (isLight) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleTheme();
    }
  };

  const memory: SettingsItem[] = [
    {
      label: 'Recall',
      icon: 'visibility',
      meta: 'On-device',
      onPress: () => router.push('/(app)/(tabs)/recall'),
    },
    {
      label: 'Notifications',
      icon: 'notifications-none',
      onPress: () => router.push('/(app)/notifications'),
    },
    {
      label: 'Devices',
      icon: 'phone-iphone',
      onPress: () => router.push('/(app)/devices'),
    },
  ];

  const privacy: SettingsItem[] = [
    {
      label: 'Privacy',
      icon: 'shield',
      onPress: () => router.push('/(app)/privacy'),
    },
    {
      label: 'Data',
      icon: 'storage',
      meta: 'Export & delete',
      onPress: () => router.push('/(app)/data'),
    },
  ];

  const about: SettingsItem[] = [
    {
      label: 'How it works',
      icon: 'auto-stories',
      onPress: () => router.push('/(app)/how-it-works'),
    },
    {
      label: 'About Kairos',
      icon: 'info-outline',
      meta: APP_VERSION,
      onPress: () => router.push('/(app)/about'),
    },
  ];

  return (
    <SoftPage>
      <PressScale
        onPress={() => router.push('/(app)/(tabs)/profile')}
        accessibilityLabel="Account"
      >
        <View style={[styles.account, { backgroundColor: colors.surfaceElevated }]}>
          {user?.imageUrl ? (
            <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.primaryContainer }]}>
              <Text style={[styles.avatarLetter, { color: colors.text }]}>
                {name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.accountCopy}>
            <Text style={[styles.accountName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            {email ? (
              <Text style={[styles.accountEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {email}
              </Text>
            ) : (
              <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                Manage your account
              </Text>
            )}
          </View>
          <MaterialIcons name="chevron-right" size={22} color={colors.textMuted} />
        </View>
      </PressScale>

      <SettingsGroup title="Appearance">
        <View style={styles.appearance}>
          <Text style={[styles.appearanceLabel, { color: colors.text }]}>Theme</Text>
          <View style={[styles.segment, { backgroundColor: colors.primaryContainer }]}>
            <Pressable
              onPress={setLight}
              accessibilityRole="button"
              accessibilityState={{ selected: isLight }}
              accessibilityLabel="Light theme"
              style={[
                styles.segmentItem,
                isLight && { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <MaterialIcons name="light-mode" size={16} color={colors.text} />
              <Text style={[styles.segmentText, { color: colors.text }]}>Light</Text>
            </Pressable>
            <Pressable
              onPress={setDark}
              accessibilityRole="button"
              accessibilityState={{ selected: !isLight }}
              accessibilityLabel="Dark theme"
              style={[
                styles.segmentItem,
                !isLight && { backgroundColor: colors.surfaceElevated },
              ]}
            >
              <MaterialIcons name="dark-mode" size={16} color={colors.text} />
              <Text style={[styles.segmentText, { color: colors.text }]}>Dark</Text>
            </Pressable>
          </View>
        </View>
      </SettingsGroup>

      <SettingsGroup title="Memory">
        {memory.map((item, index) => (
          <SettingsRow
            key={item.label}
            item={item}
            index={index}
            last={index === memory.length - 1}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="Privacy & data">
        {privacy.map((item, index) => (
          <SettingsRow
            key={item.label}
            item={item}
            index={index}
            last={index === privacy.length - 1}
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="Kairos">
        {about.map((item, index) => (
          <SettingsRow
            key={item.label}
            item={item}
            index={index}
            last={index === about.length - 1}
          />
        ))}
      </SettingsGroup>

      <Text style={[styles.footer, { color: colors.textMuted }]}>
        Kairos {APP_VERSION}
      </Text>
    </SoftPage>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  groupTitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    letterSpacing: -0.08,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
  },
  groupCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarFallback: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 24,
  },
  accountCopy: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    letterSpacing: 0.38,
  },
  accountEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    letterSpacing: -0.24,
  },
  appearance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  appearanceLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    letterSpacing: -0.41,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 9,
    padding: 2,
    gap: 2,
  },
  segmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  segmentText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 17,
    letterSpacing: -0.41,
  },
  rowMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    letterSpacing: -0.24,
    maxWidth: 120,
  },
  footer: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    textAlign: 'center',
    paddingTop: 8,
    paddingBottom: 12,
  },
});
