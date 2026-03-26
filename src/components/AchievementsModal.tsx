import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS } from '../constants/achievements';
import { ALL_CARDS } from '../data/cards';
import { Trophy, X, CheckCircle2, Lock, Medal, Star, Package } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AchievementsModal({ isOpen, onClose }: AchievementsModalProps) {
  const state = useGame();
  const { unlockedAchievements } = state;

  const unlockedCount = ACHIEVEMENTS.filter(ach => 
    unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS)
  ).length;
  
  const totalCount = ACHIEVEMENTS.length;
  const completionPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
          >
            {/* Header with Progress */}
            <div className="p-6 sm:p-8 border-b border-zinc-900 bg-gradient-to-b from-zinc-900/50 to-transparent relative overflow-hidden shrink-0">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="text-amber-500" size={20} />
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Hall of Fame</h2>
                  </div>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Your Legacy in NBA Opener</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Progress Summary */}
              <div className="mt-8 flex items-center gap-6">
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      className="text-zinc-900"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="6"
                      strokeDasharray={226}
                      initial={{ strokeDashoffset: 226 }}
                      animate={{ strokeDashoffset: 226 - (226 * completionPercent) / 100 }}
                      className="text-amber-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black italic leading-none">{completionPercent}%</span>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Progress</span>
                    <span className="text-xs font-black italic text-amber-500">{unlockedCount} / {totalCount}</span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-600 mt-2 font-bold uppercase tracking-wider">
                    {completionPercent === 100 ? "Legendary Status Achieved" : "Keep collecting to reach 100%"}
                  </p>
                </div>
              </div>
            </div>

            {/* Achievements List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar bg-zinc-950">
              {ACHIEVEMENTS.map((ach, index) => {
                const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
                const Icon = ach.icon;
                
                return (
                  <motion.div 
                    key={ach.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`group relative p-4 rounded-2xl border transition-all duration-500 ${
                      isUnlocked 
                        ? 'bg-zinc-900/40 border-amber-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.2)]' 
                        : 'bg-zinc-950 border-zinc-900/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      {/* Icon Container */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isUnlocked 
                          ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : 'bg-zinc-900 text-zinc-700'
                      }`}>
                        <Icon size={28} strokeWidth={isUnlocked ? 2.5 : 2} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-black uppercase italic tracking-tight truncate ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                            {ach.title}
                          </h3>
                          {isUnlocked && <CheckCircle2 size={12} className="text-amber-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-zinc-500 font-medium leading-tight mt-1 line-clamp-2">
                          {ach.description}
                        </p>
                      </div>

                      {/* Status / Reward */}
                      <div className="text-right shrink-0">
                        {isUnlocked ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-amber-500 italic uppercase tracking-widest">Unlocked</span>
                            <div className="flex flex-col items-end gap-0.5 mt-1">
                              {ach.reward > 0 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-zinc-500">+{ach.reward}</span>
                                  <span className="text-[10px]">🪙</span>
                                </div>
                              )}
                              {ach.packReward && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[9px] font-bold text-amber-500/70">{ach.packReward.name}</span>
                                  <Package size={10} className="text-amber-500/70" />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end opacity-40">
                            <Lock size={14} className="text-zinc-700" />
                            <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-tighter mt-1">Locked</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Effect for Unlocked */}
                    {isUnlocked && (
                      <div className="absolute inset-0 rounded-2xl bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-900 bg-zinc-900/20 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                <Medal size={14} className="text-zinc-600" />
                <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black">
                  NBA Opener Achievements
                </span>
              </div>
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
              <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black">
                v1.0.4
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
