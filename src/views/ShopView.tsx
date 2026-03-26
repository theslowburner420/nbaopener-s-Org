import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Star, Trophy, Coins, Gift, Timer, ShoppingCart, ArrowRight, Sparkles, Crown, ShieldCheck, X, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import InterstitialAd from '../components/InterstitialAd';

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
    coins: 5000,
    price: 1.99,
    icon: <Zap size={24} className="text-blue-400" />,
    color: 'from-blue-600/20 to-blue-900/40',
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    coins: 15000,
    price: 4.99,
    bonus: '+10% Bonus',
    icon: <Star size={24} className="text-purple-400" />,
    color: 'from-purple-600/20 to-purple-900/40',
    popular: true,
  },
  {
    id: 'whale',
    name: 'Whale Pack',
    coins: 50000,
    price: 14.99,
    bonus: '+25% Bonus',
    icon: <Trophy size={24} className="text-amber-400" />,
    color: 'from-amber-600/20 to-amber-900/40',
  }
];

const ADS_FREE_PRICE = 2.00;

export default function ShopView() {
  const { coins, setCoins, isPremium, setPremium } = useGame();
  const { notifySuccess, notifyInfo, notifyError } = useNotification();
  
  const [adTimer, setAdTimer] = useState<number | null>(null);
  const [isAdRunning, setIsAdRunning] = useState(false);

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  // Adsterra Timer Logic
  useEffect(() => {
    if (adTimer === null || adTimer === 0) return;
    
    const timer = setTimeout(() => {
      setAdTimer(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [adTimer]);

  const handleStartAd = () => {
    if (isPremium) {
      notifyInfo("You already have the Ads Free version. Enjoy the game!");
      return;
    }
    if (isAdRunning) return;
    
    setIsAdRunning(true);
    setAdTimer(10); // 10 seconds as requested
    notifyInfo("Watching Ad... Please wait.");
  };

  const handleClaimReward = () => {
    if (adTimer !== 0) return;
    
    setCoins(coins + 500);
    setIsAdRunning(false);
    setAdTimer(null);
    notifySuccess("500 Coins added to your account!");
  };

  const handlePaymentSuccess = (rewardType: 'coins' | 'isPremium', amount: number) => {
    if (rewardType === 'coins') {
      setCoins(coins + amount);
    } else {
      setPremium(true);
    }
    notifySuccess("Purchase Successful! Enjoy your rewards.");
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
    <PayPalScriptProvider options={{ "client-id": paypalClientId }}>
      <div className="h-full w-full flex flex-col bg-black overflow-hidden relative">
        {/* Ad Blocking Overlay */}
        <AnimatePresence>
          {isAdRunning && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6 text-center"
            >
              <div className="max-w-md w-full space-y-8 flex flex-col items-center">
                
                {/* Ad Content */}
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Sparkles size={16} className="animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Watching Ad</span>
                    </div>
                    {adTimer === 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={handleClaimReward}
                        className="flex items-center gap-2 px-4 py-1.5 bg-green-500 text-black rounded-full font-black uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                      >
                        <CheckCircle2 size={14} />
                        Claim Reward
                      </motion.button>
                    )}
                  </div>
                  
                  <InterstitialAd />
                </div>

                <div className="space-y-4 w-full">
                  <div className="relative w-24 h-24 mx-auto">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-amber-500/10 border-t-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black italic tracking-tighter text-amber-500">
                        {adTimer === 0 ? '0' : adTimer}s
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                      {adTimer === 0 ? 'Reward Claimed' : 'Please wait'}
                    </h2>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] leading-relaxed">
                      {adTimer === 0 
                        ? 'You can now claim your 500 coins!' 
                        : `Claiming reward in ${adTimer} seconds...`}
                    </p>
                  </div>

                  <div className="pt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <Coins size={14} className="text-amber-500 animate-bounce" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">500 Coins Pending</span>
                    </div>
                  </div>
                </div>

                {/* Close Button (only visible when timer is 0) */}
                {adTimer === 0 && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleClaimReward}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X size={24} />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

        {/* Compact Header */}
        <header className="px-6 py-4 flex justify-between items-center shrink-0 z-20 border-b border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <ShoppingCart size={16} className="text-black" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Shop</h1>
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-bold">NBA Economy</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar pb-32 z-10">
          
          {/* Adsterra Free Coins Banner - COMPLETELY HIDDEN IF isPremium */}
          {!isPremium && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleStartAd}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-500 cursor-pointer ${
                isAdRunning 
                  ? 'border-zinc-800 bg-zinc-900/50 grayscale' 
                  : 'border-amber-500/30 bg-gradient-to-r from-amber-600/20 to-orange-600/20 hover:border-amber-500/50'
              }`}
            >
              <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isAdRunning ? 'bg-zinc-800' : 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]'}`}>
                    {isAdRunning ? <Timer size={24} className="text-zinc-500 animate-pulse" /> : <Gift size={24} className="text-black animate-bounce" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase italic tracking-tighter text-white">
                      {isAdRunning ? 'Processing Reward...' : 'NEED MORE COINS?'}
                    </h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      {isAdRunning ? `Wait ${adTimer}s to receive your prize` : 'Get 500 FREE here'}
                    </p>
                  </div>
                </div>
                
                {isAdRunning ? (
                  <div className="text-2xl font-black italic tracking-tighter text-amber-500 font-mono">
                    {adTimer}s
                  </div>
                ) : (
                  <div className="bg-amber-500 text-black px-3 py-1.5 rounded-lg font-black uppercase tracking-widest text-[10px] shadow-lg">
                    Watch Now
                  </div>
                )}
              </div>

              {/* Progress Bar for Ad */}
              {isAdRunning && (
                <div className="absolute bottom-0 left-0 h-1 bg-amber-500 transition-all duration-1000 ease-linear" style={{ width: `${(adTimer! / 10) * 100}%` }} />
              )}
            </motion.div>
          )}

          {/* Ads Free Option */}
          {!isPremium ? (
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/20 bg-zinc-900/40 p-5 group">
              <div className="flex flex-col gap-5 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                      <Zap size={20} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-base font-black uppercase italic tracking-tighter text-white">Ad-Free Experience</h3>
                      <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">One-time payment • Lifetime access</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-lg font-black italic tracking-tighter text-purple-400">${ADS_FREE_PRICE.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-1">
                  <PayPalButtons
                    style={{ layout: "horizontal", height: 38, color: 'blue', shape: 'rect', label: 'pay' }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: "CAPTURE",
                        purchase_units: [{
                          description: "Ad-Free Experience",
                          amount: {
                            currency_code: "USD",
                            value: ADS_FREE_PRICE.toFixed(2)
                          }
                        }]
                      });
                    }}
                    onApprove={async (data, actions) => {
                      const details = await actions.order?.capture();
                      if (details?.status === 'COMPLETED') {
                        handlePaymentSuccess('isPremium', 0);
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
            <div className="bg-zinc-900/30 border border-green-500/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-green-500">Ads Free Active</h3>
                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">Thank you for supporting the game</p>
              </div>
            </div>
          )}

          {/* Coin Packs Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-amber-500 rounded-full" />
              <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Coin Packs</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {COIN_PACKS.map((pack, index) => (
                <motion.div
                  key={pack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
                >
                  {/* Background Glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${pack.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  
                  <div className="flex flex-col gap-5 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5">
                          {pack.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-black italic tracking-tighter text-white">{pack.coins.toLocaleString()}</span>
                            <span className="text-xs font-bold text-yellow-500">🪙</span>
                          </div>
                          <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{pack.name}</h4>
                          {pack.bonus && (
                            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">{pack.bonus}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-base font-black italic tracking-tighter text-white">${pack.price.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="mt-1">
                      <PayPalButtons
                        style={{ layout: "horizontal", height: 38, color: 'gold', shape: 'rect', label: 'pay' }}
                        createOrder={(data, actions) => {
                          return actions.order.create({
                            intent: "CAPTURE",
                            purchase_units: [{
                              description: pack.name,
                              amount: {
                                currency_code: "USD",
                                value: pack.price.toFixed(2)
                              }
                            }]
                          });
                        }}
                        onApprove={async (data, actions) => {
                          const details = await actions.order?.capture();
                          if (details?.status === 'COMPLETED') {
                            handlePaymentSuccess('coins', pack.coins);
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
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Premium NBA Economy</span>
            </div>
            <p className="text-center text-[7px] text-zinc-800 uppercase tracking-[0.2em] font-bold max-w-[180px]">
              All transactions are final. Coins are non-transferable and have no real-world value.
            </p>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
