import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, X, Play, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const PayPalScriptProvider = lazy(() =>
  import("@paypal/react-paypal-js").then((m) => ({ default: m.PayPalScriptProvider }))
);
const PayPalButtons = lazy(() =>
  import("@paypal/react-paypal-js").then((m) => ({ default: m.PayPalButtons }))
);

const LIFETIME_NO_ADS_PRICE = 2.99;
const AD_DURATION_SECONDS = 10;

export default function ShopView() {
  const { 
    addCoins, 
    hasLifetimeNoAds,
    updateGameStateAsync,
  } = useGame();
  const { notifySuccess, notifyError } = useNotification();
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(AD_DURATION_SECONDS);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAdPlaying && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
    } else if (isAdPlaying && adCountdown === 0) {
      setIsAdPlaying(false);
      addCoins(50000);
      notifySuccess("Reward Claimed! +50,000 Coins");
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Content */}
      <div className="flex-1 px-4 sm:px-8 py-6 sm:py-10 space-y-8 no-scrollbar pb-32 z-10 max-w-lg mx-auto w-full">
        
        <div className="text-center space-y-2 mb-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
              <Sparkles size={12} className="text-amber-500" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">Official Shop</span>
           </div>
           <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Hoops<span className="text-amber-500">Shop</span></h1>
           <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold max-w-sm mx-auto leading-normal">Available Shop Options</p>
        </div>

        {/* Option 1: REMOVE ADS for $2.99 */}
        <div className={`relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 p-8 group ${hasLifetimeNoAds ? 'border-purple-500 bg-purple-500/10 shadow-[0_40px_100px_rgba(168,85,247,0.2)]' : 'border-zinc-800 bg-zinc-900/40 hover:border-purple-500/30'}`}>
          {hasLifetimeNoAds && (
            <div className="absolute top-6 right-6 px-4 py-1.5 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
              <Check size={12} /> PURCHASED
            </div>
          )}
          
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex flex-col gap-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-600 flex items-center justify-center text-white shadow-[0_20px_40px_rgba(168,85,247,0.3)] shrink-0">
                <ShieldCheck size={32} fill="currentColor" />
              </div>
              <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Remove Ads</h3>
                <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mt-1">One-time payment • Lifetime access</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="text-4xl font-black italic tracking-tighter text-white">
                $2.99<span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 ml-3 italic">LIFETIME ACCESS</span>
              </div>
              
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
                Permanently remove all pop-up ads and banners from your account.
              </p>
            </div>

            {!hasLifetimeNoAds && (
              <div className="mt-4 space-y-3">
                {paypalClientId ? (
                  <Suspense fallback={<div className="h-[55px] w-full bg-zinc-900 animate-pulse rounded-full" />}>
                    <PayPalButtons
                      style={{ layout: "vertical", height: 55, color: 'blue', shape: 'pill', label: 'pay', tagline: false }}
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
                        const details = await actions.order?.capture();
                        if (details?.status === 'COMPLETED') {
                          handleNoAdsPurchaseSuccess();
                        }
                      }}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                        notifyError("Error processing payment.");
                      }}
                    />
                  </Suspense>
                ) : (
                  <button
                    disabled={isPurchasing}
                    onClick={handleNoAdsPurchaseSuccess}
                    className="w-full h-[55px] bg-purple-600 hover:bg-purple-500 text-white font-black uppercase tracking-widest text-xs rounded-full transition-all shadow-[0_10px_30px_rgba(168,85,247,0.4)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isPurchasing ? "Processing..." : "Remove Ads for $2.99"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Option 2: WATCH AD (+50,000 COINS, 10 SEC) */}
        <div 
          className="relative overflow-hidden rounded-[2.5rem] border border-amber-500/30 bg-zinc-950 p-8 group cursor-pointer active:scale-[0.98] transition-all shadow-[0_20px_50px_rgba(245,158,11,0.1)]"
          onClick={startAd}
        >
          <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center text-black shadow-[0_0_25px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform shrink-0">
                  <Play size={32} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Watch Ad</h3>
                  <p className="text-[9px] text-amber-500 uppercase font-black tracking-widest mt-0.5">Only 10 Seconds</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reward</span>
              <div className="flex items-center gap-1.5">
                <span className="text-3xl font-black italic tracking-tighter text-amber-500">+50,000</span>
                <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Coins</span>
              </div>
            </div>

            <button className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-2xl group-hover:bg-amber-400 transition-colors shadow-lg flex items-center justify-center gap-2">
              <Play size={16} fill="currentColor" />
              Watch Ad (10s)
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="pt-10 flex flex-col items-center gap-4 opacity-30 pb-10">
          <div className="h-px w-24 bg-white/10" />
          <p className="text-center text-[7.5px] text-zinc-400 uppercase tracking-[0.3em] font-black leading-loose max-w-sm">
            NOT AFFILIATED WITH THE NBA • THIS IS AN UNOFFICIAL FAN GAME
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
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Earn +50,000 Coins...</p>
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

  if (paypalClientId) {
    return (
      <PayPalScriptProvider options={{ 
        "client-id": paypalClientId,
        currency: "USD",
        locale: "en_US",
        "enable-funding": "venmo",
        "disable-funding": "paylater",
        "components": "buttons",
        "intent": "capture"
      }}>
        {content}
      </PayPalScriptProvider>
    );
  }

  return content;
}
