import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { ACHIEVEMENTS } from '../constants/achievements';
import { Check, Lock, Gift, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import AchievementsModal from '../components/AchievementsModal';

export default function RewardsView() {
  const state = useGame();
  const { coins, claimedDays, lastClaimedDate, claimReward, unlockedAchievements } = state;
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const canClaimToday = lastClaimedDate !== today;
  
  // Determine which day is next to claim
  const nextDayToClaim = claimedDays.length + 1;

  const achievementsPercent = useMemo(() => {
    // Only calculate if we have the necessary data
    const unlockedCount = ACHIEVEMENTS.filter(ach => 
      unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS)
    ).length;
    return Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
  }, [unlockedAchievements, state.collection, state.inventoryPacks]); // More specific dependencies to avoid re-calculating on coin changes

  const rewards = useMemo(() => [
    { day: 1, amount: 100, label: 'Starter Bonus' },
    { day: 2, amount: 150, label: 'Daily Boost' },
    { day: 3, amount: 200, label: 'Mid-Week Gift' },
    { day: 4, amount: 250, label: 'Loyalty Reward' },
    { day: 5, amount: 300, label: 'Elite Bonus' },
    { day: 6, amount: 500, label: 'Weekend Prep' },
    { day: 7, amount: 1000, label: 'Grand Prize' },
  ], []);

  const handleClaim = (day: number, amount: number) => {
    if (day === nextDayToClaim && canClaimToday) {
      claimReward(day, amount);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="px-6 pt-8 pb-4 flex justify-between items-end shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-3 bg-amber-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Daily Stimulus</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Rewards</h1>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/10 text-amber-500">
                <Trophy size={10} />
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Hall of Fame</span>
                <span className="text-[10px] font-black italic text-white">{achievementsPercent}%</span>
              </div>
            </div>
          </button>

          <div className="flex items-center space-x-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900 shadow-lg">
            <span className="text-lg">🪙</span>
            <span className="font-mono font-bold text-lg text-yellow-500">
              {coins}
            </span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 no-scrollbar pb-24">
        {rewards.map((reward) => {
          const isClaimed = claimedDays.includes(reward.day);
          const isNext = reward.day === nextDayToClaim;
          const isLocked = reward.day > nextDayToClaim;
          const canClaim = isNext && canClaimToday;

          return (
            <motion.div
              key={reward.day}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: reward.day * 0.05 }}
              onClick={() => canClaim && handleClaim(reward.day, reward.amount)}
              className={`relative p-5 rounded-2xl border transition-all duration-300 flex justify-between items-center group ${
                isClaimed 
                  ? 'bg-zinc-900/30 border-zinc-800 opacity-60' 
                  : isNext 
                    ? canClaim 
                      ? 'bg-zinc-900 border-amber-500/50 cursor-pointer hover:border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                      : 'bg-zinc-900 border-zinc-700 opacity-80'
                    : 'bg-zinc-950 border-zinc-900 opacity-40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isClaimed ? 'bg-zinc-800 text-zinc-500' : isNext ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-700'
                }`}>
                  {isClaimed ? <Check size={24} strokeWidth={3} /> : <Gift size={24} strokeWidth={2.5} />}
                </div>
                
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Day {reward.day}</p>
                  <h3 className="text-lg font-black italic tracking-tighter uppercase leading-none mt-0.5">
                    {reward.label}
                  </h3>
                  <p className={`text-xs font-bold mt-1 ${isClaimed ? 'text-zinc-600' : 'text-amber-500'}`}>
                    +{reward.amount} Coins
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {isClaimed ? (
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Claimed</span>
                ) : isNext ? (
                  canClaim ? (
                    <button className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg group-hover:bg-amber-400 transition-colors">
                      Claim
                    </button>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Tomorrow</span>
                  )
                ) : (
                  <Lock size={16} className="text-zinc-800" />
                )}
              </div>

              {/* Progress Line */}
              {reward.day < 7 && (
                <div className="absolute -bottom-3 left-11 w-0.5 h-3 bg-zinc-800" />
              )}
            </motion.div>
          );
        })}
      </div>

      <AchievementsModal 
        isOpen={isAchievementsOpen} 
        onClose={() => setIsAchievementsOpen(false)} 
      />
    </div>
  );
}
