import React, { useState, useMemo, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Trash2, CheckCircle2, XCircle, Sparkles, 
  Search, Shield, Award, RefreshCw, X, Check, Eye,
  ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { Card, SbcGroup, SbcSegment, SbcRequirement } from '../../types';
import { sbcService } from '../../services/sbcService';
import CardItem from '../CardItem';

interface DraftSlot {
  id: string;
  label: string;
  position: string | null;
  card: Card | null;
}

interface SbcCourtBuilderProps {
  segment: SbcSegment;
  group: SbcGroup;
  availableDuplicates: (Card & { quantity: number })[];
  isSubmitting: boolean;
  onBack: () => void;
  onSubmitSquad: (submittedCards: Card[]) => void;
  onInspectCard: (card: Card) => void;
}

const DEFAULT_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

// Default 5-man basketball tactical positions on half court (matching Hoops Draft)
const STARTER_COORDINATES = [
  { top: '18%', left: '50%' }, // PG
  { top: '38%', left: '78%' }, // SG
  { top: '38%', left: '22%' }, // SF
  { top: '68%', left: '24%' }, // PF
  { top: '68%', left: '76%' }  // C
];

const getReqShortLabel = (req: SbcRequirement) => {
  switch (req.type) {
    case 'TOTAL_CARDS':
      return `${req.value} Cards`;
    case 'MIN_OVR':
      return `Min ${req.value} OVR`;
    case 'TEAM_OVR_MIN':
      return `Squad ${req.value}+ OVR`;
    case 'MIN_RARITY':
      return `Min ${String(req.value).toUpperCase()}`;
    case 'EXACT_RARITY':
      return `${req.count ?? 1}x ${String(req.value).toUpperCase()}`;
    case 'POSITION':
      return `${req.count ?? 1}x ${req.value}`;
    case 'UNIQUE_PLAYERS':
      return 'Unique Players';
    case 'SAME_TEAM_MIN':
      return `Same Team (Min ${req.value})`;
    case 'SAME_CONF_MIN':
      return `Same Conf (Min ${req.value})`;
    case 'MAX_TEAMS':
      return `Max ${req.value} Teams`;
    case 'SPECIFIC_PLAYER_NAME':
      return `Card of ${req.value}`;
    case 'SPECIFIC_TEAM':
      return `${req.count ?? 'All'}x ${req.value}`;
    case 'SPECIAL_CARDS_MIN':
      return `${req.count ?? req.value ?? 1}x Special`;
    case 'CATEGORY':
      return `${req.count ?? 1}x ${req.value}`;
    default:
      return `${req.type}: ${req.value}`;
  }
};

const getReqDescription = (req: SbcRequirement) => {
  switch (req.type) {
    case 'TOTAL_CARDS':
      return `Submit exactly ${req.value} duplicate cards.`;
    case 'MIN_OVR':
      return `Every slotted card must be at least ${req.value} OVR.`;
    case 'TEAM_OVR_MIN':
      return `Squad average rating must be ${req.value}+ OVR.`;
    case 'MIN_RARITY':
      return `All cards must be ${String(req.value).toUpperCase()} tier or higher.`;
    case 'EXACT_RARITY':
      return `Include ${req.count ?? 1}x ${String(req.value).toUpperCase()} tier card(s).`;
    case 'POSITION':
      return `Include ${req.count ?? 1}x card(s) in position ${req.value}.`;
    case 'UNIQUE_PLAYERS':
      return 'All submitted players must be unique (no duplicate names).';
    case 'SAME_TEAM_MIN':
      return `Include at least ${req.value} players from the same NBA team.`;
    case 'SAME_CONF_MIN':
      return `Include at least ${req.value} players from the same conference.`;
    case 'MAX_TEAMS':
      return `Maximum ${req.value} different NBA teams represented.`;
    case 'SPECIFIC_PLAYER_NAME':
      return `Must include a card of ${req.value}.`;
    case 'SPECIFIC_TEAM':
      return `Must include ${req.count ?? 'all'} player(s) from ${req.value}.`;
    case 'SPECIAL_CARDS_MIN':
      return `Include at least ${req.count ?? req.value ?? 1}x Special Card(s) (All-Star / Award / Legend).`;
    case 'CATEGORY':
      return `Include ${req.count ?? 1}x card(s) from ${req.value} series.`;
    default:
      return `${req.type}: ${req.value}`;
  }
};

// Hoops Draft Slot Component
const CourtSlot = memo<{
  slot: DraftSlot;
  onClick: () => void;
  onRemove: (e: React.MouseEvent) => void;
  onInspect: (e: React.MouseEvent) => void;
  isSelected?: boolean;
}>(({ slot, onClick, onRemove, onInspect, isSelected }) => {
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
    if (screenSize === 'mobile') return 95;
    if (screenSize === 'tablet') return 130;
    return 165;
  }, [screenSize]);

  return (
    <div 
      className={`relative group transition-all duration-300 w-full h-full aspect-[2.5/3.5] ${
        isSelected ? 'scale-105 z-50' : ''
      }`}
    >
      {slot.card ? (
        <motion.div 
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1.05 : 1, 
            opacity: 1,
            boxShadow: isSelected ? "0 0 25px rgba(245,158,11,0.6)" : "0 10px 25px rgba(0,0,0,0.5)"
          }}
          whileTap={{ scale: 0.95 }}
          className="h-full w-full cursor-pointer relative"
          onClick={onClick}
        >
          <CardItem 
            card={slot.card} 
            isOwned={true} 
            width={cardWidth} 
            mode="large"
          />

          {/* Quick Action Badges */}
          <div className="absolute top-1 right-1 flex items-center gap-1 z-30 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              onClick={onInspect}
              className="w-5 h-5 rounded-full bg-black/80 text-amber-300 hover:bg-amber-500 hover:text-black flex items-center justify-center border border-amber-400/40 shadow cursor-pointer transition-colors"
              title="3D Inspect"
            >
              <Eye className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={onRemove}
              className="w-5 h-5 rounded-full bg-red-600/90 text-white hover:bg-red-500 flex items-center justify-center shadow cursor-pointer transition-colors"
              title="Remove Player"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        </motion.div>
      ) : (
        <button 
          onClick={onClick}
          className={`h-full w-full bg-zinc-900/35 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 transition-all relative overflow-hidden text-left cursor-pointer ${
            isSelected 
              ? 'border-amber-400 bg-amber-500/15 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
              : 'border-zinc-800/60 hover:border-amber-500/50 hover:bg-zinc-900/60'
          }`}
        >
          {/* Ghost Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-50" />
          
          <div className="rounded-full bg-zinc-900/80 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner mx-auto relative">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-black text-white/20 text-sm sm:text-lg">+</span>
            </div>
          </div>
          
          <span className="font-black uppercase tracking-[0.2em] text-zinc-600 group-hover:text-amber-500/70 transition-colors text-center w-full block text-[8px] sm:text-[10px]">
            {slot.position || slot.label}
          </span>

          {/* Decorative Corner Accents */}
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-zinc-700" />
          <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-zinc-700" />
          <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-zinc-700" />
          <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-zinc-700" />

          {/* Pulsing '+' indicator */}
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10 pointer-events-none">
            <span className="text-black font-black text-[9px] sm:text-[10px] leading-none">+</span>
          </div>
        </button>
      )}
    </div>
  );
});

