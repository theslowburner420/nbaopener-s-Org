import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { ACHIEVEMENTS } from '../constants/achievements';
import { Check, Trophy, Coins, Sparkles, Filter, CheckCircle2, Calendar, Gift, Flame, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useMemo } from 'react';
import AchievementsModal from '../components/AchievementsModal';
import { useNotification } from '../context/NotificationContext';
import { getActiveCalendarEvents, calculateEventClaimStatus } from '../constants/calendarEvents';

export default function RewardsView() {
  const state = useGame();
  const { 
    coins, 
    unlockedAchievements, 
    claimedAchievements, 
    claimAchievementReward, 
    isSaving,
  } = state;
  const { notifySuccess, notifyError } = useNotification();
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const activeCalendarEvents = getActiveCalendarEvents();
  const primaryCalendarEvent = activeCalendarEvents.length > 0 ? activeCalendarEvents[0] : null;
  const calendarStatus = primaryCalendarEvent ? calculateEventClaimStatus(primaryCalendarEvent) : null;

  const openCalendarModal = () => {
    window.dispatchEvent(new CustomEvent('open-calendar-event-modal'));
  };

  const achievementsPercent = useMemo(() => {
    const unlockedCount = ACHIEVEMENTS.filter(ach => 
      unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS)
    ).length;
    return Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
  }, [unlockedAchievements, state]);

  const totalUnlockedCount = useMemo(() => {
    return ACHIEVEMENTS.filter(ach => 
      unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS)
    ).length;
  }, [unlockedAchievements, state]);

  const claimableAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(ach => {
      const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
      const isClaimed = claimedAchievements.includes(ach.id);
      return isUnlocked && !isClaimed;
    });
  }, [unlockedAchievements, claimedAchievements, state]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'packs', label: 'Packs' },
    { id: 'collection', label: 'Collection' },
    { id: 'specials', label: 'Specials' },
    { id: 'drafting', label: 'Draft' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'matches', label: 'Matches' },
  ];

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(ach => ach.category === selectedCategory);
  }, [selectedCategory]);

  const handleClaim = async (id: string) => {
    if (isSaving) return;
    try {
      await claimAchievementReward(id);
      notifySuccess('Achievement reward claimed!');
    } catch (err) {
      notifyError('Failed to claim reward. Please try again.');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black px-4 py-3 border-b border-zinc-900 flex items-center justify-between gap-2 h-14 shrink-0">
        <h1 className="text-sm font-black uppercase tracking-tight italic leading-none flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-amber-500" />
          Rewards & Achievements
        </h1>

        <div className="flex items-center gap-2">
          {/* Coins Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-amber-500">
            <Coins size={14} fill="currentColor" />
            <span>{coins.toLocaleString()}</span>
          </div>

          {/* HOF Achievements button */}
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full hover:bg-amber-500/20 transition-all text-left"
          >
            <Trophy size={14} className="text-amber-500 shrink-0" />
            <span className="text-[10px] font-black tracking-widest text-amber-400">HOF {achievementsPercent}%</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-4 space-y-6 no-scrollbar pb-28 overflow-y-auto max-w-4xl mx-auto w-full">
        
        {/* Active Calendar Login Event Banner */}
        {primaryCalendarEvent && (
          <div 
            onClick={openCalendarModal}
            className={`cursor-pointer relative overflow-hidden rounded-3xl border-2 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl transition-all hover:scale-[1.01] ${
              primaryCalendarEvent.id === 'opening_tipoff'
                ? 'border-amber-500/80 bg-gradient-to-r from-amber-950/80 via-zinc-950 to-black shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                : 'border-rose-500/80 bg-gradient-to-r from-rose-950/80 via-purple-950/50 to-black shadow-[0_0_25px_rgba(244,63,94,0.3)]'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center text-2xl shadow-lg shrink-0 ${
                primaryCalendarEvent.id === 'opening_tipoff'
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-400'
                  : 'bg-rose-500/20 border-rose-500/60 text-rose-400'
              }`}>
                {primaryCalendarEvent.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider ${
                    primaryCalendarEvent.id === 'opening_tipoff' ? 'bg-amber-500 text-black' : 'bg-rose-500 text-white'
                  }`}>
                    {primaryCalendarEvent.tag}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                    Day {calendarStatus?.currentDayIndex || 1} / {primaryCalendarEvent.totalDays}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase text-white tracking-tight truncate">
                  {primaryCalendarEvent.name} Daily Rewards
                </h3>
                <p className="text-[10px] sm:text-xs text-zinc-300">
                  {calendarStatus?.canClaimToday ? "⚡ Today's reward ready: +" + calendarStatus?.rewardToday?.coins?.toLocaleString() + ' Coins & +' + calendarStatus?.rewardToday?.packsCount + ' Packs' : "✓ Today's reward already claimed"}
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full sm:w-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCalendarModal();
                }}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md ${
                  calendarStatus?.canClaimToday
                    ? primaryCalendarEvent.id === 'opening_tipoff'
                      ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse'
                      : 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                <Gift size={14} />
                <span>{calendarStatus?.canClaimToday ? 'Claim Day ' + calendarStatus?.currentDayIndex : 'View Calendar'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Banner Summary */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-400 uppercase tracking-widest">
                <Sparkles size={12} /> Game Challenges
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                Collector <span className="text-amber-500">Achievements</span>
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Complete quests to unlock free packs and coins.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 rounded-2xl shrink-0">
              <div className="text-center">
                <div className="text-xl font-black text-white italic">{totalUnlockedCount} / {ACHIEVEMENTS.length}</div>
                <div className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Unlocked</div>
              </div>
              <div className="h-8 w-px bg-zinc-800" />
              <div className="text-center">
                <div className="text-xl font-black text-amber-500 italic">{claimableAchievements.length}</div>
                <div className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Pending</div>
              </div>
            </div>
          </div>
        </div>

        {/* Claimable Pending Rewards Section */}
        {claimableAchievements.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-1.5">
                <Sparkles size={14} /> Rewards Ready to Claim ({claimableAchievements.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claimableAchievements.map((ach) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/40 flex items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.08)]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-500 text-black flex items-center justify-center shrink-0 animate-bounce">
                      <ach.icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{ach.category}</p>
                      <h3 className="text-xs font-black italic tracking-tight uppercase truncate text-white">{ach.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {ach.rewardCoins > 0 && (
                          <span className="text-[10px] font-bold text-amber-400 font-mono">+{ach.rewardCoins.toLocaleString()}</span>
                        )}
                        {ach.rewardPacks && ach.rewardPacks.map((p, pIdx) => (
                          <span key={pIdx} className="text-[9px] font-bold text-zinc-300">+{p.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleClaim(ach.id)}
                    disabled={isSaving}
                    className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-amber-400 transition-all shadow-lg active:scale-95 disabled:opacity-50 shrink-0"
                  >
                    Claim
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-1.5">
              <Filter size={14} /> Achievement List
            </h2>
            <button
              onClick={() => setIsAchievementsOpen(true)}
              className="text-[10px] font-black uppercase tracking-wider text-amber-500 hover:text-amber-400 flex items-center gap-1"
            >
              View Full Gallery
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 ${
                    isActive 
                      ? 'bg-white text-black shadow-lg scale-105' 
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievements List */}
        <div className="space-y-3">
          {filteredAchievements.slice(0, 30).map((ach) => {
            const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
            const isClaimed = claimedAchievements.includes(ach.id);
            const progress = ach.getProgress ? ach.getProgress(state, ALL_CARDS) : { current: isUnlocked ? 1 : 0, total: 1 };
            const progressPercent = Math.min(100, Math.round((progress.current / progress.total) * 100));

            return (
              <div 
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isClaimed 
                    ? 'bg-zinc-950/40 border-zinc-900/60 opacity-60' 
                    : isUnlocked 
                      ? 'bg-zinc-900 border-amber-500/30 shadow-md' 
                      : 'bg-zinc-950 border-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isClaimed 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-600' 
                        : isUnlocked 
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}>
                      <ach.icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{ach.category}</span>
                        {isClaimed && (
                          <span className="text-[8px] font-black uppercase text-green-500 flex items-center gap-0.5">
                            <CheckCircle2 size={10} /> Completed
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-black italic tracking-tight uppercase text-white truncate">{ach.title}</h3>
                      <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{ach.description}</p>
                      
                      {/* Progress Bar */}
                      {!isClaimed && (
                        <div className="mt-2.5 space-y-1 max-w-xs">
                          <div className="flex justify-between text-[8px] font-bold text-zinc-500">
                            <span>Progress</span>
                            <span>{progress.current} / {progress.total}</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isUnlocked ? 'bg-amber-500' : 'bg-zinc-600'}`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end gap-2">
                    <div className="text-right">
                      {ach.rewardCoins > 0 && (
                        <div className="text-xs font-black text-amber-500 font-mono">+{ach.rewardCoins.toLocaleString()}</div>
                      )}
                      {ach.rewardPacks && ach.rewardPacks.map((p, pIdx) => (
                        <div key={pIdx} className="text-[9px] font-bold text-zinc-400">+{p.name}</div>
                      ))}
                    </div>

                    {isUnlocked && !isClaimed ? (
                      <button 
                        onClick={() => handleClaim(ach.id)}
                        disabled={isSaving}
                        className="bg-white text-black text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-amber-400 transition-all active:scale-95"
                      >
                        Claim
                      </button>
                    ) : isClaimed ? (
                      <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                        <Check size={12} /> Claimed
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <AchievementsModal 
        isOpen={isAchievementsOpen} 
        onClose={() => setIsAchievementsOpen(false)} 
      />
    </div>
  );
}
