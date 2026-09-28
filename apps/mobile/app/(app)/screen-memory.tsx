import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import Recall from 'kairos-recall';

import RecallScreen from './(tabs)/recall-screen';

export default function ScreenMemoryRoute() {
  if (Platform.OS !== 'android' || !Recall.isAvailable()) {
    return <Redirect href="/(app)/(tabs)/profile" />;
  }
  return <RecallScreen />;
}
