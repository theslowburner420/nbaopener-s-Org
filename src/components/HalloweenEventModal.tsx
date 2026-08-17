import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Flame, Layers, Award, ChevronRight, Eye, Ghost, CloudFog, Trophy } from 'lucide-react';
import { SCREAM_CARDS, SCREAM_PACK_CARDS, SCREAM_SBC_CARDS } from '../data/screamCards';
import { SCREAM_EDITION_CONFIG } from '../constants/screamEdition';
import { Card } from '../types';
import CardDetailModal from './CardDetailModal';

interface HalloweenEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPacks: () => void;
  onNavigateToSBC: () => void;
  onNavigateToDraft?: () => void;
}

export const HalloweenEventModal: React.FC<HalloweenEventModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPacks,
  onNavigateToSBC,
  onNavigateToDraft,
}) => {
  const [filter, setFilter] = useState<'all' | 'packs' | 'sbc'>('all');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [fogEnabled, setFogEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hoops_spooky_fog') !== 'false';
  });

  const toggleFog = () => {
    const nextState = !fogEnabled;
    setFogEnabled(nextState);
    localStorage.setItem('hoops_spooky_fog', nextState ? 'true' : 'false');
    window.dispatchEvent(new Event('hoops-fog-toggle'));
  };

  useEffect(() => {
    const handler = () => {
      setFogEnabled(localStorage.getItem('hoops_spooky_fog') !== 'false');
    };
    window.addEventListener('hoops-fog-toggle', handler);
    return () => window.removeEventListener('hoops-fog-toggle', handler);
  }, []);

  if (!isOpen) return null;

  const displayCards = filter === 'all' 
    ? SCREAM_CARDS 
    : filter === 'packs' 
      ? SCREAM_PACK_CARDS 
      : SCREAM_SBC_CARDS;

  return (
    <AnimatePresence>
      <div 
        key="halloween-modal-backdrop"
        className="fixed inset-0 z-[12000] flex items-center justify-center p-1.5 sm:p-4 md:p-6 overflow-hidden bg-black/85 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          key="halloween-modal-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl h-[95dvh] sm:h-[88dvh] max-h-[840px] flex flex-col bg-zinc-950 border-2 border-orange-500/80 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(249,115,22,0.45)] overflow-hidden text-white"
        >
          {/* Ambient Glows */}
          <div className="absolute -top-32 -left-32 w-72 h-72 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-purple-700/20 rounded-full blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="relative z-10 shrink-0 px-3 py-2.5 sm:px-5 sm:py-3.5 border-b border-orange-500/30 bg-gradient-to-r from-orange-950/90 via-purple-950/70 to-zinc-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-orange-500/20 border border-orange-500/60 flex items-center justify-center text-base sm:text-2xl shadow-[0_0_15px_rgba(249,115,22,0.5)] shrink-0 animate-pulse">
                🎃
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded-md bg-orange-500 text-black text-[7.5px] sm:text-[9px] font-black uppercase tracking-wider shadow">
                    LIMITED EVENT
                  </span>
                  <span className="text-[8.5px] sm:text-[10px] font-bold text-orange-300/80 uppercase tracking-widest hidden xs:inline">
                    HALLOWEEN SPECIAL
                  </span>
                </div>
                <h2 className="text-xs sm:text-lg font-black uppercase tracking-tight text-white drop-shadow truncate">
                  SCREAM <span className="text-orange-400">EDITION</span> SHOWCASE
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Spooky Fog Ambient Toggler */}
              <button
                onClick={toggleFog}
                title="Toggle atmospheric spooky fog overlay"
                className={`px-2 py-1 rounded-lg sm:rounded-xl text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border transition-all ${
                  fogEnabled 
                    ? 'bg-orange-500/20 border-orange-500/60 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.3)]' 
                    : 'bg-zinc-900 border-white/10 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <CloudFog size={12} className={fogEnabled ? 'animate-pulse text-orange-400' : ''} />
                <span className="hidden xs:inline">Fog:</span>
                <span>{fogEnabled ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full bg-zinc-900/80 border border-white/10 hover:border-orange-400 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={15} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2.5 py-2.5 sm:px-5 sm:py-4 space-y-2.5 sm:space-y-4">
            {/* Featured Pack Hero Card */}
            <div className="rounded-xl sm:rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-950/60 via-purple-950/40 to-black p-2.5 sm:p-3.5 flex flex-col gap-2.5 sm:gap-3 shadow-lg">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                <div className="w-12 h-16 sm:w-16 sm:h-22 rounded-xl overflow-hidden border-2 border-orange-500/80 shrink-0 bg-black shadow-[0_0_15px_rgba(249,115,22,0.6)]">
                  <img
                    src={SCREAM_EDITION_CONFIG.PACK_IMAGE}
                    alt="Scream Pack"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <Flame size={11} className="text-orange-400 shrink-0" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-orange-300 truncate">
                      EXCLUSIVE PACK
                    </span>
                  </div>
                  <h3 className="text-[11.5px] sm:text-base font-black uppercase text-white tracking-tight truncate">
                    {SCREAM_EDITION_CONFIG.PACK_NAME}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-mono font-bold text-amber-400 flex-wrap">
                    <span>🪙 {SCREAM_EDITION_CONFIG.PACK_PRICE.toLocaleString()} COINS</span>
                    <span className="text-zinc-600">•</span>
                    <span>🃏 {SCREAM_EDITION_CONFIG.PACK_CARDS_COUNT} CARDS</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-orange-500/30 text-[8px] sm:text-[9px] text-orange-300/90 font-bold">
                    <span>10% Scream • 10% Specials • 80% Base</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 w-full pt-1 border-t border-orange-500/20">
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToPacks();
                  }}
                  className="py-1.5 sm:py-2 px-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-[9.5px] sm:text-[11px] uppercase tracking-wider shadow-[0_0_12px_rgba(249,115,22,0.4)] flex items-center justify-center gap-1 transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Layers size={12} />
                  <span className="truncate">Store</span>
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSBC();
                  }}
                  className="py-1.5 sm:py-2 px-1.5 rounded-xl bg-purple-950/90 border border-purple-500/60 hover:bg-purple-900/90 text-purple-200 font-black text-[9.5px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-transform active:scale-95 whitespace-nowrap"
                >
                  <Award size={12} />
                  <span className="truncate">SBC Masters</span>
                </button>
                {onNavigateToDraft && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToDraft();
                    }}
                    className="py-1.5 sm:py-2 px-1.5 rounded-xl bg-zinc-950 border border-orange-500/60 hover:border-orange-400 text-orange-300 font-black text-[9.5px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 transition-transform active:scale-95 whitespace-nowrap shadow-[0_0_8px_rgba(249,115,22,0.2)]"
                  >
                    <Trophy size={12} className="text-orange-400" />
                    <span className="truncate">Draft Cup</span>
                  </button>
                )}
              </div>
            </div>

            {/* Spooky Tournament Promo Banner */}
            {onNavigateToDraft && (
              <div 
                onClick={() => {
                  onClose();
                  onNavigateToDraft();
                }}
                className="group cursor-pointer rounded-xl border border-orange-500/50 bg-gradient-to-r from-orange-950/40 via-zinc-950 to-purple-950/40 p-2 sm:p-2.5 flex items-center justify-between gap-2 hover:border-orange-400 transition-all shadow-md"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shrink-0">
                    <Ghost size={14} className="animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[7.5px] sm:text-[8px] font-black uppercase px-1 py-0.2 rounded bg-orange-500 text-black">TOURNAMENT</span>
                      <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase text-white truncate">Spooky Scream Classic</span>
                    </div>
                    <p className="text-[8.5px] sm:text-[9.5px] text-zinc-400 truncate">
                      Win 120,000 Coins + 2 Scream Packs + 1 All-Star Pack!
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-orange-400 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shrink-0 group-hover:translate-x-0.5 transition-transform">
                  <span className="hidden xs:inline">Play</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            )}

            {/* Collection Showcase Section */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div>
                  <h3 className="text-[11px] sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Sparkles size={13} className="text-orange-400 shrink-0" />
                    <span>HALLOWEEN CARDS ({SCREAM_CARDS.length})</span>
                  </h3>
                  <p className="text-[9px] sm:text-[10px] text-zinc-400">
                    Tap any card to view in full interactive 3D.
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900 border border-white/10 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setFilter('all')}
                    className={`py-1 px-1.5 sm:px-2.5 rounded-lg text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center transition-all ${
                      filter === 'all'
                        ? 'bg-orange-500 text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    All ({SCREAM_CARDS.length})
                  </button>
                  <button
                    onClick={() => setFilter('packs')}
                    className={`py-1 px-1.5 sm:px-2.5 rounded-lg text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center transition-all ${
                      filter === 'packs'
                        ? 'bg-orange-500 text-black shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Packs ({SCREAM_PACK_CARDS.length})
                  </button>
                  <button
                    onClick={() => setFilter('sbc')}
                    className={`py-1 px-1.5 sm:px-2.5 rounded-lg text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider text-center transition-all ${
                      filter === 'sbc'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    SBCs ({SCREAM_SBC_CARDS.length})
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-2.5">
                {displayCards.map((card) => {
                  const isSBC = card.isSpecialSBC;
                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCard(card)}
                      className="group cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden border-2 border-orange-500/50 hover:border-orange-400 bg-gradient-to-b from-purple-950/50 via-zinc-950 to-black p-1.5 sm:p-2 flex flex-col justify-between relative shadow-[0_0_12px_rgba(249,115,22,0.25)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] transition-all"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 mb-1 z-10">
                        <span className={`text-[7px] sm:text-[7.5px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider truncate ${
                          isSBC
                            ? 'bg-purple-600 text-white border border-purple-400 shadow'
                            : 'bg-orange-500 text-black border border-orange-300 shadow'
                        }`}>
                          {isSBC ? '🎃 SBC' : 'PACK'}
                        </span>
                        <div className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/85 border border-orange-500/60 text-orange-400 shrink-0">
                          <span className="text-[6px] font-bold">OVR</span>
                          <span className="text-[10px] sm:text-[11px] font-black italic leading-none">{card.stats?.ovr || 95}</span>
                        </div>
                      </div>

                      {/* Large Card Image */}
                      <div className="w-full aspect-[4/5] rounded-lg overflow-hidden border border-orange-500/30 bg-zinc-950 relative mb-1 shadow-inner">
                        <img
                          src={card.imageUrl}
                          alt={card.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 p-0.5 rounded-full text-orange-300">
                          <Eye size={10} />
                        </div>
                      </div>

                      {/* Card Info */}
                      <div className="space-y-0.5 text-center px-0.5">
                        <h4 className="text-[10px] sm:text-[11.5px] font-black uppercase text-white truncate tracking-tight">
                          {card.name}
                        </h4>
                        <p className="text-[7.5px] sm:text-[8.5px] font-bold text-orange-300/80 uppercase tracking-wider truncate">
                          {card.team} • {card.position}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="relative z-10 shrink-0 px-3 py-2 sm:px-5 sm:py-2.5 border-t border-orange-500/30 bg-zinc-950/95 flex items-center justify-between gap-2">
            <span className="text-[9px] sm:text-[10px] text-zinc-400 flex items-center gap-1 truncate">
              <Ghost size={12} className="text-orange-400 shrink-0" />
              <span className="truncate">Limited-time event</span>
            </span>

            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
              <button
                onClick={onClose}
                className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToPacks();
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black text-[10px] sm:text-[11px] uppercase tracking-wider shadow-[0_0_12px_rgba(249,115,22,0.4)] flex items-center gap-1 transition-transform active:scale-95 whitespace-nowrap"
              >
                <span>Store</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* 3D Card Detail Modal on Card Click */}
        {selectedCard && (
          <CardDetailModal
            key={`scream-detail-${selectedCard.id}`}
            card={selectedCard}
            onClose={() => setSelectedCard(null)}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

export default HalloweenEventModal;
