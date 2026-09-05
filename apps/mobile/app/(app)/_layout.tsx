import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAppTheme } from '../../providers/ThemeProvider';

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const { colors } = useAppTheme();

  if (!isLoaded) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontFamily: 'DotGothic16_400Regular',
        },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="event/add" options={{ title: 'Add event' }} />
      <Stack.Screen name="event/[id]" options={{ title: 'Event' }} />
      <Stack.Screen name="prediction/[id]" options={{ title: 'Prediction' }} />
      <Stack.Screen name="scenario" options={{ title: 'What if?' }} />
      <Stack.Screen name="evidence" options={{ title: 'Evidence' }} />
      <Stack.Screen name="patterns" options={{ title: 'Patterns' }} />
      <Stack.Screen name="recommendations" options={{ title: 'Recommendations' }} />
      <Stack.Screen name="goals/index" options={{ title: 'Goals' }} />
      <Stack.Screen name="goals/create" options={{ title: 'New goal' }} />
      <Stack.Screen name="goals/[id]" options={{ title: 'Goal' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
      <Stack.Screen name="data" options={{ title: 'Data' }} />
      <Stack.Screen name="subscription" options={{ title: 'Subscription' }} />
      <Stack.Screen name="paywall" options={{ title: 'Upgrade' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
