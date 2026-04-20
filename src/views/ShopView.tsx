import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Star, Trophy, ShoppingCart, ShieldCheck, Sparkles, X, Play } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface CoinPack {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus?: string;
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
}

const COIN_PACKS: CoinPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    coins: 25000,
    price: 1.99,
    icon: <Zap size={24} className="text-blue-400" />,
    color: 'from-blue-600/20 to-blue-900/40',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    coins: 75000,
    price: 4.99,
    bonus: '+15% Bonus',
    icon: <Star size={24} className="text-purple-400" />,
    color: 'from-purple-600/20 to-purple-900/40',
    popular: true,
  },
  {
    id: 'whale',
    name: 'Whale Pack',
    coins: 250000,
    price: 14.99,
    bonus: '+30% Bonus',
    icon: <Trophy size={24} className="text-amber-400" />,
    color: 'from-amber-600/20 to-amber-900/40',
  }
];

const ADS_FREE_PRICE = 2.00;

export default function ShopView() {
  const { coins, addCoins, isPremium, setPremium, forceSync, isSaving } = useGame();
  const { notifySuccess, notifyError } = useNotification();
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adCountdown, setAdCountdown] = useState(30);
  const adContainerRef = useRef<HTMLDivElement>(null);
  
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
      setAdCountdown(30);
    }
    return () => clearInterval(timer);
  }, [isAdPlaying, adCountdown, coins, addCoins, notifySuccess]);

  // Adsterra Integration
  useEffect(() => {
    if (isAdPlaying && adContainerRef.current) {
      const container = adContainerRef.current;
      container.innerHTML = '';

      const adId = 'adsterra-reward-ad-7b956296dd611d148eef5572569c1535';
      const adWrapper = document.createElement('div');
      adWrapper.id = adId;
      container.appendChild(adWrapper);

      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.text = `
        atOptions = {
          'key' : '7b956296dd611d148eef5572569c1535',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/7b956296dd611d148eef5572569c1535/invoke.js';
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

  const handlePaymentSuccess = async (rewardType: 'coins' | 'isPremium', amount: number, transactionId?: string) => {
    if (rewardType === 'coins') {
      await addCoins(amount);
    } else {
      await setPremium(true);
    }
    
    console.log(`💰 PURCHASE VERIFIED: ${rewardType} - Amount: ${amount} - TX: ${transactionId}`);
    notifySuccess("Purchase Successful! Your progress has been synced to the cloud.");
  };

  if (!paypalClientId) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-zinc-500 p-8 text-center">
        <div>
          <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
          <p className="text-sm font-black uppercase tracking-widest">PayPal Not Configured</p>
          <p className="text-[10px] mt-2 uppercase tracking-widest opacity-60">Please set VITE_PAYPAL_CLIENT_ID in environment variables</p>
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
      <div className="h-full w-full flex flex-col bg-black overflow-hidden relative">
        {/* Background Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

        {/* Compact Header */}
        <header className="px-6 py-4 flex justify-between items-center shrink-0 z-20 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-[0_0_15_rgba(245,158,11,0.3)]">
              <ShoppingCart size={16} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Shop</h1>
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Hoops Economy</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8 no-scrollbar pb-32 z-10">
          
          {/* Ads Free Option */}
          {!isPremium ? (
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-zinc-900/40 p-4 sm:p-5 group">
              <div className="flex flex-col gap-4 sm:gap-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] shrink-0">
                      <Zap size={16} sm:size={20} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black uppercase italic tracking-tighter text-white">Ad-Free Experience</h3>
                      <p className="text-[8px] sm:text-[9px] text-zinc-500 uppercase font-bold tracking-widest">One-time payment • Lifetime access</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="block text-base sm:text-lg font-black italic tracking-tighter text-purple-400">${ADS_FREE_PRICE.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-1">
                  <PayPalButtons
                    style={{ 
                      layout: "vertical", 
                      height: 50, 
                      color: 'blue', 
                      shape: 'rect', 
                      label: 'pay',
                      tagline: false
                    }}
                    fundingSource={undefined} // Allow all eligible funding sources (Card, Apple Pay, Google Pay)
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          description: "Ad-Free Experience",
                          amount: {
                            currency_code: "USD",
                            value: ADS_FREE_PRICE.toFixed(2)
                          }
                        }],
                        application_context: {
                          shipping_preference: 'NO_SHIPPING',
                          user_action: 'PAY_NOW'
                        }
                      });
                    }}
                    onApprove={async (data, actions) => {
                      const details = await actions.order?.capture();
                      if (details?.status === 'COMPLETED') {
                        handlePaymentSuccess('isPremium', 0, details.id);
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      notifyError("Payment failed. Please try again.");
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/30 border border-green-500/20 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <ShieldCheck size={16} sm:size={20} />
              </div>
              <div>
                <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-green-500">Ads Free Active</h3>
                <p className="text-[8px] sm:text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Thank you for supporting the game</p>
              </div>
            </div>
          )}

          {/* Ad Reward Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-4 sm:p-5 group cursor-pointer active:scale-[0.98] transition-all"
               onClick={startAd}>
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500 flex items-center justify-center text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
                  <Sparkles size={20} sm:size={24} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black uppercase italic tracking-tighter text-white">Daily Reward</h3>
                  <p className="text-[8px] sm:text-[9px] text-amber-500/80 uppercase font-bold tracking-widest">Watch an ad to claim coins</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xl sm:text-2xl font-black italic tracking-tighter text-amber-400">+50,000</span>
                  <span className="text-xs sm:text-sm">🪙</span>
                </div>
                <span className="text-[7px] sm:text-[8px] text-zinc-500 uppercase font-black tracking-widest">Available Now</span>
              </div>
            </div>
          </div>

          {/* Coin Packs Section */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-amber-500 rounded-full" />
              <h3 className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Coin Packs</h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {COIN_PACKS.map((pack, index) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5"
                >
                  {/* Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${pack.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="flex flex-col gap-4 sm:gap-5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 shrink-0">
                          {React.cloneElement(pack.icon as React.ReactElement, { size: 20 })}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-lg sm:text-xl font-black italic tracking-tighter text-white">{pack.coins.toLocaleString()}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-yellow-500">🪙</span>
                          </div>
                          <h4 className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest">{pack.name}</h4>
                          {pack.bonus && (
                            <span className="text-[8px] sm:text-[9px] font-black text-green-400 uppercase tracking-widest">{pack.bonus}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-sm sm:text-base font-black italic tracking-tighter text-white">${pack.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-1">
                    <PayPalButtons
                      style={{ 
                        layout: "vertical", 
                        height: 50, 
                        color: 'gold', 
                        shape: 'rect', 
                        label: 'pay',
                        tagline: false
                      }}
                      fundingSource={undefined} // Allow all eligible funding sources
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          intent: "CAPTURE",
                          purchase_units: [{
                            description: pack.name,
                            amount: {
                              currency_code: "USD",
                              value: pack.price.toFixed(2)
                            }
                          }],
                          application_context: {
                            shipping_preference: 'NO_SHIPPING',
                            user_action: 'PAY_NOW'
                          }
                        });
                      }}
                      onApprove={async (data, actions) => {
                        const details = await actions.order?.capture();
                        if (details?.status === 'COMPLETED') {
                          handlePaymentSuccess('coins', pack.coins, details.id);
                        }
                      }}
                      onError={(err) => {
                        console.error("PayPal Error:", err);
                        notifyError("Payment failed. Please try again.");
                      }}
                    />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-800">
              <Sparkles size={12} />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Premium Hoops Economy</span>
            </div>
            <p className="text-center text-[7px] text-zinc-800 uppercase tracking-[0.2em] font-bold max-w-[180px]">
              All transactions are final. We are not affiliated with the NBA; this is a fan game. Coins are non-transferable and have no real-world value.
            </p>
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
                  width: '300px',
                  height: '250px',
                  minWidth: '300px',
                  maxWidth: '300px',
                  minHeight: '250px',
                  maxHeight: '250px',
                  overflow: 'hidden',
                  display: 'flex',
                  position: 'relative'
                }}
              >
                <div 
                  ref={adContainerRef}
                  className="w-full h-full flex items-center justify-center pointer-events-auto"
                  style={{
                    width: '300px',
                    height: '250px',
                    overflow: 'hidden',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                >
                  <div className="flex flex-col items-center">
                    <Play size={48} className="text-amber-500 mb-4 animate-bounce" />
                    <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">Hoops Collector Ad</h2>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-2">Premium Experience Loading...</p>
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
