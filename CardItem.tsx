import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS as ALL_ACHIEVEMENTS } from '../constants/achievements';
import { ALL_CARDS } from '../data/cards';
import { Trophy, X, CheckCircle2, Lock, Medal, Star, Package, Gem, Shield, Search, Filter, LayoutGrid, ListFilter, Coins } from 'lucide-react';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Category = 'all' | 'packs' | 'collection' | 'specials' | 'drafting' | 'tournaments' | 'matches';
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
  const { unlockedAchievements, claimedAchievements } = state;
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Performance Optimization: Only calculate achievements when the modal is open
  const filteredAchievements = useMemo(() => {
    if (!isOpen) return [];
    
    return ALL_ACHIEVEMENTS.filter(ach => {
      const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);

      const matchesCategory = activeCategory === 'all' || ach.category === activeCategory;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'completed' && isUnlocked) || 
                           (statusFilter === 'pending' && !isUnlocked);
      const matchesSearch = ach.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           ach.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [isOpen, activeCategory, statusFilter, searchQuery, unlockedAchievements, state]);

  const stats = useMemo(() => {
    if (!isOpen) return { total: ALL_ACHIEVEMENTS.length, unlocked: 0, percent: 0 };
    
    const total = ALL_ACHIEVEMENTS.length;
    const unlocked = ALL_ACHIEVEMENTS.filter(ach => {
      return unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
    }).length;
    return { total, unlocked, percent: Math.round((unlocked / total) * 100) };
  }, [isOpen, unlockedAchievements, state]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800/50 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] max-h-[900px]"
          >
            {/* Header Section */}
            <div className="p-4 sm:p-8 border-b border-zinc-900 bg-zinc-900/20 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center justify-between w-full sm:w-auto">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg">
                      <Trophy className="text-amber-500" size={18} sm:size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-3xl font-black uppercase italic tracking-tighter">Achievements</h2>
                      <p className="hidden sm:block text-[8px] sm:text-xs text-zinc-500 font-bold uppercase tracking-widest">Track your Hoops Collector legacy</p>
                    </div>
                  </div>
                  <button 
                    onClick={onClose}
                    className="sm:hidden w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                  <div className="text-left sm:text-right">
                    <div className="text-lg sm:text-2xl font-black italic text-white leading-none">{stats.unlocked} <span className="text-zinc-600 text-xs sm:text-sm">/ {stats.total}</span></div>
                    <div className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5 sm:mt-1">Total Unlocked</div>
                  </div>
                  <div className="w-12 h-12 sm:w-16 sm:h-16 relative flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-900 sm:hidden" />
                      <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-zinc-900 hidden sm:block" />
                      
                      {/* Mobile Circle */}
                      <motion.circle
                        cx="24"
                        cy="24"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={126}
                        initial={{ strokeDashoffset: 126 }}
                        animate={{ strokeDashoffset: 126 - (126 * stats.percent) / 100 }}
                        className="text-amber-500 sm:hidden"
                        strokeLinecap="round"
                      />
                      
                      {/* Desktop Circle */}
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
                        className="text-amber-500 hidden sm:block"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-[10px] sm:text-xs font-black italic">{stats.percent}%</span>
                  </div>
                  <button 
                    onClick={onClose}
                    className="hidden sm:flex w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Navigation & Filters */}
              <div className="mt-4 sm:mt-8 flex flex-col gap-3">
                <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/50 overflow-x-auto no-scrollbar">
                  {(['all', 'packs', 'collection', 'specials', 'drafting', 'tournaments', 'matches'] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex-none px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[8px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeCategory === cat ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
                    <input 
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl pl-8 pr-3 py-1.5 sm:py-2 text-[10px] sm:text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-2 py-1.5 sm:py-2 text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-zinc-400 focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="completed">Done</option>
                    <option value="pending">Wait</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar scroll-smooth">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {filteredAchievements.map((ach) => {
                    const isUnlocked = unlockedAchievements.includes(ach.id) || ach.requirement(state, ALL_CARDS);
                    const progress = ach.getProgress(state, ALL_CARDS);
                    const progressPercent = Math.round((progress.current / progress.total) * 100);
                    const level = ach.level;
                    const LevelIcon = LEVEL_ICONS[level as keyof typeof LEVEL_ICONS];
                  
                    return (
                      <motion.div
                        layout
                        key={ach.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                          isUnlocked 
                            ? 'bg-zinc-900/40 border-amber-500/20 shadow-xl' 
                            : 'bg-zinc-950 border-zinc-900/50'
                        }`}
                      >
                        <div className="flex gap-3 sm:gap-4">
                          {/* Icon & Level */}
                          <div className="shrink-0 flex flex-col items-center gap-1.5 sm:gap-2">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${
                              isUnlocked ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-700'
                            }`}>
                              <ach.icon size={20} sm:size={24} />
                            </div>
                            <div className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-tighter border ${LEVEL_COLORS[level as keyof typeof LEVEL_COLORS]}`}>
                              {level}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className={`text-xs sm:text-sm font-black uppercase italic tracking-tight truncate ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                                {ach.title}
                              </h3>
                              {isUnlocked && <CheckCircle2 size={14} sm:size={16} className="text-green-500 shrink-0" />}
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-zinc-500 font-medium leading-tight line-clamp-2 mb-3 sm:mb-4">
                              {ach.description}
                            </p>

                            {/* Progress Bar */}
                            {!isUnlocked && (
                              <div className="space-y-1 sm:space-y-1.5">
                                <div className="flex justify-between text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-zinc-600">
                                  <span>Progress</span>
                                  <span>{progress.current} / {progress.total}</span>
                                </div>
                                <div className="h-1 sm:h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    className="h-full bg-zinc-700"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Reward */}
                            <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3">
                              {ach.rewardCoins > 0 && (
                                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                  <span className="text-[8px] sm:text-[10px] font-black text-amber-500 italic">+{ach.rewardCoins}</span>
                                  <Coins size={8} sm:size={10} className="text-amber-500" />
                                </div>
                              )}
                              {ach.rewardPacks && ach.rewardPacks.map((p, pIdx) => (
                                <div key={pIdx} className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-zinc-900/50 rounded-lg border border-zinc-800/50">
                                  <span className="text-[8px] sm:text-[10px] font-black text-zinc-400 italic truncate max-w-[60px] sm:max-w-none">{p.name} {p.count && p.count > 1 ? `x${p.count}` : ''}</span>
                                  <Package size={8} sm:size={10} className="text-zinc-500" />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                      {/* Level Indicator Icon in corner */}
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-10 pointer-events-none">
                        <LevelIcon size={32} sm:size={40} />
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
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">No achievements found</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-6 border-t border-zinc-900 bg-zinc-900/20 flex items-center justify-center gap-3 sm:gap-4 shrink-0">
              <div className="flex items-center gap-2">
                <Medal size={12} sm:size={14} className="text-zinc-600" />
                <span className="text-[8px] sm:text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black">
                  Hoops Collector Hall of Fame
                </span>
              </div>
              <div className="w-1 h-1 bg-zinc-800 rounded-full" />
              <span className="text-[8px] sm:text-[9px] text-zinc-600 uppercase tracking-[0.2em] font-black">
                v1.1.0
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
