import { Capacitor } from '@capacitor/core';
import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases';

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
 * Service to handle real Google Play Billing for Android via @capgo/native-purchases.
 * Securely enforces real payments on Google Play and never gives free unlocks.
 */
class GooglePlayBillingService {
  private isInitialized: boolean = false;

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  /**
   * Check if Google Play Billing is supported on the current device
   */
  public async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      return !!isBillingSupported;
    } catch {
      return false;
    }
  }

  /**
   * Purchase the non-consumable "lifetime_no_ads" product via Google Play Store
   */
  public async purchaseLifetimeNoAds(
    onSuccess: () => Promise<void> | void,
    onError: (errorMsg: string) => void
  ): Promise<boolean> {
    await this.initialize();

    // Check if running inside native Android / iOS
    if (!Capacitor.isNativePlatform()) {
      onError('Las compras directas de Google Play solo están disponibles desde la app móvil en Android. Para la web, utiliza la pasarela de PayPal.');
      return false;
    }

    try {
      const supported = await this.isAvailable();
      if (!supported) {
        onError('Google Play Billing no está disponible o no hay servicios de Google Play activos en este dispositivo.');
        return false;
      }

      console.log('[BillingService] Launching Google Play purchase flow for:', BILLING_PRODUCTS.LIFETIME_NO_ADS);

      const transaction = await NativePurchases.purchaseProduct({
        productIdentifier: BILLING_PRODUCTS.LIFETIME_NO_ADS,
        productType: PURCHASE_TYPE.INAPP,
        autoAcknowledgePurchases: true,
      });

      console.log('[BillingService] Purchase transaction completed:', transaction);

      if (transaction && transaction.transactionId) {
        await onSuccess();
        return true;
      } else {
        onError('La compra no se pudo completar o fue cancelada en Google Play.');
        return false;
      }
    } catch (err: any) {
      console.error('[BillingService] Google Play purchase error:', err);
      const message = err?.message || (typeof err === 'string' ? err : 'Error en la pasarela de Google Play.');
      onError(message);
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

    if (!Capacitor.isNativePlatform()) {
      onNoneFound();
      return;
    }

    try {
      await NativePurchases.restorePurchases();
      const res = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP });
      
      const hasPurchased = res?.purchases?.some(
        (p: any) => p.productIdentifier === BILLING_PRODUCTS.LIFETIME_NO_ADS || p.productId === BILLING_PRODUCTS.LIFETIME_NO_ADS
      );

      if (hasPurchased) {
        await onRestored();
        return;
      }
    } catch (err) {
      console.warn('[BillingService] Restore purchases error:', err);
    }

    onNoneFound();
  }
}

export const billingService = new GooglePlayBillingService();

