import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { ACHIEVEMENTS } from '../constants/achievements';
import { Check, Lock, Gift, Trophy, Star, Zap, Users, Award, Flame, Target, Coins, Package, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import AchievementsModal from '../components/AchievementsModal';

export default function RewardsView() {
  const state = useGame();
  const { coins, claimedDays, lastClaimedDate, claimReward, unlockedAchievements, claimedAchievements, claimAchievementReward } = state;
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'draft'>('daily');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const canClaimToday = lastClaimedDate !== today;
  
  // Determine which day is next to claim
  const nextDayToClaim = claimedDays.length + 1;

  const achievementsPercent = useMemo(() => {
    const unlockedCount = ACHIEVEMENTS.filter(ach => 
      unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS)
    ).length;
    return Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
  }, [unlockedAchievements, state.collection, state.inventoryPacks]);

  const claimableAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(ach => {
      const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
      const isClaimed = claimedAchievements.includes(ach.id);
      return isUnlocked && !isClaimed;
    });
  }, [unlockedAchievements, claimedAchievements, state]);

  const rewards = useMemo(() => [
    { day: 1, amount: 1000, label: 'Starter Bonus' },
    { day: 2, amount: 2500, label: 'Daily Boost' },
    { day: 3, amount: 5000, label: 'Mid-Week Gift', pack: { id: 'rookie-pack', type: 'rookie', name: 'Rookie Pack' } },
    { day: 4, amount: 10000, label: 'Loyalty Reward' },
    { day: 5, amount: 15000, label: 'Elite Bonus', pack: { id: 'allstar-pack', type: 'allstar', name: 'All-Star Pack' } },
    { day: 6, amount: 25000, label: 'Weekend Prep' },
    { day: 7, amount: 50000, label: 'Grand Prize', pack: { id: 'mvp-pack', type: 'mvp', name: 'Finals MVP Pack' } },
  ], []);

  const handleClaim = (day: number, amount: number, pack?: any) => {
    if (day === nextDayToClaim && canClaimToday) {
      claimReward(day, amount, pack);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <header className="px-6 pt-8 pb-4 flex justify-between items-end shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-3 bg-amber-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Rewards Center</span>
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

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 no-scrollbar pb-24">
        {/* Daily Rewards Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Daily Rewards</h2>
            {!canClaimToday && (
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/50 italic">Next in 14h 20m</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {rewards.map((reward) => {
              const isClaimed = claimedDays.includes(reward.day);
              const isNext = reward.day === nextDayToClaim;
              const canClaim = isNext && canClaimToday;

              return (
                <motion.div
                  key={reward.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reward.day * 0.05 }}
                  onClick={() => canClaim && handleClaim(reward.day, reward.amount, reward.pack)}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 flex justify-between items-center group ${
                    isClaimed 
                      ? 'bg-zinc-900/30 border-zinc-800/50 opacity-60' 
                      : isNext 
                        ? canClaim 
                          ? 'bg-zinc-900 border-amber-500/50 cursor-pointer hover:border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
                          : 'bg-zinc-900 border-zinc-700 opacity-80'
                        : 'bg-zinc-950 border-zinc-900/50 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                      isClaimed ? 'bg-zinc-800 text-zinc-500' : isNext ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-700'
                    }`}>
                      {isClaimed ? <Check size={20} strokeWidth={3} /> : <Gift size={20} strokeWidth={2.5} />}
                    </div>
                    
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Day {reward.day}</p>
                      <h3 className="text-sm font-black italic tracking-tighter uppercase leading-none mt-0.5">
                        {reward.label}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-bold ${isClaimed ? 'text-zinc-600' : 'text-amber-500'}`}>
                          +{reward.amount.toLocaleString()} Coins
                        </span>
                        {reward.pack && (
                          <span className={`text-[10px] font-bold ${isClaimed ? 'text-zinc-600' : 'text-zinc-400'}`}>
                            + {reward.pack.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isClaimed ? (
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Claimed</span>
                    ) : isNext ? (
                      canClaim ? (
                        <button className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg group-hover:bg-amber-400 transition-colors shadow-lg active:scale-95">
                          Claim
                        </button>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Tomorrow</span>
                      )
                    ) : (
                      <Lock size={14} className="text-zinc-800" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Achievements Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Achievements</h2>
            <button 
              onClick={() => setIsAchievementsOpen(true)}
              className="text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              View All <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {claimableAchievements.length > 0 ? (
              claimableAchievements.slice(0, 3).map((ach, idx) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 flex justify-between items-center shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center">
                      <ach.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{ach.category}</p>
                      <h3 className="text-sm font-black italic tracking-tighter uppercase leading-none mt-0.5">{ach.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {ach.rewardCoins > 0 && (
                          <span className="text-[10px] font-bold text-amber-500">+{ach.rewardCoins.toLocaleString()} Coins</span>
                        )}
                        {ach.rewardPacks && ach.rewardPacks.map((p, pIdx) => (
                          <span key={pIdx} className="text-[10px] font-bold text-zinc-400">+{p.name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => claimAchievementReward(ach.id)}
                    className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors shadow-lg active:scale-95"
                  >
                    Claim
                  </button>
                </motion.div>
              ))
            ) : (
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 border-dashed flex flex-col items-center justify-center text-center">
                <Trophy size={32} className="text-zinc-800 mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">No rewards to claim</p>
                <p className="text-[8px] font-medium text-zinc-700 mt-1">Complete achievements to earn coins and packs!</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <AchievementsModal 
        isOpen={isAchievementsOpen} 
        onClose={() => setIsAchievementsOpen(false)} 
      />
    </div>
  );
}
