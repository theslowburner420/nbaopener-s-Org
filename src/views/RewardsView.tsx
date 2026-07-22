import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { ACHIEVEMENTS } from '../constants/achievements';
import { Check, Lock, Gift, Trophy, Star, Zap, Users, Award, Flame, Target, Coins, Package, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useMemo } from 'react';
import AchievementsModal from '../components/AchievementsModal';
import { useNotification } from '../context/NotificationContext';

export default function RewardsView() {
  const state = useGame();
  const { 
    collection,
    coins, 
    unlockedAchievements, 
    claimedAchievements, 
    claimAchievementReward, 
    battlePassLevel,
    battlePassXP,
    isBattlePassPremium,
    inventoryPacks,
    updateGameStateAsync,
    isSaving,
    user,
    login
  } = state;
  const { notifySuccess, notifyError } = useNotification();
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);

  const XP_PER_LEVEL = 1000;
  const progressPercent = (battlePassXP / XP_PER_LEVEL) * 100;

  const getFreeRewardForLevel = (lvl: number) => {
    if (lvl === 100) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'legendary_mvp', name: 'Legendary MVP Pack' },
          { type: 'coins' as const, amount: 50000 }
        ]
      };
    }
    
    const rookieLevels = [2, 5, 8, 11, 14, 19, 22, 28, 34, 39];
    if (rookieLevels.includes(lvl)) {
      return { type: 'pack' as const, id: 'rookie', name: 'Rookie Pack' };
    }
    
    const allStarLevels = [16, 25, 31, 36, 42, 48, 54, 59];
    if (allStarLevels.includes(lvl)) {
      return { type: 'pack' as const, id: 'allstar', name: 'All-Star Pack' };
    }
    
    const mvpLevels = [45, 51, 56, 62, 68, 74, 79];
    if (mvpLevels.includes(lvl)) {
      return { type: 'pack' as const, id: 'mvp', name: 'Finals MVP Pack' };
    }
    
    const hofLevels = [65, 71, 76, 82, 88, 94, 99];
    if (hofLevels.includes(lvl)) {
      return { type: 'pack' as const, id: 'hof', name: 'HOF Pack' };
    }
    
    const legendaryLevels = [85, 91, 96];
    if (legendaryLevels.includes(lvl)) {
      return { type: 'pack' as const, id: 'legendary_mvp', name: 'Legendary MVP Pack' };
    }
    
    const coinsMap: Record<number, number> = {
      1: 1000, 3: 1500, 4: 2000, 6: 2500, 7: 3000, 9: 3500, 10: 5000,
      12: 4000, 13: 4500, 15: 6000, 17: 5000, 18: 5500, 20: 7500,
      21: 6000, 23: 6500, 24: 7000, 26: 8000, 27: 7500, 29: 8500, 30: 10000,
      32: 9000, 33: 9500, 35: 11000, 37: 10000, 38: 10500, 40: 12500,
      41: 11000, 43: 11500, 44: 12000, 46: 13000, 47: 12500, 49: 13500, 50: 15000,
      52: 14000, 53: 14500, 55: 16000, 57: 15000, 58: 15500, 60: 17500,
      61: 16000, 63: 16500, 64: 17000, 66: 18000, 67: 17500, 69: 18500, 70: 20000,
      72: 19000, 73: 19500, 75: 22000, 77: 20000, 78: 21000, 80: 25000,
      81: 22000, 83: 23000, 84: 24000, 86: 25000, 87: 24500, 89: 26000, 90: 30000,
      92: 27000, 93: 28000, 95: 32000, 97: 30000, 98: 35000
    };
    
    return { type: 'coins' as const, amount: coinsMap[lvl] || 1000 };
  };

  const getEliteRewardForLevel = (lvl: number) => {
    if (lvl === 20) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'allstar', name: 'All-Star Pack', count: 1 },
          { type: 'coins' as const, amount: 10000 }
        ]
      };
    }
    if (lvl === 30) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'mvp', name: 'Finals MVP Pack', count: 1 },
          { type: 'coins' as const, amount: 15000 }
        ]
      };
    }
    if (lvl === 40) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'hof', name: 'HOF Pack', count: 1 },
          { type: 'coins' as const, amount: 20000 }
        ]
      };
    }
    if (lvl === 50) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'legendary_mvp', name: 'Legendary MVP Pack', count: 1 },
          { type: 'coins' as const, amount: 25000 }
        ]
      };
    }
    if (lvl === 60) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'hof', name: 'HOF Pack', count: 1 },
          { type: 'coins' as const, amount: 30000 }
        ]
      };
    }
    if (lvl === 70) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'hof', name: 'HOF Pack', count: 2 },
          { type: 'coins' as const, amount: 35000 }
        ]
      };
    }
    if (lvl === 80) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'legendary_mvp', name: 'Legendary MVP Pack', count: 1 },
          { type: 'coins' as const, amount: 40000 }
        ]
      };
    }
    if (lvl === 90) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'legendary_mvp', name: 'Legendary MVP Pack', count: 1 },
          { type: 'coins' as const, amount: 50000 }
        ]
      };
    }
    if (lvl === 100) {
      return {
        type: 'combo' as const,
        items: [
          { type: 'pack' as const, id: 'legendary_mvp', name: 'Legendary MVP Pack', count: 3 },
          { type: 'coins' as const, amount: 250000 }
        ]
      };
    }

    const rookieAndCounts: Record<number, number> = { 2: 1, 4: 1, 8: 1, 12: 2, 18: 1, 22: 2 };
    if (lvl in rookieAndCounts) {
      return { type: 'pack' as const, id: 'rookie', name: 'Rookie Pack', count: rookieAndCounts[lvl] };
    }

    const allStarAndCounts: Record<number, number> = { 6: 1, 10: 1, 14: 1, 24: 1, 28: 1, 32: 2, 38: 1, 44: 2, 62: 2 };
    if (lvl in allStarAndCounts) {
      return { type: 'pack' as const, id: 'allstar', name: 'All-Star Pack', count: allStarAndCounts[lvl] };
    }

    const mvpAndCounts: Record<number, number> = { 16: 1, 26: 1, 34: 1, 42: 1, 48: 1, 54: 2, 64: 1, 72: 1, 78: 2 };
    if (lvl in mvpAndCounts) {
      return { type: 'pack' as const, id: 'mvp', name: 'Finals MVP Pack', count: mvpAndCounts[lvl] };
    }

    const hofAndCounts: Record<number, number> = { 36: 1, 46: 1, 52: 1, 56: 1, 66: 1, 74: 2, 82: 2, 86: 2, 92: 2, 96: 3 };
    if (lvl in hofAndCounts) {
      return { type: 'pack' as const, id: 'hof', name: 'HOF Pack', count: hofAndCounts[lvl] };
    }

    const legendaryAndCounts: Record<number, number> = { 58: 1, 68: 1, 76: 1, 84: 1, 88: 2, 94: 2, 98: 2 };
    if (lvl in legendaryAndCounts) {
      return { type: 'pack' as const, id: 'legendary_mvp', name: 'Legendary MVP Pack', count: legendaryAndCounts[lvl] };
    }

    const coinsMap: Record<number, number> = {
      1: 5000, 3: 7500, 5: 10000, 7: 12500, 9: 15000, 11: 17500, 13: 20000, 15: 22500, 17: 25000, 19: 27500,
      21: 30000, 23: 32500, 25: 35000, 27: 37500, 29: 40000, 31: 42500, 33: 45000, 35: 47500, 37: 50000, 39: 52500,
      41: 55000, 43: 57500, 45: 60000, 47: 62500, 49: 65000, 51: 67500, 53: 70000, 55: 72500, 57: 75000, 59: 77500,
      61: 80000, 63: 82500, 65: 85000, 67: 87500, 69: 90000, 71: 92500, 73: 95000, 75: 100000, 77: 105000, 79: 110000,
      81: 115000, 83: 120000, 85: 125000, 87: 130000, 89: 135000, 91: 140000, 93: 145000, 95: 150000, 97: 160000, 99: 175000
    };

    return { type: 'coins' as const, amount: coinsMap[lvl] || 5000 };
  };

  const BATTLE_PASS_REWARDS = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 100; i++) {
      list.push({
        level: i,
        free: getFreeRewardForLevel(i),
        premium: getEliteRewardForLevel(i)
      });
    }
    return list;
  }, []);

  const [activeStage, setActiveStage] = useState<'rookie' | 'pro' | 'allstar' | 'superstar' | 'hof'>(() => {
    if (battlePassLevel <= 20) return 'rookie';
    if (battlePassLevel <= 40) return 'pro';
    if (battlePassLevel <= 60) return 'allstar';
    if (battlePassLevel <= 80) return 'superstar';
    return 'hof';
  });

  const filteredRewards = useMemo(() => {
    let start = 1;
    let end = 20;
    if (activeStage === 'pro') { start = 21; end = 40; }
    else if (activeStage === 'allstar') { start = 41; end = 60; }
    else if (activeStage === 'superstar') { start = 61; end = 80; }
    else if (activeStage === 'hof') { start = 81; end = 100; }
    return BATTLE_PASS_REWARDS.filter(r => r.level >= start && r.level <= end);
  }, [activeStage, BATTLE_PASS_REWARDS]);

  const progressPercentSegment = useMemo(() => {
    let start = 1;
    if (activeStage === 'pro') start = 21;
    else if (activeStage === 'allstar') start = 41;
    else if (activeStage === 'superstar') start = 61;
    else if (activeStage === 'hof') start = 81;
    
    const completedNodeCount = Math.max(0, Math.min(20, battlePassLevel - start + 1));
    return (completedNodeCount / 20) * 100;
  }, [activeStage, battlePassLevel]);

  const handleClaimBPReward = async (level: number, type: 'free' | 'premium') => {
    if (isSaving) return;
    const reward = (BATTLE_PASS_REWARDS.find(r => r.level === level) as any)[type];
    if (!reward) return;

    try {
      let newCoins = coins;
      let newCollection = { ...collection };
      let newPacks = [...inventoryPacks];

      const applyReward = (r: any) => {
        if (r.type === 'coins') {
          newCoins += r.amount;
        } else if (r.type === 'pack') {
          const packCount = r.count || 1;
          const existing = newPacks.find(p => p.type === r.id);
          if (existing) {
            newPacks = newPacks.map(p => p.type === r.id ? { ...p, count: p.count + packCount } : p);
          } else {
            newPacks.push({ id: r.id, type: r.id, name: r.name, count: packCount });
          }
        } else if (r.type === 'card') {
          newCollection[r.cardId] = (newCollection[r.cardId] || 0) + 1;
        } else if (r.type === 'combo') {
          r.items.forEach((subReward: any) => applyReward(subReward));
        }
      };

      applyReward(reward);

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

  const pendingFreeClaimsCount = useMemo(() => {
    return BATTLE_PASS_REWARDS.filter(r => battlePassLevel >= r.level && !claimedAchievements.includes(`bp_free_${r.level}`)).length;
  }, [battlePassLevel, claimedAchievements, BATTLE_PASS_REWARDS]);

  // UI Helpers for dual-path
  const getRewardIcon = (rewardItem: any) => {
    if (!rewardItem) return <Gift size={12} />;
    
    if (rewardItem.type === 'coins') {
      return <Coins size={12} className="text-yellow-500" />;
    }
    if (rewardItem.type === 'pack') {
      switch (rewardItem.id) {
        case 'rookie': return <Package size={12} className="text-orange-400" />;
        case 'allstar': return <Package size={12} className="text-blue-400" />;
        case 'mvp': return <Package size={12} className="text-amber-400 font-bold" />;
        case 'hof': return <Package size={12} className="text-purple-400 animate-pulse" />;
        case 'legendary_mvp': return <Package size={12} className="text-yellow-500 animate-pulse font-extrabold" />;
        default: return <Package size={12} className="text-zinc-400" />;
      }
    }
    if (rewardItem.type === 'card') {
      return <Star size={11} className="text-amber-400 fill-amber-400/20" />;
    }
    if (rewardItem.type === 'combo') {
      return <Gift size={12} className="text-amber-500 animate-pulse" />;
    }
    return <Gift size={12} />;
  };

  const getRewardLabel = (rewardItem: any) => {
    if (!rewardItem) return 'Reward';
    
    if (rewardItem.type === 'coins') {
      return `+${rewardItem.amount.toLocaleString()}`;
    }
    if (rewardItem.type === 'pack') {
      const name = rewardItem.name.replace(' Pack', '');
      const countLabel = (rewardItem.count && rewardItem.count > 1) ? `${rewardItem.count}x ` : '';
      return `${countLabel}${name}`;
    }
    if (rewardItem.type === 'card') {
      const nameParts = rewardItem.playerName.split(' ');
      if (nameParts.length > 1) {
        return nameParts[nameParts.length - 1]; // Just last name for layout space
      }
      return rewardItem.playerName;
    }
    if (rewardItem.type === 'combo') {
      const packItem = rewardItem.items.find((it: any) => it.type === 'pack');
      const coinsItem = rewardItem.items.find((it: any) => it.type === 'coins');
      
      let label = '';
      if (packItem) {
        const pName = packItem.name.replace(' Pack', '').replace('Legendary MVP', 'L.MVP');
        const pCount = packItem.count || 1;
        label += `${pCount > 1 ? `${pCount}x ` : ''}${pName}`;
      }
      if (coinsItem) {
        if (label) label += ' + ';
        label += `${(coinsItem.amount / 1000)}k`;
      }
      return label || 'Combo';
    }
    return 'Reward';
  };

  return (
    <div className="flex flex-col min-h-full bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black px-4 py-2.5 border-b border-zinc-900/60 flex items-center justify-between gap-2 h-11 shrink-0">
        <h1 className="text-xs font-black uppercase tracking-tighter italic leading-none flex items-center gap-1.5">
          <span className="w-0.5 h-1.5 rounded-full bg-amber-500" />
          Elite Pass
        </h1>

        <div className="flex items-center gap-2">
          {/* Coins Counter */}
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-950 border border-zinc-850/80 text-[9.5px] font-mono font-bold text-yellow-500">
            <span className="text-[9px]">🪙</span>
            <span>{coins.toLocaleString()}</span>
          </div>

          {/* HOF Achievements button */}
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 bg-zinc-950 border border-zinc-850/80 rounded hover:bg-zinc-900 transition-all text-left"
          >
            <Trophy size={8.5} className="text-amber-500 shrink-0" />
            <span className="text-[7.5px] font-black tracking-widest text-zinc-400">HOF {achievementsPercent}%</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 px-3 py-3 space-y-5 no-scrollbar pb-24 overflow-y-auto">
        <section className="space-y-6 max-w-5xl mx-auto">
          {/* BP Header / Progress with Cyberpunk Glassmorphism */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-850/80 bg-zinc-950 p-4 group transition-all duration-500 hover:border-amber-500/20 shadow-xl max-w-sm sm:max-w-xl mx-auto">
            {/* Dynamic Animated Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-650/5 opacity-35 group-hover:opacity-45 transition-opacity duration-700" />
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-[6.5px] font-black text-amber-400 uppercase tracking-widest inline-block leading-none">
                  Season 1: Rising Legends
                </div>
                <h3 className="text-sm font-black italic uppercase tracking-tight text-white leading-none">
                  Rewards <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Highway</span>
                </h3>
              </div>

              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800/85 px-2.5 py-1 rounded-lg">
                <span className="text-[7.5px] font-black text-zinc-550 uppercase tracking-widest leading-none">LEVEL</span>
                <span className="text-xs font-black italic text-amber-500 leading-none">{battlePassLevel}</span>
              </div>
            </div>
          </div>

          {/* Symmetrical Dual-Path Control Center (Banners Side-by-Side) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm sm:max-w-xl mx-auto">
            {/* Left Column: Free Path Unlock State */}
            <div className={`relative overflow-hidden rounded-xl border p-3 flex items-center justify-between gap-3 transition-all duration-300 ${
              !user 
                ? 'bg-gradient-to-r from-purple-950/30 to-black/80 border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.04)]' 
                : 'bg-zinc-950/40 border-zinc-900/60'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 border ${
                  !user 
                    ? 'bg-purple-500/10 border-purple-500/25 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.15)]' 
                    : 'bg-zinc-900 border-zinc-850 text-zinc-500'
                }`}>
                  <Sparkles size={11} className={!user ? 'animate-pulse' : ''} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500 leading-none">Free Road</h4>
                  <p className={`text-[9.5px] font-black uppercase mt-1 tracking-wide leading-none ${
                    !user ? 'text-purple-450' : 'text-zinc-300'
                  }`}>
                    {!user ? 'Guest Locked' : 'Unlocked & Active'}
                  </p>
                </div>
              </div>
              {!user && (
                <button 
                  onClick={login}
                  className="bg-purple-650 hover:bg-purple-600 text-white font-black uppercase tracking-widest text-[7.5px] px-3 py-1.5 rounded-md transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center gap-1"
                >
                  <Lock size={7} />
                  LOG IN
                </button>
              )}
            </div>

            {/* Right Column: Elite Track Upgrade State */}
            <div className={`relative overflow-hidden rounded-xl border p-3 flex items-center justify-between gap-3 transition-all duration-300 ${
              !isBattlePassPremium 
                ? 'bg-gradient-to-r from-amber-950/20 to-black/80 border-amber-500/35 shadow-[0_0_15px_rgba(245,158,11,0.03)]' 
                : 'bg-zinc-950/40 border-zinc-900/60'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 border ${
                  !isBattlePassPremium 
                    ? 'bg-amber-500/10 border-amber-500/25 text-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.1)]' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-450'
                }`}>
                  <Trophy size={11} className={!isBattlePassPremium ? 'animate-pulse' : ''} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[8.5px] font-black uppercase tracking-wider text-zinc-500 leading-none">Elite Road</h4>
                  <p className={`text-[9.5px] font-black uppercase mt-1 tracking-wide leading-none ${
                    !isBattlePassPremium ? 'text-amber-500' : 'text-amber-400'
                  }`}>
                    {!isBattlePassPremium ? 'Locked' : 'Premium Active'}
                  </p>
                </div>
              </div>
              {!isBattlePassPremium && (
                <button 
                  onClick={() => state.setCurrentView('shop')}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-450 hover:to-amber-550 text-black font-black uppercase tracking-widest text-[7.5px] px-3 py-1.5 rounded-md transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  UPGRADE
                </button>
              )}
            </div>
          </div>

          {/* Stage selectors for 100 level progression */}
          <div className="flex items-center justify-between gap-1 pb-1 max-w-sm sm:max-w-xl mx-auto px-1 overflow-x-auto no-scrollbar">
            {(['rookie', 'pro', 'allstar', 'superstar', 'hof'] as const).map((stage) => {
              const isActive = activeStage === stage;
              const label = stage === 'rookie' ? '1-20' 
                          : stage === 'pro' ? '21-40' 
                          : stage === 'allstar' ? '41-60' 
                          : stage === 'superstar' ? '61-80' 
                          : '81-100';
              const stageName = stage === 'rookie' ? 'Rookie'
                              : stage === 'pro' ? 'Pro'
                              : stage === 'allstar' ? 'All-Star'
                              : stage === 'superstar' ? 'Superstar'
                              : 'H.O.F';
              return (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  type="button"
                  className={`flex-1 min-w-[65px] py-2 rounded-xl border flex flex-col items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/10 font-black scale-105' 
                      : 'bg-zinc-950/60 border-zinc-900/60 text-zinc-500 hover:text-zinc-300 font-bold hover:bg-zinc-900/50'
                  }`}
                >
                  <span className="text-[6.5px] uppercase tracking-widest leading-none opacity-80">{stageName}</span>
                  <span className="text-[9px] mt-0.5 leading-none font-black italic">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Symmetrical Dual-Path Highway header labels (Free vs Elite) */}
          <div className="grid grid-cols-[1fr_36px_1fr] gap-1.5 items-center max-w-sm sm:max-w-xl mx-auto px-1.5">
            <div className={`text-right text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${!user ? 'text-purple-400' : 'text-zinc-400'}`}>
              FREE PATH {!user && '🔒'}
            </div>
            <div className="text-center text-[7.5px] font-black text-zinc-650 tracking-tighter">LVL</div>
            <div className="text-left text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-1">
              ELITE PATH <span className="text-[8px]">👑</span>
            </div>
          </div>

          {/* BP Rewards Symmetrical Stepper Road */}
          <div className="space-y-3 relative max-w-sm sm:max-w-xl mx-auto select-none mt-2">
            {/* Path connector line down the middle */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-[1px] w-[2px] bg-zinc-900/80 z-0" />
            <div 
              className="absolute top-0 left-1/2 -translate-x-[1px] w-[2px] bg-gradient-to-b from-amber-500/80 to-purple-650/80 z-0 transition-all duration-500"
              style={{ height: `${progressPercentSegment}%` }}
            />

            {filteredRewards.map((reward, index) => {
              const isFreeClaimed = claimedAchievements.includes(`bp_free_${reward.level}`);
              const isFreeUnlockedAtLevel = battlePassLevel >= reward.level;
              const isFreeUnlocked = !!user && isFreeUnlockedAtLevel;

              const isPremiumClaimed = claimedAchievements.includes(`bp_premium_${reward.level}`);
              const isPremiumUnlocked = battlePassLevel >= reward.level && isBattlePassPremium;

              // Dual-path styling definitions
              const freeCardStyle = isFreeClaimed
                ? 'bg-zinc-950/20 border-zinc-900/40 opacity-55 cursor-default'
                : !user && isFreeUnlockedAtLevel
                  ? 'bg-gradient-to-br from-purple-950/30 via-purple-900/10 to-zinc-900/60 border-purple-500/40 hover:border-purple-400 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.12)] active:scale-95'
                  : isFreeUnlocked
                    ? 'bg-zinc-900 border-zinc-700/80 hover:border-zinc-500 hover:bg-zinc-850 cursor-pointer shadow-[0_0_10px_rgba(255,255,255,0.02)] active:scale-95'
                    : 'bg-zinc-950/40 border-zinc-900/40 opacity-30 cursor-not-allowed';

              const freeIconStyle = isFreeClaimed
                ? 'border-zinc-900 text-zinc-500'
                : !user && isFreeUnlockedAtLevel
                  ? 'border-purple-500/30 text-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                  : isFreeUnlocked
                    ? 'border-zinc-850 text-white'
                    : 'border-zinc-900 text-zinc-700';

              const freeLabelStyle = !user && isFreeUnlockedAtLevel
                ? 'text-purple-400/90'
                : 'text-zinc-500';

              return (
                <div key={`reward-level-${reward.level}-${index}`} className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-2.5 min-h-[60px] sm:min-h-[68px]">
                  
                  {/* LEFT SIDE: FREE TRACK REWARD */}
                  <div className="flex-1 flex justify-end">
                    <button
                      disabled={isFreeClaimed || !isFreeUnlockedAtLevel || isSaving}
                      onClick={() => {
                        if (!user) {
                          login();
                        } else {
                          handleClaimBPReward(reward.level, 'free');
                        }
                      }}
                      className={`w-full max-w-[130px] sm:max-w-[170px] h-[52px] sm:h-[60px] rounded-lg border p-1.5 flex items-center gap-1.5 sm:gap-2.5 relative transition-all duration-300 text-left ${freeCardStyle}`}
                    >
                      {/* Reward Icon badge */}
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded bg-zinc-950 border flex items-center justify-center shrink-0 ${freeIconStyle}`}>
                        {getRewardIcon(reward.free)}
                      </div>

                      {/* Text and status */}
                      <div className="min-w-0 flex-1 leading-none">
                        <p className={`text-[6.5px] sm:text-[7px] font-black uppercase tracking-wider ${freeLabelStyle}`}>Free</p>
                        <p className={`text-[8.5px] sm:text-[9.5px] font-black tracking-tight truncate mt-0.5 ${
                          isFreeClaimed ? 'text-zinc-500' : 'text-white'
                        }`}>
                          {getRewardLabel(reward.free)}
                        </p>
                        
                        <div className="mt-1">
                          {isFreeClaimed ? (
                            <span className="text-[6px] sm:text-[6.5px] font-black text-zinc-650 tracking-wider uppercase flex items-center gap-0.5">
                              <Check size={6} strokeWidth={4} /> OWNED
                            </span>
                          ) : !user ? (
                            isFreeUnlockedAtLevel ? (
                              <span className="text-[6.2px] sm:text-[6.8px] font-sans font-black text-purple-400 tracking-wider uppercase flex items-center gap-0.5 animate-pulse">
                                <Lock size={6} /> REG. UNLOCK
                              </span>
                            ) : (
                              <span className="text-[6px] sm:text-[6.5px] font-black text-zinc-650 tracking-wider uppercase flex items-center gap-0.5">
                                <Lock size={6} /> LOCKED
                              </span>
                            )
                          ) : isFreeUnlocked ? (
                            <span className="text-[6px] sm:text-[6.5px] font-black text-amber-500 tracking-widest animate-pulse uppercase">
                              CLAIM
                            </span>
                          ) : (
                            <span className="text-[6px] sm:text-[6.5px] font-black text-zinc-650 tracking-wider uppercase flex items-center gap-0.5">
                              <Lock size={6} /> LOCKED
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* CENTER COLUMN: LEVEL NODE */}
                  <div className={`w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full border-2 flex flex-col items-center justify-center font-black italic text-[9.5px] sm:text-[10.5px] tracking-tighter shrink-0 z-10 shadow-lg shadow-black transition-all duration-500 ${
                    battlePassLevel >= reward.level 
                      ? 'border-amber-500 bg-black text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'border-zinc-900 bg-zinc-950 text-zinc-650'
                  }`}>
                    {reward.level}
                  </div>

                  {/* RIGHT SIDE: PREMIUM/ELITE TRACK REWARD */}
                  <div className="flex-1 flex justify-start">
                    <button
                      disabled={!isPremiumUnlocked || isPremiumClaimed || isSaving}
                      onClick={() => handleClaimBPReward(reward.level, 'premium')}
                      className={`w-full max-w-[130px] sm:max-w-[170px] h-[52px] sm:h-[60px] rounded-lg border p-1.5 flex items-center gap-1.5 sm:gap-2.5 relative overflow-hidden transition-all duration-300 text-left ${
                        isPremiumClaimed 
                          ? 'bg-zinc-950/20 border-zinc-900/40 opacity-55 cursor-default' 
                          : isPremiumUnlocked 
                            ? 'bg-gradient-to-br from-amber-500/10 to-zinc-900/80 border-amber-500/60 hover:border-amber-400 hover:from-amber-500/15 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.15)] active:scale-95' 
                            : !isBattlePassPremium && isFreeUnlocked
                              ? 'bg-zinc-950/80 border-zinc-900/80 cursor-pointer hover:border-amber-500/35 hover:bg-zinc-900 shadow-[0_0_6px_rgba(245,158,11,0.02)]'
                              : 'bg-zinc-950/40 border-zinc-900/40 opacity-30 cursor-not-allowed'
                      }`}
                      {...((!isBattlePassPremium && isFreeUnlocked) ? { onClick: () => state.setCurrentView('shop') } : {})}
                    >
                      {/* Premium Shimmer Shimmer effect if unlocked and can claim */}
                      {isPremiumUnlocked && !isPremiumClaimed && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/10 to-transparent -translate-x-full animate-shimmer" />
                      )}

                      {/* Reward Icon badge */}
                      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded bg-zinc-950 border flex items-center justify-center shrink-0 ${
                        isPremiumClaimed ? 'border-zinc-900 text-zinc-500' : 'border-amber-500/30 text-amber-400'
                      }`}>
                        {getRewardIcon(reward.premium)}
                      </div>

                      {/* Text and status */}
                      <div className="min-w-0 flex-1 leading-none">
                        <p className="text-[6.5px] sm:text-[7px] font-black uppercase text-amber-500 tracking-wider">Elite</p>
                        <p className={`text-[8.5px] sm:text-[9.5px] font-black tracking-tight truncate mt-0.5 ${
                          isPremiumClaimed ? 'text-zinc-500' : 'text-amber-400 font-bold'
                        }`}>
                          {getRewardLabel(reward.premium)}
                        </p>
                        
                        <div className="mt-1">
                          {isPremiumClaimed ? (
                            <span className="text-[6px] sm:text-[6.5px] font-black text-amber-500/50 tracking-wider uppercase flex items-center gap-0.5">
                              <Check size={6} strokeWidth={4} /> OWNED
                            </span>
                          ) : isPremiumUnlocked ? (
                            <span className="text-[6px] sm:text-[6.5px] font-black text-yellow-400 tracking-widest animate-pulse uppercase">
                              CLAIM
                            </span>
                          ) : !isBattlePassPremium && isFreeUnlocked ? (
                            <span className="text-[6px] sm:text-[6.5px] font-black text-purple-400 tracking-wider uppercase flex items-center gap-0.5">
                              <Lock size={6} /> UNLOCK
                            </span>
                          ) : (
                            <span className="text-[6px] sm:text-[6.5px] font-black text-zinc-650 tracking-wider uppercase flex items-center gap-0.5">
                              <Lock size={6} /> LOCKED
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </section>

        {/* Global Achievement Section */}
        <section className="mt-6 max-w-5xl mx-auto">
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
                  key={`${ach.id}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 rounded-2xl bg-zinc-900 border border-amber-500/30 flex justify-between items-center shadow-[0_0_20px_rgba(245,158,11,0.05)]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-black flex items-center justify-center animate-pulse">
                      <ach.icon size={20} />
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">{ach.category}</p>
                      <h3 className="text-sm font-black italic tracking-tighter uppercase leading-none mt-0.5">{ach.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {ach.rewardCoins > 0 && (
                          <span className="text-[10px] font-bold text-amber-505 font-mono">+{ach.rewardCoins.toLocaleString()} Coins</span>
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
                    className="bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors shadow-lg active:scale-95 disabled:opacity-50 min-w-[70px] flex items-center justify-center font-black"
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
              <div className="p-8 rounded-2xl bg-zinc-900/30 border border-zinc-880/50 border-dashed flex flex-col items-center justify-center text-center">
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
