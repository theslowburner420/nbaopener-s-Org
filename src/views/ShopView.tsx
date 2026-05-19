import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Star, Trophy, ShoppingCart, ShieldCheck, Sparkles, X, Play } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

// Removed Coin Packs as per user request to only have subscriptions and lifetime upgrades
const LIFETIME_NO_ADS_PRICE = 5.00;
const SUBSCRIPTION_BATTLE_PASS_PRICE = 3.00;

export default function ShopView() {
  const { 
    coins, 
    addCoins, 
    isPremium, 
    setPremium, 
    hasLifetimeNoAds,
    isBattlePassPremium,
    subscriptionExpiry,
    updateGameStateAsync,
    forceSync, 
    isSaving 
  } = useGame();
  const { notifySuccess, notifyError } = useNotification();
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(30);
  const adContainerRef = useRef<HTMLDivElement>(null);
  
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  const isSubActive = subscriptionExpiry && new Date(subscriptionExpiry) > new Date();
  
  // Lifetime No-Ads is active if either the lifetime purchase was made OR the subscription is active
  const isNoAdsActive = hasLifetimeNoAds || isSubActive;

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
      setAdCountdown(30);
    }
    return () => clearInterval(timer);
  }, [isAdPlaying, adCountdown, coins, addCoins, notifySuccess]);

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
    setAdCountdown(30);
  };

  const handlePurchaseSuccess = async (type: 'lifetime' | 'subscription') => {
    if (type === 'lifetime') {
      await updateGameStateAsync({ 
        hasLifetimeNoAds: true,
        isPremium: true
      });
      notifySuccess("Lifetime No-Ads Activated!");
    } else {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 1);
      await updateGameStateAsync({ 
        isBattlePassPremium: true,
        subscriptionExpiry: expiry.toISOString(),
        isPremium: true
      });
      notifySuccess("Subscription Activated! Battle Pass Unlocked.");
    }
  };

  if (!paypalClientId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-zinc-500 p-8 text-center">
        <div className="max-w-xs">
          <ShieldCheck size={48} className="mx-auto mb-6 opacity-20 text-amber-500" />
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-white mb-2">Secure Vault</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold leading-relaxed">The premium shop is currently in restricted mode. Please contact administrator to enable payments.</p>
        </div>
      </div>
    );
  }

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
      <div className="min-h-full w-full flex flex-col bg-black relative">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

        {/* Content */}
        <div className="flex-1 px-4 sm:px-8 py-6 sm:py-10 space-y-8 no-scrollbar pb-32 z-10 max-w-lg mx-auto w-full">
          
          <div className="text-center space-y-2 mb-10">
             <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
                <Sparkles size={12} className="text-amber-500" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">Exclusive Services</span>
             </div>
             <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Hoops<span className="text-amber-500">Shop</span></h1>
             <p className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-bold">Ultra Pro Collector Vault</p>
          </div>

          {/* Subscription Option: ELITE PASS */}
          <div className={`relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 p-8 group ${isSubActive ? 'border-amber-500 bg-amber-500/10 shadow-[0_40px_100px_rgba(245,158,11,0.2)]' : 'border-zinc-800 bg-zinc-900/40 hover:border-amber-500/30'}`}>
            {isSubActive && (
              <div className="absolute top-6 right-6 px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg -rotate-6">
                Active Member
              </div>
            )}
            
            <div className="flex flex-col gap-8 relative z-10">
              <div className="flex flex-col gap-4">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black shadow-[0_20px_40px_rgba(245,158,11,0.3)] shrink-0">
                  <Trophy size={32} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Elite Pass</h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mt-1">Full Premium Experience</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-4xl font-black italic tracking-tighter text-white">
                  $3.00<span className="text-sm font-black uppercase tracking-widest text-zinc-500 ml-2">/ month</span>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={12} className="text-amber-500" />
                    </div>
                    Permanent No Ads
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Zap size={12} className="text-amber-500" />
                    </div>
                    Premium Battle Pass
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                    <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Sparkles size={12} className="text-amber-500" />
                    </div>
                    Daily Reward Multiplier
                  </div>
                </div>
              </div>

              {!isSubActive && (
                <div className="mt-4">
                  <PayPalButtons
                    style={{ layout: "vertical", height: 55, color: 'gold', shape: 'pill', label: 'subscribe', tagline: false }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          description: "Elite Pass Monthly Subscription",
                          amount: { currency_code: "USD", value: SUBSCRIPTION_BATTLE_PASS_PRICE.toFixed(2) }
                        }],
                        application_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' }
                      });
                    }}
                    onApprove={async (data, actions) => {
                      const details = await actions.order?.capture();
                      if (details?.status === 'COMPLETED') {
                        handlePurchaseSuccess('subscription');
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      notifyError("Elite Pass activation failed.");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Upgrade Option: LIFETIME NO-ADS */}
          <div className={`relative overflow-hidden rounded-[2.5rem] border-2 transition-all duration-500 p-8 group ${hasLifetimeNoAds ? 'border-purple-500 bg-purple-500/10 shadow-[0_40px_100px_rgba(168,85,247,0.2)]' : 'border-zinc-800 bg-zinc-900/40 hover:border-purple-500/30'}`}>
            {hasLifetimeNoAds && (
              <div className="absolute top-6 right-6 px-4 py-1.5 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                OWNED
              </div>
            )}
            
            <div className="flex flex-col gap-8 relative z-10">
              <div className="flex flex-col gap-4">
                <div className="w-16 h-16 rounded-3xl bg-purple-600 flex items-center justify-center text-white shadow-[0_20px_40px_rgba(168,85,247,0.3)] shrink-0">
                  <ShieldCheck size={32} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Lifetime No-Ads</h3>
                  <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mt-1">One-time payment • Forever</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-4xl font-black italic tracking-tighter text-white">
                  $5.00<span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 ml-3 italic">LIFETIME ACCESS</span>
                </div>
                
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
                  Remove all banner and popup advertisements permanently from your account. Invest once, play forever.
                </p>
              </div>

              {!hasLifetimeNoAds && (
                <div className="mt-4">
                  <PayPalButtons
                    style={{ layout: "vertical", height: 55, color: 'blue', shape: 'pill', label: 'pay', tagline: false }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          description: "Lifetime No-Ads Access",
                          amount: { currency_code: "USD", value: LIFETIME_NO_ADS_PRICE.toFixed(2) }
                        }],
                        application_context: { shipping_preference: 'NO_SHIPPING', user_action: 'PAY_NOW' }
                      });
                    }}
                    onApprove={async (data, actions) => {
                      const details = await actions.order?.capture();
                      if (details?.status === 'COMPLETED') {
                        handlePurchaseSuccess('lifetime');
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      notifyError("Upgrade purchase failed.");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Ad Reward Option: FREE COINS */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950 p-6 group cursor-pointer active:scale-[0.98] transition-all"
               onClick={startAd}>
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform shrink-0">
                  <Play size={28} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Ad Reward</h3>
                  <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest">Support the development</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black italic tracking-tighter text-amber-500">+50,000</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 leading-none">Coins</span>
                </div>
              </div>
            </div>
          {/* Footer Quality Note */}
          <div className="pt-10 flex flex-col items-center gap-4 opacity-30 pb-10">
            <div className="h-px w-24 bg-white/10" />
            <p className="text-center text-[7px] text-zinc-400 uppercase tracking-[0.5em] font-black leading-loose max-w-xs">
              MEC HOOPS ULTRA PRO • SECURE CHECKOUT • GLOBAL ACCESS
            </p>
          </div>
        </div>
      </div>
    </div>

      {/* Ad Modal */}
      <AnimatePresence>
        {isAdPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
          >
            {/* Ad Content Simulation */}
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
                  scale: '0.45' // Scale down to fit the reward modal
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
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Premium Experience Loading...</p>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${((30 - adCountdown) / 30) * 100}%` }}
                  className="h-full bg-amber-500"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 flex items-center justify-center relative">
                <span className="text-xl font-black italic text-white">{adCountdown}</span>
              </div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-black">Reward in progress...</p>
            </div>

            {/* Close Button (Disabled until finished) */}
            <button 
              disabled={adCountdown > 0}
              onClick={() => setIsAdPlaying(false)}
              className={`absolute top-6 right-6 p-2 rounded-full transition-all ${
                adCountdown > 0 ? 'opacity-20 cursor-not-allowed' : 'bg-white text-black hover:scale-110'
              }`}
            >
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PayPalScriptProvider>
  );
}
