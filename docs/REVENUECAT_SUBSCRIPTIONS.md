# RevenueCat subscriptions

**Entitlement:** `recall`  
**Product:** Kairos Pro

## Current development setup: RevenueCat Test Store

1. Keep the existing Kairos iOS and Android app configurations in RevenueCat. They remain available for future store-backed releases.
2. In the RevenueCat project, open **Apps & providers** and use the Test Store app/key for development.
3. In the Test Store product catalog, create one subscription product for Kairos Pro. Product IDs are configured in RevenueCat and are not hardcoded in the app.
4. Create the `recall` entitlement and attach the Kairos Pro Test Store product to it.
5. Create/configure the default offering and attach the Kairos Pro product to its subscription package.
6. Confirm Test Store purchases are allowed in the project's Sandbox Testing Access settings.
7. Copy the RevenueCat **Test Store public SDK key** to `EXPO_PUBLIC_REVENUECAT_TEST_API_KEY` in `apps/mobile/.env`. Development builds use this same key on iOS and Android. Do not put a secret API key here.
8. Keep the RevenueCat webhook URL configured as `https://<backend-host>/webhooks/revenuecat`, with its Authorization header set to the same server-only `REVENUECAT_WEBHOOK_AUTHORIZATION` value, so backend entitlement checks receive Test Store events.

Use a native Expo development build; Expo Go cannot run the native RevenueCat SDK. `__DEV__` builds use the Test Store key, while non-development builds continue to use the existing iOS/Android public SDK keys. RevenueCat Test Store is for development/testing and is not a production purchase configuration.
