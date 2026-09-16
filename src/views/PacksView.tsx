import React, { useState, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useEngine, PackType } from '../hooks/useEngine';
import { 
  Package, 
  RefreshCw, 
  Coins, 
  Layers,
  Sparkles,
  ChevronRight,
  Flame,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PackOpener from '../components/PackOpener';
import { Card } from '../types';
import { useNotification } from '../context/NotificationContext';
import { isScreamEditionActive, SCREAM_EDITION_CONFIG } from '../constants/screamEdition';
import { getPrimaryActiveEvent, getActiveEvents } from '../constants/events';

interface Pack {
  id: PackType;
  name: string;
  cardsCount: number;
  price: number;
  image: string;
  isEventPack?: boolean;
  eventBadge?: string;
}

const BASE_PACKS: Pack[] = [
  {
    id: 'rookie',
    name: 'Rookie Pack',
    cardsCount: 4,
    price: 5000,
    image: 'https://i.postimg.cc/bY3DRzLz/4a07a4ae-7c5c-4d11-8585-780a8aebebbe.png'
  },
  {
    id: 'starter',
    name: 'Starter Pack',
    cardsCount: 4,
    price: 15000,
    image: 'https://i.postimg.cc/TwG0zjyz/generated-image-(1).png'
  },
  {
    id: 'allstar',
    name: 'All-Star Pack',
    cardsCount: 5,
    price: 35000,
    image: 'https://i.postimg.cc/RVKZpcmB/generated-image-(7).png'
  },
  {
    id: 'allnba',
    name: 'All-NBA Pack',
    cardsCount: 5,
    price: 75000,
    image: 'https://i.postimg.cc/PJ7m51xb/generated-image-(2).png'
  },
  {
    id: 'mvp',
    name: 'Finals MVP Pack',
    cardsCount: 5,
    price: 130000,
    image: 'https://i.postimg.cc/T3kMtwps/generated-image-(8).png'
  },
  {
    id: 'hof',
    name: 'Hall of Fame Pack',
    cardsCount: 5,
    price: 195000,
    image: 'https://i.postimg.cc/Pfb76x7C/generated-image-(9).png'
  },
  {
    id: 'legendary_mvp',
    name: 'Legendary MVP Pack',
    cardsCount: 1,
    price: 280000,
    image: 'https://i.postimg.cc/GtzqbBwc/generated-image-(10).png'
  }
];

export default function PacksView() {
  const { coins, inventoryPacks, isSaving, isPremium } = useGame();
  const { openPack, openInventoryPack } = useEngine();
  const { notifyError } = useNotification();
  
  const [openedCards, setOpenedCards] = useState<Card[] | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory'>('shop');
  const [openedPackImage, setOpenedPackImage] = useState<string | undefined>(undefined);
  const [buyingPackId, setBuyingPackId] = useState<string | null>(null);

  // Active events resolution
  const activeEvents = useMemo(() => getActiveEvents(), []);
  const primaryEvent = useMemo(() => getPrimaryActiveEvent(), []);

  // Pack list with event packs highlighted at the very top
  const availablePacks = useMemo<Pack[]>(() => {
    const eventPacks: Pack[] = activeEvents.map(event => ({
      id: event.packId,
      name: event.packName,
      cardsCount: event.packCardsCount,
      price: event.packPrice,
      image: event.packImage,
      isEventPack: true,
      eventBadge: event.icon
    }));

    // Event packs featured FIRST, followed by standard base packs
    return [...eventPacks, ...BASE_PACKS];
  }, [activeEvents]);

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

  const handleBuy = useCallback(async (pack: Pack) => {
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
  }, [isSaving, buyingPackId, coins, notifyError, openPack]);

  const handleOpenInventory = useCallback(async (packId: string, packType: string) => {
    if (isSaving) return;
    const result = await openInventoryPack(packId, packType as PackType);
    if (result) {
      const packInfo = availablePacks.find(p => p.id === packType);
      setOpenedPackImage(packInfo?.image || (packType.includes('scream') ? SCREAM_EDITION_CONFIG.PACK_IMAGE : 'https://i.postimg.cc/TwG0zjyz/generated-image-(1).png'));
      setOpenedCards(result.cards);
      setNewlyUnlocked(result.newlyUnlocked);
    }
  }, [isSaving, openInventoryPack, availablePacks]);

  const handleOpenEventModal = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-halloween-modal'));
  }, []);

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
      <div className="flex-1 px-3 py-2 no-scrollbar pb-24 max-w-2xl mx-auto w-full z-10 overflow-y-auto space-y-3">
        <AnimatePresence mode="wait">
          {activeTab === 'shop' ? (
            <motion.div
              key="shop-tab"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="space-y-3"
            >
              {/* Featured Event Hero Showcase Banner */}
              {primaryEvent && (
                <div 
                  className={`rounded-2xl border ${primaryEvent.theme.borderGlow} bg-gradient-to-r ${primaryEvent.theme.bgGradient} p-3 sm:p-4 relative overflow-hidden transition-all shadow-xl`}
                >
                  {/* Subtle Background Glow */}
                  <div className="absolute top-0 right-0 w-36 h-36 bg-orange-500/10 blur-2xl rounded-full pointer-events-none" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    {/* Left: Pack Art & Info */}
                    <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
                      <div className="w-14 h-20 sm:w-16 sm:h-22 rounded-xl overflow-hidden border-2 border-orange-500/80 shrink-0 bg-black shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                        <img 
                          src={primaryEvent.packImage} 
                          alt={primaryEvent.packName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>

                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded ${primaryEvent.theme.badgeBg} ${primaryEvent.theme.badgeText} text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider shadow`}>
                            {primaryEvent.tag}
                          </span>
                          <span className="text-[9px] font-bold text-orange-300 uppercase tracking-widest hidden xs:inline">
                            FEATURED DROP
                          </span>
                        </div>

                        <h2 className="text-xs sm:text-base font-black uppercase tracking-tight text-white truncate drop-shadow">
                          {primaryEvent.packName}
                        </h2>

                        <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold text-amber-400">
                          <Coins size={11} fill="currentColor" className="shrink-0" />
                          <span>{primaryEvent.packPrice.toLocaleString()} COINS</span>
                          <span className="text-zinc-600">•</span>
                          <span>{primaryEvent.packCardsCount} CARDS</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex sm:flex-col items-center gap-2 w-full sm:w-36 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-orange-500/20">
                      {/* Buy Button */}
                      <button
                        onClick={() => {
                          const pack = availablePacks.find(p => p.id === primaryEvent.packId);
                          if (pack) handleBuy(pack);
                        }}
                        disabled={isSaving || !!buyingPackId || coins < primaryEvent.packPrice}
                        className={`w-full py-2 px-3 rounded-xl text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 ${
                          coins >= primaryEvent.packPrice
                            ? `bg-gradient-to-r ${primaryEvent.theme.buttonGradient}`
                            : 'bg-zinc-900 text-zinc-600 border border-white/5 cursor-not-allowed'
                        }`}
                      >
                        {buyingPackId === primaryEvent.packId ? (
                          <RefreshCw size={12} className="animate-spin" />
                        ) : (
                          <>
                            <Flame size={12} className="text-black shrink-0" />
                            <span>Quick Buy</span>
                          </>
                        )}
                      </button>

                      {/* View Showcase Modal */}
                      <button
                        onClick={handleOpenEventModal}
                        className="w-full py-1.5 px-3 rounded-xl bg-zinc-950/80 hover:bg-zinc-900 border border-orange-500/50 hover:border-orange-400 text-orange-300 font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95"
                      >
                        <Sparkles size={11} className="text-orange-400" />
                        <span>View Cards</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* All Packs Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <span>ALL AVAILABLE PACKS</span>
                    <span className="text-zinc-600 font-mono">({availablePacks.length})</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availablePacks.map((pack) => {
                    const canAfford = coins >= pack.price;
                    const isBuyingThis = buyingPackId === pack.id;
                    const isEvent = pack.isEventPack || pack.id === 'scream_edition' || pack.id === 'scream';

                    return (
                      <div
                        key={pack.id}
                        className={`group rounded-xl p-2.5 flex flex-col justify-between transition-all duration-300 relative ${
                          isEvent
                            ? 'bg-gradient-to-b from-orange-950/40 via-zinc-950/80 to-zinc-950 border border-orange-500/60 hover:border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                            : 'bg-zinc-950/70 border border-white/5 hover:border-amber-400/30'
                        }`}
                      >
                        {isEvent && (
                          <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.2 rounded bg-orange-500 text-black text-[7px] font-black uppercase tracking-wider shadow">
                            🎃 EVENT
                          </div>
                        )}

                        {/* Pack Art Image */}
                        <div className={`w-full aspect-[3/4] rounded-lg overflow-hidden border mb-2 relative group-hover:scale-[1.02] transition-transform duration-300 ${
                          isEvent ? 'border-orange-500/50 bg-black' : 'border-white/5 bg-zinc-900'
                        }`}>
                          <img 
                            src={pack.image} 
                            alt={pack.name} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>

                        {/* Pack Title & Details */}
                        <div className="space-y-0.5 mb-2.5 text-center">
                          <h3 className={`text-[10px] font-black uppercase tracking-tight truncate ${
                            isEvent ? 'text-orange-300' : 'text-white'
                          }`}>
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
                              ? isEvent
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:from-orange-400 hover:to-amber-400 active:scale-95 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                                : 'bg-amber-400 text-black hover:bg-amber-300 active:scale-95'
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
                </div>
              </div>
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
                    const packInfo = availablePacks.find(p => p.id === pack.type) || BASE_PACKS.find(p => p.id === pack.type) || { 
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
                              loading="lazy"
                              decoding="async"
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

