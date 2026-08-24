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
import { isScreamEditionActive, isScreamFilterPermanentlyAvailable, setScreamDevOverride } from '../constants/screamEdition';

type FilterType = Rarity | 'All';
type SortType = 'Number' | 'OVR' | 'Name' | 'Team';

export default function CollectionView() {
  const { collection, customCards = [], unlockedAchievements, addCoins, addToCollection, setPremium, resetGame, updateGameStateAsync } = useGame();
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
  const [filterTab, setFilterTab] = useState<'sort' | 'rarity' | 'category' | 'team'>('sort');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
      setScreamDevOverride(true);
      
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
      setScreamDevOverride(false);
      
      // Feedback
      setSearch('');
      setEasterEggType('reset');
      setShowEasterEgg(true);
      setTimeout(() => setShowEasterEgg(false), 3000);
      return;
    }

    if (search.toLowerCase() === 'catalunya') {
      // Catalonia Mode: Reset Game & Turn Off Premium + Wipe Shop Purchases
      resetGame();
      setPremium(false);
      setScreamDevOverride(false);
      updateGameStateAsync({ hasLifetimeNoAds: false, isPremium: false });
      
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
  }, [search, collection, addCoins, setPremium, addToCollection, resetGame, updateGameStateAsync]);

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

  const isScreamActive = isScreamEditionActive();
  const hasOwnedScreamCards = useMemo(() => {
    return Object.keys(collection).some(id => id.startsWith('scream-') && (collection[id] || 0) > 0);
  }, [collection]);
  const isScreamFilterAvailable = isScreamFilterPermanentlyAvailable(hasOwnedScreamCards);

  const allAvailableCards = useMemo(() => {
    const map = new Map<string, Card>();
    ALL_CARDS.forEach(c => {
      const isScream = c.series === 'Scream Edition' || c.category === 'Scream Edition' || c.id.startsWith('scream-');
      if (isScream && !isScreamActive && !collection[c.id]) return;
      map.set(c.id, c);
    });
    (customCards || []).forEach(c => {
      const isScream = c.series === 'Scream Edition' || c.category === 'Scream Edition' || c.id.startsWith('scream-');
      if (isScream && !isScreamActive && !collection[c.id]) return;
      map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [customCards, isScreamActive, collection]);

  const totalCards = allAvailableCards.length;
  const collectedCount = useMemo(() => Object.keys(collection).filter(id => collection[id] > 0).length, [collection]);
  const progressPercent = Math.round((collectedCount / totalCards) * 100);

  const teams = useMemo(() => {
    const list = NBA_TEAMS.map(t => t.name).sort();
    return ['All', ...list];
  }, []);

  const series = useMemo(() => {
    const uniqueSeries = Array.from(new Set(allAvailableCards.filter(c => c.series).map(c => c.series as string))).sort();
    return ['All', ...uniqueSeries];
  }, [allAvailableCards]);

  const categoryOptions = useMemo(() => {
    const base = ['All', 'MVP', 'Finals MVP', 'DPOY', 'ROY', '6MOTY', 'MIP', 'SBC Reward', 'Base', 'Award', 'Moment', 'Duo', 'Coach', 'Dynasty', 'X-Factor', 'NBA Record', 'All-Star MVP', 'Scoring Champion', 'Hall of Fame'];
    if (isScreamFilterAvailable) {
      base.splice(1, 0, 'Scream Edition');
    }
    return base;
  }, [isScreamFilterAvailable]);

  const filteredCards = useMemo(() => {
    const searchLower = debouncedSearch.toLowerCase();
    
    const filtered = allAvailableCards.filter(card => {
      // Duplicates mode filter
      if (viewMode === 'duplicates' && (collection[card.id] || 0) <= 1) return false;

      const matchesRarity = activeFilter === 'All' || card.rarity === activeFilter;
      
      let matchesCategory = categoryFilter === 'All';
      if (!matchesCategory) {
        if (categoryFilter === 'SBC Reward') {
          matchesCategory = !!(card.isSpecialSBC || card.category === 'SBC Reward' || card.subtitle?.toLowerCase().includes('sbc') || card.rarity.includes('_sbc'));
        } else if (categoryFilter === 'Scream Edition') {
          matchesCategory = card.category === 'Scream Edition' || card.series === 'Scream Edition' || card.id.startsWith('scream-');
        } else {
          matchesCategory = card.category === categoryFilter;
        }
      }

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
          comparison = (a.number || 0) - (b.number || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allAvailableCards, activeFilter, categoryFilter, teamFilter, seriesFilter, debouncedSearch, sortBy, sortOrder, viewMode, collection]);

  const filters: FilterType[] = ['All', 'mvp' as any, 'fmvp' as any, 'dpoy' as any, 'roty' as any, '6moy' as any, 'mip' as any, 'future_star' as any, 'legend_sbc' as any, 'icon_sbc' as any, 'moments_sbc' as any, 'bench', 'starter', 'allstar', 'franchise', 'legend', 'coach', 'record'];

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
      <header className={`sticky top-0 z-30 backdrop-blur-md px-3 border-b border-white/10 transition-colors duration-500 ${isDynastyHunter ? 'bg-amber-950/30' : 'bg-black/90'} shrink-0 flex flex-col w-full`}>
        
        {/* Main Control Bar */}
        <div className="flex items-center justify-between gap-2 h-11 w-full">
          {/* Left Side: Micro Roster / Duplicates Toggle & Collection Counter */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Micro Roster / Duplicates Toggle (Text illumination only - no background or border contour) */}
            <div className="h-6 px-2 bg-zinc-950 border border-white/10 rounded-full flex items-center gap-2 shrink-0">
              <button
                onClick={() => setViewMode('roster')}
                className={`text-[8px] uppercase tracking-wider transition-all ${
                  viewMode === 'roster' 
                    ? 'text-amber-400 font-black drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' 
                    : 'text-zinc-500 hover:text-zinc-300 font-bold'
                }`}
              >
                ROSTER
              </button>
              <span className="text-zinc-800 text-[8px] font-bold">|</span>
              <button
                onClick={() => setViewMode('duplicates')}
                className={`text-[8px] uppercase tracking-wider transition-all ${
                  viewMode === 'duplicates' 
                    ? 'text-amber-400 font-black drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]' 
                    : 'text-zinc-500 hover:text-zinc-300 font-bold'
                }`}
              >
                DUPLICATES
              </button>
            </div>

            {/* Collection Counter (x/762) */}
            <div className="h-6 flex items-center gap-1 px-2 py-0.5 bg-zinc-900 border border-white/10 rounded-full text-[8.5px] font-bold text-zinc-400 shrink-0">
              <span className="text-amber-400 font-bold">{collectedCount}</span>
              <span className="text-zinc-600">/</span>
              <span>{totalCards}</span>
            </div>
          </div>

          {/* Right Side: Search Icon Toggle & Filter Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Search Toggle Icon */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 relative transition-all ${
                isSearchOpen || search 
                  ? 'bg-amber-400/20 text-amber-400 border-amber-400/60' 
                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:border-zinc-500 hover:text-white'
              }`}
              title="Search Cards"
            >
              <Search size={11} />
              {search && !isSearchOpen && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full" />}
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-7 h-7 rounded-full border flex items-center justify-center shrink-0 relative transition-all ${
                isFilterOpen || activeFilter !== 'All' || categoryFilter !== 'All' || teamFilter !== 'All' || seriesFilter !== 'All'
                  ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md shadow-amber-400/20'
                  : 'bg-zinc-900 text-zinc-400 border-white/10 hover:border-zinc-500 hover:text-white'
              }`}
              title="Filter & Sort"
            >
              <Filter size={11} strokeWidth={2} />
              {(activeFilter !== 'All' || categoryFilter !== 'All' || teamFilter !== 'All' || seriesFilter !== 'All') && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-black z-10" />
              )}
            </button>
          </div>
        </div>

        {/* Sub-Row: Expandable Search Bar (Unfolds directly underneath the roster/duplicates bar) */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden pb-2"
            >
              <div className="relative flex items-center w-full h-8 bg-zinc-900 border border-amber-500/40 rounded-full px-3 shadow-lg shadow-amber-500/5">
                <Search size={12} className="text-amber-400 shrink-0 mr-2" />
                <input
                  type="text"
                  autoFocus
                  placeholder="SEARCH CARDS BY NAME, TEAM, OVR..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-white placeholder:text-zinc-500 focus:outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="p-1 text-zinc-400 hover:text-white shrink-0 mr-1"
                  >
                    <X size={10} />
                  </button>
                )}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 text-zinc-500 hover:text-zinc-300 text-[8px] font-bold uppercase tracking-wider border-l border-zinc-800 pl-2 ml-1 shrink-0"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Optimized Filter & Sort Modal */}
      <AnimatePresence>
        {isFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsFilterOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="fixed inset-x-3 top-14 sm:inset-auto sm:top-14 sm:right-4 sm:w-96 max-h-[82vh] z-50 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-3 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-900/80 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-white">Filter & Sort</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {filteredCards.length} CARDS
                    </span>
                  </div>
                  <button onClick={() => setIsFilterOpen(false)} className="p-1 text-zinc-400 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {/* Filter Navigation Tabs */}
                <div className="flex border-b border-zinc-800/80 bg-zinc-950 shrink-0 px-2 pt-2 gap-1 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setFilterTab('sort')}
                    className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-t-lg transition-all border-t border-x ${
                      filterTab === 'sort' 
                        ? 'bg-zinc-900 text-amber-400 border-zinc-800 font-bold' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    SORT
                  </button>
                  <button
                    onClick={() => setFilterTab('rarity')}
                    className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-t-lg transition-all border-t border-x ${
                      filterTab === 'rarity' 
                        ? 'bg-zinc-900 text-amber-400 border-zinc-800 font-bold' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    RARITY {activeFilter !== 'All' && '●'}
                  </button>
                  <button
                    onClick={() => setFilterTab('category')}
                    className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-t-lg transition-all border-t border-x ${
                      filterTab === 'category' 
                        ? 'bg-zinc-900 text-amber-400 border-zinc-800 font-bold' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    CATEGORY {categoryFilter !== 'All' && '●'}
                  </button>
                  <button
                    onClick={() => setFilterTab('team')}
                    className={`px-3 py-1.5 text-[8.5px] font-black uppercase tracking-wider rounded-t-lg transition-all border-t border-x ${
                      filterTab === 'team' 
                        ? 'bg-zinc-900 text-amber-400 border-zinc-800 font-bold' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-300'
                    }`}
                  >
                    TEAMS {teamFilter !== 'All' && '●'}
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="overflow-y-auto p-3.5 space-y-4 custom-scrollbar bg-zinc-900 flex-1 min-h-[220px]">
                  {/* SORT TAB */}
                  {filterTab === 'sort' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Order By</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['Number', 'OVR', 'Name', 'Team'] as SortType[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => setSortBy(s)}
                              className={`py-2 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border text-center ${
                                sortBy === s 
                                  ? 'bg-white text-black border-white shadow' 
                                  : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Direction</h4>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => setSortOrder('asc')}
                            className={`py-2 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border text-center ${
                              sortOrder === 'asc' 
                                ? 'bg-white text-black border-white shadow' 
                                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                            }`}
                          >
                            ↑ Ascending
                          </button>
                          <button
                            onClick={() => setSortOrder('desc')}
                            className={`py-2 px-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border text-center ${
                              sortOrder === 'desc' 
                                ? 'bg-white text-black border-white shadow' 
                                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                            }`}
                          >
                            ↓ Descending
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RARITY TAB */}
                  {filterTab === 'rarity' && (
                    <div>
                      <h4 className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Select Card Rarity</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {filters.map((f) => (
                          <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`py-2 px-2 rounded-lg text-[8.5px] font-bold uppercase tracking-wider transition-all border text-center truncate ${
                              activeFilter === f 
                                ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow' 
                                : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:border-zinc-600'
                            }`}
                          >
                            {f === 'allstar' ? 'All-Star' : f === 'roty' ? 'ROTY' : f === 'dpoy' ? 'DPOY' : f.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CATEGORY TAB */}
                  {filterTab === 'category' && (
                    <div>
                      <h4 className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Select Card Category</h4>
                      <div className="grid grid-cols-2 gap-1.5">
                        {categoryOptions.map((c) => (
                          <button
                            key={c}
                            onClick={() => setCategoryFilter(c)}
                            className={`py-2 px-2.5 rounded-lg text-[8.5px] font-bold uppercase tracking-wider transition-all border text-center truncate ${
                              categoryFilter === c 
                                ? (c === 'Scream Edition' ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white border-orange-400 font-extrabold shadow-[0_0_12px_rgba(249,115,22,0.7)]' : 'bg-amber-400 text-black border-amber-400 font-extrabold shadow')
                                : (c === 'Scream Edition' ? 'bg-orange-950/40 text-orange-300 border-orange-500/40 hover:border-orange-400' : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:border-zinc-600')
                            }`}
                          >
                            {c === 'Scream Edition' ? '🎃 Scream Edition' : c === 'Duo' ? 'Dynamic Duo' : c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TEAMS TAB */}
                  {filterTab === 'team' && (
                    <div>
                      <h4 className="text-[8px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Select NBA Franchise</h4>
                      <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {teams.map((t) => (
                          <button
                            key={t}
                            onClick={() => setTeamFilter(t)}
                            className={`py-1.5 px-2 rounded-lg text-[8.5px] font-bold uppercase tracking-wider transition-all border text-left truncate ${
                              teamFilter === t 
                                ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow' 
                                : 'bg-zinc-800/60 text-zinc-300 border-zinc-700/50 hover:border-zinc-600'
                            }`}
                          >
                            {t === 'All' ? 'ALL TEAMS' : t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setActiveFilter('All');
                      setCategoryFilter('All');
                      setTeamFilter('All');
                      setSeriesFilter('All');
                      setSearch('');
                    }}
                    className="flex-1 py-2 text-[8.5px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors border border-zinc-800 hover:border-zinc-700 rounded-xl"
                  >
                    RESET ALL
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-2 py-2 px-3 text-[8.5px] font-black uppercase tracking-widest bg-amber-400 text-black rounded-xl font-extrabold shadow-lg shadow-amber-400/20 hover:bg-amber-300 transition-colors"
                  >
                    APPLY ({filteredCards.length})
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

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
                {easterEggType === 'unlock' ? 'Everything Unlocked!' : easterEggType === 'catalunya' ? 'GAME RESET & SHOP PURCHASES WIPED!' : 'Game Restored to Base!'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
