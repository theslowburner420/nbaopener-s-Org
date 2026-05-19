import React, { ReactNode, useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useEngine, PackType, DROP_RATES } from '../hooks/useEngine';
import { ShoppingCart, Zap, Trophy, Crown, Star, CheckCircle2, Shield, Package, Gift, Sparkles, RefreshCw } from 'lucide-react';
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
  image: string;
}

const PACKS: Pack[] = [
  {
    id: 'rookie',
    name: 'Rookie Pack',
    description: 'Perfect for beginners. Contains 3 cards.',
    price: 1000,
    color: 'from-orange-800 to-orange-950',
    image: 'https://i.postimg.cc/d1xbwS8d/generated-image-(6).png'
  },
  {
    id: 'allstar',
    name: 'All-Star Pack',
    description: 'High chance of elite players. Contains 4 cards.',
    price: 5000,
    color: 'from-zinc-400 to-zinc-600',
    image: 'https://i.postimg.cc/RVKZpcmB/generated-image-(7).png'
  },
  {
    id: 'mvp',
    name: 'Finals MVP Pack',
    description: 'Guaranteed high-tier players. Contains 5 cards.',
    price: 25000,
    color: 'from-amber-500 to-amber-700',
    image: 'https://i.postimg.cc/T3kMtwps/generated-image-(8).png'
  },
  {
    id: 'hof',
    name: 'HOF Pack',
    description: 'The ultimate collection. Highest Mythic rates.',
    price: 100000,
    color: 'from-yellow-400 via-orange-500 to-red-600',
    image: 'https://i.postimg.cc/Pfb76x7C/generated-image-(9).png'
  },
  {
    id: 'legendary_mvp',
    name: 'Legendary MVP',
    description: 'Exclusive series of historical MVP winners. Contains 1 card.',
    price: 250000,
    color: 'from-zinc-900 via-amber-900 to-black',
    image: 'https://i.postimg.cc/GtzqbBwc/generated-image-(10).png'
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
        const rates = DROP_RATES[packId as PackType];
        const mainRarities = rates
          ? rates.filter(r => r.rate > 10).map(r => r.rarity)
          : [];
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
      // Use lowercase for case-insensitive grouping
      const type = pack.type?.toLowerCase() || 'random';
      if (!groups[type]) {
        groups[type] = { ...pack, type, count: pack.count || 1 };
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
    <div className="min-h-full w-full flex flex-col bg-black">
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
      <div className="flex-1 pb-safe px-6">
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
                  whileHover={{ y: -5 }}
                >
                  <div className="flex-1 flex flex-col gap-4">
                    <div className={`aspect-[4/5.5] rounded-[2.5rem] bg-zinc-900 shadow-2xl relative overflow-hidden group border border-white/5 flex-shrink-0 cursor-pointer`}
                         onClick={() => handleBuy(pack)}>
                      <img 
                        src={pack.image} 
                        alt={pack.name} 
                        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-1000"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      
                      {/* Collection Indicator Badge */}
                      {(() => {
                        const progress = packProgresses[pack.id];
                        return (
                          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
                            <CheckCircle2 size={10} className={progress.percent === 100 ? "text-green-400" : "text-amber-500"} />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">
                              {progress.percent}% COLLECTED
                            </span>
                          </div>
                        );
                      })()}
                      
                      {/* Price Tag */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl px-6 py-2 rounded-full border border-white/20 z-20 flex items-center gap-2 group-hover:bg-amber-500 transition-colors group-hover:border-amber-400">
                        <Zap size={12} className="text-amber-400 group-hover:text-black" fill="currentColor" />
                        <span className="text-sm font-black text-white group-hover:text-black italic tracking-tighter">
                          {pack.price.toLocaleString()}
                        </span>
                      </div>
                    </div>
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
                    const packInfo = PACKS.find(p => p.id === pack.type) || { color: 'from-zinc-700 to-zinc-900', image: 'https://i.postimg.cc/TwG0zjyz/generated-image-(1).png' };
                    return (
                      <motion.div
                        key={`${pack.type}-${pack.id}`}
                        className="bg-zinc-950/50 backdrop-blur-xl border border-white/5 rounded-3xl p-5 flex items-center gap-6 group relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 bg-amber-500 px-4 py-1.5 rounded-bl-2xl shadow-lg z-10">
                          <span className="text-[10px] font-black text-black uppercase tracking-widest">x{pack.count}</span>
                        </div>

                        <div className="w-20 h-28 rounded-2xl overflow-hidden shadow-2xl shrink-0 relative border border-white/10">
                          <img src={packInfo.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={pack.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black uppercase italic tracking-tight truncate text-white">{pack.name}</h3>
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Stored Reward</p>
                          <button
                            onClick={() => handleOpenInventory(pack.id, pack.type)}
                            disabled={isSaving}
                            className="mt-4 w-full bg-white text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center"
                          >
                            {isSaving ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              'Decompress Pack'
                            )}
                          </button>
                        </div>
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
