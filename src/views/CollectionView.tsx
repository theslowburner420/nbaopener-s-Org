import React, { useState, useMemo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { NBA_TEAMS } from '../data/nbaTeams';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Rarity } from '../types';
import { Search, LayoutGrid, Filter, X, ChevronDown, Trophy } from 'lucide-react';
import CardDetailModal from '../components/CardDetailModal';
import CardItem from '../components/CardItem';
import AchievementsModal from '../components/AchievementsModal';

type FilterType = Rarity | 'All';
type SortType = 'Number' | 'OVR' | 'Name' | 'Team';

export default function CollectionView() {
  const { collection, unlockedAchievements, addCoins, addToCollection, setPremium, resetGame } = useGame();
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [teamFilter, setTeamFilter] = useState<string>('All');
  const [seriesFilter, setSeriesFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortType>('Number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [easterEggType, setEasterEggType] = useState<'unlock' | 'reset'>('unlock');
  const [viewMode, setViewMode] = useState<'roster' | 'duplicates'>('roster');

  // Reset pagination when filters change
  React.useEffect(() => {
    setVisibleCount(24);
  }, [activeFilter, categoryFilter, teamFilter, seriesFilter, debouncedSearch, sortBy, sortOrder, viewMode]);

  // Debounce search input
  React.useEffect(() => {
    if (search.toLowerCase() === 'nbachampion' || search.toLowerCase() === 'camatxo') {
      // Secret Code Activated!
      addCoins(999999999);
      setPremium(true);
      
      // Add all cards to collection (deduplicated)
      const allCardIds = ALL_CARDS.map(c => c.id);
      addToCollection(allCardIds);
      
      // Feedback
      setSearch('');
      setEasterEggType('unlock');
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 3000);
      return;
    }

    if (search.toLowerCase() === 'freshstart') {
      // Base Version Secret Code!
      resetGame();
      
      // Feedback
      setSearch('');
      setEasterEggType('reset');
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 3000);
      return;
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, collection, addCoins, setPremium, addToCollection, resetGame]);

  const handleCardClick = useCallback((card: Card) => {
    setSelectedCard(card);
  }, []);

  const renderGridItem = useCallback((card: Card) => {
    const quantity = collection[card.id] || 0;
    const isOwned = quantity > 0;
    return (
      <CardItem 
        key={`${card.id}-${card.number}`}
        card={card} 
        isOwned={isOwned} 
        mode="mini"
        onClick={handleCardClick}
        quantity={quantity}
      />
    );
  }, [collection, handleCardClick]);

  const totalCards = ALL_CARDS.length;
  const collectedCount = useMemo(() => Object.keys(collection).filter(id => collection[id] > 0).length, [collection]);
  const progressPercent = Math.round((collectedCount / totalCards) * 100);

  const teams = useMemo(() => {
    const list = NBA_TEAMS.map(t => t.name).sort();
    return ['All', ...list];
  }, []);

  const series = useMemo(() => {
    const uniqueSeries = Array.from(new Set(ALL_CARDS.filter(c => c.series).map(c => c.series as string))).sort();
    return ['All', ...uniqueSeries];
  }, []);

  const filteredCards = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    
    const filtered = ALL_CARDS.filter(card => {
      // Duplicates mode filter
      if (viewMode === 'duplicates' && (collection[card.id] || 0) <= 1) return false;

      const matchesRarity = activeFilter === 'All' || card.rarity === activeFilter;
      const matchesCategory = categoryFilter === 'All' || card.category === categoryFilter;
      const matchesTeam = teamFilter === 'All' || card.team === teamFilter;
      const matchesSeries = seriesFilter === 'All' || card.series === seriesFilter;
      const matchesSearch = !debouncedSearch || 
                           card.name.toLowerCase().includes(searchLower) || 
                           card.team.toLowerCase().includes(searchLower);
      return matchesRarity && matchesCategory && matchesTeam && matchesSeries && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'OVR':
          comparison = b.stats.ovr - a.stats.ovr;
          break;
        case 'Name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'Team':
          comparison = a.team.localeCompare(b.team);
          break;
        case 'Number':
        default:
          comparison = a.number - b.number;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [activeFilter, categoryFilter, teamFilter, seriesFilter, debouncedSearch, sortBy, sortOrder, viewMode, collection]);

  const filters: FilterType[] = ['All', 'bench', 'starter', 'allstar', 'franchise', 'legend', 'roty', 'coach', 'dpoy', 'record', 'rookie', 'rising_star'];

  const hasActiveFilters = activeFilter !== 'All' || categoryFilter !== 'All' || teamFilter !== 'All' || seriesFilter !== 'All' || search !== '';

  const clearFilters = () => {
    setActiveFilter('All');
    setCategoryFilter('All');
    setTeamFilter('All');
    setSeriesFilter('All');
    setSearch('');
  };

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
      if (visibleCount < filteredCards.length) {
        setVisibleCount(prev => prev + 24);
      }
    }
  }, [visibleCount, filteredCards.length]);

  const isDynastyHunter = unlockedAchievements.includes('dynasty-hunter');
  const isVintageCollector = unlockedAchievements.includes('vintage-collector');

  return (
    <div className={`flex flex-col h-full bg-black text-white overflow-hidden transition-all duration-1000 ${isDynastyHunter ? 'animate-golden-aura' : ''}`}>
      {/* Header */}
      <header className={`collection-header sticky top-0 z-30 backdrop-blur-xl px-4 pt-3 pb-2 border-b border-zinc-800/50 transition-colors duration-1000 ${isDynastyHunter ? 'bg-amber-950/20' : 'bg-black/60'}`}>
        <div className="flex justify-between items-end mb-3">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`w-1 h-2 rounded-full transition-colors ${isDynastyHunter ? 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.8)]' : 'bg-amber-500'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">Player Registry</span>
              </div>
              <h1 className="text-lg font-black uppercase tracking-tighter italic leading-none flex items-center gap-2">
                {viewMode === 'roster' ? 'My Roster' : 'Duplicates'}
                {isVintageCollector && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[7px] font-black uppercase tracking-widest text-amber-500 italic">
                    History
                  </span>
                )}
              </h1>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-zinc-900/80 rounded-full p-1 border border-zinc-800 self-center">
              <button
                onClick={() => setViewMode('roster')}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'roster' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                }`}
              >
                Roster
              </button>
              <button
                onClick={() => setViewMode('duplicates')}
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'duplicates' ? 'bg-amber-500 text-black shadow-lg' : 'text-zinc-500 hover:text-white'
                }`}
              >
                Duplicates
              </button>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button 
              onClick={() => setIsAchievementsOpen(true)}
              className="group flex items-center gap-1.5 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-1.5">
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/10 text-amber-500">
                  <Trophy size={8} />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[7px] font-black uppercase tracking-widest text-zinc-500">HOF</span>
                  <span className="text-[9px] font-black italic text-white">{progressPercent}%</span>
                </div>
              </div>
            </button>

            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-baseline gap-1">
                <span className={`text-base font-black italic transition-colors ${isDynastyHunter ? 'text-amber-400' : 'text-white'}`}>{collectedCount}</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">/ {totalCards}</span>
              </div>
              <div className="w-16 h-1 bg-zinc-900 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={`h-full shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-all duration-1000 ${isDynastyHunter ? 'bg-gradient-to-r from-amber-600 via-white to-amber-600' : 'bg-gradient-to-r from-amber-500 to-white'}`} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Compact Search & Filter Bar */}
        <div className="flex gap-2 items-center relative">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              isFilterOpen || activeFilter !== 'All' || teamFilter !== 'All' || seriesFilter !== 'All'
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <Filter size={18} strokeWidth={2.5} />
            {(activeFilter !== 'All' || teamFilter !== 'All' || seriesFilter !== 'All') && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 rounded-full border-2 border-black flex items-center justify-center shadow-lg">
                <span className="text-[10px] font-black text-white leading-none">
                  {(activeFilter !== 'All' ? 1 : 0) + (teamFilter !== 'All' ? 1 : 0) + (seriesFilter !== 'All' ? 1 : 0)}
                </span>
              </span>
            )}
          </button>

          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search roster..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-10 text-sm focus:ring-1 focus:ring-white/20 focus:bg-zinc-900 transition-all outline-none placeholder:text-zinc-600"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Active Filters Bar */}
          {hasActiveFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="flex flex-wrap gap-2 mt-3 overflow-hidden"
            >
              {activeFilter !== 'All' && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">Rarity: {activeFilter}</span>
                  <button onClick={() => setActiveFilter('All')} className="text-zinc-500 hover:text-white"><X size={10} /></button>
                </div>
              )}
              {categoryFilter !== 'All' && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">Category: {categoryFilter}</span>
                  <button onClick={() => setCategoryFilter('All')} className="text-zinc-500 hover:text-white"><X size={10} /></button>
                </div>
              )}
              {teamFilter !== 'All' && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">{teamFilter}</span>
                  <button onClick={() => setTeamFilter('All')} className="text-zinc-500 hover:text-white"><X size={10} /></button>
                </div>
              )}
              {seriesFilter !== 'All' && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">{seriesFilter}</span>
                  <button onClick={() => setSeriesFilter('All')} className="text-zinc-500 hover:text-white"><X size={10} /></button>
                </div>
              )}
              {search !== '' && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 rounded-lg border border-zinc-700">
                  <span className="text-[9px] font-bold uppercase text-zinc-400">Search: {search}</span>
                  <button onClick={() => setSearch('')} className="text-zinc-500 hover:text-white"><X size={10} /></button>
                </div>
              )}
              <button 
                onClick={clearFilters}
                className="text-[9px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 ml-auto self-center"
              >
                Clear All
              </button>
            </motion.div>
          )}

          {/* Filter Dropdown */}
          <AnimatePresence>
            {isFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
                  onClick={() => setIsFilterOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col"
                >
                    <div className="p-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Filter & Sort</span>
                      <button onClick={() => setIsFilterOpen(false)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                        <X size={16} />
                      </button>
                    </div>

                    <div className="overflow-y-auto p-4 space-y-6 custom-scrollbar bg-zinc-900">
                      {/* Category Section */}
                      <div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-500 rounded-full" />
                          Category
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {['All', 'Base', 'Award', 'Moment', 'Duo', 'Coach', 'Dynasty', 'X-Factor', 'NBA Record', 'Rookie', 'All-Star MVP', 'Finals MVP'].map((c) => (
                            <button
                              key={c}
                              onClick={() => {
                                setCategoryFilter(c);
                                setIsFilterOpen(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                categoryFilter === c 
                                  ? 'bg-white text-black border-white shadow-lg' 
                                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                              }`}
                            >
                              {c === 'Duo' ? 'Dynamic Duo' : c}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sort Section */}
                      <div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-500 rounded-full" />
                          Sort By
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {(['Number', 'OVR', 'Name', 'Team'] as SortType[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => setSortBy(s)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                sortBy === s 
                                  ? 'bg-white text-black border-white shadow-lg' 
                                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                          <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          >
                            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                          </button>
                        </div>
                      </div>

                      {/* Rarity Section */}
                    <div>
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                        <div className="w-1 h-1 bg-amber-500 rounded-full" />
                        Rarity
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {filters.map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setActiveFilter(f);
                              setIsFilterOpen(false);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                              activeFilter === f 
                                ? 'bg-white text-black border-white shadow-lg' 
                                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                            }`}
                          >
                            {f === 'allstar' ? 'All-Star' : f === 'roty' ? 'ROTY' : f === 'dpoy' ? 'DPOY' : f}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Team Section */}
                    <div>
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                        <div className="w-1 h-1 bg-amber-500 rounded-full" />
                        Team
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {teams.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setTeamFilter(t);
                              setIsFilterOpen(false);
                            }}
                            className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border text-left truncate ${
                              teamFilter === t 
                                ? 'bg-white text-black border-white shadow-lg' 
                                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                            }`}
                          >
                            {t === 'All' ? 'All Teams' : t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Series Section */}
                    {series.length > 1 && (
                      <div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                          <div className="w-1 h-1 bg-amber-500 rounded-full" />
                          Series
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {series.map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setSeriesFilter(s);
                                setIsFilterOpen(false);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                seriesFilter === s 
                                  ? 'bg-white text-black border-white shadow-lg' 
                                  : 'bg-zinc-800/50 text-zinc-400 border-zinc-700 hover:border-zinc-600'
                              }`}
                            >
                              {s === 'All' ? 'All Series' : s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
                    <button
                      onClick={() => {
                        setActiveFilter('All');
                        setCategoryFilter('All');
                        setTeamFilter('All');
                        setSeriesFilter('All');
                      }}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 rounded-lg"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest bg-white text-black rounded-lg font-bold"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Grid View */}
      <div className="flex-1 overflow-y-auto no-scrollbar" onScroll={handleScroll}>
        <div className="collection-grid">
          {(filteredCards || []).slice(0, visibleCount).map(renderGridItem)}
        </div>
        
        {/* Load More Indicator */}
        {visibleCount < filteredCards.length && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          </div>
        )}
        
        {/* Empty State */}
        {filteredCards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Search size={48} strokeWidth={1} className="mb-4 opacity-20" />
            <p className="text-sm font-medium uppercase tracking-widest">No players found</p>
          </div>
        )}

        {/* Padding for the bottom nav */}
        <div className="h-24" />
      </div>

      <CardDetailModal 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
      />

      <AchievementsModal 
        isOpen={isAchievementsOpen} 
        onClose={() => setIsAchievementsOpen(false)} 
      />

      {/* Easter Egg Feedback */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] bg-amber-500 text-black px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center gap-3 border-2 border-white/20"
          >
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <Trophy size={18} className="text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-0.5">
                {easterEggType === 'unlock' ? 'Developer Mode' : 'System Reset'}
              </span>
              <span className="text-xs font-black italic tracking-tighter uppercase">
                {easterEggType === 'unlock' ? 'Everything Unlocked!' : 'Game Restored to Base!'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
