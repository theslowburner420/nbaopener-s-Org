import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { ACHIEVEMENTS } from '../constants/achievements';
import { Check, Lock, Gift, Trophy, Star, Zap, Users, Award, Flame, Target, Coins, Package, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import AchievementsModal from '../components/AchievementsModal';

export default function RewardsView() {
  const state = useGame();
  const { 
    coins, 
    claimedDays, 
    lastClaimedDate, 
    claimReward, 
    unlockedAchievements, 
    claimedAchievements, 
    claimAchievementReward, 
    battlePassLevel,
    battlePassXP,
    isBattlePassPremium,
    inventoryPacks,
    addPackToInventory,
    addCoins,
    isSaving 
  } = state;
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'battlepass'>('daily');

  const XP_PER_LEVEL = 1000;
  const progressPercent = (battlePassXP / XP_PER_LEVEL) * 100;

  const BATTLE_PASS_REWARDS = useMemo(() => [
    { level: 1, free: { type: 'coins', amount: 5000 }, premium: { type: 'pack', id: 'premium', name: 'Premium Pack' }, tier: 'Common' },
    { level: 2, free: { type: 'coins', amount: 10000 }, premium: { type: 'coins', amount: 25000 }, tier: 'Common' },
    { level: 3, free: { type: 'pack', id: 'rookie', name: 'Rookie Pack' }, premium: { type: 'pack', id: 'allstar', name: 'All-Star Pack' }, tier: 'Rare' },
    { level: 4, free: { type: 'coins', amount: 15000 }, premium: { type: 'coins', amount: 50000 }, tier: 'Rare' },
    { level: 5, free: { type: 'pack', id: 'allstar', name: 'All-Star Pack' }, premium: { type: 'pack', id: 'mvp', name: 'Finals MVP Pack' }, tier: 'Epic' },
    { level: 6, free: { type: 'coins', amount: 25000 }, premium: { type: 'coins', amount: 100000 }, tier: 'Epic' },
    { level: 7, free: { type: 'pack', id: 'mvp', name: 'Finals MVP Pack' }, premium: { type: 'pack', id: 'legendary', name: 'Legendary Pack' }, tier: 'Legendary' },
    { level: 8, free: { type: 'coins', amount: 50000 }, premium: { type: 'coins', amount: 200000 }, tier: 'Legendary' },
    { level: 9, free: { type: 'pack', id: 'special_item', name: 'Draft Exclusive Selection' }, premium: { type: 'pack', id: 'special_item', name: 'Draft Winner Card' }, tier: 'Ultimate' },
    { level: 10, free: { type: 'coins', amount: 100000 }, premium: { type: 'coins', amount: 500000 }, tier: 'Ultimate' },
  ], []);

  const handleClaimBPReward = async (level: number, type: 'free' | 'premium') => {
    const reward = (BATTLE_PASS_REWARDS.find(r => r.level === level) as any)[type];
    if (reward.type === 'coins') {
      await addCoins(reward.amount);
    } else {
      await addPackToInventory({ id: reward.id, type: reward.id, name: reward.name });
    }
    // In a real app we'd track specific claimed BP rewards, but for now we'll just grant them
  };

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

  const handleClaim = async (day: number, amount: number, pack?: any) => {
    if (day === nextDayToClaim && canClaimToday) {
      await claimReward(day, amount, pack);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-black text-white">
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

      {/* Tabs */}
      <div className="px-6 flex items-center gap-1 shrink-0 mb-4">
        <button 
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border ${
            activeTab === 'daily' 
              ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.1)]' 
              : 'bg-zinc-900/50 text-zinc-500 border-zinc-800/50 hover:bg-zinc-900'
          }`}
        >
          Daily Login
        </button>
        <button 
          onClick={() => setActiveTab('battlepass')}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl border flex items-center justify-center gap-2 ${
            activeTab === 'battlepass' 
              ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' 
              : 'bg-zinc-900/50 text-amber-500/50 border-zinc-800/50 hover:bg-zinc-900'
          }`}
        >
          <Trophy size={12} fill={activeTab === 'battlepass' ? 'black' : 'currentColor'} />
          Elite Pass
        </button>
      </div>

      <div className="flex-1 px-6 py-2 space-y-8 no-scrollbar pb-24">
        {activeTab === 'daily' ? (
          /* Daily Rewards Section */
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Consecutive Login</h2>
              {!canClaimToday && (
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/50 italic">Claimed Today</span>
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
                          <button 
                            disabled={isSaving}
                            className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg group-hover:bg-amber-400 transition-colors shadow-lg active:scale-95 disabled:opacity-50 min-w-[70px] flex items-center justify-center"
                          >
                            {isSaving ? (
                              <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                              'Claim'
                            )}
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
        ) : (
          /* Battle Pass Section */
          <section className="space-y-8 max-w-5xl mx-auto">
            {/* BP Header / Progress */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900 shadow-2xl p-8 sm:p-10 group">
              {/* Dynamic Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-purple-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-700" />
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-black text-amber-500 uppercase tracking-widest">
                      Season 1: Rising Legends
                    </div>
                  </div>
                  <h3 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
                    Elite <span className="text-amber-500">Pass</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Level {battlePassLevel} • {XP_PER_LEVEL - battlePassXP} XP TO GO</p>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4 min-w-[240px]">
                  {!isBattlePassPremium ? (
                    <button 
                      onClick={() => state.setCurrentView('shop')}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_rgba(245,158,11,0.2)] flex items-center justify-center gap-3"
                    >
                      <Trophy size={16} fill="currentColor" />
                      Unlock Elite Track
                    </button>
                  ) : (
                    <div className="w-full bg-white/5 border border-amber-500/20 px-8 py-5 rounded-2xl flex items-center justify-center gap-3 backdrop-blur-xl">
                      <ShieldCheck size={16} className="text-amber-500" />
                      <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Elite Membership Active</span>
                    </div>
                  )}
                  
                  <div className="w-full space-y-2">
                    <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-zinc-600">
                      <span>{battlePassXP} Progress</span>
                      <span>1000 Threshold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BP Rewards Table */}
            <div className="space-y-6">
              <div className="grid grid-cols-[80px,1fr,1fr] gap-6 px-8 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
                <span className="text-center">Tier</span>
                <span className="flex items-center gap-2">Free <span className="opacity-40">Track</span></span>
                <span className="text-amber-500 flex items-center gap-2">Elite <span className="opacity-40 italic">Premium</span></span>
              </div>

              <div className="space-y-4">
                {BATTLE_PASS_REWARDS.map((reward) => (
                  <div key={reward.level} className="grid grid-cols-[80px,1fr,1fr] gap-4 sm:gap-6 group">
                    {/* Level Pill */}
                    <div className={`relative aspect-square rounded-[2rem] flex flex-col items-center justify-center border-2 transition-all duration-500 ${
                      battlePassLevel >= reward.level 
                        ? 'bg-zinc-800 border-white/10 text-white shadow-xl' 
                        : 'bg-zinc-950 border-white/5 text-zinc-700'
                    }`}>
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1">LVL</span>
                      <span className="text-2xl font-black italic tracking-tighter">{reward.level}</span>
                      {battlePassLevel >= reward.level && (
                        <div className="absolute -top-1 -right-1 bg-green-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-950">
                          <Check size={10} className="text-black" strokeWidth={4} />
                        </div>
                      )}
                    </div>
                    
                    {/* Free Reward Card */}
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => battlePassLevel >= reward.level && handleClaimBPReward(reward.level, 'free')}
                      className={`relative p-5 sm:p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden ${
                        battlePassLevel >= reward.level 
                          ? 'bg-zinc-900 border-zinc-800 cursor-pointer hover:border-zinc-700 shadow-xl' 
                          : 'bg-zinc-950/50 border-white/5 opacity-40 grayscale pointer-events-none'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-700 transition-colors">
                          {reward.free.type === 'coins' ? <Coins size={24} /> : <Package size={24} />}
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Standard Reward</span>
                          <h4 className="text-base sm:text-lg font-black text-white italic uppercase tracking-tight">
                            {reward.free.type === 'coins' ? `+${reward.free.amount.toLocaleString()} Coins` : reward.free.name}
                          </h4>
                        </div>
                      </div>
                      {battlePassLevel < reward.level && (
                        <div className="absolute inset-0 flex items-center justify-end px-8 bg-gradient-to-l from-black/40 to-transparent">
                          <Lock size={16} className="text-zinc-800" />
                        </div>
                      )}
                    </motion.div>

                    {/* Elite Reward Card */}
                    <motion.div 
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => isBattlePassPremium && battlePassLevel >= reward.level && handleClaimBPReward(reward.level, 'premium')}
                      className={`relative p-5 sm:p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden group/elite ${
                        isBattlePassPremium && battlePassLevel >= reward.level 
                          ? 'bg-amber-500/5 border-amber-500/20 cursor-pointer hover:bg-amber-500/10 hover:border-amber-500/40 shadow-2xl shadow-amber-500/5' 
                          : 'bg-zinc-950/50 border-white/5 opacity-40 grayscale'
                      }`}
                    >
                      {/* Glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent opacity-0 group-hover/elite:opacity-100 transition-opacity duration-700" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover/elite:scale-110 transition-transform">
                          {reward.premium.type === 'coins' ? <Coins size={24} fill="currentColor" /> : <Package size={24} fill="currentColor" />}
                        </div>
                        <div className="flex flex-col leading-tight">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest italic">Elite Path</span>
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              reward.tier === 'Ultimate' ? 'bg-purple-500 text-white' : 
                              reward.tier === 'Legendary' ? 'bg-amber-500 text-black' : 
                              reward.tier === 'Epic' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'
                            }`}>
                              {reward.tier}
                            </span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-white italic uppercase tracking-tight group-hover/elite:translate-x-1 transition-transform">
                            {reward.premium.type === 'coins' ? `+${reward.premium.amount.toLocaleString()} Coins` : reward.premium.name}
                          </h4>
                        </div>
                      </div>

                      {!isBattlePassPremium && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60 backdrop-blur-[2px]">
                          <div className="flex flex-col items-center gap-1 group-hover/elite:scale-110 transition-transform">
                            <Lock size={18} className="text-zinc-600 mb-1" />
                            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Locked</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Global Achievement Pulse */}
        <section className="mt-4">
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
                    disabled={isSaving}
                    className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors shadow-lg active:scale-95 disabled:opacity-50 min-w-[70px] flex items-center justify-center"
                  >
                    {isSaving ? (
                      <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      'Claim'
                    )}
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
