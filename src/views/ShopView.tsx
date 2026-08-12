import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, X, Play, Check, Coins, Zap, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

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
  } = useGame();
  const { notifySuccess, notifyError } = useNotification();
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(AD_DURATION_SECONDS);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
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

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAdPlaying && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
    } else if (isAdPlaying && adCountdown === 0) {
      setIsAdPlaying(false);
      addCoins(3000);
      notifySuccess("Reward Claimed! +3,000 Coins");
      setAdCountdown(AD_DURATION_SECONDS);
    }
    return () => clearInterval(timer);
  }, [isAdPlaying, adCountdown, addCoins, notifySuccess]);

  // Adsterra Integration
  useEffect(() => {
    if (isAdPlaying && adContainerRef.current) {
      const container = adContainerRef.current;
      container.innerHTML = '';

      const adId = 'adsterra-reward-ad-ca59b0dcdd453b6300a8f085b2df6f47';
      const adWrapper = document.createElement('div');
      adWrapper.id = adId;
      container.appendChild(adWrapper);

      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.text = `
        atOptions = {
          'key' : 'ca59b0dcdd453b6300a8f085b2df6f47',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/ca59b0dcdd453b6300a8f085b2df6f47/invoke.js';
      invokeScript.async = true;
      invokeScript.defer = true;

      container.appendChild(optionsScript);
      container.appendChild(invokeScript);
    }
  }, [isAdPlaying]);

  const startAd = () => {
    setIsAdPlaying(true);
    setAdCountdown(AD_DURATION_SECONDS);
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

            <div className="mt-4">
              {hasLifetimeNoAds ? (
                <div className="w-full py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-center text-[10px] font-black text-purple-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Check size={14} /> Ads Permanently Disabled
                </div>
              ) : (
                <PayPalButtonsWrapper 
                  onSuccess={handleNoAdsPurchaseSuccess} 
                  onError={(msg) => notifyError(msg)} 
                  activeClientId={activeClientId}
                  onFallbackToTest={handleFallbackToTest}
                />
              )}
            </div>
          </div>

          {/* Option 2: WATCH AD (+50,000 COINS) */}
          <div 
            className="relative overflow-hidden rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950 p-5 flex flex-col justify-between hover:border-amber-500/50 transition-all duration-300 group cursor-pointer"
            onClick={startAd}
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
                  startAd();
                }}
                className="w-full py-3 bg-amber-500 text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-amber-400 transition-colors shadow-[0_4px_20px_rgba(245,158,11,0.25)] active:scale-95 flex items-center justify-center gap-2"
              >
                <Play size={14} fill="currentColor" />
                Watch Ad (+3k Coins)
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

      {/* 10-Second Ad Modal */}
      <AnimatePresence>
        {isAdPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
          >
            {/* Ad Content Box */}
            <div className="w-full max-w-md aspect-video bg-zinc-900 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent animate-pulse" />
              
              {/* Adsterra Container */}
              <div 
                className="relative z-10 flex items-center justify-center bg-zinc-950/50 rounded-xl overflow-hidden adsterra-container"
                style={{ 
                  width: '728px',
                  height: '90px',
                  minWidth: '728px',
                  maxWidth: '728px',
                  minHeight: '90px',
                  maxHeight: '90px',
                  overflow: 'hidden',
                  display: 'flex',
                  position: 'relative',
                  scale: '0.45'
                }}
              >
                <div 
                  ref={adContainerRef}
                  className="w-full h-full flex items-center justify-center pointer-events-auto"
                  style={{
                    width: '728px',
                    height: '90px',
                    overflow: 'hidden',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Play size={32} className="text-amber-500 mb-2 animate-bounce" />
                    <h2 className="text-sm font-black italic uppercase tracking-tighter text-white">Hoops Collector Ad</h2>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Earn +3,000 Coins...</p>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar for 10 seconds */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${((AD_DURATION_SECONDS - adCountdown) / AD_DURATION_SECONDS) * 100}%` }}
                  className="h-full bg-amber-500"
                  transition={{ ease: "linear" }}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 flex items-center justify-center relative">
                <span className="text-2xl font-black italic text-white">{adCountdown}s</span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Ad in progress...</p>
            </div>

            {/* Close Button (Disabled until 10 seconds complete) */}
            <button 
              disabled={adCountdown > 0}
              onClick={() => setIsAdPlaying(false)}
              className={`absolute top-6 right-6 p-2 rounded-full transition-all ${
                adCountdown > 0 ? 'opacity-20 cursor-not-allowed text-zinc-500' : 'bg-white text-black hover:scale-110'
              }`}
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
