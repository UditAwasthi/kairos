import { useAuth } from '@clerk/expo';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../providers/ThemeProvider';
import { darkTheme, lightTheme } from '../../theme';

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isLight } = useAppTheme();
  const theme = isLight ? lightTheme : darkTheme;

  if (!isLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontFamily: 'DotGothic16_400Regular',
          letterSpacing: 1,
        },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.text,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: {
          fontFamily: 'Inter_400Regular',
          fontSize: 11,
        },
        sceneStyle: { backgroundColor: theme.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="timeline" options={{ title: 'Timeline' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
