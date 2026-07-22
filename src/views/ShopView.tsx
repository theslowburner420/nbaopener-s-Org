import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Play, RotateCcw, CheckCircle2, AlertCircle, Sparkles, X, Coins, Check } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

const PayPalScriptProvider = lazy(() =>
  import("@paypal/react-paypal-js").then((m) => ({ default: m.PayPalScriptProvider }))
);
const PayPalButtons = lazy(() =>
  import("@paypal/react-paypal-js").then((m) => ({ default: m.PayPalButtons }))
);

const LIFETIME_NO_ADS_PRICE = 3.99;

function PayPalPurchaseContainer({
  clientId,
  onSuccess,
  onError,
}: {
  clientId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return (
      <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
        <p className="text-xs text-zinc-400 font-medium">Unable to load PayPal gateway.</p>
        <button
          onClick={() => setLoadError(false)}
          className="px-4 py-2 bg-amber-500 text-black text-xs font-black uppercase rounded-lg hover:bg-amber-400 transition-all"
        >
          Retry PayPal
        </button>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="w-full h-12 bg-zinc-800/80 animate-pulse rounded-xl flex items-center justify-center text-xs font-bold text-zinc-400">
        Loading PayPal Payment Gateway...
      </div>
    }>
      <PayPalScriptProvider options={{ 
        "client-id": clientId,
        currency: "USD",
        intent: "capture"
      }}>
        <div className="w-full relative z-10 min-h-[50px] overflow-hidden rounded-xl">
          <PayPalButtons
            style={{ 
              layout: "vertical", 
              color: "gold", 
              shape: "rect", 
              label: "pay", 
              tagline: false,
              height: 48
            }}
            createOrder={(data, actions) => {
              return actions.order.create({
                intent: "CAPTURE",
                purchase_units: [{
                  description: "Remove Ads Forever - Lifetime Access",
                  amount: { currency_code: "USD", value: LIFETIME_NO_ADS_PRICE.toFixed(2) }
                }],
                application_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' }
              });
            }}
            onApprove={async (data, actions) => {
              try {
                if (actions.order) {
                  const details = await actions.order.capture();
                  if (details?.status === 'COMPLETED' || details?.status === 'APPROVED') {
                    onSuccess();
                    return;
                  }
                }
                onSuccess();
              } catch (e) {
                console.error("PayPal capture error:", e);
                onError("Failed to process PayPal order.");
              }
            }}
            onCancel={() => {
              onError("Payment was cancelled.");
            }}
            onError={(err) => {
              console.error("PayPal SDK Error:", err);
              onError("PayPal encountered an error. Please try again.");
            }}
          />
        </div>
      </PayPalScriptProvider>
    </Suspense>
  );
}

