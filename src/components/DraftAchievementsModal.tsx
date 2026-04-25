import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS as ALL_ACHIEVEMENTS } from '../constants/achievements';
import { ALL_CARDS } from '../data/cards';
import { Trophy, X, Shield, Medal, Gem, Star, Package, Coins, Target, Users, Zap } from 'lucide-react';

interface DraftAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVEL_COLORS = {
  bronze: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  silver: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20',
  gold: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  diamond: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
};

export default function DraftAchievementsModal({ isOpen, onClose }: DraftAchievementsModalProps) {
  const state = useGame();
  const { unlockedAchievements } = state;

  const draftAchievements = useMemo(() => {
    return ALL_ACHIEVEMENTS.filter(ach => ach.category === 'drafting' || ach.category === 'tournaments');
  }, []);

  const stats = useMemo(() => {
    const unlocked = draftAchievements.filter(ach => unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS)).length;
    return { total: draftAchievements.length, unlocked, percent: Math.round((unlocked / draftAchievements.length) * 100) };
  }, [unlockedAchievements, state, draftAchievements]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col h-[70vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-900/50 bg-gradient-to-br from-zinc-900/40 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none">Draft Missions</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Exclusive rewards for HoopsDraft</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Progress Summary */}
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percent}%` }}
                    className="h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                  />
                </div>
                <span className="text-[10px] font-black italic text-amber-500">{stats.unlocked}/{stats.total} COMPLETED</span>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
              {draftAchievements.map((ach) => {
                const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
                const Icon = ach.icon || Zap;
                
                return (
                  <div 
                    key={ach.id}
                    className={`p-5 rounded-3xl border transition-all duration-300 flex items-center gap-5 ${
                      isUnlocked ? 'bg-zinc-900 border-amber-500/30' : 'bg-zinc-950 border-zinc-900 opacity-60'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                      isUnlocked ? 'bg-amber-500 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)]' : 'bg-zinc-900 text-zinc-700'
                    }`}>
                      <Icon size={28} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-black uppercase italic tracking-tight ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                          {ach.title}
                        </h3>
                        <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter border ${LEVEL_COLORS[ach.level as keyof typeof LEVEL_COLORS]}`}>
                          {ach.level}
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium leading-tight mb-3">
                        {ach.description}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {ach.rewardCoins > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-black/40 rounded-lg border border-zinc-800">
                             <span className="text-[9px] font-black text-amber-500">+{ach.rewardCoins.toLocaleString()}</span>
                             <Coins size={10} className="text-amber-500" />
                          </div>
                        )}
                        {ach.rewardPacks?.map((p, idx) => (
                          <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-black/40 rounded-lg border border-zinc-800">
                            <span className="text-[9px] font-black text-zinc-400">{p.name}</span>
                            <Package size={10} className="text-zinc-500" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {isUnlocked && (
                      <div className="bg-green-500/10 p-2 rounded-full">
                        <Star size={16} className="text-green-500 fill-green-500" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-900/20 border-t border-zinc-900 text-center">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-700">Champions are made in the draft</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
