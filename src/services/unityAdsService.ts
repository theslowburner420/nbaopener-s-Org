import { Capacitor } from '@capacitor/core';
import { UnityAds } from 'capacitor-unity-ads';

export const UNITY_ADS_CONFIG = {
  GAME_ID_ANDROID: '800361166',
  PLACEMENT_REWARDED_ANDROID: 'Rewarded_Android',
  TEST_MODE: true, // Active test mode while developing
} as const;

export interface ShowAdOptions {
  rewardText?: string;
  durationSeconds?: number;
}

type AdModalHandler = (config: {
  isOpen: boolean;
  rewardText: string;
  durationSeconds: number;
  onComplete: () => Promise<void>;
  onClose: () => void;
}) => void;

class UnityAdsService {
  private isInitialized = false;
  private isInitializing = false;
  private isAdLoading = false;
  private modalHandler: AdModalHandler | null = null;

  public registerModalHandler(handler: AdModalHandler | null) {
    this.modalHandler = handler;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    this.isInitializing = true;

    try {
      if (Capacitor.isNativePlatform()) {
        console.log('🎮 [UnityAds] Initializing Native Unity Ads SDK with Game ID:', UNITY_ADS_CONFIG.GAME_ID_ANDROID);
        await UnityAds.initialize({
          gameId: UNITY_ADS_CONFIG.GAME_ID_ANDROID,
          testMode: UNITY_ADS_CONFIG.TEST_MODE,
        });
        this.isInitialized = true;
        console.log('🎮 [UnityAds] Initialization successful. Preloading rewarded ad...');
        await this.preloadRewardedVideo();
      } else {
        console.log('🌐 [UnityAds] Running on Web/Browser platform - In-app Ad Player ready');
        this.isInitialized = true;
      }
    } catch (error) {
      console.warn('⚠️ [UnityAds] Initialization warning:', error);
      this.isInitialized = false;
    } finally {
      this.isInitializing = false;
    }
  }

  public async preloadRewardedVideo(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return true;
    if (this.isAdLoading) return false;

    this.isAdLoading = true;
    try {
      console.log('🎮 [UnityAds] Preloading placement:', UNITY_ADS_CONFIG.PLACEMENT_REWARDED_ANDROID);
      await UnityAds.loadRewardedVideo({
        placementId: UNITY_ADS_CONFIG.PLACEMENT_REWARDED_ANDROID,
      });
      console.log('🎮 [UnityAds] Rewarded ad loaded and ready');
      return true;
    } catch (error) {
      console.warn('⚠️ [UnityAds] Failed to preload rewarded video:', error);
      return false;
    } finally {
      this.isAdLoading = false;
    }
  }

  /**
   * Displays a rewarded video ad and executes callback if completed
   */
  public async showRewardedAd(
    onReward: () => void | Promise<void>,
    options?: ShowAdOptions
  ): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const rewardLabel = options?.rewardText || '+3,000 Coins';
      const duration = options?.durationSeconds || 10;

      // 1. Try Native Unity Ads SDK on Android
      if (Capacitor.isNativePlatform()) {
        console.log('🎮 [UnityAds] Showing native rewarded video...');
        
        try {
          const result = await UnityAds.showRewardedVideo();
          console.log('🎮 [UnityAds] Native Show Result:', result);

          if (result && result.success) {
            console.log('🎉 [UnityAds] Native rewarded ad completed! Granting reward...');
            await onReward();
            // Preload next ad silently in the background
            setTimeout(() => {
              this.preloadRewardedVideo().catch(() => {});
            }, 1000);
            return true;
          } else {
            console.log('ℹ️ [UnityAds] Native rewarded ad returned without success, proceeding to fallback modal player...');
          }
        } catch (showError) {
          console.warn('⚠️ [UnityAds] Native showRewardedVideo error, attempting in-app player fallback:', showError);
        }
      }

      // 2. In-App Video Player (Web Preview & Fallback)
      if (this.modalHandler) {
        return new Promise<boolean>((resolve) => {
          this.modalHandler!({
            isOpen: true,
            rewardText: rewardLabel,
            durationSeconds: duration,
            onComplete: async () => {
              try {
                await onReward();
                resolve(true);
              } catch (err) {
                console.error('Error executing reward callback:', err);
                resolve(true);
              }
            },
            onClose: () => {
              resolve(false);
            },
          });
        });
      } else {
        // Fallback custom event trigger
        return new Promise<boolean>((resolve) => {
          const handleComplete = async () => {
            await onReward();
            resolve(true);
            cleanup();
          };
          const handleClose = () => {
            resolve(false);
            cleanup();
          };
          const cleanup = () => {
            window.removeEventListener('hoops_ad_completed', handleComplete);
            window.removeEventListener('hoops_ad_closed', handleClose);
          };

          window.addEventListener('hoops_ad_completed', handleComplete, { once: true });
          window.addEventListener('hoops_ad_closed', handleClose, { once: true });

          window.dispatchEvent(
            new CustomEvent('open_rewarded_ad_modal', {
              detail: {
                rewardText: rewardLabel,
                durationSeconds: duration,
              },
            })
          );
        });
      }
    } catch (err) {
      console.error('❌ [UnityAds] Error showing rewarded ad:', err);
      return false;
    }
  }
}

export const unityAdsService = new UnityAdsService();
