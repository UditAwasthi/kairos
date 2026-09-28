import { Tabs } from 'expo-router';

import { FloatingTabBar } from '../../../components/FloatingTabBar';
import { useAppTheme } from '../../../providers/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter_500Medium',
          fontSize: 18,
        },
        headerShadowVisible: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
        },
        tabBarHideOnKeyboard: true,
        animation: 'shift',
        transitionSpec: {
          animation: 'spring',
          config: {
            stiffness: 420,
            damping: 42,
            mass: 0.9,
            overshootClamping: false,
            restDisplacementThreshold: 0.01,
            restSpeedThreshold: 0.01,
          },
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          headerShown: false,
          tabBarAccessibilityLabel: 'Today',
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          headerShown: false,
          tabBarAccessibilityLabel: 'Library',
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capture',
          headerShown: false,
          tabBarAccessibilityLabel: 'Capture options',
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          headerShown: false,
          tabBarAccessibilityLabel: 'Ask',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'You',
          headerShown: false,
          tabBarAccessibilityLabel: 'You',
        }}
      />
      <Tabs.Screen name="recall" options={{ href: null }} />
      <Tabs.Screen name="recall-screen" options={{ href: null }} />
    </Tabs>
  );
}