export default function ShopView() {
  const { 
    coins, 
    addCoins, 
    isPremium, 
    hasLifetimeNoAds,
    updateGameStateAsync,
  } = useGame();
  
  const { notifySuccess, notifyError } = useNotification();
  
  // Ad state
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(15);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [isAdAvailable, setIsAdAvailable] = useState(true);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  
  // Modal state
  const [activeModal, setActiveModal] = useState<{
    type: 'ad_success' | 'ad_incomplete' | 'purchase_success' | 'restore_success';
    title: string;
    body: string;
  } | null>(null);

  const adContainerRef = useRef<HTMLDivElement>(null);
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'sb';

  const isNoAdsActive = hasLifetimeNoAds || isPremium;

  // Rewarded Video Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAdPlaying && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
    } else if (isAdPlaying && adCountdown === 0) {
      // ON_REWARD_COMPLETE: Successfully finished ad
      setIsAdPlaying(false);
      addCoins(50000);
      setActiveModal({
        type: 'ad_success',
        title: 'COINS RECEIVED!',
        body: 'You earned 50,000 coins for watching the video!',
      });
      setAdCountdown(15);
    }
    return () => clearInterval(timer);
  }, [isAdPlaying, adCountdown, addCoins]);

  // Adsterra script injection when playing
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

  const handleStartAd = () => {
    if (!isAdAvailable) {
      notifyError("No ads available right now. Please try again later.");
      return;
    }
    setIsAdLoading(true);
    setTimeout(() => {
      setIsAdLoading(false);
      setIsAdPlaying(true);
      setAdCountdown(15);
    }, 400);
  };

  const handleCloseAdEarly = () => {
    if (adCountdown > 0) {
      setIsAdPlaying(false);
      setAdCountdown(15);
      setActiveModal({
        type: 'ad_incomplete',
        title: 'WATCH INCOMPLETE',
        body: 'Watch the full video to claim your 50,000 coins.',
      });
    } else {
      setIsAdPlaying(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsProcessingPurchase(true);
    try {
      await new Promise(res => setTimeout(res, 600));
      await updateGameStateAsync({ 
        hasLifetimeNoAds: true,
        isPremium: true
      });
      setIsProcessingPurchase(false);
      setActiveModal({
        type: 'restore_success',
        title: 'PURCHASES RESTORED',
        body: 'Your No-Ads status has been restored successfully.',
      });
    } catch (err) {
      setIsProcessingPurchase(false);
      notifyError("Could not restore purchases.");
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col bg-black relative selection:bg-amber-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Content */}
      <div className="flex-1 px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 no-scrollbar pb-32 z-10 max-w-md sm:max-w-lg mx-auto w-full">
        
        {/* Header Section */}
        <div className="text-center space-y-1.5 sm:space-y-2 mb-4 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full mb-2">
            <Sparkles size={12} className="text-amber-500 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">In-App Store</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
            STORE
          </h1>
          <p className="text-[10px] sm:text-[11px] text-zinc-400 uppercase tracking-widest font-bold max-w-xs sm:max-w-sm mx-auto leading-relaxed">
            Get coins and remove ad interruptions
          </p>
        </div>

        {/* CARD 1: REMOVE ADS FOREVER */}
        <div className={`relative overflow-hidden rounded-2xl sm:rounded-[2.2rem] border-2 transition-all duration-300 p-4 sm:p-7 group ${
          isNoAdsActive 
            ? 'border-purple-500/60 bg-purple-950/20 shadow-[0_20px_50px_rgba(168,85,247,0.15)]' 
            : 'border-zinc-800 bg-zinc-900/60 hover:border-purple-500/40 shadow-2xl'
        }`}>
          <div className="flex flex-col gap-4 sm:gap-6 relative z-10">
            {/* Header row with badges */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white shadow-[0_10px_25px_rgba(168,85,247,0.3)] shrink-0">
                  <ShieldCheck size={26} className="sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-black uppercase italic tracking-tighter text-white truncate">
                    REMOVE ADS FOREVER
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-purple-400 uppercase font-black tracking-widest mt-0.5">
                    $3.99 • Lifetime Upgrade
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-purple-600 to-amber-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                <Sparkles size={10} fill="currentColor" />
                <span>BEST VALUE</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-zinc-300 leading-relaxed">
              Enjoy a clean, ad-free experience permanently. No banners, no popups.
            </p>

            <div className="pt-1">
              {isNoAdsActive ? (
                <div className="w-full py-3.5 sm:py-4 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center gap-2 text-purple-300 text-xs sm:text-sm font-black uppercase tracking-widest shadow-inner">
                  <Check size={18} strokeWidth={3} />
                  <span>ACTIVE / PURCHASED</span>
                </div>
              ) : (
                <PayPalPurchaseContainer
                  clientId={paypalClientId}
                  onSuccess={async () => {
                    await updateGameStateAsync({
                      hasLifetimeNoAds: true,
                      isPremium: true
                    });
                    setActiveModal({
                      type: 'purchase_success',
                      title: 'THANK YOU!',
                      body: 'Ads have been permanently removed from your account.'
                    });
                  }}
                  onError={(msg) => {
                    notifyError(msg);
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* CARD 2: FREE COINS VIA VIDEO */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.2rem] border border-amber-500/20 bg-zinc-900/60 p-4 sm:p-7 group shadow-2xl">
          <div className="flex flex-col gap-4 sm:gap-6 relative z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-black shadow-[0_10px_25px_rgba(245,158,11,0.25)] shrink-0">
                  <Play size={24} className="sm:w-7 sm:h-7" fill="currentColor" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-2xl font-black uppercase italic tracking-tighter text-white truncate">
                    FREE COINS
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-amber-400 uppercase font-black tracking-widest mt-0.5">
                    Rewarded Video Sponsor
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-amber-500 text-black text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full shadow-md">
                <Coins size={12} fill="currentColor" />
                <span>+50,000 COINS</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-zinc-300 leading-relaxed">
              Watch a short video sponsor to get instant coins.
            </p>

            <div>
              <button
                onClick={handleStartAd}
                disabled={isAdLoading || !isAdAvailable}
                className={`w-full py-3.5 sm:py-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg min-h-[48px] ${
                  !isAdAvailable
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                    : isAdLoading
                    ? 'bg-amber-600 text-black cursor-wait opacity-80'
                    : 'bg-amber-500 hover:bg-amber-400 text-black hover:shadow-amber-500/25 active:scale-[0.98]'
                }`}
              >
                {!isAdAvailable ? (
                  <span>NO AD AVAILABLE</span>
                ) : isAdLoading ? (
                  <span>LOADING...</span>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>WATCH AD</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ELEMENT 3: RESTORE PURCHASES BUTTON */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <button
            onClick={handleRestorePurchases}
            disabled={isProcessingPurchase}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-zinc-400 hover:text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            <RotateCcw size={14} />
            <span>Restore Purchases</span>
          </button>

          <p className="text-center text-[8px] sm:text-[8.5px] text-zinc-500 uppercase tracking-widest font-black max-w-xs leading-normal">
            UNOFFICIAL FAN GAME • NOT AFFILIATED WITH THE NBA
          </p>
        </div>

      </div>

      {/* REWARDED VIDEO AD PLAYER OVERLAY */}
      <AnimatePresence>
        {isAdPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-6"
          >
            <div className="w-full max-w-xs sm:max-w-md aspect-video bg-zinc-950 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl p-2">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10 animate-pulse" />
              
              {/* Adsterra Container scaled for mobile */}
              <div className="relative z-10 w-full h-full flex items-center justify-center overflow-hidden">
                <div 
                  ref={adContainerRef}
                  className="w-[728px] h-[90px] flex items-center justify-center pointer-events-auto shrink-0"
                  style={{
                    transform: 'scale(0.42)',
                    transformOrigin: 'center center'
                  }}
                >
                  <div className="flex flex-col items-center text-center p-2 min-w-[300px]">
                    <Play size={28} className="text-amber-500 mb-1 animate-bounce" />
                    <h2 className="text-xs font-black italic uppercase tracking-tighter text-white">SPONSORED VIDEO AD</h2>
                    <p className="text-[8px] text-zinc-400 uppercase tracking-widest font-bold mt-0.5">Please watch until countdown ends</p>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-900">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${((15 - adCountdown) / 15) * 100}%` }}
                  className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
              </div>
            </div>

            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2 sm:gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 flex items-center justify-center relative shadow-lg">
                <span className="text-lg sm:text-xl font-black italic text-white">{adCountdown}s</span>
              </div>
              <p className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-black">
                Watching Sponsor Video...
              </p>
            </div>

            {/* Early Close Button */}
            <button 
              onClick={handleCloseAdEarly}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-zinc-900 border border-white/10 hover:border-white/30 text-white rounded-full transition-all hover:scale-105 active:scale-95"
            >
              <X size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL / POPUP DIALOG SYSTEM */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-xs sm:max-w-sm bg-zinc-950 border border-white/10 rounded-[2rem] p-5 sm:p-6 text-center space-y-4 sm:space-y-5 shadow-2xl relative overflow-hidden"
            >
              {/* Top Accent Gradient */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                activeModal.type === 'ad_success' || activeModal.type === 'purchase_success' || activeModal.type === 'restore_success'
                  ? 'bg-gradient-to-r from-amber-500 to-purple-500'
                  : 'bg-amber-500'
              }`} />

              {/* Icon Header */}
              <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                {activeModal.type === 'ad_success' && (
                  <div className="w-full h-full rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                    <Coins size={30} />
                  </div>
                )}
                {activeModal.type === 'ad_incomplete' && (
                  <div className="w-full h-full rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                    <AlertCircle size={30} />
                  </div>
                )}
                {activeModal.type === 'purchase_success' && (
                  <div className="w-full h-full rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                    <CheckCircle2 size={30} />
                  </div>
                )}
                {activeModal.type === 'restore_success' && (
                  <div className="w-full h-full rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <RotateCcw size={30} />
                  </div>
                )}
              </div>

              {/* Modal Texts */}
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight text-white">
                  {activeModal.title}
                </h3>
                <p className="text-xs text-zinc-300 font-medium leading-relaxed px-1 sm:px-2">
                  {activeModal.body}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setActiveModal(null)}
                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-[0.98] ${
                  activeModal.type === 'ad_incomplete'
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    : 'bg-gradient-to-r from-amber-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white'
                }`}
              >
                {activeModal.type === 'ad_incomplete' ? 'GOT IT' : 'AWESOME!'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
