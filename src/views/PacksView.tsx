import React, { ReactNode, useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useEngine, PackType, DROP_RATES } from '../hooks/useEngine';
import { ShoppingCart, Zap, Trophy, Crown, Star, CheckCircle, Shield, Package, Gift, Sparkles, RefreshCw } from 'lucide-react';
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
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 p-4 sm:p-6 pb-24"
            >
              {PACKS.map((pack) => (
                <motion.div 
                  key={pack.id} 
                  className="flex flex-col items-center"
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="relative w-full aspect-[2/3] group cursor-pointer"
                       onClick={() => handleBuy(pack)}>
                    {/* The Pack Image Itself */}
                    <div className="absolute inset-0 z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:shadow-[0_40px_80px_rgba(0,0,0,0.8)] transition-all duration-500 rounded-lg overflow-hidden border border-white/5">
                      <img 
                        src={pack.image} 
                        alt={pack.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Progress Indicator */}
                    <div className="absolute -top-3 -right-3 z-30 flex items-center justify-center w-10 h-10 bg-black border border-amber-500/30 rounded-full shadow-2xl backdrop-blur-xl">
                      <span className="text-[8px] font-black text-amber-500">{packProgresses[pack.id].percent}%</span>
                    </div>
                    
                    {/* Buy Prompt Overlay */}
                    <div className="absolute inset-x-0 bottom-0 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 px-4 pb-4">
                      <div className="bg-amber-500 text-black py-2 rounded-full text-center text-[10px] font-black uppercase tracking-tighter shadow-2xl flex items-center justify-center gap-2">
                        <ShoppingCart size={12} fill="currentColor" />
                        BUX {pack.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90 italic">{pack.name}</h3>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                      {pack.id === 'legendary_mvp' ? '1 CARD' : 'MULTIPLE CARDS'}
                    </p>
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
              className="px-4 sm:px-6 pb-24"
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
