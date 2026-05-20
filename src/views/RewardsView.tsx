import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { ACHIEVEMENTS } from '../constants/achievements';
import { Check, Lock, Gift, Trophy, Star, Zap, Users, Award, Flame, Target, Coins, Package, ChevronRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import AchievementsModal from '../components/AchievementsModal';
import { useNotification } from '../context/NotificationContext';

export default function RewardsView() {
  const state = useGame();
  const { 
    collection,
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
    updateGameStateAsync,
    isSaving 
  } = state;
  const { notifySuccess, notifyError } = useNotification();
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'battlepass'>('daily');

  const XP_PER_LEVEL = 1000;
  const progressPercent = (battlePassXP / XP_PER_LEVEL) * 100;

  const BATTLE_PASS_REWARDS = useMemo(() => [
    { level: 1, free: { type: 'coins' as const, amount: 10000 }, premium: { type: 'pack' as const, id: 'rookie', name: 'Rookie Pack' }, tier: 'Common' },
    { level: 2, free: { type: 'pack' as const, id: 'rookie', name: 'Rookie Pack' }, premium: { type: 'coins' as const, amount: 25000 }, tier: 'Common' },
    { level: 3, free: { type: 'coins' as const, amount: 15000 }, premium: { type: 'card' as const, cardId: 'lal-003', playerName: 'Austin Reaves', rarity: 'allstar' }, tier: 'Rare' },
    { level: 4, free: { type: 'pack' as const, id: 'rookie', name: 'Rookie Pack' }, premium: { type: 'pack' as const, id: 'allstar', name: 'All-Star Pack' }, tier: 'Rare' },
    { level: 5, free: { type: 'coins' as const, amount: 25000 }, premium: { type: 'pack' as const, id: 'mvp', name: 'Finals MVP Pack' }, tier: 'Epic' },
    { level: 6, free: { type: 'pack' as const, id: 'allstar', name: 'All-Star Pack' }, premium: { type: 'coins' as const, amount: 75000 }, tier: 'Epic' },
    { level: 7, free: { type: 'coins' as const, amount: 35000 }, premium: { type: 'pack' as const, id: 'hof', name: 'HOF Pack' }, tier: 'Legendary' },
    { level: 8, free: { type: 'pack' as const, id: 'rookie', name: 'Rookie Pack' }, premium: { type: 'card' as const, cardId: 'bos-002', playerName: 'Jayson Tatum', rarity: 'franchise' }, tier: 'Legendary' },
    { level: 9, free: { type: 'coins' as const, amount: 50000 }, premium: { type: 'pack' as const, id: 'mvp', name: 'Finals MVP Pack' }, tier: 'Epic' },
    { level: 10, free: { type: 'pack' as const, id: 'allstar', name: 'All-Star Pack' }, premium: { type: 'card' as const, cardId: 'lal-002', playerName: 'LeBron James', rarity: 'franchise' }, tier: 'Ultimate' },
    { level: 11, free: { type: 'coins' as const, amount: 75000 }, premium: { type: 'pack' as const, id: 'hof', name: 'HOF Pack' }, tier: 'Legendary' },
    { level: 12, free: { type: 'pack' as const, id: 'mvp', name: 'Finals MVP Pack' }, premium: { type: 'card' as const, cardId: 'lal-001', playerName: 'Luka Doncic', rarity: 'franchise' }, tier: 'Ultimate' },
    { level: 13, free: { type: 'coins' as const, amount: 100000 }, premium: { type: 'pack' as const, id: 'hof', name: 'HOF Pack' }, tier: 'Ultimate' },
    { level: 14, free: { type: 'pack' as const, id: 'hof', name: 'HOF Pack' }, premium: { type: 'coins' as const, amount: 250000 }, tier: 'Ultimate' },
    { level: 15, free: { type: 'pack' as const, id: 'hof', name: 'HOF Pack' }, premium: { type: 'card' as const, cardId: 'gsw-001', playerName: 'Stephen Curry', rarity: 'franchise' }, tier: 'Ultimate' }
  ], []);

  const handleClaimBPReward = async (level: number, type: 'free' | 'premium') => {
    if (isSaving) return;
    const reward = (BATTLE_PASS_REWARDS.find(r => r.level === level) as any)[type];
    if (!reward) return;

    try {
      let newCoins = coins;
      let newCollection = { ...collection };
      let newPacks = [...inventoryPacks];

      if (reward.type === 'coins') {
        newCoins += reward.amount;
      } else if (reward.type === 'pack') {
        const existing = newPacks.find(p => p.type === reward.id);
        if (existing) {
          newPacks = newPacks.map(p => p.type === reward.id ? { ...p, count: p.count + 1 } : p);
        } else {
          newPacks.push({ id: reward.id, type: reward.id, name: reward.name, count: 1 });
        }
      } else if (reward.type === 'card') {
        newCollection[reward.cardId] = (newCollection[reward.cardId] || 0) + 1;
      }

      const newClaimed = [...claimedAchievements, `bp_${type}_${level}`];
      await updateGameStateAsync({
        coins: newCoins,
        collection: newCollection,
        inventoryPacks: newPacks,
        claimedAchievements: newClaimed
      });

      notifySuccess(`Claimed Level ${level} ${type === 'premium' ? 'Premium' : 'Free'} reward!`);
    } catch (err) {
      notifyError('Failed to claim reward. Please try again.');
    }
  };

  const getTeamStyling = (teamAbbr: string) => {
    switch (teamAbbr?.toUpperCase()) {
      case 'LAL': return 'bg-purple-950/90 border-amber-500 text-yellow-500';
      case 'BOS': return 'bg-emerald-950/90 border-emerald-500 text-emerald-300';
      case 'GSW': return 'bg-blue-950/90 border-yellow-500 text-yellow-400';
      case 'DAL': return 'bg-sky-950/90 border-sky-500 text-sky-400';
      default: return 'bg-zinc-900 border-zinc-700 text-white';
    }
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
            {/* BP Header / Progress with Cyberpunk Glassmorphism and Amber/Purple glow */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.15)] p-8 sm:p-10 group transition-all duration-500 hover:border-amber-500/20">
              {/* Dynamic Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-purple-550/15 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-[10px] font-black text-amber-400 uppercase tracking-widest animate-pulse">
                      Season 1: Rising Legends
                    </div>
                  </div>
                  <h3 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)]">
                    Elite <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Pass Pro</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,1)]" />
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.22em]">Level {battlePassLevel} • {XP_PER_LEVEL - battlePassXP} XP TO GO</p>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-4 min-w-[240px]">
                  {!isBattlePassPremium ? (
                    <button 
                      onClick={() => state.setCurrentView('shop')}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-[1.03] active:scale-[0.97] shadow-[0_20px_45px_rgba(245,158,11,0.25)] flex items-center justify-center gap-3"
                    >
                      <Trophy size={16} fill="currentColor" />
                      Unlock Elite Track
                    </button>
                  ) : (
                    <div className="w-full bg-zinc-900/80 border border-amber-500/30 px-8 py-5 rounded-2xl flex items-center justify-center gap-3 backdrop-blur-xl shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                      <ShieldCheck size={16} className="text-amber-400 animate-pulse animate-duration-1000" />
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] italic">Elite Membership Active</span>
                    </div>
                  )}
                  
                  <div className="w-full space-y-2">
                    <div className="h-4 w-full bg-black/60 rounded-full overflow-hidden border border-white/10 p-1 flex items-center shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500">
                      <span>{battlePassXP} Progress</span>
                      <span>1000 Threshold</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BP Rewards Table */}
            <div className="space-y-8">
              <div className="space-y-6">
                {BATTLE_PASS_REWARDS.map((reward) => {
                  const isFreeClaimed = claimedAchievements.includes(`bp_free_${reward.level}`);
                  const isFreeUnlocked = battlePassLevel >= reward.level;

                  const isPremiumClaimed = claimedAchievements.includes(`bp_premium_${reward.level}`);
                  const isPremiumUnlocked = battlePassLevel >= reward.level && isBattlePassPremium;

                  // Find player card details
                  const freeCardData = reward.free.type === 'card' ? ALL_CARDS.find(c => c.id === reward.free.cardId) : null;
                  const premiumCardData = reward.premium.type === 'card' ? ALL_CARDS.find(c => c.id === reward.premium.cardId) : null;

                  return (
                    <div key={reward.level} className="relative border border-zinc-900 bg-zinc-950/60 rounded-3xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-zinc-800 hover:bg-zinc-950/80">
                      {/* Level Indicator Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`px-4 py-2 bg-zinc-900 border rounded-2xl flex items-center gap-2 transition-all duration-500 ${
                            battlePassLevel >= reward.level 
                              ? 'border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-black'
                              : 'border-zinc-800 text-zinc-500'
                          }`}>
                            <Star size={12} className={battlePassLevel >= reward.level ? "text-amber-400 fill-amber-400 shrink-0 animate-spin" : "text-zinc-500 shrink-0"} />
                            <span className="text-[11px] font-black uppercase tracking-widest italic">Level {reward.level}</span>
                          </div>
                          
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                            reward.tier === 'Ultimate' ? 'bg-purple-600/90 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)]' : 
                            reward.tier === 'Legendary' ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 
                            reward.tier === 'Epic' ? 'bg-blue-600 text-white' : 'bg-zinc-850 text-zinc-450'
                          }`}>
                            {reward.tier}
                          </span>
                        </div>
                        
                        {battlePassLevel >= reward.level && isFreeClaimed && (!isBattlePassPremium || isPremiumClaimed) && (
                          <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase tracking-wider">
                            <Check size={12} strokeWidth={4} />
                            <span>100% Cleared</span>
                          </div>
                        )}
                      </div>

                      {/* Tracks Area (separated by center dividing line) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                        {/* Center Glowing Divider Line */}
                        <div className="hidden md:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-gradient-to-b from-transparent via-zinc-850 to-transparent" />
                        <div className="md:hidden h-[1px] bg-gradient-to-r from-transparent via-zinc-850 to-transparent my-1" />

                        {/* 1. FREE TRACK COLUMN */}
                        <div className="flex flex-col justify-between gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Free Track</span>
                            {isFreeClaimed ? (
                              <span className="text-[9px] font-black uppercase text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded-full">
                                <Check size={10} strokeWidth={4} className="stroke-[3]" /> Claimed
                              </span>
                            ) : !isFreeUnlocked ? (
                              <span className="text-[9px] font-black uppercase text-zinc-650 flex items-center gap-1">
                                <Lock size={10} /> Locked
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase text-amber-500 animate-pulse">
                                Available
                              </span>
                            )}
                          </div>

                          {/* Free Reward Representation */}
                          <div className="flex-1">
                            {reward.free.type === 'card' ? (
                              <div className="relative overflow-hidden rounded-2.5xl p-3 border border-zinc-805 bg-zinc-950/60 flex items-center gap-4 group/hologram">
                                <div className={`w-14 h-20 rounded-xl overflow-hidden border-2 flex items-center justify-center shrink-0 relative ${getTeamStyling(freeCardData?.teamAbbr || '')} shadow-lg`}>
                                  {freeCardData?.imageUrl ? (
                                    <img src={freeCardData.imageUrl} className="h-full object-cover select-none pointer-events-none" referrerPolicy="no-referrer" alt={reward.free.playerName} />
                                  ) : (
                                    <span className="text-xl font-bold">{freeCardData?.name?.charAt(0) || '🏀'}</span>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Holographic Card</span>
                                  <h4 className="text-sm font-black italic uppercase text-white tracking-tight">
                                    {reward.free.playerName}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[8px] font-mono uppercase bg-black/60 px-1.5 py-0.5 rounded border border-white/5 text-zinc-400">{freeCardData?.teamAbbr || 'NBA'}</span>
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black">{reward.free.rarity}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 rounded-2.5xl border border-zinc-90 w-full bg-zinc-950/40 flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                                  {reward.free.type === 'coins' ? <Coins size={20} className="text-yellow-500" /> : <Package size={20} className="text-cyan-400" />}
                                </div>
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[8px] font-black text-zinc-550 uppercase tracking-widest">Standard Reward</span>
                                  <h4 className="text-sm font-black text-white italic uppercase tracking-tight">
                                    {reward.free.type === 'coins' ? `+${reward.free.amount.toLocaleString()} Coins` : reward.free.name}
                                  </h4>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Claim Action for Free */}
                          {isFreeUnlocked && !isFreeClaimed && (
                            <motion.button
                              whileHover={{ y: -2, scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => handleClaimBPReward(reward.level, 'free')}
                              disabled={isSaving}
                              className="w-full py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-450 hover:text-black transition-all shadow-lg font-bold"
                            >
                              Claim Reward
                            </motion.button>
                          )}
                        </div>

                        {/* 2. ELITE PREMIUM TRACK COLUMN */}
                        <div className="flex flex-col justify-between gap-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">Premium Track</span>
                            {isPremiumClaimed ? (
                              <span className="text-[9px] font-black uppercase text-amber-500 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                <Check size={10} strokeWidth={4} className="stroke-[3]" /> Claimed
                              </span>
                            ) : !isPremiumUnlocked ? (
                              <span className="text-[9px] font-black uppercase text-zinc-650 flex items-center gap-1">
                                <Lock size={10} /> Locked
                              </span>
                            ) : (
                              <span className="text-[9px] font-black uppercase text-amber-400 animate-pulse">
                                Available
                              </span>
                            )}
                          </div>

                          {/* Premium Reward Representation (Supports Card) */}
                          <div className="flex-1">
                            {reward.premium.type === 'card' ? (
                              <div className="relative overflow-hidden rounded-2.5xl p-3 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-950/90 to-purple-500/5 flex items-center gap-4 group/hologram hover:border-amber-500/60 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-500 cursor-pointer">
                                <div className={`w-14 h-20 rounded-xl overflow-hidden border-2 flex items-center justify-center shrink-0 relative ${getTeamStyling(premiumCardData?.teamAbbr || '')} shadow-lg shadow-amber-500/5 border-amber-500`}>
                                  {premiumCardData?.imageUrl ? (
                                    <img src={premiumCardData.imageUrl} className="h-full object-cover select-none pointer-events-none" referrerPolicy="no-referrer" alt={reward.premium.playerName} />
                                  ) : (
                                    <span className="text-xl font-bold">{premiumCardData?.name?.charAt(0) || '🏀'}</span>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                </div>
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[8px] font-black text-amber-400 uppercase tracking-[0.2em] italic animate-pulse">Holographic Card</span>
                                  <h4 className="text-sm font-black italic uppercase text-white tracking-tight">
                                    {reward.premium.playerName}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1.5">
                                    <span className="text-[8px] font-mono uppercase bg-black/60 px-1.5 py-0.5 rounded border border-white/5 text-zinc-400">{premiumCardData?.teamAbbr || 'NBA'}</span>
                                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-black">{reward.premium.rarity}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4 rounded-2.5xl border border-zinc-900 bg-zinc-950/40 flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                  {reward.premium.type === 'coins' ? <Coins size={20} fill="currentColor" /> : <Package size={20} fill="currentColor" />}
                                </div>
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[8px] font-black text-amber-500/80 uppercase tracking-widest">Elite Reward</span>
                                  <h4 className="text-sm font-black text-white italic uppercase tracking-tight">
                                    {reward.premium.type === 'coins' ? `+${reward.premium.amount.toLocaleString()} Coins` : reward.premium.name}
                                  </h4>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Claim Action for Premium */}
                          {isPremiumUnlocked && !isPremiumClaimed && (
                            <motion.button
                              whileHover={{ y: -2, scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => handleClaimBPReward(reward.level, 'premium')}
                              disabled={isSaving}
                              className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg"
                            >
                              Claim Premium
                            </motion.button>
                          )}

                          {!isBattlePassPremium && isFreeUnlocked && (
                            <div className="w-full py-1.5 bg-zinc-900/60 border border-dashed border-zinc-800 rounded-xl flex items-center justify-center gap-1.5 text-[8px] font-black uppercase text-zinc-500 tracking-wider">
                              <Lock size={10} /> Get Elite Pass to Claim
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
