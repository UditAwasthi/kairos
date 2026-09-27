import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import { useAuth } from '@clerk/expo';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import {
  getCustomerInfoAfterAction,
  hasRecallEntitlement,
} from '../lib/revenuecatEntitlements';
import { selectRevenueCatApiKey } from '../lib/revenuecatApiKey';

type SubscriptionContextValue = {
  isLoading: boolean;
  hasRecallAccess: boolean;
  isPro: boolean;
  offering: PurchasesOffering | null;
  error: string | null;
  purchase: (
    aPackage: PurchasesPackage,
  ) => Promise<'active' | 'inactive' | 'cancelled' | 'error'>;
  restorePurchases: () => Promise<'active' | 'inactive' | 'error'>;
  refresh: () => Promise<void>;
  manageSubscriptions: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);
const API_KEY = selectRevenueCatApiKey({
  isDevelopment: __DEV__,
  platform:
    Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
  testStoreKey: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY,
  iosApiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
  androidApiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
});

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const identityQueue = useRef<Promise<void>>(Promise.resolve());
  const currentUser = useRef<string | null>(null);
  const desiredUser = useRef<string | null>(null);
  const configured = useRef(false);

  const refresh = useCallback(async () => {
    const requestedUser = userId;
    if (!configured.current || !requestedUser) return;
    try {
      const [info, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);
      if (
        desiredUser.current !== requestedUser ||
        currentUser.current !== requestedUser
      )
        return;
      setCustomerInfo(info);
      setOffering(offerings.current ?? null);
      setError(
        offerings.current
          ? null
          : 'Kairos Pro is temporarily unavailable. Please try again later.',
      );
    } catch {
      setError(
        'Could not load your subscription. Check your connection and try again.',
      );
    }
  }, [userId]);

  useEffect(() => {
    if (!isLoaded) return;
    desiredUser.current = userId ?? null;
    setCustomerInfo(null);
    setOffering(null);
    setIsLoading(Boolean(isSignedIn));
    setError(null);

    identityQueue.current = identityQueue.current
      .then(async () => {
        if (desiredUser.current !== userId) return;
        if (!userId) {
          if (configured.current) {
            try {
              await Purchases.logOut();
            } catch {
              /* SDK may already be anonymous. */
            }
          }
          if (desiredUser.current !== userId) return;
          currentUser.current = null;
          setCustomerInfo(null);
          setOffering(null);
          setIsLoading(false);
          return;
        }

        if (!API_KEY || Platform.OS === 'web') {
          setError(
            Platform.OS === 'web'
              ? 'Subscriptions are available in the Kairos mobile app.'
              : __DEV__
                ? 'Add the RevenueCat Test Store key to the mobile environment to enable subscriptions.'
                : 'Subscriptions are not configured for this platform.',
          );
          setIsLoading(false);
          return;
        }

        try {
          if (!configured.current) {
            Purchases.configure({ apiKey: API_KEY, appUserID: userId });
            configured.current = true;
            setIsConfigured(true);
          } else if (currentUser.current !== userId) {
            await Purchases.logIn(userId);
          }
          currentUser.current = userId;
          const [info, offerings] = await Promise.all([
            Purchases.getCustomerInfo(),
            Purchases.getOfferings(),
          ]);
          if (desiredUser.current !== userId) return;
          setCustomerInfo(info);
          setOffering(offerings.current ?? null);
          if (!offerings.current)
            setError(
              'Kairos Pro is temporarily unavailable. Please try again later.',
            );
        } catch {
          if (desiredUser.current === userId) {
            setError(
              'Could not connect to subscriptions. Check your connection and try again.',
            );
          }
        } finally {
          if (desiredUser.current === userId) setIsLoading(false);
        }
      })
      .catch(() => {
        if (desiredUser.current === userId) setIsLoading(false);
      });
  }, [isLoaded, isSignedIn, userId]);

  useEffect(() => {
    if (!isConfigured) return;
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      appState.remove();
    };
  }, [isConfigured, refresh]);

  const purchase = useCallback(
    async (aPackage: PurchasesPackage) => {
      setError(null);
      try {
        const info = await getCustomerInfoAfterAction(
          () => Purchases.purchasePackage(aPackage),
          () => Purchases.getCustomerInfo(),
        );
        if (desiredUser.current !== userId || currentUser.current !== userId)
          return 'error';
        setCustomerInfo(info);
        return hasRecallEntitlement(info) ? 'active' : 'inactive';
      } catch (cause) {
        const code = (cause as { userCancelled?: boolean; code?: string }).code;
        if (
          code === 'PURCHASE_CANCELLED_ERROR' ||
          (cause as { userCancelled?: boolean }).userCancelled
        )
          return 'cancelled';
        setError('Your purchase could not be completed. Please try again.');
        return 'error';
      }
    },
    [userId],
  );

  const restorePurchases = useCallback(async () => {
    setError(null);
    try {
      const info = await getCustomerInfoAfterAction(
        () => Purchases.restorePurchases(),
        () => Purchases.getCustomerInfo(),
      );
      if (desiredUser.current !== userId || currentUser.current !== userId)
        return 'error';
      setCustomerInfo(info);
      return hasRecallEntitlement(info) ? 'active' : 'inactive';
    } catch {
      setError(
        'Purchases could not be restored. Check your connection and try again.',
      );
      return 'error';
    }
  }, [userId]);

  const manageSubscriptions = useCallback(async () => {
    try {
      await Purchases.showManageSubscriptions();
      await refresh();
    } catch {
      setError('Subscription settings could not be opened. Please try again.');
    }
  }, [refresh]);

  const hasRecallAccess = customerInfo
    ? hasRecallEntitlement(customerInfo)
    : false;
  const value = useMemo(
    () => ({
      isLoading: !isLoaded || isLoading,
      hasRecallAccess,
      isPro: hasRecallAccess,
      offering,
      error,
      purchase,
      restorePurchases,
      refresh,
      manageSubscriptions,
    }),
    [
      error,
      hasRecallAccess,
      isLoaded,
      isLoading,
      manageSubscriptions,
      offering,
      purchase,
      refresh,
      restorePurchases,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context)
    throw new Error(
      'useSubscription must be used within SubscriptionProvider.',
    );
  return context;
}
