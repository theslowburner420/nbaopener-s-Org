import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Coins, 
  Layers, 
  Sparkles, 
  Flame, 
  Check, 
  Lock, 
  Calendar, 
  AlertCircle, 
  Trophy, 
  ChevronRight, 
  Zap, 
  Gift, 
  Tag, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { 
  CalendarEventConfig, 
  CalendarDayReward, 
  OPENING_TIPOFF_CONFIG, 
  BLACK_FRIDAY_CONFIG, 
  getActiveCalendarEvents, 
  calculateEventClaimStatus, 
  saveEventProgress, 
  getTodayDateString 
} from '../constants/calendarEvents';
import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEventId?: 'opening_tipoff' | 'black_friday';
  onNavigateToStore?: () => void;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  initialEventId,
  onNavigateToStore,
}) => {
  const { coins, addCoins, inventoryPacks, updateGameStateAsync, forceSync } = useGame();
  const { notifySuccess } = useNotification();

  const activeEvents = useMemo(() => getActiveCalendarEvents(), []);
  
  const [selectedEventId, setSelectedEventId] = useState<'opening_tipoff' | 'black_friday'>(() => {
    if (initialEventId) return initialEventId;
    if (activeEvents.length > 0) return activeEvents[0].id;
    return 'opening_tipoff';
  });

  const [isClaiming, setIsClaiming] = useState(false);
  const [justClaimedDay, setJustClaimedDay] = useState<number | null>(null);

  const activeConfig = selectedEventId === 'opening_tipoff' ? OPENING_TIPOFF_CONFIG : BLACK_FRIDAY_CONFIG;

  const [claimStatus, setClaimStatus] = useState(() => calculateEventClaimStatus(activeConfig));

  // Refresh status whenever event changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setClaimStatus(calculateEventClaimStatus(activeConfig));
    }
  }, [isOpen, activeConfig]);

  if (!isOpen) return null;

  const { canClaimToday, currentDayIndex, isStreakBroken, progress, rewardToday } = claimStatus;

  // Handle claiming today's reward
  const handleClaim = async () => {
    if (!canClaimToday || isClaiming) return;
    setIsClaiming(true);

    try {
      const todayStr = getTodayDateString();
      const currentReward = rewardToday;

      // 1. Calculate new packs inventory
      let updatedPacks = [...inventoryPacks];
      currentReward.packBreakdown.forEach((packItem) => {
        const existing = updatedPacks.find(p => p.type === packItem.type);
        if (existing) {
          updatedPacks = updatedPacks.map(p => 
            p.type === packItem.type ? { ...p, count: (p.count || 1) + packItem.count } : p
          );
        } else {
          updatedPacks.push({
            id: `${packItem.type}-${Date.now()}`,
            type: packItem.type,
            name: packItem.name,
            count: packItem.count,
          });
        }
      });

      // 2. Update Game State
      const newCoins = coins + currentReward.coins;
      await updateGameStateAsync({
        coins: newCoins,
        inventoryPacks: updatedPacks,
      });

      // 3. Update Event Progress
      const newHistory = Array.from(new Set([...progress.claimedDaysHistory, currentReward.day]));
      const newProgress = {
        currentStreakDay: currentDayIndex,
        lastClaimDate: todayStr,
        claimedDaysHistory: newHistory,
        totalCoinsEarned: (progress.totalCoinsEarned || 0) + currentReward.coins,
        totalPacksEarned: (progress.totalPacksEarned || 0) + currentReward.packsCount,
      };
      saveEventProgress(activeConfig.id, newProgress);

      // 4. Update UI State & Notify
      setJustClaimedDay(currentReward.day);
      setClaimStatus(calculateEventClaimStatus(activeConfig));

      notifySuccess(
        `🎁 Claimed Day ${currentReward.day}: +${currentReward.coins.toLocaleString()} Coins and +${currentReward.packsCount} Packs!`
      );

      // 5. Cloud Sync if available
      setTimeout(() => {
        forceSync();
      }, 500);
    } catch (err) {
      console.error('Error claiming calendar event reward:', err);
    } finally {
      setIsClaiming(false);
    }
  };

  const isOpening = activeConfig.id === 'opening_tipoff';

  return (
    <AnimatePresence>
      <div 
        key="calendar-event-backdrop"
        className="fixed inset-0 z-[12500] flex items-center justify-center p-1.5 sm:p-4 md:p-6 overflow-hidden bg-black/90 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          key="calendar-event-dialog"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full max-w-4xl h-[95dvh] sm:h-[88dvh] max-h-[850px] flex flex-col bg-zinc-950 border-2 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden text-white ${
            isOpening ? 'border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.4)]' : 'border-rose-500/80 shadow-[0_0_50px_rgba(244,63,94,0.45)]'
          }`}
        >
          {/* Ambient Glows */}
          <div className={`absolute -top-32 -left-32 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            isOpening ? 'bg-amber-600/20' : 'bg-rose-600/25'
          }`} />
          <div className={`absolute -bottom-32 -right-32 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
            isOpening ? 'bg-orange-700/20' : 'bg-purple-700/25'
          }`} />

          {/* Modal Header */}
          <div className={`relative z-10 shrink-0 px-3.5 py-3 sm:px-6 sm:py-4 border-b flex items-center justify-between gap-3 bg-gradient-to-r ${
            isOpening 
              ? 'border-amber-500/30 from-amber-950/90 via-zinc-950 to-zinc-950' 
              : 'border-rose-500/30 from-rose-950/90 via-purple-950/60 to-zinc-950'
          }`}>
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center text-lg sm:text-2xl shadow-lg shrink-0 ${
                isOpening 
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                  : 'bg-rose-500/20 border-rose-500/60 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
              }`}>
                {activeConfig.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-md text-[8px] sm:text-[9.5px] font-black uppercase tracking-wider shadow ${
                    isOpening ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'
                  }`}>
                    {activeConfig.tag}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden xs:inline">
                    {activeConfig.subtitle}
                  </span>
                </div>
                <h2 className="text-sm sm:text-xl font-black uppercase tracking-tight text-white drop-shadow truncate">
                  {activeConfig.name} <span className={isOpening ? 'text-amber-400' : 'text-rose-400'}>CALENDAR</span>
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Event Switcher if multiple events active */}
              {activeEvents.length > 1 && (
                <div className="flex items-center bg-black/60 p-0.5 rounded-xl border border-white/10">
                  <button
                    onClick={() => setSelectedEventId('opening_tipoff')}
                    className={`px-2 py-1 rounded-lg text-[8.5px] sm:text-[9.5px] font-black uppercase transition-all ${
                      selectedEventId === 'opening_tipoff' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🏀 Tip-Off
                  </button>
                  <button
                    onClick={() => setSelectedEventId('black_friday')}
                    className={`px-2 py-1 rounded-lg text-[8.5px] sm:text-[9.5px] font-black uppercase transition-all ${
                      selectedEventId === 'black_friday' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    🏷️ Black Friday
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-full bg-zinc-900/80 border border-white/10 hover:border-amber-400 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="relative z-10 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-3 sm:px-6 sm:py-5 space-y-3.5 sm:space-y-5">
            
            {/* Top Stats Banner: Two Independent Progression Tracks (Coins & Packs) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
              
              {/* Track 1: Coins Multiplier & Progression */}
              <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-zinc-900/90 to-black p-3 sm:p-4 flex items-center justify-between gap-3 shadow-md relative overflow-hidden">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-amber-400 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    <Coins size={13} />
                    <span>COINS TRACK</span>
                  </div>
                  <div className="text-base sm:text-xl font-black font-mono text-white tracking-tight">
                    +{rewardToday.coins.toLocaleString()} <span className="text-xs text-amber-400">COINS</span>
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-zinc-400 leading-tight">
                    {isOpening ? 'Cap of 160,000 (Day 6) • Peak 320k (Day 11) • Finale 500k' : 'Daily doubling up to 160,000'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Coins size={20} />
                </div>
              </div>

              {/* Track 2: Packs Multiplier & Progression */}
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-zinc-900/90 to-black p-3 sm:p-4 flex items-center justify-between gap-3 shadow-md relative overflow-hidden">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-purple-400 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    <Layers size={13} />
                    <span>PACKS TRACK</span>
                  </div>
                  <div className="text-base sm:text-xl font-black font-mono text-white tracking-tight">
                    +{rewardToday.packsCount} <span className="text-xs text-purple-400">PACKS</span>
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-zinc-400 leading-tight">
                    {isOpening ? 'Cap 10/day (Day 5) • Real night 20 • Finale 25' : 'Daily doubling: 2 ➔ 4 ➔ 8 ➔ 16 ➔ 32 packs'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <Layers size={20} />
                </div>
              </div>

              {/* Streak Tracker & Protection Status */}
              <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-zinc-900/90 to-black p-3 sm:p-4 flex items-center justify-between gap-3 shadow-md">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 text-blue-400 text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider">
                    <Flame size={13} />
                    <span>LOGIN STREAK</span>
                  </div>
                  <div className="text-base sm:text-xl font-black text-white tracking-tight">
                    DAY {currentDayIndex} <span className="text-xs text-zinc-400">/ {activeConfig.totalDays}</span>
                  </div>
                  <p className="text-[8px] sm:text-[9px] text-zinc-400 leading-tight">
                    {canClaimToday 
                      ? 'Claim today to advance to the next multiplier' 
                      : "Today's reward claimed! Come back tomorrow"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Flame size={20} className={canClaimToday ? 'animate-pulse' : ''} />
                </div>
              </div>
            </div>

            {/* Streak Warning Banner */}
            {isStreakBroken && (
              <div className="rounded-xl border border-amber-500/50 bg-amber-950/40 p-2.5 sm:p-3 flex items-center gap-2.5 text-amber-200 text-xs">
                <AlertCircle size={18} className="text-amber-400 shrink-0" />
                <p className="text-[9.5px] sm:text-[11px] font-medium leading-relaxed">
                  You missed a login day. Your streak has reset to <strong>Day 1</strong> to restart the multiplier track (you keep all previously claimed rewards).
                </p>
              </div>
            )}

            {/* Hero Claim Box for Today */}
            <div className={`rounded-2xl sm:rounded-3xl border-2 p-3.5 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl relative overflow-hidden ${
              isOpening 
                ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/60 via-zinc-950 to-zinc-950 shadow-[0_0_30px_rgba(245,158,11,0.25)]' 
                : 'border-rose-500/80 bg-gradient-to-r from-rose-950/60 via-zinc-950 to-zinc-950 shadow-[0_0_30px_rgba(244,63,94,0.3)]'
            }`}>
              <div className="space-y-1.5 min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                    isOpening ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'
                  }`}>
                    {rewardToday.highlightBadge || `DAY ${rewardToday.day}`}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400">
                    {rewardToday.dateLabel}
                  </span>
                  {rewardToday.isSpecialMilestone && (
                    <span className="px-2 py-0.5 rounded bg-purple-600 text-white text-[8.5px] font-black uppercase tracking-wider animate-pulse">
                      MILESTONE X2
                    </span>
                  )}
                </div>

                <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white">
                  Today's Reward: <span className="font-mono text-amber-400">+{rewardToday.coins.toLocaleString()}</span> Coins + <span className="font-mono text-purple-400">{rewardToday.packsCount}</span> Packs
                </h3>

                {/* Pack breakdown chips */}
                <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap pt-0.5">
                  {rewardToday.packBreakdown.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/10 text-[9px] sm:text-[10px] font-bold text-zinc-300 flex items-center gap-1">
                      <Layers size={11} className="text-purple-400" />
                      <span>{p.name}</span>
                      <strong className="text-amber-400">x{p.count}</strong>
                    </span>
                  ))}
                  {rewardToday.extraBenefit && (
                    <span className="px-2 py-0.5 rounded-lg bg-pink-950/60 border border-pink-500/40 text-[9px] sm:text-[10px] font-bold text-pink-300">
                      ⚡ {rewardToday.extraBenefit}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 w-full sm:w-auto">
                <button
                  disabled={!canClaimToday || isClaiming}
                  onClick={handleClaim}
                  className={`w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl ${
                    canClaimToday
                      ? isOpening
                        ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-black shadow-[0_0_25px_rgba(245,158,11,0.6)] cursor-pointer animate-pulse'
                        : 'bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.6)] cursor-pointer animate-pulse'
                      : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  {isClaiming ? (
                    <>
                      <Zap size={16} className="animate-spin" />
                      <span>CLAIMING...</span>
                    </>
                  ) : canClaimToday ? (
                    <>
                      <Gift size={18} />
                      <span>CLAIM DAY {currentDayIndex}</span>
                    </>
                  ) : (
                    <>
                      <Check size={18} className="text-emerald-400" />
                      <span>CLAIMED TODAY</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Complete Schedule Interactive Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <Calendar size={15} className={isOpening ? 'text-amber-400' : 'text-rose-400'} />
                  <span>FULL SCHEDULE ({activeConfig.totalDays} DAYS)</span>
                </h4>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium">
                  {progress.claimedDaysHistory.length} / {activeConfig.totalDays} Claimed
                </span>
              </div>

              <div className={`grid gap-2 sm:gap-2.5 ${
                isOpening ? 'grid-cols-2 xs:grid-cols-3 sm:grid-cols-5' : 'grid-cols-1 xs:grid-cols-5'
              }`}>
                {activeConfig.rewards.map((reward) => {
                  const isClaimed = progress.claimedDaysHistory.includes(reward.day);
                  const isCurrent = reward.day === currentDayIndex && canClaimToday;
                  const isFuture = reward.day > currentDayIndex;

                  return (
                    <motion.div
                      key={reward.day}
                      whileHover={isCurrent ? { scale: 1.03, y: -2 } : undefined}
                      className={`relative rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border flex flex-col justify-between transition-all ${
                        isClaimed
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                          : isCurrent
                            ? isOpening
                              ? 'bg-gradient-to-b from-amber-950/60 to-zinc-950 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-2 ring-amber-400/50'
                              : 'bg-gradient-to-b from-rose-950/60 to-zinc-950 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)] ring-2 ring-rose-400/50'
                            : 'bg-zinc-950/80 border-white/10 opacity-70'
                      }`}
                    >
                      {/* Top Day Header */}
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[8.5px] sm:text-[9.5px] font-black uppercase ${
                          isCurrent ? 'text-white' : 'text-zinc-400'
                        }`}>
                          DAY {reward.day}
                        </span>

                        {isClaimed ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                            <Check size={10} strokeWidth={3} />
                          </div>
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        ) : (
                          <Lock size={11} className="text-zinc-600" />
                        )}
                      </div>

                      {/* Date label */}
                      <div className="text-[8px] sm:text-[9px] font-bold text-zinc-400 mb-1">
                        {reward.dateLabel}
                      </div>

                      {/* Milestone badge if any */}
                      {reward.highlightBadge && (
                        <div className={`text-[7px] sm:text-[7.5px] font-black uppercase px-1 py-0.5 rounded text-center mb-1.5 truncate ${
                          reward.isSpecialMilestone
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {reward.highlightBadge}
                        </div>
                      )}

                      {/* Reward values */}
                      <div className="space-y-0.5 text-center my-auto py-1">
                        <div className="text-[10.5px] sm:text-xs font-black font-mono text-amber-400 leading-tight">
                          +{reward.coins.toLocaleString()}
                        </div>
                        <div className="text-[9px] sm:text-[10px] font-bold text-purple-300 flex items-center justify-center gap-0.5">
                          <Layers size={10} />
                          <span>{reward.packsCount} {reward.packsCount === 1 ? 'Pack' : 'Packs'}</span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      <div className="mt-1.5 pt-1 border-t border-white/5 text-center">
                        <span className={`text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider ${
                          isClaimed 
                            ? 'text-emerald-400' 
                            : isCurrent 
                              ? 'text-amber-400 animate-pulse font-extrabold' 
                              : 'text-zinc-500'
                        }`}>
                          {isClaimed ? '✓ CLAIMED' : isCurrent ? '⚡ AVAILABLE' : 'LOCKED'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer Notice & Access Security Note */}
            <div className="rounded-xl bg-zinc-900/50 border border-white/5 p-2.5 sm:p-3 flex items-center justify-between text-[9px] sm:text-[10px] text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>Calendar-exclusive live event. Early access is strictly date-locked to preserve game economy balance.</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="relative z-10 shrink-0 px-3.5 py-2.5 sm:px-6 sm:py-3 border-t border-white/10 bg-zinc-950 flex items-center justify-between gap-3">
            <span className="text-[9px] sm:text-[10px] text-zinc-400 flex items-center gap-1">
              <Clock size={12} className="text-amber-400" />
              <span>Event active: {activeConfig.startDate.split('T')[0]} to {activeConfig.endDate.split('T')[0]}</span>
            </span>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-colors"
              >
                Close
              </button>
              {onNavigateToStore && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToStore();
                  }}
                  className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1 transition-transform active:scale-95 shadow-md"
                >
                  <span>Go to Store</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CalendarEventModal;
