import { Router } from 'expo-router';

export function navigateToApp(router: Router) {
  router.replace('/(app)');
}

export function navigateToSignIn(router: Router) {
  router.replace('/(auth)/sign-in');
}
