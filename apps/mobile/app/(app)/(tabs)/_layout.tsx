import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAppTheme } from '../../../providers/ThemeProvider';

function TabIcon({
  name,
  focused,
  color,
  accent,
}: {
  name: React.ComponentProps<typeof Feather>['name'];
  focused: boolean;
  color: string;
  accent: string;
}) {
  return (
    <View style={styles.iconWrap}>
      <View
        style={[
          styles.dot,
          { backgroundColor: focused ? accent : 'transparent' },
        ]}
      />
      <Feather name={name} size={20} color={color} style={{ opacity: focused ? 1 : 0.45 }} />
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'DotGothic16_400Regular',
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarShowLabel: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="home" focused={focused} color={color} accent={colors.accent} />
          ),
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="clock" focused={focused} color={color} accent={colors.accent} />
          ),
          tabBarAccessibilityLabel: 'Timeline',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="bar-chart-2" focused={focused} color={color} accent={colors.accent} />
          ),
          tabBarAccessibilityLabel: 'Analytics',
        }}
      />
      <Tabs.Screen
        name="predict"
        options={{
          title: 'Predict',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="trending-up" focused={focused} color={color} accent={colors.accent} />
          ),
          tabBarAccessibilityLabel: 'Predict',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="user" focused={focused} color={color} accent={colors.accent} />
          ),
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    gap: 4,
    minWidth: 44,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});