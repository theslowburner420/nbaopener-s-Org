import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
  const [easterEggType, setEasterEggType] = useState<'unlock' | 'reset' | 'catalunya'>('unlock');
  const [viewMode, setViewMode] = useState<'roster' | 'duplicates'>('roster');
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll using IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => prev + 24);
      }
    }, { threshold: 0.1 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, []);

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

    if (search.toLowerCase() === 'catalunya') {
      // Catalonia Mode: Reset Game & Turn Off Premium
      resetGame();
      setPremium(false);
      
      // Feedback
      setSearch('');
      setEasterEggType('catalunya');
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

  const renderGridItem = useCallback((card: Card, index: number) => {
    const quantity = collection[card.id] || 0;
    const isOwned = quantity > 0;
    return (
      <CardItem 
        key={`${card.id}-${card.number ?? index}-${index}`}
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

  const isDynastyHunter = unlockedAchievements.includes('dynasty-hunter');
  const isVintageCollector = unlockedAchievements.includes('vintage-collector');

  return (
    <div className={`flex flex-col min-h-full bg-black text-white transition-all duration-1000 ${isDynastyHunter ? 'animate-golden-aura' : ''}`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 backdrop-blur-xl px-3 border-b border-zinc-900/60 transition-colors duration-1000 ${isDynastyHunter ? 'bg-amber-950/20' : 'bg-black'} shrink-0 flex flex-col justify-center gap-2 py-2 sm:py-0 sm:flex-row sm:items-center sm:justify-between sm:h-14`}>
        
        {/* Row 1 / Left Side: Dual-mode Selector & Mobile HOF indicator */}
        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
          <div className="p-0.5 bg-zinc-950 border border-zinc-850/60 rounded-lg flex gap-0.5 shrink-0 shadow-inner">
            <button
              onClick={() => setViewMode('roster')}
              className={`px-3 py-1 rounded text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 ${
                viewMode === 'roster' ? 'bg-white text-black font-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Roster
            </button>
            <button
              onClick={() => setViewMode('duplicates')}
              className={`px-3 py-1 rounded text-[8px] sm:text-[8.5px] font-black uppercase tracking-wider transition-all duration-200 ${
                viewMode === 'duplicates' ? 'bg-white text-black font-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Duplicates
            </button>
          </div>

          {/* Compact HOF button for mobile ONLY */}
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="flex sm:hidden items-center gap-1.5 px-2.5 h-[26px] bg-zinc-900/30 border border-zinc-850/80 rounded-lg hover:border-zinc-750 hover:text-white active:scale-95 transition-all text-left"
          >
            <Trophy size={10} className="text-amber-500 shrink-0" />
            <span className="text-[8px] font-black tracking-widest text-zinc-400">HOF {progressPercent}%</span>
          </button>
        </div>

        {/* Row 2 / Right Side: Search and Filter (with HOF button shown only on desktop) */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto sm:flex-1 sm:justify-end min-w-0">
          <div className="relative flex-1 sm:max-w-[180px] h-8">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={11} />
            <input
              type="text"
              placeholder="SEARCH ROSTER..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full bg-zinc-900/55 border border-zinc-850/80 rounded-lg pl-8 pr-7 text-[8px] sm:text-[8.5px] font-black uppercase tracking-widest focus:border-zinc-700/80 focus:outline-none focus:bg-zinc-950 placeholder:text-zinc-650 text-white min-w-0 transition-all opacity-95 focus:opacity-100"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white p-1"
              >
                <X size={9} />
              </button>
            )}
          </div>

          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 relative transition-all duration-200 ${
              isFilterOpen || activeFilter !== 'All' || teamFilter !== 'All' || seriesFilter !== 'All'
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-zinc-900/30 text-zinc-405 border-zinc-850/80 hover:border-zinc-700 hover:text-white'
            }`}
          >
            <Filter size={10} strokeWidth={2.5} />
            {(activeFilter !== 'All' || teamFilter !== 'All' || seriesFilter !== 'All') && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-purple-500 rounded-full border border-black z-10 animate-pulse" />
            )}
          </button>

          {/* HOF Achievements button (hidden on mobile, shown on sm+) */}
          <button 
            onClick={() => setIsAchievementsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 h-8 bg-zinc-900/30 border border-zinc-850/80 rounded-lg hover:border-zinc-750 hover:text-white active:scale-95 transition-all text-left"
          >
            <Trophy size={11} className="text-amber-500 shrink-0" />
            <span className="text-[8px] font-black tracking-widest text-zinc-400">HOF {progressPercent}%</span>
          </button>
        </div>

        {/* Filter Dropdown Modal (Styled with carbon texture and high-fidelity scrolling container) */}
        <AnimatePresence>
          {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
                onClick={() => setIsFilterOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[60vh] flex flex-col"
              >
                  <div className="p-3 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50 shrink-0">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Filter & Sort</span>
                    <button onClick={() => setIsFilterOpen(false)} className="p-1 text-zinc-500 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="overflow-y-auto p-4 space-y-5 custom-scrollbar bg-zinc-900 flex-1">
                    {/* Sort Section */}
                    <div>
                      <h3 className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-amber-500 rounded-full" />
                        Sort Options
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {(['Number', 'OVR', 'Name', 'Team'] as SortType[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => setSortBy(s)}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                              sortBy === s 
                                ? 'bg-white text-black border-white shadow-lg font-black' 
                                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:border-zinc-650'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                        <button
                          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                          className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:border-zinc-650"
                        >
                          {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                        </button>
                      </div>
                    </div>
                    {/* Rarity Section */}
                    <div>
                      <h3 className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-amber-500 rounded-full" />
                        Card Rarity
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {filters.map((f) => (
                          <button
                            key={f}
                            onClick={() => {
                              setActiveFilter(f);
                              setIsFilterOpen(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                              activeFilter === f 
                                ? 'bg-white text-black border-white shadow-lg font-black' 
                                : 'bg-zinc-800/50 text-zinc-450 border-zinc-700/50 hover:border-zinc-650'
                            }`}
                          >
                            {f === 'allstar' ? 'All-Star' : f === 'roty' ? 'ROTY' : f === 'dpoy' ? 'DPOY' : f.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Category Section */}
                    <div>
                      <h3 className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-amber-500 rounded-full" />
                        Card Category
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {['All', 'Base', 'Award', 'Moment', 'Duo', 'Coach', 'Dynasty', 'X-Factor', 'NBA Record', 'Rookie', 'All-Star MVP', 'Finals MVP'].map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setCategoryFilter(c);
                              setIsFilterOpen(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                              categoryFilter === c 
                                ? 'bg-white text-black border-white shadow-lg font-black' 
                                : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/50 hover:border-zinc-650'
                            }`}
                          >
                            {c === 'Duo' ? 'Dynamic Duo' : c}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Team Section */}
                    <div>
                      <h3 className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-amber-500 rounded-full" />
                        Franchise Team
                      </h3>
                      <div className="grid grid-cols-2 gap-1.5">
                        {teams.map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setTeamFilter(t);
                              setIsFilterOpen(false);
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border text-left truncate ${
                              teamFilter === t 
                                ? 'bg-white text-black border-white shadow-lg font-black' 
                                : 'bg-zinc-800/50 text-zinc-450 border-zinc-700/50 hover:border-zinc-650'
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
                        <h3 className="text-[8.5px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-amber-500 rounded-full" />
                          Card Series
                        </h3>
                        <div className="flex flex-wrap gap-1.5">
                          {series.map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                setSeriesFilter(s);
                                setIsFilterOpen(false);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                                seriesFilter === s 
                                  ? 'bg-white text-black border-white shadow-lg font-black' 
                                  : 'bg-zinc-800/50 text-zinc-455 border-zinc-700/50 hover:border-zinc-650'
                              }`}
                            >
                              {s === 'All' ? 'All Series' : s}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-zinc-950 border-t border-zinc-800/60 flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setActiveFilter('All');
                        setCategoryFilter('All');
                        setTeamFilter('All');
                        setSeriesFilter('All');
                      }}
                      className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-800 rounded-lg"
                    >
                      Reset
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="flex-1 py-2 text-[9px] font-black uppercase tracking-widest bg-white text-black rounded-lg font-black shadow-lg"
                    >
                      Apply Filters
                    </button>
                  </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* Row 2: Active Filters Bar (Horizontal Scrollable, no-wrap, extremely compact, only visible if filtering) */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-950/80 border-b border-zinc-900/50 overflow-x-auto no-scrollbar shrink-0 select-none pb-1.5 whitespace-nowrap">
          {activeFilter !== 'All' && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800/60 shrink-0">
              <span className="text-[7px] font-black uppercase text-zinc-400">Rar: {activeFilter}</span>
              <button onClick={() => setActiveFilter('All')} className="text-zinc-500 hover:text-white shrink-0"><X size={7} /></button>
            </div>
          )}
          {categoryFilter !== 'All' && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800/60 shrink-0">
              <span className="text-[7px] font-black uppercase text-zinc-400">Cat: {categoryFilter}</span>
              <button onClick={() => setCategoryFilter('All')} className="text-zinc-500 hover:text-white shrink-0"><X size={7} /></button>
            </div>
          )}
          {teamFilter !== 'All' && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800/60 shrink-0">
              <span className="text-[7px] font-black uppercase text-zinc-400">{teamFilter}</span>
              <button onClick={() => setTeamFilter('All')} className="text-zinc-550 hover:text-white shrink-0"><X size={7} /></button>
            </div>
          )}
          {seriesFilter !== 'All' && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800/60 shrink-0">
              <span className="text-[7px] font-black uppercase text-zinc-400">{seriesFilter}</span>
              <button onClick={() => setSeriesFilter('All')} className="text-zinc-550 hover:text-white shrink-0"><X size={7} /></button>
            </div>
          )}
          {search !== '' && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800/60 shrink-0">
              <span className="text-[7px] font-black uppercase text-zinc-400">Query: {search}</span>
              <button onClick={() => setSearch('')} className="text-zinc-555 hover:text-white shrink-0"><X size={7} /></button>
            </div>
          )}
          <button 
            onClick={clearFilters}
            className="text-[7px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 shrink-0 ml-1.5"
          >
            Clear
          </button>
        </div>
      )}

      {/* Grid View */}
      <div className="flex-1 px-4">
        <div className="collection-grid">
          {(filteredCards || []).slice(0, visibleCount).map(renderGridItem)}
        </div>
        
        {/* Load More Indicator */}
        {visibleCount < filteredCards.length && (
          <div ref={loaderRef} className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="w-6 h-6 border-2 border-amber-500/10 border-t-amber-500 rounded-full animate-spin" />
            <span className="text-[8px] font-black tracking-[0.2em] text-zinc-600 uppercase animate-pulse">LOAD MORE PLAYERS</span>
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
                {easterEggType === 'unlock' ? 'Developer Mode' : easterEggType === 'catalunya' ? 'Catalonia Mode' : 'System Reset'}
              </span>
              <span className="text-xs font-black italic tracking-tighter uppercase">
                {easterEggType === 'unlock' ? 'Everything Unlocked!' : easterEggType === 'catalunya' ? 'JOC REINICIAT & PREMIUM OFF!' : 'Game Restored to Base!'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
