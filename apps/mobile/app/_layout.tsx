import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Slot } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { assertClerkPublishableKey } from '../lib/config';
import { OnboardingProvider } from '../providers/OnboardingProvider';
import { ThemeProvider } from '../providers/ThemeProvider';

export default function RootLayout() {
  const publishableKey = assertClerkPublishableKey();

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <GestureHandlerRootView style={styles.root}>
        <ThemeProvider>
          <OnboardingProvider>
            <Slot />
          </OnboardingProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
