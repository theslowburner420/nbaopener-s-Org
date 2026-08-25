import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, X, Play, Check, Coins, Zap, Star, AlertCircle, RefreshCw, ShoppingBag } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { billingService } from '../services/billingService';
import { Capacitor } from '@capacitor/core';

const LIFETIME_NO_ADS_PRICE = 2.99;
const AD_DURATION_SECONDS = 10;

function PayPalButtonsWrapper({ 
  onSuccess, 
  onError,
  activeClientId,
  onFallbackToTest
}: { 
  onSuccess: () => void; 
  onError: (msg: string) => void;
  activeClientId: string;
  onFallbackToTest: () => void;
}) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  useEffect(() => {
    if (isRejected && activeClientId !== 'test') {
      console.warn(`PayPal script rejected with clientId '${activeClientId}'. Falling back to 'test'.`);
      onFallbackToTest();
    }
  }, [isRejected, activeClientId, onFallbackToTest]);

  if (isPending) {
    return (
      <div className="w-full h-[50px] bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-300 text-xs font-bold gap-2 animate-pulse">
        <RefreshCw size={14} className="animate-spin text-purple-400" />
        <span>Loading PayPal...</span>
      </div>
    );
  }

  if (isRejected && activeClientId === 'test') {
    return (
      <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center text-red-400 text-xs font-semibold">
        Unable to load PayPal. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="w-full min-h-[50px] relative z-10">
      <PayPalButtons
        style={{ 
          layout: "vertical", 
          color: 'gold', 
          shape: 'rect', 
          label: 'pay', 
          tagline: false 
        }}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [{
              description: "Remove Ads - Lifetime Access",
              amount: { currency_code: "USD", value: LIFETIME_NO_ADS_PRICE.toFixed(2) }
            }],
            application_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' }
          });
        }}
        onApprove={async (data, actions) => {
          try {
            const details = await actions.order?.capture();
            if (details?.status === 'COMPLETED') {
              onSuccess();
            }
          } catch (e) {
            console.error("Capture error:", e);
            onError("Payment failed.");
          }
        }}
        onError={(err) => {
          console.error("PayPal Error:", err);
          if (activeClientId !== 'test') {
            onFallbackToTest();
          } else {
            onError("Error with PayPal.");
          }
        }}
      />
    </div>
  );
}

