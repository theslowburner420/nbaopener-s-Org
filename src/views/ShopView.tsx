import React from 'react';
import { useGame } from '../context/GameContext';
import { motion } from 'motion/react';
import { Zap, Star, Trophy, ShoppingCart, ShieldCheck, Sparkles } from 'lucide-react';
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
  const { coins, setCoins, isPremium, setPremium } = useGame();
  const { notifySuccess, notifyError } = useNotification();
  
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

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
              <p className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-bold">NBA Economy</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 no-scrollbar pb-32 z-10">
          
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
