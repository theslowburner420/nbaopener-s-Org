import React, { useState, useMemo, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, Trophy, Sparkles, Clock, 
  Search, X, ChevronRight, ChevronUp, ChevronDown, Check, Trash2, ArrowRight, ArrowLeft, RefreshCw, Layers, Zap, RotateCcw, Filter, Shield, Eye, CheckCircle2, XCircle, AlertCircle, Info, Lock, ShieldCheck
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { SBC_CHALLENGES } from '../data/sbcChallenges';
import { sbcService } from '../services/sbcService';
import { Card, SbcChallenge, SbcRequirement } from '../types';
import CardItem from '../components/CardItem';
import SBCCard from '../components/SBCCard';
import confetti from 'canvas-confetti';

interface DraftSlot {
  id: string;
  label: string;
  position: string | null;
  card: Card | null;
}

// Requirement Helper Text Generator (English)
const getRequirementDescription = (req: SbcRequirement) => {
  switch (req.type) {
    case 'TOTAL_CARDS':
      return { title: 'Card Count', text: `Submit exactly ${req.value} duplicate cards.` };
    case 'MIN_OVR':
      return { title: 'Min Card Rating', text: `All cards must be at least ${req.value} OVR.` };
    case 'TEAM_OVR_MIN':
      return { title: 'Min Squad Rating', text: `Squad average rating must be ${req.value}+ OVR.` };
    case 'MIN_RARITY':
      return { title: 'Min Rarity Tier', text: `All cards must be ${String(req.value).toUpperCase()} tier or higher.` };
    case 'EXACT_RARITY':
      return { title: 'Required Rarity', text: `Include ${req.count ?? 1}x ${String(req.value).toUpperCase()} tier card(s).` };
    case 'POSITION':
      return { title: 'Required Position', text: `Include ${req.count ?? 1}x card(s) in position ${req.value}.` };
    case 'UNIQUE_PLAYERS':
      return { title: 'Unique Players', text: 'All submitted players must be unique (no duplicate names).' };
    case 'SAME_TEAM_MIN':
      return { title: 'Same NBA Team', text: `Include at least ${req.value} players from the same NBA team.` };
    case 'SAME_CONF_MIN':
      return { title: 'Same Conference', text: `Include at least ${req.value} players from the same conference.` };
    case 'MAX_TEAMS':
      return { title: 'Team Limit', text: `Maximum ${req.value} different NBA teams represented.` };
    default:
      return { title: 'Special Requirement', text: `${req.type}: ${req.value}` };
  }
};

// Requirement Bullet Badge Component
const RequirementBullet: React.FC<{ 
  req: SbcRequirement; 
  fulfilled: boolean; 
}> = ({ req, fulfilled }) => {
  const getReqText = () => {
    switch (req.type) {
      case 'MIN_RARITY': return `MIN: ${req.value?.toUpperCase() || ''}`;
      case 'EXACT_RARITY': return `${req.count ?? req.value ?? 1}x ${req.value?.toUpperCase() || ''}`;
      case 'POSITION': return `${req.count ?? req.value ?? 1}x ${req.value}`;
      case 'MIN_OVR': return `MIN OVR: ${req.value}`;
      case 'TOTAL_CARDS': return `CARDS: ${req.value}`;
      case 'UNIQUE_PLAYERS': return `UNIQUE PLAYERS`;
      case 'TEAM_OVR_MIN': return `TEAM: ${req.value}+ OVR`;
      case 'SAME_TEAM_MIN': return `SAME TEAM: ${req.value}+`;
      case 'SAME_CONF_MIN': return `CONF: ${req.value}+`;
      case 'MAX_TEAMS': return `MAX TEAMS: ${req.value}`;
      default: return String(req.type);
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0 select-none bg-zinc-950/90 px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
      <span className={`w-2 h-2 rounded-full transition-all duration-300 ${
        fulfilled ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-zinc-700'
      }`} />
      <span className={`text-[8.5px] font-black uppercase tracking-wider ${
        fulfilled ? 'text-emerald-400' : 'text-zinc-400'
      }`}>
        {getReqText()}
      </span>
    </div>
  );
};

// Slot Component
const Slot = memo<{ 
  slot: DraftSlot; 
  mini?: boolean; 
  onClick: () => void; 
  onRemove?: () => void;
  disabled?: boolean; 
  isSelected?: boolean;
}>(({ slot, mini, onClick, onRemove, disabled, isSelected }) => {
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setScreenSize('mobile');
      else if (w < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardWidth = useMemo(() => {
    if (mini) {
      if (screenSize === 'mobile') return 80;
      if (screenSize === 'tablet') return 95;
      return 105;
    } else {
      if (screenSize === 'mobile') return 105;
      if (screenSize === 'tablet') return 140;
      return 175;
    }
  }, [mini, screenSize]);

  return (
    <div 
      className={`relative group transition-all duration-300 w-full h-full aspect-[2.5/3.5] ${disabled ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''} ${isSelected ? 'scale-105 z-50' : ''}`}
    >
      {slot.card ? (
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          className="h-full w-full cursor-pointer relative"
          onClick={onClick}
        >
          <CardItem 
            card={slot.card} 
            isOwned={true} 
            width={cardWidth} 
            mode={mini ? 'mini' : 'large'}
          />

          {/* Quick Remove Button */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 p-1.5 rounded-full z-40 shadow-xl text-white transition-all scale-90 hover:scale-110 cursor-pointer"
              title="Remove Card"
            >
              <X size={10} strokeWidth={3} />
            </button>
          )}
        </motion.div>
      ) : (
        <button 
          onClick={onClick}
          disabled={disabled}
          className="h-full w-full bg-zinc-900/40 border-2 border-dashed border-zinc-800/80 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-amber-500/60 hover:bg-zinc-900/80 transition-all relative overflow-hidden text-left cursor-pointer group"
        >
          {/* Ghost Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-50" />
          
          <div className={`rounded-full bg-zinc-900/90 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner mx-auto ${mini ? 'w-7 h-7' : 'w-10 h-10'}`}>
            <Zap size={mini ? 14 : 20} className={mini ? '' : 'fill-current opacity-20'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-black text-white/20 ${mini ? 'text-xs' : 'text-xl'}`}>+</span>
            </div>
          </div>

          <div className="text-center z-10 px-1">
            <span className={`block font-black uppercase tracking-wider text-amber-500/90 group-hover:text-amber-400 ${mini ? 'text-[7px]' : 'text-[10px]'}`}>
              {slot.label}
            </span>
            <span className={`block font-extrabold uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 ${mini ? 'text-[5.5px]' : 'text-[7.5px]'}`}>
              DUPLICATE
            </span>
          </div>
        </button>
      )}
    </div>
  );
});

export default function SbcView() {
  const { collection, customCards, updateGameStateAsync, completedSbcs = [], setCurrentView } = useGame();
  
  const [selectedChallenge, setSelectedChallenge] = useState<SbcChallenge | null>(null);
  const [starters, setStarters] = useState<DraftSlot[]>([]);
  const [bench, setBench] = useState<DraftSlot[]>([]);
  const [isBenchOpen, setIsBenchOpen] = useState(false);
  
  // Requirements Dropdown & Target Reward Card Preview Modal States
  const [isReqDropdownOpen, setIsReqDropdownOpen] = useState(false);
  const [isPreviewRewardOpen, setIsPreviewRewardOpen] = useState(false);

  // Selector Drawer / Modal
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  // Submission & Reveal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardReveal, setRewardReveal] = useState<Card | null>(null);
  
  // Filters & Search for Challenges and Duplicate Selector
  const [filterCategory, setFilterCategory] = useState<'all' | 'rookie_series' | 'fan_favourites' | 'hof_legends' | 'franchise_icons' | 'clutch_moments' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [sortDuplicatesBy, setSortDuplicatesBy] = useState<'OVR' | 'Name' | 'Count'>('OVR');

  // Initialize Slots when Challenge is picked
  useEffect(() => {
    if (!selectedChallenge) {
      setStarters([]);
      setBench([]);
      setIsReqDropdownOpen(false);
      setIsPreviewRewardOpen(false);
      return;
    }

    const totalReq = selectedChallenge.cardsRequired || 5;
    const starterCount = Math.min(5, totalReq);
    const benchCount = Math.max(0, totalReq - 5);

    const defaultStarterPositions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const newStarters: DraftSlot[] = Array.from({ length: starterCount }).map((_, i) => ({
      id: `starter-${i}`,
      label: selectedChallenge.slotPositions?.[i] || defaultStarterPositions[i] || `POS ${i+1}`,
      position: defaultStarterPositions[i] || null,
      card: null
    }));

    const newBench: DraftSlot[] = Array.from({ length: benchCount }).map((_, i) => ({
      id: `bench-${i}`,
      label: `BN ${i + 1}`,
      position: null,
      card: null
    }));

    setStarters(newStarters);
    setBench(newBench);
    setIsBenchOpen(false);
    setIsReqDropdownOpen(false);
  }, [selectedChallenge]);

  // Generate target reward card object for preview
  const previewRewardCard = useMemo(() => {
    if (!selectedChallenge) return null;
    return sbcService.generateRewardCard(
      selectedChallenge.reward.playerName,
      selectedChallenge.reward.rarity,
      selectedChallenge.reward.ovr,
      [...ALL_CARDS, ...customCards]
    );
  }, [selectedChallenge, customCards]);

  // Available Duplicates Pool (STRICT GUARANTEE: collection[id] > 1 ONLY)
  const duplicates = useMemo(() => {
    const allAvailable = [...ALL_CARDS, ...customCards];
    return sbcService.getDuplicates(collection, allAvailable);
  }, [collection, customCards]);

  // Filtered Duplicates for the Active Slot
  const filteredDuplicates = useMemo(() => {
    const squadCardCounts: Record<string, number> = {};
    [...starters, ...bench].forEach(s => {
      if (s.card) {
        squadCardCounts[s.card.id] = (squadCardCounts[s.card.id] || 0) + 1;
      }
    });

    const filtered = duplicates.filter(card => {
      const totalOwned = collection[card.id] || 0;
      
      // ABSOLUTE RULE: Must have > 1 owned copy (so 1 copy stays in collection, extra copies are duplicates)
      if (totalOwned <= 1) return false;

      const usedInSquad = squadCardCounts[card.id] || 0;
      const availableDuplicates = totalOwned - 1 - usedInSquad;

      // If all duplicate copies are already placed in other slots, hide it from current slot picker
      if (availableDuplicates <= 0) return false;

      const matchSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPos = posFilter === 'ALL' || card.position === posFilter;
      const matchRarity = rarityFilter === 'ALL' || card.rarity === rarityFilter;
      return matchSearch && matchPos && matchRarity;
    });

    return [...filtered].sort((a, b) => {
      if (sortDuplicatesBy === 'OVR') {
        return b.stats.ovr - a.stats.ovr;
      }
      if (sortDuplicatesBy === 'Name') {
        return a.name.localeCompare(b.name);
      }
      if (sortDuplicatesBy === 'Count') {
        const countA = (collection[a.id] || 1) - 1;
        const countB = (collection[b.id] || 1) - 1;
        return countB - countA;
      }
      return 0;
    });
  }, [duplicates, collection, starters, bench, searchTerm, posFilter, rarityFilter, sortDuplicatesBy]);

  // Validation
  const allSquadCards = useMemo(() => {
    return [...starters, ...bench].map(s => s.card).filter(Boolean) as Card[];
  }, [starters, bench]);

  const validation = useMemo(() => {
    if (!selectedChallenge) return { allFulfilled: false, details: [] };
    return sbcService.checkRequirements(allSquadCards, selectedChallenge.requirements);
  }, [allSquadCards, selectedChallenge]);

  const fulfilledCount = useMemo(() => {
    return validation.details.filter(d => d.fulfilled).length;
  }, [validation]);

  const totalCount = useMemo(() => {
    return selectedChallenge?.requirements.length || 0;
  }, [selectedChallenge]);

  const teamOVR = useMemo(() => {
    if (allSquadCards.length === 0) return 0;
    const total = allSquadCards.reduce((sum, c) => sum + c.stats.ovr, 0);
    return Math.round(total / allSquadCards.length);
  }, [allSquadCards]);

  // Handle Card Placement
  const handleSlotClick = (slotId: string) => {
    setActiveSlotId(slotId);
    setIsSelectorOpen(true);
  };

  const handleSelectDuplicateCard = (card: Card) => {
    if (!activeSlotId) return;

    setStarters(prev => prev.map(s => s.id === activeSlotId ? { ...s, card } : s));
    setBench(prev => prev.map(b => b.id === activeSlotId ? { ...b, card } : b));

    setIsSelectorOpen(false);
    setActiveSlotId(null);
  };

  const handleRemoveSlotCard = (slotId: string) => {
    setStarters(prev => prev.map(s => s.id === slotId ? { ...s, card: null } : s));
    setBench(prev => prev.map(b => b.id === slotId ? { ...b, card: null } : b));
  };

  const handleClearAllSlots = () => {
    setStarters(prev => prev.map(s => ({ ...s, card: null })));
    setBench(prev => prev.map(b => ({ ...b, card: null })));
  };

  // Submit Squad (STRICT: Deducts 1 duplicate copy per used card, NEVER deletes sole remaining copy)
  const handleSubmitSbc = async () => {
    if (!selectedChallenge || !validation.allFulfilled || isSubmitting) return;
    setIsSubmitting(true);

    const usedCards = allSquadCards;
    const newCollection = { ...collection };

    // Deduct exactly 1 duplicate per submitted card
    usedCards.forEach(card => {
      if (newCollection[card.id] > 1) {
        newCollection[card.id] -= 1;
      }
    });

    const rewardCard = sbcService.generateRewardCard(
      selectedChallenge.reward.playerName,
      selectedChallenge.reward.rarity,
      selectedChallenge.reward.ovr,
      [...ALL_CARDS, ...customCards]
    );

    newCollection[rewardCard.id] = (newCollection[rewardCard.id] || 0) + 1;
    const newCompleted = [...completedSbcs, selectedChallenge.id];

    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      await updateGameStateAsync({
        collection: newCollection,
        completedSbcs: newCompleted,
        customCards: [...customCards, rewardCard]
      });

      setRewardReveal(rewardCard);

      confetti({
        particleCount: 140,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ffffff', '#22c55e']
      });

    } catch (err) {
      console.error('SBC submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredChallenges = useMemo(() => {
    return SBC_CHALLENGES.filter(c => {
      const isCompleted = completedSbcs.includes(c.id);
      if (filterCategory === 'completed') return isCompleted;
      if (isCompleted) return false;
      if (filterCategory === 'all') return true;
      return c.category === filterCategory;
    });
  }, [completedSbcs, filterCategory]);

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col select-none overflow-hidden font-sans relative">
      
      {/* 1. CHALLENGES SELECTOR VIEW (WHEN NO ACTIVE CHALLENGE) */}
      {!selectedChallenge ? (
        <div className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
          
          {/* Header Bar */}
          <header className="sticky top-0 z-30 bg-zinc-900/95 backdrop-blur-3xl border-b border-white/5 py-2.5 px-4 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <Puzzle size={16} className="text-amber-500 shrink-0" />
              <h1 className="text-sm font-black italic tracking-tight text-white uppercase">
                SBC <span className="text-amber-500">CHALLENGES</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-full border border-white/5">
                Completed: <span className="text-amber-400 font-bold">{completedSbcs.length}</span>/{SBC_CHALLENGES.length}
              </span>

              <button
                onClick={() => setCurrentView('home')}
                className="p-1.5 bg-zinc-900 border border-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Back to Home"
              >
                <ArrowLeft size={14} />
              </button>
            </div>
          </header>

          {/* Minimalist Category Filter Bar */}
          <div className="px-3 py-2 border-b border-white/5 bg-zinc-950/80 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 min-w-max bg-zinc-900/60 p-1 rounded-xl border border-white/5">
              {[
                { id: 'all', label: 'All' },
                { id: 'rookie_series', label: 'Rookies' },
                { id: 'fan_favourites', label: 'Favorites' },
                { id: 'hof_legends', label: 'HOF Legends' },
                { id: 'franchise_icons', label: 'Icons' },
                { id: 'clutch_moments', label: 'Clutch' },
                { id: 'completed', label: 'Completed' },
              ].map((cat) => {
                const isActive = filterCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilterCategory(cat.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid of Challenges */}
          <div className="flex-1 overflow-y-auto p-4 max-w-5xl mx-auto w-full no-scrollbar">
            {filteredChallenges.length === 0 ? (
              <div className="py-20 text-center text-zinc-600 text-xs font-bold uppercase tracking-wider">
                No challenges available in this category
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredChallenges.map((challenge) => {
                  const isCompleted = completedSbcs.includes(challenge.id);

                  const catLabels: Record<string, string> = {
                    rookie_series: 'ROOKIE SERIES',
                    fan_favourites: 'FAN FAVOURITE',
                    hof_legends: 'HOF LEGEND',
                    franchise_icons: 'FRANCHISE ICON',
                    clutch_moments: 'CLUTCH MOMENT',
                  };

                  return (
                    <div
                      key={challenge.id}
                      onClick={() => setSelectedChallenge(challenge)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 flex flex-col justify-between gap-4 group relative overflow-hidden ${
                        isCompleted
                          ? 'border-emerald-500/20 bg-zinc-950/60 opacity-80'
                          : 'border-white/10 bg-zinc-900/60 hover:bg-zinc-900 hover:border-amber-500/50 hover:shadow-xl'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isCompleted
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/20 bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform'
                          }`}>
                            {isCompleted ? <Check size={18} strokeWidth={3} /> : <Trophy size={18} />}
                          </div>

                          <div>
                            {challenge.category && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mb-1 inline-block">
                                {catLabels[challenge.category] || challenge.category}
                              </span>
                            )}
                            <h3 className="text-xs font-black uppercase tracking-tight text-white group-hover:text-amber-400 transition-colors">
                              {challenge.name}
                            </h3>
                            <p className="text-[9px] font-bold text-zinc-400 line-clamp-1 mt-0.5">
                              {challenge.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Reward Badge */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={12} className="text-amber-400" />
                          <span className="text-[9px] font-mono font-bold text-zinc-300">
                            Reward: <span className="text-amber-400 font-bold">{challenge.reward.playerName} ({challenge.reward.ovr} OVR)</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-500 group-hover:translate-x-1 transition-transform">
                          <span>Build</span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2. SQUAD BUILDER COURT VIEW */
        <div className="h-[100dvh] w-full flex flex-col bg-zinc-950 overflow-hidden relative">
          
          {/* Header Bar */}
          <div className="w-full bg-zinc-900/95 backdrop-blur-3xl border-b border-white/5 py-2 px-2.5 sm:px-4 flex items-center justify-between gap-2 z-50 relative shadow-2xl min-h-[46px]">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1">
              <button 
                onClick={() => setSelectedChallenge(null)}
                title="Back to Challenges"
                className="p-1.5 bg-zinc-800/80 border border-white/10 text-zinc-300 hover:text-white rounded-lg transition-all active:scale-95 shadow-md shrink-0 cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase"
              >
                <ArrowLeft size={13} />
                <span className="hidden sm:inline">Exit</span>
              </button>

              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <Trophy size={14} className="text-amber-500 shrink-0" />
                <span className="text-xs sm:text-sm font-black tracking-tight text-white uppercase italic leading-none truncate">
                  SBC <span className="text-amber-500">{selectedChallenge.name}</span>
                </span>
              </div>
            </div>

            {/* Action buttons in header: View Reward Preview & Toggle Requirements */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setIsPreviewRewardOpen(true)}
                className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-400 hover:bg-amber-500/25 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
                title="View Reward Card"
              >
                <Eye size={12} className="shrink-0" />
                <span>Reward</span>
              </button>

              <button
                onClick={() => setIsReqDropdownOpen(!isReqDropdownOpen)}
                className="flex items-center gap-1 bg-zinc-800/90 border border-white/10 text-zinc-200 hover:bg-zinc-800 px-2 sm:px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${validation.allFulfilled ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span>Reqs ({fulfilledCount}/{totalCount})</span>
                <ChevronDown size={11} className={`transition-transform duration-200 shrink-0 ${isReqDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <button 
                onClick={handleClearAllSlots}
                title="Clear Squad"
                className="p-1.5 bg-red-950/40 border border-red-900/40 text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-lg transition-all active:scale-95 shadow-md shrink-0 cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Collapsible Requirements Dropdown Drawer */}
          <AnimatePresence>
            {isReqDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-zinc-900/95 border-b border-white/10 overflow-hidden z-40 shadow-2xl relative"
              >
                <div className="p-4 max-w-3xl mx-auto space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-amber-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        CHALLENGE REQUIREMENTS & SBC RULES
                      </h3>
                    </div>

                    <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded-full ${
                      validation.allFulfilled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {validation.allFulfilled ? 'REQUIREMENTS MET!' : `${fulfilledCount} OF ${totalCount} MET`}
                    </span>
                  </div>

                  {/* Requirements Detailed Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                    {selectedChallenge.requirements.map((req, idx) => {
                      const detail = validation.details.find(d => d.type === req.type);
                      const isFulfilled = detail?.fulfilled || false;
                      const reqInfo = getRequirementDescription(req);

                      return (
                        <div 
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 transition-all ${
                            isFulfilled 
                              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' 
                              : 'bg-zinc-950/80 border-white/5 text-zinc-300'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {isFulfilled ? (
                              <CheckCircle2 size={15} className="text-emerald-400" />
                            ) : (
                              <XCircle size={15} className="text-zinc-500" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase tracking-wider ${
                              isFulfilled ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {reqInfo.title}
                            </p>
                            <p className="text-[8.5px] font-medium text-zinc-300 leading-tight mt-0.5">
                              {reqInfo.text}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Important Rule Banner */}
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2.5 text-amber-300 text-[8.5px]">
                    <Shield size={16} className="shrink-0 text-amber-400" />
                    <p className="leading-tight font-bold">
                      <span className="font-black underline uppercase">DUPLICATE PROTECTION:</span> Only cards with <span className="text-amber-200 underline">2+ owned copies</span> appear in SBC picker. Your main unique cards <span className="text-white font-black">CANNOT</span> be lost or submitted.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Requirements Horizontal Belt (when dropdown is closed) */}
          {!isReqDropdownOpen && (
            <div className="px-4 py-1.5 border-b border-white/5 bg-zinc-950/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 z-20">
              {selectedChallenge.requirements.map((req, idx) => {
                const detail = validation.details.find(d => d.type === req.type);
                return (
                  <RequirementBullet 
                    key={idx} 
                    req={req} 
                    fulfilled={detail?.fulfilled || false} 
                  />
                );
              })}
            </div>
          )}

          {/* Court Container */}
          <div className="flex-1 w-full relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 z-10">
            
            {/* Basketball Half-Court Line Art Overlay */}
            <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-0">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="100" y2="0" stroke="white" strokeWidth="1" />
                <path d="M 35 0 A 15 15 0 0 0 65 0" fill="none" stroke="white" strokeWidth="0.5" />
                <rect x="34" y="64" width="32" height="36" fill="none" stroke="white" strokeWidth="0.5" />
                <path d="M 34 64 A 16 16 0 0 1 66 64" fill="none" stroke="white" strokeWidth="0.5" />
                <line x1="10" y1="100" x2="10" y2="86" stroke="white" strokeWidth="0.5" />
                <line x1="90" y1="100" x2="90" y2="86" stroke="white" strokeWidth="0.5" />
                <path d="M 10 86 A 42 42 0 0 1 90 86" fill="none" stroke="white" strokeWidth="0.5" />
                <line x1="44" y1="92" x2="56" y2="92" stroke="white" strokeWidth="0.8" />
                <circle cx="50" cy="90.5" r="2.5" fill="none" stroke="white" strokeWidth="0.5" />
              </svg>
            </div>

            {/* Left Stats & Reward Preview Floating Panel on Desktop */}
            <div className="hidden lg:flex absolute left-6 top-6 w-52 flex-col gap-3 z-30 bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-4 shadow-2xl">
              <div className="text-center">
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Squad Rating</p>
                <p className="text-2xl font-black italic text-amber-500 mt-0.5">{teamOVR} OVR</p>
              </div>

              <div className="w-full h-px bg-white/5" />

              {/* Target Reward Mini Banner */}
              <div 
                onClick={() => setIsPreviewRewardOpen(true)}
                className="p-2.5 bg-gradient-to-br from-amber-500/10 to-zinc-900 border border-amber-500/30 rounded-xl cursor-pointer hover:border-amber-400 transition-all text-center group"
              >
                <p className="text-[7.5px] font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1">
                  <Sparkles size={10} /> TARGET REWARD
                </p>
                <p className="text-[11px] font-black italic text-white mt-1 group-hover:text-amber-400 transition-colors">
                  {selectedChallenge.reward.playerName}
                </p>
                <p className="text-[9px] font-extrabold text-amber-500 uppercase tracking-widest mt-0.5">
                  {selectedChallenge.reward.ovr} OVR • {selectedChallenge.reward.rarity.toUpperCase()}
                </p>
                <span className="inline-block mt-2 text-[7.5px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-full border border-white/10 group-hover:bg-amber-400 group-hover:text-black transition-all">
                  👁️ View Full Card
                </span>
              </div>

              <div className="w-full h-px bg-white/5" />

              <div className="flex flex-col gap-1 text-center">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Submitted Cards</p>
                <p className="text-xs font-bold text-amber-500">
                  {allSquadCards.length} / {starters.length + bench.length} Duplicates
                </p>
              </div>

              <div className="w-full h-px bg-white/5" />

              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${validation.allFulfilled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
                <p className={`text-[7.5px] font-black uppercase tracking-widest ${validation.allFulfilled ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {validation.allFulfilled ? 'REQUIREMENTS MET' : 'BUILDING SQUAD'}
                </p>
              </div>
            </div>

            {/* Tactical Starting Positions Grid */}
            <div className="relative z-10 w-full h-full overflow-visible">
              {[
                { slot: starters[0], style: { top: '18%', left: '50%' } }, // PG
                { slot: starters[1], style: { top: '38%', left: '78%' } }, // SG
                { slot: starters[2], style: { top: '38%', left: '22%' } }, // SF
                { slot: starters[3], style: { top: '68%', left: '24%' } }, // PF
                { slot: starters[4], style: { top: '68%', left: '76%' } }  // C
              ].map(({ slot, style }) => {
                if (!slot) return null;
                return (
                  <div 
                    key={slot.id} 
                    style={style} 
                    className="absolute w-[24%] sm:w-[20%] md:w-[17%] lg:w-[15%] xl:w-[13%] aspect-[2.5/3.5] -translate-x-1/2 -translate-y-1/2 z-10 hover:z-20 transition-all duration-300"
                  >
                    <Slot 
                      slot={slot} 
                      onClick={() => handleSlotClick(slot.id)} 
                      onRemove={slot.card ? () => handleRemoveSlotCard(slot.id) : undefined}
                      isSelected={activeSlotId === slot.id}
                    />
                  </div>
                );
              })}
            </div>

            {/* Action / Submit Squad Button Overlay */}
            <div className="absolute inset-x-0 bottom-14 flex justify-center z-40 px-8">
              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                disabled={!validation.allFulfilled || isSubmitting}
                onClick={handleSubmitSbc}
                className={`w-full max-w-xs py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all border-t border-white/20 ${
                  validation.allFulfilled 
                    ? 'bg-amber-500 text-black shadow-[0_20px_40px_rgba(245,158,11,0.35)] hover:bg-amber-400 cursor-pointer active:scale-95' 
                    : 'bg-zinc-900/90 text-zinc-500 border border-white/5 cursor-not-allowed opacity-80'
                }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="animate-spin text-black" size={16} />
                ) : (
                  <>
                    <span>{validation.allFulfilled ? 'SUBMIT SQUAD' : 'COMPLETE REQUIREMENTS'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </div>

            {/* Bench & Reserves Pull-up Drawer */}
            {bench.length > 0 && (
              <AnimatePresence>
                {isBenchOpen ? (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsBenchOpen(false)}
                      className="absolute inset-0 bg-black/45 backdrop-blur-sm z-40 cursor-pointer"
                    />
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                      className="absolute bottom-0 inset-x-0 bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-900/60 rounded-t-xl shadow-[0_-15px_40px_rgba(0,0,0,0.9)] z-50 flex flex-col px-3 pt-1 pb-2 w-full h-[195px] sm:h-[245px] md:h-[305px] overflow-hidden"
                    >
                      <div 
                        className="w-8 h-0.5 bg-zinc-800 hover:bg-zinc-700 rounded-full mx-auto mb-1 cursor-pointer transition-colors shrink-0" 
                        onClick={() => setIsBenchOpen(false)} 
                      />
                      
                      <div className="flex items-center justify-center mb-0.5 shrink-0 px-1 h-3.5 sm:h-4">
                        <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-widest text-zinc-400">
                          BENCH & RESERVES ({bench.filter(b => b.card).length}/{bench.length})
                        </span>
                      </div>

                      <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        <div className="flex items-center gap-3 sm:gap-4 h-full py-0.5 px-0.5 min-w-max">
                          {bench.map((slot, index) => (
                            <div 
                              key={slot.id} 
                              className="flex flex-col items-center shrink-0 w-[105px] sm:w-[140px] md:w-[175px]"
                            >
                              <div className="flex items-center justify-center -mb-1.5 relative z-20 select-none pointer-events-none">
                                <span className="text-[5.5px] md:text-[6.5px] font-extrabold uppercase px-1 py-0.5 rounded-[2px] bg-zinc-950/90 border border-zinc-900/40 tracking-wider leading-none shadow-sm text-amber-500">
                                  BN {index + 1}
                                </span>
                              </div>
                              
                              <div className="w-full aspect-[2.5/3.5]">
                                <Slot 
                                  slot={slot} 
                                  mini={false} 
                                  onClick={() => handleSlotClick(slot.id)} 
                                  onRemove={slot.card ? () => handleRemoveSlotCard(slot.id) : undefined}
                                  isSelected={activeSlotId === slot.id}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <div className="absolute bottom-0 inset-x-0 z-40 flex justify-center">
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      onClick={() => setIsBenchOpen(true)}
                      className="flex items-center justify-center gap-1.5 bg-zinc-950 border-t border-x border-zinc-900 text-zinc-400 hover:text-white px-6 h-8 rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.5)] font-bold uppercase tracking-widest text-[8px] transition-colors pointer-events-auto active:bg-zinc-900 cursor-pointer"
                    >
                      <ChevronUp size={10} className="animate-bounce text-amber-500" />
                      <span>▲ BENCH & RESERVES ({bench.filter(b => b.card).length}/{bench.length})</span>
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        </div>
      )}

      {/* 3. TARGET REWARD CARD PREVIEW MODAL */}
      <AnimatePresence>
        {isPreviewRewardOpen && previewRewardCard && (
          <div className="fixed inset-0 z-[9000] flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setIsPreviewRewardOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="w-full max-w-[340px] sm:max-w-sm max-h-[88dvh] bg-zinc-950 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_rgba(245,158,11,0.2)] z-10 relative flex flex-col items-center text-center overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setIsPreviewRewardOpen(false)}
                className="absolute top-3 right-3 p-1.5 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer z-20 border border-white/10"
              >
                <X size={15} />
              </button>

              <div className="flex items-center gap-1.5 text-amber-400 text-[11px] sm:text-xs font-black uppercase tracking-widest mt-1 mb-0.5">
                <Sparkles size={14} className="animate-pulse" />
                <span>CHALLENGE REWARD CARD</span>
              </div>

              <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider mb-3 truncate max-w-[85%]">
                {selectedChallenge?.name}
              </p>

              {/* Render High Quality SBCCard in scaled container for small screens */}
              <div className="my-1 py-1 flex justify-center scale-95 sm:scale-100 transition-transform">
                <SBCCard card={previewRewardCard} size="md" />
              </div>

              {/* Card Summary Stats Box */}
              <div className="w-full bg-zinc-900/90 border border-white/10 rounded-xl p-3 my-3 space-y-2 text-left">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase">PLAYER NAME</span>
                  <span className="text-xs font-black text-white">{previewRewardCard.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase">POSITION</span>
                  <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                    {previewRewardCard.position}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                  <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase">OVERALL RATING</span>
                  <span className="text-sm font-black italic text-amber-400 font-mono">
                    {previewRewardCard.stats.ovr} OVR
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-extrabold text-zinc-400 uppercase">RARITY TIER</span>
                  <span className="text-[10px] font-black uppercase text-amber-300 font-mono tracking-wider">
                    {previewRewardCard.rarity.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsPreviewRewardOpen(false)}
                className="w-full py-2.5 bg-amber-400 text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-amber-300 transition-all shadow-lg active:scale-95 cursor-pointer shrink-0 mt-1"
              >
                RETURN TO SQUAD BUILDER
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. DUPLICATE CARD SELECTOR MODAL / DRAWER */}
      <AnimatePresence>
        {isSelectorOpen && (
          <div className="fixed inset-0 z-[8000] flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setIsSelectorOpen(false)}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="w-full h-full max-w-4xl flex flex-col bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 relative"
            >
              {/* Header */}
              <header className="p-3.5 flex items-center justify-between gap-3 border-b border-white/5 shrink-0 bg-zinc-900/90">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-tight text-white flex items-center gap-2">
                    <Layers size={14} className="text-amber-500" />
                    SELECT DUPLICATE PLAYER
                  </h2>
                  <p className="text-[8.5px] font-bold text-amber-400/90 uppercase tracking-wider">
                    Target Slot: {[...starters, ...bench].find(s => s.id === activeSlotId)?.label || 'SLOT'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-36 sm:w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                    <input 
                      type="text" 
                      placeholder="SEARCH..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-full py-1 pl-8 pr-3 text-[9px] font-bold uppercase tracking-wider focus:outline-none focus:border-amber-400 text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <button 
                    onClick={() => setIsSelectorOpen(false)}
                    className="p-1.5 bg-zinc-950 border border-white/10 rounded-full text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </header>

              {/* Filters Bar */}
              <div className="px-3.5 py-2 border-b border-white/5 flex flex-col gap-1.5 bg-zinc-950 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[8px] font-bold uppercase">
                  <span className="text-zinc-500 mr-1 text-[7.5px]">POS:</span>
                  {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map(pos => (
                    <button 
                      key={pos}
                      onClick={() => setPosFilter(pos)}
                      className={`px-2.5 py-0.5 rounded-full transition-all border cursor-pointer ${
                        posFilter === pos 
                          ? 'border-amber-400/80 text-amber-400 bg-amber-400/10 font-black' 
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[8px] font-bold uppercase pt-1.5 border-t border-white/5">
                  <span className="text-zinc-500 mr-1 text-[7.5px]">SORT:</span>
                  {(['OVR', 'Name', 'Count'] as const).map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setSortDuplicatesBy(mode)}
                      className={`px-2.5 py-0.5 rounded-full transition-all border cursor-pointer ${
                        sortDuplicatesBy === mode 
                          ? 'border-amber-400/80 text-amber-400 bg-amber-400/10 font-black' 
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {mode === 'Count' ? 'Duplicates' : mode === 'Name' ? 'Name' : 'OVR Rating'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Security Rule Sub-Banner */}
              <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-[8px] font-black uppercase text-amber-300 shrink-0">
                <span className="flex items-center gap-1">
                  <Lock size={10} className="text-amber-400" />
                  ONLY DUPLICATE CARDS (2+ COPIES OWNED) ARE SHOWN
                </span>
                <span className="text-zinc-400 font-mono">
                  Available Duplicates: {filteredDuplicates.length}
                </span>
              </div>

              {/* Duplicate Cards Grid */}
              <div className="flex-1 overflow-y-auto p-3.5 no-scrollbar bg-black/40">
                {filteredDuplicates.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {filteredDuplicates.map(card => {
                      const totalOwned = collection[card.id] || 0;
                      const dupeCount = totalOwned - 1; // Number of extra copies beyond the 1x owned copy
                      return (
                        <div 
                          key={card.id}
                          onClick={() => handleSelectDuplicateCard(card)}
                          className="relative cursor-pointer group flex flex-col items-center w-full transition-transform hover:scale-105"
                        >
                          <CardItem card={card} isOwned={true} mode="mini" />

                          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-black text-[8px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-md z-40 border border-black/20 flex items-center gap-0.5" title={`${dupeCount} duplicate copy(ies) available`}>
                            <span>x{dupeCount}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-zinc-600 py-16 space-y-2">
                    <Layers size={28} className="text-zinc-600" />
                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                      NO MATCHING DUPLICATE CARDS FOUND
                    </p>
                    <p className="text-[8.5px] text-zinc-600 uppercase max-w-xs">
                      Open more packs in the Store to get duplicate cards for SBC challenges. Your main collection cards are protected!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. REWARD REVEAL MODAL */}
      <AnimatePresence>
        {rewardReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 text-center"
          >
            <div className="relative z-10 flex flex-col items-center max-w-sm">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="mb-6 w-48"
              >
                <SBCCard card={rewardReveal} size="lg" />
              </motion.div>

              <h2 className="text-lg font-black uppercase tracking-tight text-white mb-1">
                SBC COMPLETED!
              </h2>
              
              <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-6">
                {rewardReveal.name} • {rewardReveal.stats.ovr} OVR
              </p>
              
              <button 
                onClick={() => {
                  setRewardReveal(null);
                  setSelectedChallenge(null);
                }}
                className="px-6 py-2.5 bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-amber-300 transition-all shadow-lg active:scale-95 cursor-pointer"
              >
                CLAIM REWARD
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
