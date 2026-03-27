import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS, Achievement } from '../constants/achievements';
import { ALL_CARDS } from '../data/cards';
import { Trophy, X, CheckCircle2, Lock, Medal, Star, Package, Gem, Shield, Search, Filter, LayoutGrid, ListFilter, Coins } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Category = 'all' | 'packs' | 'collection' | 'specials';
type StatusFilter = 'all' | 'completed' | 'pending';

const LEVEL_ICONS = {
  bronze: Shield,
  silver: Medal,
  gold: Trophy,
  diamond: Gem
};

const LEVEL_COLORS = {
  bronze: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  silver: 'text-zinc-300 bg-zinc-300/10 border-zinc-300/20',
  gold: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  diamond: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
};

export default function AchievementsModal({ isOpen, onClose }: AchievementsModalProps) {
  const state = useGame();
  const { unlockedAchievements } = state;
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(ach => {
      const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
      const matchesCategory = activeCategory === 'all' || ach.category === activeCategory;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'completed' && isUnlocked) || 
                           (statusFilter === 'pending' && !isUnlocked);
      const matchesSearch = ach.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           ach.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [activeCategory, statusFilter, searchQuery, unlockedAchievements, state]);

  const stats = useMemo(() => {
    const total = ACHIEVEMENTS.length;
    const unlocked = ACHIEVEMENTS.filter(ach => 
      unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS)
    ).length;
    return { total, unlocked, percent: Math.round((unlocked / total) * 100) };
  }, [unlockedAchievements, state]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800/50 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[85vh]"
          >
            {/* Header Section */}
            <div className="p-6 sm:p-8 border-b border-zinc-900 bg-zinc-900/20 shrink-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Trophy className="text-amber-500" size={24} />
                    </div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Achievements</h2>
                  </div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Track your NBA Opener legacy</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-2xl font-black italic text-white leading-none">{stats.unlocked} <span className="text-zinc-600 text-sm">/ {stats.total}</span></div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Total Unlocked</div>
                  </div>
                  <div className="w-16 h-16 relative flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-900" />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="28"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeDasharray={176}
                        initial={{ strokeDashoffset: 176 }}
                        animate={{ strokeDashoffset: 176 - (176 * stats.percent) / 100 }}
                        className="text-amber-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-xs font-black italic">{stats.percent}%</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation & Filters */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50">
                  {(['all', 'packs', 'collection', 'specials'] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeCategory === cat ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                    <input 
                      type="text"
                      placeholder="Search achievements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 no-scrollbar scroll-smooth">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAchievements.map((ach) => {
                  const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
                  const progress = ach.getProgress(state, ALL_CARDS);
                  const progressPercent = Math.round((progress.current / progress.total) * 100);
                  const LevelIcon = LEVEL_ICONS[ach.level];
                  
                  return (
                    <motion.div
                      layout
                      key={ach.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative p-5 rounded-2xl border transition-all duration-300 ${
                        isUnlocked 
                          ? 'bg-zinc-900/40 border-amber-500/20 shadow-xl' 
                          : 'bg-zinc-950 border-zinc-900/50'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Icon & Level */}
                        <div className="shrink-0 flex flex-col items-center gap-2">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            isUnlocked ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-700'
                          }`}>
                            <ach.icon size={24} />
                          </div>
                          <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border ${LEVEL_COLORS[ach.level]}`}>
                            {ach.level}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className={`font-black uppercase italic tracking-tight truncate ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                              {ach.title}
                            </h3>
                            {isUnlocked && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-zinc-500 font-medium leading-tight line-clamp-2 mb-4">
                            {ach.description}
                          </p>

                          {/* Progress Bar */}
                          {!isUnlocked && (
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-600">
                                <span>Progress</span>
                                <span>{progress.current} / {progress.total}</span>
                              </div>
                              <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progressPercent}%` }}
                                  className="h-full bg-zinc-700"
                                />
                              </div>
                            </div>
                          )}

                          {/* Reward */}
                          <div className="mt-4 flex items-center gap-3">
                            {ach.reward > 0 && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                <span className="text-[10px] font-black text-amber-500 italic">+{ach.reward}</span>
                                <Coins size={10} className="text-amber-500" />
                              </div>
                            )}
                            {ach.packReward && (
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                <span className="text-[10px] font-black text-zinc-400 italic">{ach.packReward.name}</span>
                                <Package size={10} className="text-zinc-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Level Indicator Icon in corner */}
                      <div className="absolute top-3 right-3 opacity-10 pointer-events-none">
                        <LevelIcon size={40} />
                      </div>

                      {/* Completed Overlay */}
                      {isUnlocked && (
                        <div className="absolute inset-0 bg-green-500/[0.02] rounded-2xl pointer-events-none" />
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {filteredAchievements.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                  <LayoutGrid size={48} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No achievements found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-900 bg-zinc-900/20 flex items-center justify-center gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <Medal size={14} className="text-zinc-600" />
                <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black">
                  NBA Opener Hall of Fame
                </span>
              </div>
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
              <span className="text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black">
                v1.1.0
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