export const SbcCourtBuilder: React.FC<SbcCourtBuilderProps> = memo(({
  segment,
  group,
  availableDuplicates,
  isSubmitting,
  onBack,
  onSubmitSquad,
  onInspectCard
}) => {
  const [slots, setSlots] = useState<DraftSlot[]>(() => {
    const count = segment.cardsRequired || 5;
    const posList = segment.slotPositions || DEFAULT_POSITIONS;
    return Array.from({ length: count }, (_, idx) => ({
      id: `slot-${idx}`,
      label: posList[idx] || `SLOT ${idx + 1}`,
      position: posList[idx] || null,
      card: null
    }));
  });

  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [filterPos, setFilterPos] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isReqDropdownOpen, setIsReqDropdownOpen] = useState(false);

  // Slotted cards
  const slottedCards = useMemo(() => {
    return slots.map(s => s.card).filter((c): c is Card => c !== null);
  }, [slots]);

  // Slotted card counts for duplicates subtraction
  const slottedCardCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    slottedCards.forEach(c => {
      counts[c.id] = (counts[c.id] || 0) + 1;
    });
    return counts;
  }, [slottedCards]);

  // Requirements real-time check
  const reqCheck = useMemo(() => {
    return sbcService.checkRequirements(slottedCards, segment.requirements);
  }, [slottedCards, segment.requirements]);

  // Average OVR
  const averageOvr = useMemo(() => {
    if (slottedCards.length === 0) return 0;
    const sum = slottedCards.reduce((acc, c) => acc + c.stats.ovr, 0);
    return Math.round((sum / (segment.cardsRequired || 5)) * 10) / 10;
  }, [slottedCards, segment.cardsRequired]);

  // Filtered duplicates for selection view
  const filteredDuplicates = useMemo(() => {
    return availableDuplicates
      .filter(card => {
        const remainingQty = card.quantity - (slottedCardCounts[card.id] || 0);
        if (remainingQty <= 0) return false;
        if (filterPos !== 'ALL' && card.position !== filterPos) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return card.name.toLowerCase().includes(q) || card.team.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => (sortOrder === 'desc' ? b.stats.ovr - a.stats.ovr : a.stats.ovr - b.stats.ovr));
  }, [availableDuplicates, slottedCardCounts, filterPos, searchQuery, sortOrder]);

  const handleSlotClick = (slot: DraftSlot) => {
    setActiveSlotId(slot.id);
    if (slot.position) {
      setFilterPos(slot.position);
    } else {
      setFilterPos('ALL');
    }
    setSelectionOpen(true);
  };

  const handleAssignCard = (card: Card) => {
    if (!activeSlotId) return;
    setSlots(prev => prev.map(s => (s.id === activeSlotId ? { ...s, card } : s)));
    
    // Auto advance to next empty slot
    const currentIndex = slots.findIndex(s => s.id === activeSlotId);
    const nextEmpty = slots.find((s, idx) => idx > currentIndex && s.card === null) || slots.find(s => s.card === null);
    if (nextEmpty) {
      setActiveSlotId(nextEmpty.id);
      if (nextEmpty.position) setFilterPos(nextEmpty.position);
    } else {
      setSelectionOpen(false);
      setActiveSlotId(null);
    }
  };

  const handleRemoveCard = (slotId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSlots(prev => prev.map(s => (s.id === slotId ? { ...s, card: null } : s)));
  };

  const handleClearSquad = () => {
    setSlots(prev => prev.map(s => ({ ...s, card: null })));
  };

  const handleAutoFill = () => {
    const sorted = [...availableDuplicates].sort((a, b) => a.stats.ovr - b.stats.ovr);
    const usedCounts: Record<string, number> = {};
    const newSlots = slots.map(slot => {
      if (slot.card) {
        usedCounts[slot.card.id] = (usedCounts[slot.card.id] || 0) + 1;
        return slot;
      }
      const candidate = sorted.find(c => {
        const used = usedCounts[c.id] || 0;
        if (used >= c.quantity) return false;
        if (slot.position && c.position !== slot.position) return false;
        return true;
      }) || sorted.find(c => {
        const used = usedCounts[c.id] || 0;
        return used < c.quantity;
      });

      if (candidate) {
        usedCounts[candidate.id] = (usedCounts[candidate.id] || 0) + 1;
        return { ...slot, card: candidate };
      }
      return slot;
    });

    setSlots(newSlots);
  };

  const fulfilledCount = reqCheck.details.filter(d => d.fulfilled).length;
  const totalReqCount = segment.requirements.length;

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-zinc-950 overflow-hidden relative select-none">
      
      {/* Background Ambience (Matching Hoops Draft) */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
        <div className="absolute inset-0 opacity-15 bg-[url('https://picsum.photos/seed/basketball/1920/1080')] bg-cover bg-center blur-xl" />
      </div>

      {/* 1. Hoops Draft Style Header Bar */}
      <div className="w-full bg-zinc-900/95 backdrop-blur-3xl border-b border-white/5 py-1.5 px-3 sm:px-4 flex items-center justify-between gap-2 z-40 relative shadow-2xl shrink-0">
        
        {/* Left: Back & Titles */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="p-1.5 sm:p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-all active:scale-95 shadow-md shrink-0 flex items-center justify-center cursor-pointer"
            title="Back to Challenge Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-black tracking-tight text-white uppercase italic leading-none truncate">
              {segment.name}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 truncate hidden xs:inline">
              {group.name}
            </span>
          </div>
        </div>

        {/* Center: Rating & Minimalist Requirements Dropdown Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Squad Average Rating */}
          <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded px-2 py-0.5 shadow-sm">
            <span className="text-[8px] font-black text-zinc-500 uppercase leading-none">Rating</span>
            <span className="text-[11px] font-black text-amber-400 italic leading-none">
              {averageOvr || '--'}
            </span>
          </div>

          {/* Interactive Requirements Dropdown Trigger */}
          <button
            onClick={() => setIsReqDropdownOpen(prev => !prev)}
            className={`flex items-center gap-1.5 border rounded px-2.5 py-0.5 transition-all cursor-pointer shadow-sm ${
              isReqDropdownOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                : reqCheck.allFulfilled
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/90'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
            }`}
            title="Click to view full squad requirements"
          >
            <Shield className={`w-3 h-3 ${reqCheck.allFulfilled ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="text-[9px] font-black uppercase tracking-wider">
              Reqs:
            </span>
            <span className={`text-[11px] font-black italic leading-none ${reqCheck.allFulfilled ? 'text-emerald-400' : 'text-amber-400'}`}>
              {fulfilledCount}/{totalReqCount}
            </span>
            {isReqDropdownOpen ? (
              <ChevronUp className="w-3 h-3 text-amber-400" />
            ) : (
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            )}
          </button>
        </div>

        {/* Right: Quick Tools (Auto-Fill & Clear) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={handleAutoFill}
            disabled={availableDuplicates.length === 0}
            className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Auto-fill with duplicate cards"
          >
            <Sparkles className="w-3 h-3" />
            <span className="hidden sm:inline">Auto-Fill</span>
          </button>
          
          <button
            onClick={handleClearSquad}
            disabled={slottedCards.length === 0}
            className="p-1.5 bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-900/25 hover:text-red-300 rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Clear all cards"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Court Container (100% full screen space, identical to Hoops Draft) */}
      <div className="flex-1 w-full relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 z-10">
        
        {/* Minimalist Floating Requirements Dropdown Menu (Positioned directly under header) */}
        <AnimatePresence>
          {isReqDropdownOpen && (
            <>
              {/* Invisible click-away backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsReqDropdownOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute top-2 left-1/2 -translate-x-1/2 w-[94%] max-w-md bg-zinc-950/95 backdrop-blur-2xl border border-amber-500/30 rounded-2xl p-3 shadow-2xl z-50 flex flex-col gap-2.5 max-h-[70vh] overflow-hidden"
              >
                {/* Dropdown Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      Squad Requirements
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      reqCheck.allFulfilled 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {fulfilledCount}/{totalReqCount} Completed
                    </span>
                    <button 
                      onClick={() => setIsReqDropdownOpen(false)}
                      className="text-zinc-400 hover:text-white p-0.5 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Requirements List */}
                <div className="flex flex-col gap-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-800 max-h-[45vh]">
                  {segment.requirements.map((req, idx) => {
                    const isMet = reqCheck.details[idx]?.fulfilled || false;
                    const shortLabel = getReqShortLabel(req);
                    const desc = getReqDescription(req);

                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border flex items-start gap-2.5 transition-colors ${
                          isMet
                            ? 'bg-emerald-950/25 border-emerald-500/30 text-emerald-200'
                            : 'bg-zinc-900/80 border-white/5 text-zinc-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isMet ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-black text-white leading-tight">
                              {shortLabel}
                            </span>
                            <span className={`text-[9px] font-black uppercase ${
                              isMet ? 'text-emerald-400' : 'text-zinc-500'
                            }`}>
                              {isMet ? 'Met' : 'Pending'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">
                            {desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reward Preview inside Dropdown Footer */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between bg-zinc-900/50 -mx-3 -mb-3 p-2.5 rounded-b-2xl">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[10px] font-bold text-amber-300 truncate">
                      {segment.segmentReward.description}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    REWARD
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Basketball Half-Court Line Art Overlay (Authentic Hoops Draft Court) */}
        <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-0">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer boundary */}
            <rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.5" />
            {/* Midcourt line at the top (y=0) */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="white" strokeWidth="1" />
            {/* Center Circle at the top (y=0) */}
            <path d="M 35 0 A 15 15 0 0 0 65 0" fill="none" stroke="white" strokeWidth="0.5" />
            {/* The Paint / Key at the bottom (x: 34 to 66, y: 64 to 100) */}
            <rect x="34" y="64" width="32" height="36" fill="none" stroke="white" strokeWidth="0.5" />
            {/* Free throw circle at top of paint (y=64) */}
            <path d="M 34 64 A 16 16 0 0 1 66 64" fill="none" stroke="white" strokeWidth="0.5" />
            {/* Three-Point Arc (basket is at x=50, y=92) */}
            <line x1="10" y1="100" x2="10" y2="86" stroke="white" strokeWidth="0.5" />
            <line x1="90" y1="100" x2="90" y2="86" stroke="white" strokeWidth="0.5" />
            <path d="M 10 86 A 42 42 0 0 1 90 86" fill="none" stroke="white" strokeWidth="0.5" />
            {/* Backboard: line at y=92, from x=44 to 56 */}
            <line x1="44" y1="92" x2="56" y2="92" stroke="white" strokeWidth="0.8" />
            {/* Rim: circle centered at x=50, y=92 */}
            <circle cx="50" cy="90.5" r="2.5" fill="none" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Left Stats Panel - Floating on Desktop */}
        <div className="hidden lg:flex absolute left-6 top-6 w-44 flex-col gap-3 z-30 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 shadow-2xl">
          <div className="text-center group">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">Squad Rating</p>
            <p className="text-2xl font-black italic text-amber-500 mt-1">
              {averageOvr || '--'}
            </p>
          </div>
          <div className="w-full h-px bg-white/5" />
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-tighter text-white italic truncate">{segment.name}</p>
            <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5 truncate">{group.name}</p>
          </div>
          <div className="w-full h-px bg-white/5" />
          <button 
            onClick={() => setIsReqDropdownOpen(prev => !prev)}
            className="flex flex-col gap-1 text-center hover:bg-zinc-900/50 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-1">
              <span>Requirements</span>
              <ChevronDown className="w-2.5 h-2.5 text-zinc-400" />
            </p>
            <p className={`text-xs font-bold ${reqCheck.allFulfilled ? 'text-emerald-400' : 'text-amber-500'}`}>
              {fulfilledCount} / {totalReqCount} Met
            </p>
          </button>
          <div className="w-full h-px bg-white/5" />
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">SBC BUILDER</p>
          </div>
        </div>

        {/* Tactical Five-Card Court Grid using Coordinate Positioning (Authentic Hoops Draft) */}
        <div className="relative z-10 w-full h-full overflow-visible">
          {slots.map((slot, idx) => {
            const coord = STARTER_COORDINATES[idx] || { 
              top: `${20 + (idx * 15)}%`, 
              left: `${20 + ((idx % 3) * 30)}%` 
            };

            return (
              <div
                key={slot.id}
                style={coord}
                className="absolute w-[25%] xs:w-[22%] sm:w-[19%] md:w-[16%] lg:w-[14%] xl:w-[12.5%] aspect-[2.5/3.5] -translate-x-1/2 -translate-y-1/2 z-10 hover:z-20 transition-all duration-300"
              >
                <CourtSlot
                  slot={slot}
                  onClick={() => handleSlotClick(slot)}
                  onRemove={(e) => handleRemoveCard(slot.id, e)}
                  onInspect={(e) => {
                    e.stopPropagation();
                    if (slot.card) onInspectCard(slot.card);
                  }}
                  isSelected={activeSlotId === slot.id}
                />
              </div>
            );
          })}
        </div>

        {/* 3. Floating Bottom Clean Minimal Bar (Submit Action + Compact Reward) */}
        <div className="absolute inset-x-0 bottom-2.5 sm:bottom-4 z-30 flex flex-col items-center gap-2 px-3 sm:px-6 pointer-events-auto">
          
          {/* Main Action Submit Button (Ultra Minimalist and Clean) */}
          <div className="w-full max-w-sm flex flex-col items-center gap-1.5">
            <motion.button
              whileHover={{ scale: reqCheck.allFulfilled ? 1.02 : 1 }}
              whileTap={{ scale: reqCheck.allFulfilled ? 0.98 : 1 }}
              onClick={() => onSubmitSquad(slottedCards)}
              disabled={!reqCheck.allFulfilled || isSubmitting}
              className={`w-full py-2.5 sm:py-3 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-2xl transition-all cursor-pointer ${
                reqCheck.allFulfilled
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-[0_10px_30px_rgba(16,185,129,0.4)] border-t border-white/30 active:scale-95'
                  : 'bg-zinc-900/90 border border-zinc-800 text-zinc-500 cursor-not-allowed opacity-80'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Squad...</span>
                </>
              ) : reqCheck.allFulfilled ? (
                <>
                  <Check className="w-4 h-4 text-black" />
                  <span>Submit Squad & Claim Reward</span>
                </>
              ) : (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsReqDropdownOpen(true);
                  }}
                  className="flex items-center gap-1.5 w-full justify-center"
                >
                  <Shield className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Complete {totalReqCount - fulfilledCount} More Requirement{totalReqCount - fulfilledCount > 1 ? 's' : ''}</span>
                  <ChevronUp className="w-3 h-3 text-zinc-400 ml-1" />
                </div>
              )}
            </motion.button>

            {/* Subtle Reward Tag below CTA */}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
              <Award className="w-3 h-3 text-amber-400" />
              <span>Reward:</span>
              <span className="font-bold text-amber-300 truncate max-w-[200px] sm:max-w-[280px]">
                {segment.segmentReward.description}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Selection Modal (Matching Hoops Draft Player Pick Modal) */}
      <AnimatePresence>
        {selectionOpen && (
          <div className="fixed inset-0 z-[9000] flex flex-col items-center justify-center p-2 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl cursor-pointer"
              onClick={() => setSelectionOpen(false)}
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              className="relative z-10 w-full max-w-4xl max-h-[88vh] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black italic uppercase tracking-tight text-white leading-none">
                    Select Duplicate Player
                  </h3>
                  <p className="text-[9px] sm:text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-0.5">
                    {activeSlotId ? `Assign to ${slots.find(s => s.id === activeSlotId)?.position || 'Position'}` : 'Technical Selection'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectionOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filters & Search Control Bar */}
              <div className="px-3.5 py-2.5 bg-zinc-900/40 border-b border-zinc-800/60 flex flex-col sm:flex-row gap-2 items-center justify-between">
                {/* Position Filter Chips */}
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 sm:pb-0 scrollbar-none">
                  {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => setFilterPos(pos)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                        filterPos === pos
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>

                {/* Search & Sort */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="w-3 h-3 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search player or team..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-800 text-white pl-7 pr-2.5 py-1 rounded-md text-xs border border-white/10 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                  <button
                    onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
                    className="px-2.5 py-1 rounded-md bg-zinc-800 text-[10px] font-black text-zinc-300 hover:text-white border border-white/10 shrink-0 cursor-pointer"
                  >
                    OVR {sortOrder.toUpperCase()}
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="p-3 sm:p-5 overflow-y-auto flex-1 max-h-[55vh] scrollbar-thin scrollbar-thumb-zinc-800">
                {filteredDuplicates.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-600">
                      <Search className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-zinc-400">No matching duplicate cards found.</p>
                    <p className="text-[10px] text-zinc-600">
                      Open more packs to obtain duplicates for challenge requirements.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 justify-items-center">
                    {filteredDuplicates.map((card, cardIdx) => {
                      const remaining = card.quantity - (slottedCardCounts[card.id] || 0);
                      return (
                        <motion.div
                          key={`dup-card-${card.id}-${cardIdx}`}
                          whileHover={{ scale: 1.04, y: -4 }}
                          whileTap={{ scale: 0.96 }}
                          className="relative cursor-pointer group flex flex-col items-center w-full max-w-[155px]"
                        >
                          <div 
                            onClick={() => handleAssignCard(card)}
                            className="w-full flex justify-center"
                          >
                            <CardItem card={card} isOwned={true} mode="condensed" />
                          </div>

                          {/* 3D Inspect Action */}
                          <div className="absolute top-1 left-1 flex items-center gap-1 z-20">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onInspectCard(card);
                              }}
                              className="p-1 rounded-md bg-black/80 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-400/40 text-[9px] transition-colors shadow cursor-pointer"
                              title="Inspect Card in 3D"
                            >
                              <Eye className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          {/* Duplicates Quantity Pill */}
                          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-black/90 backdrop-blur-xs border border-amber-400/40 text-[9px] font-black text-amber-300 z-10 shadow">
                            x{remaining}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
