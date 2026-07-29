import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useEngine, PackType, DROP_RATES } from '../hooks/useEngine';
import { 
  ShoppingCart, 
  Crown, 
  Star, 
  Package, 
  Sparkles, 
  RefreshCw, 
  Coins, 
  PlusCircle,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PackOpener from '../components/PackOpener';
import { Card } from '../types';
import { ALL_CARDS } from '../data/cards';
import { useNotification } from '../context/NotificationContext';

interface Pack {
  id: PackType;
  name: string;
  subtitle: string;
  description: string;
  cardsCount: number;
  price: number;
  badge: string;
  badgeColor: string;
  accentColor: string;
  borderColor: string;
  image: string;
  featured?: boolean;
  highlight: string;
}

const PACKS: Pack[] = [
  {
    id: 'rookie',
    name: 'Rookie Pack',
    subtitle: 'Beginner Collection',
    description: 'Perfect for building your initial squad with promising talents.',
    cardsCount: 3,
    price: 1000,
    badge: 'STARTER',
    badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    accentColor: 'from-orange-950/40 via-zinc-950 to-zinc-950',
    borderColor: 'border-orange-500/30 hover:border-orange-500/50',
    image: 'https://i.postimg.cc/d1xbwS8d/generated-image-(6).png',
    highlight: 'Standard Drop Rates'
  },
  {
    id: 'allstar',
    name: 'All-Star Pack',
    subtitle: 'Elite Roster',
    description: 'High chance of unlocking star starters and All-NBA players.',
    cardsCount: 4,
    price: 5000,
    badge: 'ALL-STAR',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    accentColor: 'from-blue-950/40 via-zinc-950 to-zinc-950',
    borderColor: 'border-blue-500/30 hover:border-blue-500/50',
    image: 'https://i.postimg.cc/RVKZpcmB/generated-image-(7).png',
    highlight: 'Increased Starter & All-Star Chances'
  },
  {
    id: 'mvp',
    name: 'Finals MVP Pack',
    subtitle: 'Championship Tier',
    description: 'Guaranteed top-tier franchise cornerstones and defensive powerhouses.',
    cardsCount: 5,
    price: 25000,
    badge: 'FINALS MVP',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    accentColor: 'from-amber-950/40 via-zinc-950 to-zinc-950',
    borderColor: 'border-amber-500/30 hover:border-amber-500/50',
    image: 'https://i.postimg.cc/T3kMtwps/generated-image-(8).png',
    highlight: '5 Cards • High Franchise & DPOY Rates'
  },
  {
    id: 'hof',
    name: 'HOF Pack',
    subtitle: 'Hall of Fame',
    description: 'The premier pack for elite collectors. Premium rates for Mythic & HOF cards.',
    cardsCount: 5,
    price: 100000,
    badge: 'HALL OF FAME',
    badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    accentColor: 'from-yellow-950/50 via-zinc-950 to-zinc-950',
    borderColor: 'border-yellow-500/40 hover:border-yellow-500/70',
    image: 'https://i.postimg.cc/Pfb76x7C/generated-image-(9).png',
    featured: true,
    highlight: 'Highest Mythic & Record Rates'
  },
  {
    id: 'legendary_mvp',
    name: 'Legendary MVP',
    subtitle: 'Historical Series',
    description: '100% Guaranteed historical MVP winner card. Rare & iconic legends.',
    cardsCount: 1,
    price: 250000,
    badge: 'LEGENDARY',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    accentColor: 'from-purple-950/50 via-zinc-950 to-zinc-950',
    borderColor: 'border-purple-500/40 hover:border-purple-500/70',
    image: 'https://i.postimg.cc/GtzqbBwc/generated-image-(10).png',
    featured: true,
    highlight: '100% Guaranteed Legend MVP Card'
  }
];

export default function PacksView() {
  const { coins, collection, inventoryPacks, isSaving, setCurrentView } = useGame();
  const { openPack, openInventoryPack } = useEngine();
  const { notifyError } = useNotification();
  
  const [openedCards, setOpenedCards] = useState<Card[] | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'starter' | 'elite'>('all');
  const [openedPackImage, setOpenedPackImage] = useState<string | undefined>(undefined);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);

  const totalInventoryCount = useMemo(() => {
    return inventoryPacks.reduce((acc, p) => acc + (p.count || 1), 0);
  }, [inventoryPacks]);

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
      const type = pack.type?.toLowerCase() || 'random';
      if (!groups[type]) {
        groups[type] = { ...pack, type, count: pack.count || 1 };
      } else {
        groups[type].count += (pack.count || 1);
      }
    });
    return Object.values(groups);
  }, [inventoryPacks]);

  const filteredPacks = useMemo(() => {
    if (selectedCategory === 'starter') {
      return PACKS.filter(p => p.price <= 5000);
    }
    if (selectedCategory === 'elite') {
      return PACKS.filter(p => p.price > 5000);
    }
    return PACKS;
  }, [selectedCategory]);

  const handleBuy = async (pack: Pack) => {
    if (isSaving || buyingPackId) return;
    if (coins < pack.price) {
      notifyError(`Need ${(pack.price - coins).toLocaleString()} more coins!`);
      return;
    }

    setBuyingPackId(pack.id);
    try {
      const result = await openPack(pack.id as PackType);
      if (result) {
        setOpenedPackImage(pack.image);
        setOpenedCards(result.cards);
        setNewlyUnlocked(result.newlyUnlocked);
      }
    } finally {
      setBuyingPackId(null);
    }
  };

  const handleOpenInventory = async (packId: string, packType: string) => {
    if (isSaving) return;
    const result = await openInventoryPack(packId, packType as PackType);
    if (result) {
      const packInfo = PACKS.find(p => p.id === packType);
      setOpenedPackImage(packInfo?.image || 'https://i.postimg.cc/bY3DRzLz/4a07a4ae-7c5c-4d11-8585-780a8aebebbe.png');
      setOpenedCards(result.cards);
      setNewlyUnlocked(result.newlyUnlocked);
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col bg-black text-white relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

      {/* Header Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/90 px-4 py-3 border-b border-zinc-900 flex items-center justify-between gap-2 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Layers size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight italic leading-none">
              Pack <span className="text-amber-500">Store</span>
            </h1>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Official Card Packs</p>
          </div>
        </div>

        {/* Coin Balance & Get Coins CTA */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-amber-500">
            <Coins size={14} fill="currentColor" />
            <span>{coins.toLocaleString()}</span>
          </div>

          <button 
            onClick={() => setCurrentView('shop')}
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider transition-all"
            title="Earn or buy coins"
          >
            <PlusCircle size={12} />
            <span>+Coins</span>
          </button>
        </div>
      </header>

      {/* View Switcher Tabs & Filter */}
      <div className="px-4 pt-3 pb-2 max-w-4xl mx-auto w-full space-y-3 z-10 shrink-0">
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => setActiveTab('shop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'shop' 
                ? 'bg-amber-500 text-black shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ShoppingCart size={14} />
            Pack Store
          </button>
          
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === 'inventory' 
                ? 'bg-amber-500 text-black shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Package size={14} />
            My Packs
            {totalInventoryCount > 0 && (
              <span className="px-1.5 py-0.2 bg-black text-amber-400 rounded-full text-[9px] font-mono font-bold border border-amber-500/40">
                {totalInventoryCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Pills for Store */}
        {activeTab === 'shop' && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              All Packs ({PACKS.length})
            </button>
            <button
              onClick={() => setSelectedCategory('starter')}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${
                selectedCategory === 'starter'
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Rookie & Starter
            </button>
            <button
              onClick={() => setSelectedCategory('elite')}
              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all shrink-0 ${
                selectedCategory === 'elite'
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              Elite & Mythic
            </button>
          </div>
        )}
      </div>

      {/* Main Content Scrollable Area */}
      <div className="flex-1 px-4 py-2 space-y-4 no-scrollbar pb-28 max-w-4xl mx-auto w-full z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'shop' ? (
            <motion.div
              key="shop-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Pack List / Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPacks.map((pack) => {
                  const progress = packProgresses[pack.id] || { percent: 0, owned: 0, total: 0 };
                  const canAfford = coins >= pack.price;
                  const isBuyingThis = buyingPackId === pack.id;

                  return (
                    <motion.div
                      key={pack.id}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      className={`relative overflow-hidden rounded-2xl border-2 bg-gradient-to-b ${pack.accentColor} ${pack.borderColor} p-4 flex flex-col justify-between transition-all duration-300 shadow-xl group`}
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border ${pack.badgeColor}`}>
                          {pack.badge}
                        </span>

                        <div className="flex items-center gap-1 bg-black/60 border border-white/10 px-2 py-0.5 rounded-full text-[9px] font-mono text-amber-400 font-bold">
                          <span>{progress.percent}%</span>
                          <span className="text-[7.5px] text-zinc-400 uppercase font-sans">Collected</span>
                        </div>
                      </div>

                      {/* Middle Content: Pack Image + Title & Details */}
                      <div className="flex items-center gap-3.5 mb-4">
                        {/* Pack Image Container */}
                        <div className="w-24 h-32 rounded-xl overflow-hidden shadow-2xl border border-white/10 shrink-0 relative group-hover:scale-105 transition-transform duration-300 bg-zinc-900">
                          <img 
                            src={pack.image} 
                            alt={pack.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[8px] font-black uppercase text-white tracking-widest">
                            {pack.cardsCount} {pack.cardsCount === 1 ? 'Card' : 'Cards'}
                          </span>
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <h3 className="text-lg font-black italic uppercase tracking-tight text-white leading-tight truncate">
                            {pack.name}
                          </h3>
                          <p className="text-[9px] font-bold text-amber-400/90 uppercase tracking-wider">
                            {pack.subtitle}
                          </p>
                          <p className="text-[10px] text-zinc-400 line-clamp-2 leading-tight">
                            {pack.description}
                          </p>
                          
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1 text-[8.5px] font-bold text-zinc-300 bg-black/40 border border-white/5 px-2 py-0.5 rounded-md">
                              <Sparkles size={10} className="text-amber-500 shrink-0" />
                              <span className="truncate">{pack.highlight}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Area: Price Tag & Buy Button */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Price</span>
                          <div className="flex items-center gap-1">
                            <Coins size={14} className="text-amber-500 shrink-0" fill="currentColor" />
                            <span className="text-base font-black italic tracking-tight text-white font-mono">
                              {pack.price.toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleBuy(pack)}
                          disabled={isSaving || !!buyingPackId || !canAfford}
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg active:scale-95 shrink-0 ${
                            canAfford
                              ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20'
                              : 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed'
                          }`}
                        >
                          {isBuyingThis ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : canAfford ? (
                            <>
                              <ShoppingCart size={13} fill="currentColor" />
                              Buy Pack
                            </>
                          ) : (
                            'Need Coins'
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="inventory-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {groupedInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600 space-y-3 bg-zinc-950/60 rounded-3xl border border-zinc-900 p-8">
                  <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 border border-zinc-800">
                    <Package size={32} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">No Stored Packs</h3>
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider mt-1">
                      Complete achievements or rewards to earn free packs!
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('shop')}
                    className="mt-2 px-4 py-2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-all"
                  >
                    Visit Pack Store
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {groupedInventory.map((pack) => {
                    const packInfo = PACKS.find(p => p.id === pack.type) || { 
                      name: pack.name || 'Reward Pack',
                      badge: 'REWARD',
                      accentColor: 'from-zinc-900 to-zinc-950',
                      image: 'https://i.postimg.cc/TwG0zjyz/generated-image-(1).png' 
                    };

                    return (
                      <div
                        key={`${pack.type}-${pack.id}`}
                        className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 relative overflow-hidden shadow-xl"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-16 h-22 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0 relative bg-zinc-900">
                            <img 
                              src={packInfo.image} 
                              alt={pack.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-2 py-0.2 bg-amber-500 text-black text-[9px] font-black uppercase rounded-full">
                                x{pack.count} Available
                              </span>
                            </div>
                            <h3 className="text-sm font-black uppercase italic tracking-tight truncate text-white">
                              {pack.name || packInfo.name}
                            </h3>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                              Ready to Open
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenInventory(pack.id, pack.type)}
                          disabled={isSaving}
                          className="bg-white hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 shrink-0 flex items-center gap-1"
                        >
                          {isSaving ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            'Open Pack'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pack Opener Modal */}
      <AnimatePresence>
        {openedCards && (
          <PackOpener 
            cards={openedCards} 
            newlyUnlockedAchievements={newlyUnlocked}
            packImage={openedPackImage}
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
