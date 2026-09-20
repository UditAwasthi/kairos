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
          fontFamily: 'PlayfairDisplay_400Regular',
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
            stiffness: 900,
            damping: 68,
            mass: 1,
            overshootClamping: true,
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
          title: 'Home',
          headerShown: false,
          tabBarAccessibilityLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="recall"
        options={{
          title: 'Recall',
          headerShown: false,
          tabBarAccessibilityLabel: 'Recall',
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask',
          tabBarAccessibilityLabel: 'Ask',
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capture',
          headerShown: false,
          tabBarAccessibilityLabel: 'Capture',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerShown: false,
          tabBarAccessibilityLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}
