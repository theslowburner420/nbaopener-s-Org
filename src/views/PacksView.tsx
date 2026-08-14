import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { useEngine, PackType } from '../hooks/useEngine';
import { 
  Package, 
  RefreshCw, 
  Coins, 
  Layers,
  Info,
  X,
  Sparkles,
  Trophy,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PackOpener from '../components/PackOpener';
import { Card } from '../types';
import { useNotification } from '../context/NotificationContext';

interface PackOdds {
  guaranteed: string;
  benchRate: string;
  starterRate: string;
  allStarRate: string;
  franchiseAwardRate: string;
  dynastyLegendRate: string;
  godTierRate?: string;
  highlights: string[];
}

interface Pack {
  id: PackType;
  name: string;
  cardsCount: number;
  price: number;
  image: string;
  tag: string;
  tagColor?: string;
  odds: PackOdds;
}

const PACKS: Pack[] = [
  {
    id: 'duo_xfactor',
    name: 'Dynamic Chemistry',
    cardsCount: 4,
    price: 15000,
    image: 'https://i.postimg.cc/TwG0zjyz/generated-image-(1).png',
    tag: 'Chemistry Booster',
    odds: {
      guaranteed: 'Min. 1x Starter (80+) focus • 8% Walkout Chemistry Chance',
      benchRate: '68.0%',
      starterRate: '28.0%',
      allStarRate: '1.0%',
      franchiseAwardRate: '3.0% (Duo & X-Factor)',
      dynastyLegendRate: '<0.1%',
      highlights: ['Dynamic Duos & Special Boosts', 'X-Factor Impact Cards', 'Team Chemistry Fillers']
    }
  },
  {
    id: 'allstar',
    name: 'All-Star Players',
    cardsCount: 5,
    price: 35000,
    image: 'https://i.postimg.cc/RVKZpcmB/generated-image-(7).png',
    tag: 'Rare Players',
    odds: {
      guaranteed: 'Min. 1x Starter (80+) • 26% All-Star (85+) Walkout Chance',
      benchRate: '55.0%',
      starterRate: '38.0%',
      allStarRate: '7.0% (Base) / 26.0% (Walkout)',
      franchiseAwardRate: '4.0% (Walkout)',
      dynastyLegendRate: '0.5% (Walkout)',
      highlights: ['NBA All-Star Pool (85–89 OVR)', 'Starters & Role Players', 'Low Chance at Top Walkouts']
    }
  },
  {
    id: 'mvp',
    name: 'Finals & Award Winners',
    cardsCount: 5,
    price: 85000,
    image: 'https://i.postimg.cc/T3kMtwps/generated-image-(8).png',
    tag: 'Prime Players',
    odds: {
      guaranteed: 'High-Rated Pool • 45% All-Star 85+ • 13% Awards 90+',
      benchRate: '30.0%',
      starterRate: '52.0%',
      allStarRate: '15.0% (Base) / 45.0% (Walkout)',
      franchiseAwardRate: '13.0% (Awards & Franchise)',
      dynastyLegendRate: '2.0% (Dynasty & HOF Walkout)',
      highlights: ['Finals MVPs, DPOY, ROY & 6MOTY', 'All-Star Regulars (85–89)', 'Rare Dynasty & Legend Walkouts']
    }
  },
  {
    id: 'dynasty',
    name: 'Dynasty Champions',
    cardsCount: 5,
    price: 130000,
    image: 'https://i.postimg.cc/PJ7m51xb/generated-image-(2).png',
    tag: 'Dynasty Heritage',
    odds: {
      guaranteed: 'Elite 80–89 Base • 20% Franchise 90+ • 4.5% Dynasty Jackpot',
      benchRate: '15.0%',
      starterRate: '48.0%',
      allStarRate: '32.0% (Base) / 50.0% (Walkout)',
      franchiseAwardRate: '20.0% (Franchise Champions 90+)',
      dynastyLegendRate: '4.5% Dynasty Squads • 1.5% HOF',
      highlights: [
        'Showtime Lakers (98 OVR)',
        'Lakers Three-Peat (98 OVR)',
        'Spurs Dynasty (97 OVR)',
        'Heat Big Three (97 OVR)',
        'Bad Boys Pistons (96 OVR)'
      ]
    }
  },
  {
    id: 'hof',
    name: 'Hall of Fame Heritage',
    cardsCount: 5,
    price: 185000,
    image: 'https://i.postimg.cc/Pfb76x7C/generated-image-(9).png',
    tag: 'Ultimate Pack',
    odds: {
      guaranteed: '55% All-Star 85+ • 20% 90+ Stars • ~6.5% HOF/Dynasty Jackpot',
      benchRate: '10.0%',
      starterRate: '45.0%',
      allStarRate: '38.0% (Base) / 55.0% (Walkout)',
      franchiseAwardRate: '20.0% (Franchise & Awards)',
      dynastyLegendRate: '5.0% HOF Legends (90–99) • 1.5% Dynasty',
      highlights: ['Springfield Hall of Famers', 'High 85–93 OVR Density', 'Jordan, Bird, Magic & Wilt Eras']
    }
  },
  {
    id: 'legendary_mvp',
    name: 'Guaranteed MVP Pack',
    cardsCount: 1,
    price: 280000,
    image: 'https://i.postimg.cc/GtzqbBwc/generated-image-(10).png',
    tag: '100% Guaranteed MVP',
    odds: {
      guaranteed: '100% Guaranteed MVP Card (Finals MVP, Regular Season MVP or All-Star MVP)',
      benchRate: '0.0%',
      starterRate: '0.0%',
      allStarRate: '0.0%',
      franchiseAwardRate: '100% MVP Award Winners (93–99 OVR)',
      dynastyLegendRate: '143 Total MVP Cards Pool',
      highlights: ['Finals MVPs (Jordan, LeBron, Kobe, Shaq)', 'Regular Season MVPs (Curry, Jokic, Giannis, Bird)', 'All-Star Game MVP Legends']
    }
  }
];

export default function PacksView() {
  const { coins, inventoryPacks, isSaving } = useGame();
  const { openPack, openInventoryPack } = useEngine();
  const { notifyError } = useNotification();
  
  const [openedCards, setOpenedCards] = useState<Card[] | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [openedPackImage, setOpenedPackImage] = useState<string | undefined>(undefined);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);
  const [selectedPackForOdds, setSelectedPackForOdds] = useState<Pack | null>(null);

  const totalInventoryCount = useMemo(() => {
    return inventoryPacks.reduce((acc, p) => acc + (p.count || 1), 0);
  }, [inventoryPacks]);

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
      {/* Header Bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-black/90 px-3 border-b border-white/5 flex items-center justify-between gap-2 h-11 shrink-0 w-full">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-amber-400 shrink-0" />
          <h1 className="text-xs font-black uppercase tracking-wider text-white">
            PACK <span className="text-amber-400">STORE</span>
          </h1>
        </div>

        {/* Clean Coin Balance */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-950/80 border border-white/5 text-[10px] font-mono font-bold text-amber-400">
          <Coins size={12} fill="currentColor" />
          <span>{coins.toLocaleString()}</span>
        </div>
      </header>

      {/* Minimalist View Switcher Tabs */}
      <div className="px-3 pt-3 pb-2 max-w-2xl mx-auto w-full flex items-center justify-center shrink-0">
        <div className="h-6 px-3 bg-zinc-950 border border-white/5 rounded-full flex items-center gap-3">
          <button
            onClick={() => setActiveTab('shop')}
            className={`text-[8px] uppercase tracking-wider transition-all ${
              activeTab === 'shop' 
                ? 'text-amber-400 font-black drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' 
                : 'text-zinc-500 hover:text-zinc-300 font-bold'
            }`}
          >
            STORE
          </button>
          <span className="text-zinc-800 text-[8px] font-bold">|</span>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`text-[8px] uppercase tracking-wider transition-all flex items-center gap-1 ${
              activeTab === 'inventory' 
                ? 'text-amber-400 font-black drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' 
                : 'text-zinc-500 hover:text-zinc-300 font-bold'
            }`}
          >
            MY PACKS
            {totalInventoryCount > 0 && (
              <span className="ml-0.5 text-amber-400 text-[8px] font-mono font-black">
                ({totalInventoryCount})
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-3 py-2 no-scrollbar pb-24 max-w-2xl mx-auto w-full z-10 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'shop' ? (
            <motion.div
              key="shop-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3"
            >
              {PACKS.map((pack) => {
                const canAfford = coins >= pack.price;
                const isBuyingThis = buyingPackId === pack.id;

                return (
                  <div
                    key={pack.id}
                    className="group bg-zinc-950/70 rounded-xl border border-white/5 p-2.5 flex flex-col justify-between transition-all duration-300 hover:border-amber-400/30 relative"
                  >
                    {/* Pack Art Image */}
                    <div className="w-full aspect-[3/4] rounded-lg overflow-hidden border border-white/5 bg-zinc-900 mb-2 relative group-hover:scale-[1.02] transition-transform duration-300">
                      <img 
                        src={pack.image} 
                        alt={pack.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-amber-400 text-black text-[7px] font-black uppercase tracking-wider shadow">
                        {pack.tag}
                      </div>

                      {/* Info / Odds Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPackForOdds(pack);
                        }}
                        className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 flex items-center justify-center text-zinc-300 hover:text-amber-400 hover:border-amber-400/50 transition-colors shadow"
                        title="View Probabilities & Odds"
                      >
                        <Info size={11} />
                      </button>
                    </div>

                    {/* Pack Title & Details */}
                    <div className="space-y-0.5 mb-2.5 text-center">
                      <h3 className="text-[10px] font-black uppercase tracking-tight text-white truncate">
                        {pack.name}
                      </h3>
                      <p className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">
                        {pack.cardsCount} {pack.cardsCount === 1 ? 'Card' : 'Cards'}
                      </p>
                    </div>

                    {/* Price & Action Button */}
                    <button
                      onClick={() => handleBuy(pack)}
                      disabled={isSaving || !!buyingPackId || !canAfford}
                      className={`w-full py-1.5 px-2 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 ${
                        canAfford
                          ? 'bg-amber-400 text-black hover:bg-amber-300 active:scale-95'
                          : 'bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed'
                      }`}
                    >
                      {isBuyingThis ? (
                        <RefreshCw size={11} className="animate-spin" />
                      ) : (
                        <>
                          <Coins size={10} fill="currentColor" className="shrink-0" />
                          <span>{pack.price.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="inventory-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-2"
            >
              {groupedInventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-600 space-y-2">
                  <Package size={24} className="text-zinc-600" />
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    NO STORED PACKS
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {groupedInventory.map((pack) => {
                    const packInfo = PACKS.find(p => p.id === pack.type) || { 
                      name: pack.name || 'Reward Pack',
                      image: 'https://i.postimg.cc/TwG0zjyz/generated-image-(1).png' 
                    };

                    return (
                      <div
                        key={`${pack.type}-${pack.id}`}
                        className="bg-zinc-950/70 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-14 rounded-md overflow-hidden border border-white/5 shrink-0 bg-zinc-900">
                            <img 
                              src={packInfo.image} 
                              alt={pack.name} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <h3 className="text-[10px] font-black uppercase tracking-tight text-white truncate">
                              {pack.name || packInfo.name}
                            </h3>
                            <p className="text-[8px] font-bold text-amber-400/90 uppercase tracking-wider">
                              x{pack.count} Available
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenInventory(pack.id, pack.type)}
                          disabled={isSaving}
                          className="bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 rounded-lg text-[8.5px] font-black uppercase tracking-wider transition-all shrink-0 active:scale-95"
                        >
                          {isSaving ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            'OPEN'
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

      {/* Probabilities & Odds Modal */}
      <AnimatePresence>
        {selectedPackForOdds && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-white/10 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPackForOdds(null)}
                className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-full bg-zinc-900 border border-white/5"
              >
                <X size={14} />
              </button>

              {/* Title & Tag */}
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-14 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-zinc-900">
                  <img
                    src={selectedPackForOdds.image}
                    alt={selectedPackForOdds.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="inline-block px-1.5 py-0.5 rounded bg-amber-400 text-black text-[7px] font-black uppercase tracking-wider">
                    {selectedPackForOdds.tag}
                  </div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    {selectedPackForOdds.name}
                  </h3>
                  <p className="text-[9px] font-mono font-bold text-amber-400">
                    {selectedPackForOdds.price.toLocaleString()} Coins • {selectedPackForOdds.cardsCount} Cards
                  </p>
                </div>
              </div>

              {/* Guaranteed Box */}
              <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/20 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 text-[9px] font-black uppercase tracking-wider">
                  <Sparkles size={11} />
                  <span>Guaranteed Drop</span>
                </div>
                <p className="text-[10px] text-zinc-200 font-semibold leading-tight">
                  {selectedPackForOdds.odds.guaranteed}
                </p>
              </div>

              {/* Probabilities Breakdown */}
              <div className="space-y-1.5 text-[9px]">
                <div className="flex items-center justify-between font-bold text-zinc-400 uppercase tracking-wider text-[8px] border-b border-white/5 pb-1">
                  <span>Tier / Category</span>
                  <span>Base Rate</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span>Bench Tier (&lt;80 OVR)</span>
                  <span className="font-mono font-bold text-zinc-400">{selectedPackForOdds.odds.benchRate}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span>Starter Tier (80–84 OVR)</span>
                  <span className="font-mono font-bold text-zinc-300">{selectedPackForOdds.odds.starterRate}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span>All-Star Tier (85–89 OVR)</span>
                  <span className="font-mono font-bold text-amber-300">{selectedPackForOdds.odds.allStarRate}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-300">
                  <span>Franchise & Awards (90–93 OVR)</span>
                  <span className="font-mono font-bold text-amber-400">{selectedPackForOdds.odds.franchiseAwardRate}</span>
                </div>

                <div className="flex justify-between items-center text-zinc-200 font-bold">
                  <span className="flex items-center gap-1 text-amber-400">
                    <Flame size={10} />
                    Dynasty & Legend Tier (94–98 OVR)
                  </span>
                  <span className="font-mono text-amber-400">{selectedPackForOdds.odds.dynastyLegendRate}</span>
                </div>
              </div>

              {/* Featured Highlights */}
              <div className="space-y-1 pt-1 border-t border-white/5">
                <p className="text-[8px] font-black uppercase tracking-wider text-zinc-400">
                  Featured In This Pack
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedPackForOdds.odds.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-300 text-[8px] font-semibold"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => setSelectedPackForOdds(null)}
                className="w-full py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[9px] font-black uppercase tracking-wider text-white transition-colors"
              >
                Close Info
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

