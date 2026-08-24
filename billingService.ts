import { Capacitor } from '@capacitor/core';

export const BILLING_PRODUCTS = {
  LIFETIME_NO_ADS: 'lifetime_no_ads',
} as const;

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
}

/**
 * Service to handle Google Play Billing (and web test fallback)
 * for lifetime non-consumable in-app purchases.
 */
class GooglePlayBillingService {
  private isInitialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        console.log('[BillingService] Initializing Google Play Billing for Android...');
        // Check if any native billing plugin is registered on window/Capacitor
        const customPlugins = (Capacitor as any).Plugins || (window as any).Capacitor?.Plugins;
        if (customPlugins?.GooglePlayBilling || customPlugins?.InAppPurchase2) {
          console.log('[BillingService] Native Google Play Billing plugin detected.');
        }
      } catch (err) {
        console.warn('[BillingService] Google Play Billing init notice:', err);
      }
    }
    this.isInitialized = true;
  }

  /**
   * Purchase the non-consumable "lifetime_no_ads" product
   */
  public async purchaseLifetimeNoAds(
    onSuccess: () => Promise<void> | void,
    onError: (errorMsg: string) => void
  ): Promise<boolean> {
    await this.initialize();

    const isNativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

    if (isNativeAndroid) {
      try {
        const customPlugins = (Capacitor as any).Plugins || (window as any).Capacitor?.Plugins;
        const nativeBilling = customPlugins?.GooglePlayBilling || customPlugins?.InAppPurchase || customPlugins?.Purchases;

        if (nativeBilling && typeof nativeBilling.purchase === 'function') {
          const result = await nativeBilling.purchase({
            productId: BILLING_PRODUCTS.LIFETIME_NO_ADS,
            type: 'inapp',
          });

          if (result && (result.success || result.isSuccess || result.purchaseState === 1)) {
            await onSuccess();
            return true;
          } else {
            onError(result?.error || 'Purchase cancelled or could not be verified.');
            return false;
          }
        }
      } catch (err: any) {
        console.error('[BillingService] Native purchase error:', err);
        // If native billing plugin is not yet compiled into apk, fallback to web handler or show friendly error
      }
    }

    // Web / Fallback simulation for dev & testing environment
    console.log('[BillingService] Simulating Google Play purchase for product:', BILLING_PRODUCTS.LIFETIME_NO_ADS);
    try {
      await onSuccess();
      return true;
    } catch (err: any) {
      onError(err?.message || 'Error processing purchase');
      return false;
    }
  }

  /**
   * Query existing purchases on Google Play Store (Restore purchases)
   */
  public async restorePurchases(
    onRestored: () => Promise<void> | void,
    onNoneFound: () => void
  ): Promise<void> {
    await this.initialize();

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      try {
        const customPlugins = (Capacitor as any).Plugins || (window as any).Capacitor?.Plugins;
        const nativeBilling = customPlugins?.GooglePlayBilling || customPlugins?.Purchases;
        if (nativeBilling && typeof nativeBilling.queryPurchases === 'function') {
          const res = await nativeBilling.queryPurchases();
          const hasNoAds = res?.purchases?.some((p: any) => p.productId === BILLING_PRODUCTS.LIFETIME_NO_ADS);
          if (hasNoAds) {
            await onRestored();
            return;
          }
        }
      } catch (err) {
        console.warn('[BillingService] Query purchases error:', err);
      }
    }

    onNoneFound();
  }
}

export const billingService = new GooglePlayBillingService();
