import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';

import { resolveAuthRoute } from '../lib/auth-routing';
import { useOnboarding } from '../providers/OnboardingProvider';
import { SplashLoading } from '../components/ui/SplashLoading';

export default function SplashScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { isReady, hasCompletedOnboarding } = useOnboarding();

  if (!isLoaded || !isReady) {
    return <SplashLoading />;
  }

  const route = resolveAuthRoute(isLoaded, isSignedIn, hasCompletedOnboarding);

  if (route === 'loading') {
    return <SplashLoading />;
  }

  return <Redirect href={route} />;
}