export default function ShopView() {
  const { 
    coins,
    addCoins, 
    hasLifetimeNoAds,
    updateGameStateAsync,
    showRewardedAd,
  } = useGame();
  const { notifySuccess, notifyError } = useNotification();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  
  const envClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;
  const initialClientId = (!envClientId || envClientId === 'sb' || envClientId.startsWith('AT0')) ? 'test' : envClientId;
  const [activeClientId, setActiveClientId] = useState<string>(initialClientId);

  const handleFallbackToTest = React.useCallback(() => {
    setActiveClientId('test');
  }, []);

  useEffect(() => {
    const handleScriptError = (event: ErrorEvent | Event) => {
      const target = event.target as HTMLElement;
      if (target && target.tagName === 'SCRIPT' && target.getAttribute('src')?.includes('paypal.com/sdk/js')) {
        console.warn("PayPal SDK script failed to load. Falling back to 'test' client ID.");
        handleFallbackToTest();
      }
    };

    window.addEventListener('error', handleScriptError, true);
    return () => window.removeEventListener('error', handleScriptError, true);
  }, [handleFallbackToTest]);

  const handleWatchAd = async () => {
    if (isLoadingAd) return;
    setIsLoadingAd(true);

    try {
      const rewarded = await showRewardedAd(async () => {
        await addCoins(3000);
        notifySuccess("Reward Claimed! +3,000 Coins");
      });

      if (!rewarded) {
        console.log("Rewarded ad was skipped or not completed.");
      }
    } catch (err) {
      console.error("Error displaying rewarded ad:", err);
      notifyError("Unable to load rewarded video. Please try again.");
    } finally {
      setIsLoadingAd(false);
    }
  };

  const handleGooglePlayPurchase = async () => {
    setIsPurchasing(true);
    await billingService.purchaseLifetimeNoAds(
      async () => {
        await updateGameStateAsync({ 
          hasLifetimeNoAds: true,
          isPremium: true
        });
        notifySuccess("Ads removed forever with Google Play!");
      },
      (errorMsg) => {
        notifyError(errorMsg);
      }
    );
    setIsPurchasing(false);
  };

  const handleRestorePurchases = async () => {
    setIsPurchasing(true);
    await billingService.restorePurchases(
      async () => {
        await updateGameStateAsync({ 
          hasLifetimeNoAds: true,
          isPremium: true
        });
        notifySuccess("Lifetime No Ads restored successfully!");
      },
      () => {
        notifyError("No previous lifetime purchases found on this account.");
      }
    );
    setIsPurchasing(false);
  };

  const handleNoAdsPurchaseSuccess = async () => {
    setIsPurchasing(true);
    try {
      await updateGameStateAsync({ 
        hasLifetimeNoAds: true,
        isPremium: true
      });
      notifySuccess("Ads removed forever!");
    } catch (err) {
      notifyError("Error processing purchase.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const content = (
    <div className="min-h-full w-full flex flex-col bg-black relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.06)_0%,transparent_60%)] pointer-events-none" />

      {/* Main Container */}
      <div className="flex-1 px-4 sm:px-6 py-5 space-y-5 no-scrollbar pb-28 z-10 max-w-3xl mx-auto w-full">
        
        {/* Compact Header */}
        <div className="flex items-center justify-between bg-zinc-950/80 border border-zinc-900 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
              <Sparkles size={18} />
            </div>
            <div>
              <h1 className="text-lg font-black italic uppercase tracking-tight text-white leading-none">
                Hoops<span className="text-amber-500">Shop</span>
              </h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                Perks & Extra Rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-amber-500">
            <Coins size={14} fill="currentColor" />
            <span>{coins.toLocaleString()}</span>
          </div>
        </div>

        {/* 2-Column Grid (Compact Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Option 1: REMOVE ADS */}
          <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 p-5 flex flex-col justify-between ${
            hasLifetimeNoAds 
              ? 'border-purple-500/60 bg-purple-950/20 shadow-[0_10px_30px_rgba(168,85,247,0.15)]' 
              : 'border-purple-500/30 bg-gradient-to-b from-purple-950/30 via-zinc-950 to-zinc-950 hover:border-purple-500/50'
          }`}>
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shrink-0">
                    <ShieldCheck size={20} fill="currentColor" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest block">Special Offer</span>
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white leading-none">Remove Ads</h3>
                  </div>
                </div>
                {hasLifetimeNoAds && (
                  <span className="px-2.5 py-1 bg-purple-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md flex items-center gap-1">
                    <Check size={10} /> Active
                  </span>
                )}
              </div>

              <div className="space-y-2.5 my-3 pt-2 border-t border-purple-500/10">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black italic tracking-tighter text-white">$2.99</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">One-time • Lifetime</span>
                </div>
                
                <ul className="space-y-1.5 text-[10px] font-medium text-zinc-300">
                  <li className="flex items-center gap-1.5">
                    <Star size={12} className="text-purple-400 shrink-0" />
                    <span>Instant removal of all pop-ups & banner ads</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Zap size={12} className="text-purple-400 shrink-0" />
                    <span>Uninterrupted gameplay forever</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {hasLifetimeNoAds ? (
                <div className="w-full py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-center text-[10px] font-black text-purple-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Check size={14} /> Ads Permanently Disabled
                </div>
              ) : (
                <>
                  <button
                    onClick={handleGooglePlayPurchase}
                    disabled={isPurchasing}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <ShoppingBag size={14} />
                    <span>{isPurchasing ? 'Processing...' : 'Buy Lifetime No Ads ($2.99)'}</span>
                  </button>

                  <div className="pt-1">
                    <PayPalButtonsWrapper 
                      onSuccess={handleNoAdsPurchaseSuccess} 
                      onError={(msg) => notifyError(msg)} 
                      activeClientId={activeClientId}
                      onFallbackToTest={handleFallbackToTest}
                    />
                  </div>

                  <button
                    onClick={handleRestorePurchases}
                    disabled={isPurchasing}
                    className="w-full py-1.5 text-[9px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider transition-colors text-center"
                  >
                    Restore Purchases
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Option 2: WATCH AD (+3,000 COINS) */}
          <div 
            className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950 p-5 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 group cursor-pointer"
            onClick={handleWatchAd}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0">
                    <Play size={20} fill="currentColor" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">Free Coins</span>
                    <h3 className="text-xl font-black uppercase italic tracking-tight text-white leading-none">Watch Ad</h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-wider rounded-full">
                  10 Sec
                </span>
              </div>

              <div className="space-y-2.5 my-3 pt-2 border-t border-amber-500/10">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black italic tracking-tighter text-amber-500">+3,000</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Coins Reward</span>
                </div>
                
                <ul className="space-y-1.5 text-[10px] font-medium text-zinc-300">
                  <li className="flex items-center gap-1.5">
                    <Coins size={12} className="text-amber-500 shrink-0" />
                    <span>Earn instant coins for pack opening</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                    <span>Watch quick 10-second sponsor video</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleWatchAd();
                }}
                disabled={isLoadingAd}
                className="w-full py-3 bg-amber-500 text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.25)] active:scale-95 flex items-center justify-center gap-2"
              >
                {isLoadingAd ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Loading Ad...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} fill="currentColor" />
                    <span>Watch Ad (+3k Coins)</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="pt-4 flex flex-col items-center gap-2 opacity-30 pb-4">
          <p className="text-center text-[7.5px] text-zinc-400 uppercase tracking-[0.2em] font-black">
            UNOFFICIAL FAN GAME • NOT AFFILIATED WITH THE NBA
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <PayPalScriptProvider 
      key={activeClientId}
      options={{ 
        clientId: activeClientId,
        currency: "USD",
        intent: "capture"
      }}
    >
      {content}
    </PayPalScriptProvider>
  );
}
