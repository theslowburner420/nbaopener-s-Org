import React, { ReactNode, useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useEngine, PackType, DROP_RATES } from '../hooks/useEngine';
import { ShoppingCart, Zap, Trophy, Crown, Star, CheckCircle2, Shield, Package, Gift, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PackOpener from '../components/PackOpener';
import { Card } from '../types';
import { ALL_CARDS } from '../data/cards';
import { useNotification } from '../context/NotificationContext';

interface Pack {
  id: PackType;
  name: string;
  description: string;
  price: number;
  color: string;
  icon: ReactNode;
}

const PACKS: Pack[] = [
  {
    id: 'rookie',
    name: 'Rookie Pack',
    description: 'Perfect for beginners. Contains 3 cards.',
    price: 1000,
    color: 'from-orange-800 to-orange-950',
    icon: <Zap size={48} className="text-orange-400" />
  },
  {
    id: 'allstar',
    name: 'All-Star Pack',
    description: 'High chance of elite players. Contains 4 cards.',
    price: 5000,
    color: 'from-zinc-400 to-zinc-600',
    icon: <Star size={24} className="text-zinc-200" />
  },
  {
    id: 'mvp',
    name: 'Finals MVP Pack',
    description: 'Guaranteed high-tier players. Contains 5 cards.',
    price: 25000,
    color: 'from-amber-500 to-amber-700',
    icon: <Trophy size={48} className="text-amber-200" />
  },
  {
    id: 'hof',
    name: 'HOF Pack',
    description: 'The ultimate collection. Highest Mythic rates.',
    price: 100000,
    color: 'from-yellow-400 via-orange-500 to-red-600',
    icon: <Crown size={48} />
  },
  {
    id: 'legendary_mvp',
    name: 'Legendary MVP',
    description: 'Exclusive series of historical MVP winners. Contains 1 card.',
    price: 250000,
    color: 'from-zinc-900 via-amber-900 to-black',
    icon: <Trophy size={48} className="text-amber-500" />
  },
  {
    id: 'rising_star',
    name: 'Rising Star',
    description: 'Special edition featuring the best young prospects. Contains 4 cards.',
    price: 50000,
    color: 'from-cyan-600 via-teal-900 to-black',
    icon: <Sparkles size={48} className="text-cyan-400" />
  }
];

export default function PacksView() {
  const { coins, collection, inventoryPacks, isSaving } = useGame();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const { openPack, openInventoryPack } = useEngine();
  const { notifyError } = useNotification();
  const [openedCards, setOpenedCards] = useState<Card[] | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');

  const uniqueOwned = useMemo(() => Object.keys(collection).filter(id => collection[id] > 0).length, [collection]);
  const totalCards = ALL_CARDS.length;
  const progressPercent = Math.round((uniqueOwned / totalCards) * 100);

  const packProgresses = useMemo(() => {
    return PACKS.reduce((acc, pack) => {
      const packId = pack.id;
      let pool: Card[] = [];
      
      if (packId === 'legendary_mvp') {
        pool = ALL_CARDS.filter(c => c.series === 'Legendary MVP Series');
      } else {
        const rates = DROP_RATES[packId];
        const mainRarities = rates
          .filter(r => r.rate > 10)
          .map(r => r.rarity);
        pool = ALL_CARDS.filter(c => mainRarities.includes(c.rarity));
      }

      const uniqueOwnedInPool = pool.filter(c => !!collection[c.id]).length;
      
      acc[packId] = {
        total: pool.length,
        owned: uniqueOwnedInPool,
        percent: pool.length > 0 ? Math.round((uniqueOwnedInPool / pool.length) * 100) : 0
      };
      return acc;
    }, {} as Record<string, { total: number, owned: number, percent: number }>);
  }, [collection]);

  const groupedInventory = useMemo(() => {
    const groups: Record<string, any> = {};
    inventoryPacks.forEach(pack => {
      const type = pack.type;
      if (!groups[type]) {
        groups[type] = { ...pack, count: pack.count || 1 };
      } else {
        groups[type].count += (pack.count || 1);
      }
    });
    return Object.values(groups);
  }, [inventoryPacks]);

  const handleBuy = async (pack: Pack) => {
    if (coins < pack.price) {
      notifyError(`Need ${pack.price - coins} more coins!`);
      return;
    }
    const result = await openPack(pack.id as PackType);
    if (result) {
      setOpenedCards(result.cards);
      setNewlyUnlocked(result.newlyUnlocked);
    }
  };

  const handleOpenInventory = async (packId: string, packType: string) => {
    const result = await openInventoryPack(packId, packType as PackType);
    if (result) {
      setOpenedCards(result.cards);
      setNewlyUnlocked(result.newlyUnlocked);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden">
      {/* Header with Coins */}
      <header className="px-6 pt-4 pb-2 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Packs</h1>
            <p className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] mt-1 font-bold">Premium Collections</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'shop' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <ShoppingCart size={14} />
            Shop
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'inventory' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'
            }`}
          >
            <Package size={14} />
            My Packs
            {inventoryPacks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[8px] flex items-center justify-center text-white border border-black">
                {inventoryPacks.reduce((acc, p) => acc + p.count, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-safe">
        <AnimatePresence mode="wait">
          {activeTab === 'shop' ? (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 pb-20"
            >
              {PACKS.map((pack) => (
                <motion.div 
                  key={pack.id} 
                  className="flex flex-col h-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ 
                    x: [-1, 1, -1, 1, 0],
                    transition: { duration: 0.1, repeat: 2 }
                  }}
                >
                  <div className="flex-1 flex flex-col">
                    <div className={`aspect-[3/4.2] rounded-2xl bg-gradient-to-br ${pack.color} p-0.5 shadow-lg relative overflow-hidden group border border-white/10 flex-shrink-0`}>
                      <div className="absolute inset-0 bg-black/10 group-active:bg-black/30 transition-colors" />
                      
                      {/* Collection Indicator Badge */}
                      {(() => {
                        const progress = packProgresses[pack.id];
                        return (
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 z-20">
                            <CheckCircle2 size={8} className={progress.percent === 100 ? "text-green-400" : "text-white/60"} />
                            <span className="text-[7px] font-black text-white/90 uppercase tracking-tighter">
                              {progress.percent}%
                            </span>
                          </div>
                        );
                      })()}
                      
                      {/* Price Tag */}
                      <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 z-20 flex items-center gap-1">
                        <Zap size={8} className="text-amber-400" fill="currentColor" />
                        <span className="text-[9px] font-black text-white italic tracking-tighter">
                          {pack.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Pack Content */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-3 sm:p-4 text-center">
                        <motion.div 
                          animate={{ 
                            scale: [1, 1.05, 1],
                            rotate: [0, 2, -2, 0]
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="mb-2 sm:mb-4 text-white/90 drop-shadow-xl"
                        >
                          {/* Smaller Icon */}
                          {React.cloneElement(pack.icon as React.ReactElement, { size: isMobile ? 24 : 32 })}
                        </motion.div>
                        
                        <h2 className="text-lg sm:text-xl font-black tracking-tighter uppercase italic text-white drop-shadow-lg mb-1 leading-none">
                          {pack.name.split(' ')[0]}
                          <br />
                          <span className="text-[10px] sm:text-sm opacity-80">{pack.name.split(' ').slice(1).join(' ')}</span>
                        </h2>
                        <p className="text-[7px] sm:text-[8px] text-white/60 font-bold uppercase tracking-widest leading-tight line-clamp-2 px-1 sm:px-2">
                          {pack.description}
                        </p>
                      </div>
                    </div>

                    {/* Buy Button - Premium Redesign */}
                    <button 
                      onClick={() => handleBuy(pack)}
                      disabled={coins < pack.price || isSaving}
                      className="mt-2 sm:mt-3 w-full group relative overflow-hidden rounded-xl active:scale-95 transition-all shrink-0 disabled:opacity-50"
                    >
                      <div className="absolute inset-0 bg-white group-hover:bg-amber-400 transition-colors" />
                      <div className="relative px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {isSaving ? (
                            <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            <ShoppingCart size={12} className="text-black sm:size-14" />
                          )}
                          <span className="text-[8px] sm:text-[10px] font-black text-black uppercase tracking-widest italic">
                            {isSaving ? 'Saving...' : 'Get Pack'}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 sm:gap-1 bg-black/10 px-1.5 sm:px-2 py-0.5 rounded-full">
                          <Zap size={8} className="text-amber-600 sm:size-10" fill="currentColor" />
                          <span className="text-[8px] sm:text-[10px] font-black text-black italic">{pack.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto px-4 sm:px-6 pb-20 custom-scrollbar"
            >
              {groupedInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-zinc-600">
                  <Package size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">No packs in inventory</p>
                  <p className="text-[10px] uppercase tracking-widest mt-2">Complete achievements to earn rewards</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-4">
                  {groupedInventory.map((pack) => {
                    const packInfo = PACKS.find(p => p.id === pack.type) || { color: 'from-zinc-700 to-zinc-900', icon: <Package size={24} /> };
                    return (
                      <motion.div
                        key={`${pack.type}-${pack.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 group relative overflow-hidden"
                      >
                        {/* Quantity Badge */}
                        <div className="absolute top-0 right-0 bg-amber-500 px-3 py-1 rounded-bl-xl shadow-lg z-10">
                          <span className="text-[10px] font-black text-white uppercase tracking-tighter">x{pack.count}</span>
                        </div>

                        <div className={`w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-gradient-to-br ${packInfo.color} flex items-center justify-center text-white/80 shadow-lg shrink-0 relative`}>
                          {React.cloneElement(packInfo.icon as React.ReactElement, { size: 24 })}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs sm:text-sm font-black uppercase italic tracking-tight truncate pr-12">{pack.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                            <span className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Unopened Pack</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenInventory(pack.id, pack.type)}
                          disabled={isSaving}
                          className="bg-white text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0 disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                        >
                          {isSaving ? (
                            <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          ) : (
                            'Open'
                          )}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {openedCards && (
          <PackOpener 
            cards={openedCards} 
            newlyUnlockedAchievements={newlyUnlocked}
            onClose={() => {
              setOpenedCards(null);
              setNewlyUnlocked([]);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
