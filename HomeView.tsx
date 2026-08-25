import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { isScreamEditionActive, SCREAM_EDITION_CONFIG } from '../constants/screamEdition';
import { getActiveCalendarEvents, calculateEventClaimStatus } from '../constants/calendarEvents';
import { Eye, EyeOff, Calendar, Gift, Flame, Sparkles, Coins, Layers } from 'lucide-react';

const HomeView: React.FC = () => {
  const { setCurrentView } = useGame();
  const isScreamActive = isScreamEditionActive();
  const activeCalendarEvents = getActiveCalendarEvents();
  const primaryCalendarEvent = activeCalendarEvents.length > 0 ? activeCalendarEvents[0] : null;

  const calendarClaimStatus = primaryCalendarEvent ? calculateEventClaimStatus(primaryCalendarEvent) : null;

  const [isBannerHidden, setIsBannerHidden] = useState<boolean>(() => {
    return localStorage.getItem('hoops_halloween_banner_hidden') === 'true';
  });

  const toggleBannerVisibility = (hidden: boolean) => {
    setIsBannerHidden(hidden);
    localStorage.setItem('hoops_halloween_banner_hidden', hidden ? 'true' : 'false');
  };

  const openHalloweenModal = () => {
    window.dispatchEvent(new CustomEvent('open-halloween-modal'));
  };

  const openCalendarModal = (eventId?: string) => {
    window.dispatchEvent(new CustomEvent('open-calendar-event-modal', { detail: { eventId } }));
  };

  return (
    <div className="w-full flex flex-col bg-black">
      {/* Home Container */}
      <div className="flex-1 flex flex-col gap-1.5 md:gap-4 p-1.5 md:p-6 pb-6 md:pb-6 max-w-7xl mx-auto w-full">
        {/* Calendar Login Events Banner (Opening Tip-Off / Black Friday) */}
        {primaryCalendarEvent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative group overflow-hidden rounded-2xl md:rounded-[2rem] border p-3 md:p-4 flex items-center justify-between shadow-lg transition-all cursor-pointer ${
              primaryCalendarEvent.id === 'opening_tipoff'
                ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/90 via-zinc-950 to-zinc-950 shadow-amber-950/50 hover:border-amber-400'
                : 'border-rose-500/50 bg-gradient-to-r from-rose-950/90 via-purple-950/60 to-zinc-950 shadow-rose-950/50 hover:border-rose-400'
            }`}
            onClick={() => openCalendarModal(primaryCalendarEvent.id)}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className={`w-12 h-14 md:w-14 md:h-16 rounded-xl border flex flex-col items-center justify-center text-center shrink-0 shadow-md ${
                primaryCalendarEvent.id === 'opening_tipoff'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                  : 'bg-rose-500/20 border-rose-500/60 text-rose-400'
              }`}>
                <span className="text-lg md:text-2xl leading-none">{primaryCalendarEvent.icon}</span>
                <span className="text-[8px] font-black uppercase mt-0.5 tracking-tighter">
                  DAY {calendarClaimStatus?.currentDayIndex || 1}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-wider shadow ${
                    primaryCalendarEvent.id === 'opening_tipoff' ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'
                  }`}>
                    {primaryCalendarEvent.tag}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-zinc-400 font-bold uppercase tracking-widest hidden sm:inline">
                    {primaryCalendarEvent.totalDays} DAYS OF REWARDS
                  </span>
                </div>

                <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-tight mt-0.5 flex items-center gap-1.5 truncate">
                  {primaryCalendarEvent.name}
                  <span className="text-[10px] text-amber-400 font-bold tracking-widest hidden sm:inline">
                    • +{calendarClaimStatus?.rewardToday?.coins?.toLocaleString()} COINS & +{calendarClaimStatus?.rewardToday?.packsCount} PACKS
                  </span>
                </h3>

                <p className="text-[10px] md:text-xs text-zinc-300 truncate flex items-center gap-2">
                  <span>{calendarClaimStatus?.canClaimToday ? "⚡ Today's reward is ready to claim!" : "✓ Today's reward claimed"}</span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-amber-400 font-mono font-bold">Streak: Day {calendarClaimStatus?.currentDayIndex}/{primaryCalendarEvent.totalDays}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCalendarModal(primaryCalendarEvent.id);
                }}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-black text-xs uppercase tracking-wider shrink-0 transition-transform active:scale-95 shadow-md flex items-center gap-1.5 ${
                  calendarClaimStatus?.canClaimToday
                    ? primaryCalendarEvent.id === 'opening_tipoff'
                      ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Gift size={14} />
                <span>{calendarClaimStatus?.canClaimToday ? 'Claim' : 'View Calendar'}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* Halloween Scream Edition Special Event Banner / Minimized Strip */}
        {isScreamActive && (
          <AnimatePresence mode="wait">
            {!isBannerHidden ? (
              <motion.div
                key="halloween-banner-full"
                initial={{ opacity: 0, y: -10, height: 'auto' }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.25 }}
                className="relative group overflow-hidden rounded-2xl md:rounded-[2rem] border border-orange-500/40 bg-gradient-to-r from-orange-950/90 via-purple-950/70 to-black p-3 md:p-4 flex items-center justify-between shadow-lg shadow-orange-950/50 hover:border-orange-400 transition-all"
              >
                <div 
                  className="flex items-center gap-3 z-10 cursor-pointer min-w-0 flex-1 pr-2"
                  onClick={openHalloweenModal}
                >
                  <div className="w-12 h-16 rounded-lg overflow-hidden border-2 border-orange-500/80 shrink-0 bg-black shadow-[0_0_15px_rgba(249,115,22,0.6)]">
                    <img 
                      src={SCREAM_EDITION_CONFIG.PACK_IMAGE} 
                      alt="Scream Edition" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-orange-500 text-black text-[8px] md:text-[10px] font-black uppercase tracking-wider shadow">
                        🎃 Special Event Active
                      </span>
                      <span className="text-[9px] md:text-[10px] text-orange-300 font-bold uppercase tracking-widest hidden sm:inline">
                        LIMITED TIME
                      </span>
                    </div>
                    <h3 className="text-sm md:text-lg font-black text-white uppercase tracking-tight mt-0.5 flex items-center gap-1.5 truncate">
                      SCREAM EDITION
                      <span className="text-[10px] text-orange-400 font-bold tracking-widest hidden sm:inline">• VIEW ALL CARDS</span>
                    </h3>
                    <p className="text-[10px] md:text-xs text-zinc-300 truncate">
                      Tap to view all exclusive Halloween cards & special packs!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2 z-10 shrink-0">
                  <button 
                    onClick={openHalloweenModal}
                    className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-black text-xs uppercase tracking-wider shrink-0 transition-transform active:scale-95 shadow-[0_0_15px_rgba(249,115,22,0.5)] whitespace-nowrap"
                  >
                    View Event
                  </button>

                  <button
                    onClick={() => toggleBannerVisibility(true)}
                    title="Hide banner (can be shown again anytime)"
                    className="p-1.5 md:p-2 rounded-xl bg-black/60 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white transition-colors shrink-0"
                    aria-label="Hide Halloween banner"
                  >
                    <EyeOff size={15} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="halloween-banner-collapsed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-950/40 via-purple-950/30 to-black text-xs shadow-sm"
              >
                <div 
                  onClick={openHalloweenModal}
                  className="flex items-center gap-2 cursor-pointer text-orange-300 hover:text-orange-200 transition-colors min-w-0"
                >
                  <span className="text-sm">🎃</span>
                  <span className="text-[11px] font-black uppercase tracking-wider truncate">
                    Halloween Scream Event Active
                  </span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-bold uppercase hidden xs:inline">
                    9 Cards
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={openHalloweenModal}
                    className="text-[10px] font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 underline underline-offset-2"
                  >
                    View Popup
                  </button>
                  <span className="text-zinc-600">•</span>
                  <button
                    onClick={() => toggleBannerVisibility(false)}
                    className="px-2 py-0.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1 transition-colors"
                  >
                    <Eye size={12} />
                    <span>Show Banner</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}


        {/* Top Section: Pack Opener & Hoops Draft side by side */}
        <div className="grid grid-cols-2 gap-1.5 md:gap-4">
          {/* Bloque A: Pack Opener */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-900 aspect-square md:aspect-video flex flex-col items-center justify-center"
            onClick={() => setCurrentView('open')}
          >
            {/* Full Card Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/vHMy0CHK/generated-image.png" 
                alt="Pack Opener" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            
            {/* Neon FREE indicator */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="px-2 py-0.5 md:px-4 md:py-1 bg-black border border-amber-500/50 rounded-full shadow-[0_0_10px_#f59e0b] -rotate-6"
               >
                  <span className="text-[7px] md:text-xs font-black text-amber-500 tracking-widest uppercase">FREE</span>
               </motion.div>
            </div>
          </motion.div>

          {/* Bloque B: Hoops Draft */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-900 aspect-square md:aspect-video flex flex-col items-center justify-center"
            onClick={() => setCurrentView('draft')}
          >
            {/* Full Card Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/TwG0zjyz/generated-image-(1).png" 
                alt="Hoops Draft" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: Trading, Career/Franchise, Puzzles/SBC */}
        {/* On mobile, they are strips (aspect-[3/1] or stacked nicely); on desktop, they render side-by-side! */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-4">
          {/* Bloque C: Live Trading */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[3/1] md:aspect-auto md:h-[180px] lg:h-[240px]"
            onClick={() => setCurrentView('trading')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/PJ7m51xb/generated-image-(2).png" 
                alt="Live Trading" 
                className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </motion.div>
    
          {/* Bloque D: SBC Mode (Placed above Franchise Mode, BETA removed) */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[3/1] md:aspect-auto md:h-[180px] lg:h-[240px]"
            onClick={() => setCurrentView('sbc')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/2SkZNHTG/generated-image-(4).png" 
                alt="SBC" 
                className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </motion.div>

          {/* Bloque E: Franchise Mode */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[3/1] md:aspect-auto md:h-[180px] lg:h-[240px]"
            onClick={() => setCurrentView('career')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/CxGfW3j7/generated-image-(3).png" 
                alt="Franchise Mode" 
                className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-amber-500 text-black text-[7px] md:text-[10px] font-black rounded-full uppercase italic">BETA</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
