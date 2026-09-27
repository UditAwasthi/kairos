# RevenueCat subscriptions

**Entitlement:** `recall`  
**Product:** Kairos Pro

## Dashboard setup

1. Create a RevenueCat project and configure the Kairos iOS and Android apps.
2. Configure the matching App Store and Google Play subscription products.
3. Create the `recall` entitlement.
4. Create/configure the Kairos Pro subscription product and attach it to `recall`.
5. Create a default offering and attach the Kairos Pro package/product.
6. Configure the RevenueCat webhook URL as `https://<backend-host>/webhooks/revenuecat` and set its Authorization header to the same value as server-only `REVENUECAT_WEBHOOK_AUTHORIZATION`.
7. Enable sandbox events and test purchase, restore, cancellation, renewal, and expiration on development builds.

Rebuild and install an iOS or Android development build after adding the native SDK; Expo Go cannot make live store purchases.

Use the public iOS and Android SDK keys in `apps/mobile/.env`; keep the webhook authorization value and any RevenueCat secret API key on the backend only. Product IDs are intentionally left to the App Store / Google Play configuration.
