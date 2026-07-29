import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, Star, CheckCircle, XCircle, Search, Filter, 
  Trash2, ArrowRight, Trophy, Sparkles, Clock, AlertCircle,
  Menu, X, ChevronRight, Check, Target, TrendingUp, TrendingDown, ArrowLeft, RefreshCw
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { SBC_CHALLENGES } from '../data/sbcChallenges';
import { sbcService } from '../services/sbcService';
import { Card, SbcChallenge, SbcRequirement } from '../types';
import CardItem from '../components/CardItem';
import SBCCard from '../components/SBCCard';
import confetti from 'canvas-confetti';

// --- Sub-components ---

// Ultra-compressed Requirements Belt Item
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
      case 'UNIQUE_PLAYERS': return `UNIQUE`;
      case 'TEAM_OVR_MIN': return `TEAM: ${req.value}+`;
      case 'SAME_TEAM_MIN': return `SAME TEAM: ${req.value}+`;
      case 'SAME_CONF_MIN': return `CONF: ${req.value}+`;
      case 'MAX_TEAMS': return `MAX TEAMS: ${req.value}`;
      default: return String(req.type);
    }
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0 select-none">
      <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${fulfilled ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-zinc-800'}`} />
      <span className={`text-[9px] font-black uppercase tracking-widest ${fulfilled ? 'text-green-500 font-black' : 'text-zinc-500'}`}>
        {getReqText()}
      </span>
    </div>
  );
};

// Compact navigation items
const CompactSbcItem: React.FC<{ 
  challenge: SbcChallenge; 
  active: boolean; 
  completed: boolean;
  onClick: () => void;
}> = ({ challenge, active, completed, onClick }) => {
  const diffConfigs = {
    bronze: 'border-amber-900/30 text-amber-500 bg-amber-500/5',
    silver: 'border-zinc-800 text-zinc-400 bg-zinc-400/5',
    gold: 'border-yellow-900/30 text-yellow-500 bg-yellow-500/5',
    elite: 'border-purple-900/30 text-purple-400 bg-purple-500/5',
    legendary: 'border-red-950/30 text-red-500 bg-red-500/5'
  };

  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all border ${
        active 
          ? 'border-amber-500/50 bg-zinc-900/60 shadow-[0_4px_20px_rgba(245,158,11,0.04)]' 
          : 'border-zinc-900/50 bg-zinc-950/30 hover:bg-zinc-900/20'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-black/40 border border-zinc-900 flex items-center justify-center shrink-0 relative">
          <Trophy size={12} className={completed ? "text-green-500" : "text-zinc-600"} />
          {completed && (
            <div className="absolute inset-0 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Check className="text-green-500 stroke-[3px]" size={10} />
            </div>
          )}
        </div>
        
        <div className="min-w-0">
          <h4 className="text-xs font-black uppercase italic tracking-tight text-white truncate">
            {challenge.name}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`text-[6.5px] font-black uppercase px-1 rounded border leading-none ${diffConfigs[challenge.difficulty]}`}>
              {challenge.difficulty}
            </span>
            <span className="text-[7px] font-bold text-zinc-500 truncate">
               {challenge.reward.playerName} ({challenge.reward.ovr})
            </span>
          </div>
        </div>
      </div>

      <ChevronRight size={13} className={active ? 'text-white' : 'text-zinc-700'} />
    </div>
  );
};

// Tactical Positions Mapping (Scale controlled coordinates from 0-100)
const getSlotCoordinates = (totalSlots: number, slotPositions?: string[]) => {
  if (totalSlots === 5) {
    return [
      { x: 50, y: 15, label: slotPositions?.[0] || 'PG' },
      { x: 20, y: 40, label: slotPositions?.[1] || 'SG' },
      { x: 80, y: 40, label: slotPositions?.[2] || 'SF' },
      { x: 30, y: 78, label: slotPositions?.[3] || 'PF' },
      { x: 70, y: 78, label: slotPositions?.[4] || 'C' }
    ];
  }
  if (totalSlots === 3) {
    return [
      { x: 50, y: 18, label: slotPositions?.[0] || 'PG' },
      { x: 22, y: 65, label: slotPositions?.[1] || 'SG' },
      { x: 78, y: 65, label: slotPositions?.[2] || 'SF' }
    ];
  }
  if (totalSlots === 4) {
    return [
      { x: 50, y: 15, label: slotPositions?.[0] || 'PG' },
      { x: 20, y: 48, label: slotPositions?.[1] || 'SG' },
      { x: 80, y: 48, label: slotPositions?.[2] || 'SF' },
      { x: 50, y: 80, label: slotPositions?.[3] || 'C' }
    ];
  }
  
  // Grid layout fallback keeping everything on screen
  const coords = [];
  const cols = totalSlots <= 6 ? 3 : 4;
  const rows = Math.ceil(totalSlots / cols);
  
  for (let i = 0; i < totalSlots; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const countInRow = Math.min(cols, totalSlots - r * cols);
    const x = countInRow === 1 ? 50 : 15 + (c * (70 / Math.max(1, countInRow - 1)));
    const y = rows === 1 ? 50 : 20 + (r * (60 / Math.max(1, rows - 1)));
    coords.push({ x, y, label: slotPositions?.[i] || 'ANY' });
  }
  return coords;
};

const getCohesionLines = (totalSlots: number) => {
  if (totalSlots === 5) {
    return [
      { from: 0, to: 1 }, { from: 0, to: 2 },
      { from: 1, to: 3 }, { from: 2, to: 4 },
      { from: 3, to: 4 }
    ];
  }
  if (totalSlots === 3) {
    return [
      { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 2 }
    ];
  }
  if (totalSlots === 4) {
    return [
      { from: 0, to: 1 }, { from: 0, to: 2 },
      { from: 1, to: 3 }, { from: 2, to: 3 }
    ];
  }
  const lines = [];
  for (let i = 0; i < totalSlots - 1; i++) {
    lines.push({ from: i, to: i + 1 });
  }
  return lines;
};

const SbcView: React.FC = () => {
  const { collection, customCards, updateGameStateAsync, completedSbcs = [] } = useGame();
  
  const [selectedChallenge, setSelectedChallenge] = useState<SbcChallenge | null>(null);
  const [slots, setSlots] = useState<(Card | null)[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardReveal, setRewardReveal] = useState<Card | null>(null);

  // Selector filters
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [sortDuplicatesBy, setSortDuplicatesBy] = useState<'OVR' | 'Name' | 'Count'>('OVR');

  useEffect(() => {
    if (selectedChallenge) {
      setSlots(new Array(selectedChallenge.cardsRequired).fill(null));
    }
  }, [selectedChallenge]);

  const duplicates = useMemo(() => {
    const allAvailable = [...ALL_CARDS, ...customCards];
    return sbcService.getDuplicates(collection, allAvailable);
  }, [collection, customCards]);

  const filteredDuplicates = useMemo(() => {
    const usedIds = slots.filter(s => s !== null).map(s => s!.id);
    const filtered = duplicates.filter(card => {
      const matchSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPos = posFilter === 'ALL' || card.position === posFilter;
      const matchRarity = rarityFilter === 'ALL' || card.rarity === rarityFilter;
      const notInSlots = !usedIds.includes(card.id);
      return matchSearch && matchPos && matchRarity && notInSlots;
    });
    return [...filtered].sort((a, b) => {
      if (sortDuplicatesBy === 'OVR') {
        return b.stats.ovr - a.stats.ovr;
      }
      if (sortDuplicatesBy === 'Name') {
        return a.name.localeCompare(b.name);
      }
      if (sortDuplicatesBy === 'Count') {
        const countA = collection[a.id] || 0;
        const countB = collection[b.id] || 0;
        return countB - countA;
      }
      return 0;
    });
  }, [duplicates, searchTerm, posFilter, rarityFilter, slots, sortDuplicatesBy, collection]);

  const validation = useMemo(() => {
    if (!selectedChallenge) return { allFulfilled: false, details: [] };
    const filledSlots = slots.filter(s => s !== null) as Card[];
    return sbcService.checkRequirements(filledSlots, selectedChallenge.requirements);
  }, [slots, selectedChallenge]);

  const coords = useMemo(() => {
    return getSlotCoordinates(slots.length, selectedChallenge?.slotPositions);
  }, [slots.length, selectedChallenge]);

  const cohesionLines = useMemo(() => {
    return getCohesionLines(slots.length);
  }, [slots.length]);

  const avgOvr = useMemo(() => {
    const filledSlots = slots.filter(s => s !== null) as Card[];
    const sumOvr = filledSlots.reduce((sum, c) => sum + c.stats.ovr, 0);
    return slots.length > 0 ? (sumOvr / slots.length).toFixed(1) : '0.0';
  }, [slots]);

  // Live OVR feedback calculation
  const getLiveOVRDiff = (card: Card) => {
    if (activeSlotIndex === null) return null;
    const currentCard = slots[activeSlotIndex];
    const sumOvr = slots.reduce((sum, c) => sum + (c ? c.stats.ovr : 0), 0);
    const currentCardOvr = currentCard ? currentCard.stats.ovr : 0;
    const newSum = sumOvr - currentCardOvr + card.stats.ovr;
    
    const currentAvg = slots.length > 0 ? sumOvr / slots.length : 0;
    const newAvg = slots.length > 0 ? newSum / slots.length : 0;
    
    return {
      diff: newAvg - currentAvg,
      newAvg
    };
  };

  const handleSelectCard = (card: Card) => {
    if (activeSlotIndex === null) return;
    const newSlots = [...slots];
    newSlots[activeSlotIndex] = card;
    setSlots(newSlots);
    setIsSelectorOpen(false);
    setActiveSlotIndex(null);
  };

  const handleRemoveCard = (index: number) => {
    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);
  };

  const handleSubmit = async () => {
    if (!selectedChallenge || !validation.allFulfilled) return;
    setIsSubmitting(true);

    const usedCards = slots.filter(s => s !== null) as Card[];
    const newCollection = { ...collection };
    usedCards.forEach(card => {
      if (newCollection[card.id] > 1) {
        newCollection[card.id] -= 1;
      } else {
        delete newCollection[card.id];
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

    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      await updateGameStateAsync({
        collection: newCollection,
        completedSbcs: newCompleted,
        customCards: [...customCards, rewardCard]
      });

      setRewardReveal(rewardCard);

      const colorPalette = {
        'future_star': ['#00ff88', '#ffffff'],
        'moments_sbc': ['#ffffff', '#c0c0c0'],
        'icon_sbc': ['#ffd700', '#1a4fd4'],
        'legend_sbc': ['#ffd700', '#000000'],
        'galaxy': ['#00ffff', '#9b59b6', '#0000ff'],
        'invincible': ['#ff0000', '#00ff00', '#00ff00', '#ffff00', '#ff00ff'],
      }[rewardCard.rarity] || ['#ffd700'];

      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 },
        colors: colorPalette
      });

    } catch (err) {
      console.error('SBC submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedChallenges = useMemo(() => {
    return {
      limited: SBC_CHALLENGES.filter(c => c.type === 'limited' && !completedSbcs.includes(c.id)),
      active: SBC_CHALLENGES.filter(c => c.type === 'permanent' && !completedSbcs.includes(c.id)),
      completed: SBC_CHALLENGES.filter(c => completedSbcs.includes(c.id))
    };
  }, [completedSbcs]);

  return (
    <div className="h-full w-full bg-black text-white flex select-none overflow-hidden font-sans relative">
      
      {/* LEFT COLUMN: Challenges selector (Always shown on desktop, hidden on mobile if challenge active) */}
      <aside className={`w-full md:w-[280px] lg:w-[320px] bg-zinc-950 border-r border-zinc-900 flex-col flex overflow-hidden shrink-0 ${selectedChallenge ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-zinc-900/50">
          <div className="flex items-center gap-2 mb-1">
            <Puzzle size={16} className="text-amber-500 shrink-0" />
            <h1 className="text-sm font-black uppercase italic tracking-tight">SBC PREMIUM</h1>
          </div>
          <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Burn duplicates to construct legacy players</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          {groupedChallenges.limited.length > 0 && (
            <div>
              <h3 className="text-[8px] font-black tracking-[0.2em] text-red-500 uppercase mb-2 flex items-center gap-1.5 px-1 leading-none">
                <Clock size={10} /> Limited Time Offers
              </h3>
              <div className="space-y-1.5">
                {groupedChallenges.limited.map(c => (
                  <CompactSbcItem 
                    key={c.id} 
                    challenge={c} 
                    active={selectedChallenge?.id === c.id}
                    completed={false}
                    onClick={() => setSelectedChallenge(c)} 
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[8px] font-black tracking-[0.2em] text-amber-500 uppercase mb-2 flex items-center gap-1.5 px-1 leading-none">
              ⭐ Active Challenges
            </h3>
            <div className="space-y-1.5">
              {groupedChallenges.active.map(c => (
                <CompactSbcItem 
                  key={c.id} 
                  challenge={c} 
                  active={selectedChallenge?.id === c.id}
                  completed={false}
                  onClick={() => setSelectedChallenge(c)} 
                />
              ))}
            </div>
          </div>

          {groupedChallenges.completed.length > 0 && (
            <div>
              <h3 className="text-[8px] font-black tracking-[0.2em] text-zinc-500 uppercase mb-2 flex items-center gap-1 px-1 leading-none">
                Completed ({groupedChallenges.completed.length})
              </h3>
              <div className="space-y-1.5">
                {groupedChallenges.completed.map(c => (
                  <CompactSbcItem 
                    key={c.id} 
                    challenge={c} 
                    active={selectedChallenge?.id === c.id}
                    completed={true}
                    onClick={() => setSelectedChallenge(c)} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* RIGHT COLUMN: SINGLE-SCREEN CONSTRUCTOR */}
      <main className={`flex-1 flex flex-col bg-zinc-950 overflow-hidden relative min-h-0 ${!selectedChallenge ? 'hidden md:flex' : 'flex'}`}>
        
        {selectedChallenge ? (
          <>
            {/* 1. Header (Fina y compacta en una fila) */}
            <header className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <button 
                  onClick={() => setSelectedChallenge(null)}
                  className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer mr-1"
                >
                  <ArrowLeft size={14} />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-black italic uppercase tracking-tight text-white leading-none truncate">
                      {selectedChallenge.name}
                    </h2>
                    <span className="text-[6.5px] font-black bg-zinc-900 border border-zinc-800 text-zinc-450 px-1.5 py-0.5 rounded leading-none uppercase shrink-0">
                      {selectedChallenge.difficulty}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-right shrink-0">
                <span className="text-[9px] font-mono font-black text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded leading-none">
                  {avgOvr} TEAM OVR
                </span>
                <span className="text-[9px] lg:text-[10px] font-black tracking-widest text-zinc-500 uppercase leading-none">
                  {slots.filter(s => s).length} / {slots.length} FILLED
                </span>
              </div>
            </header>

            {/* 2. Faja de Requisitos Ultra-Compresa */}
            <div className="px-4 py-2 border-b border-white/5 bg-black/60 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 scroll-smooth">
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

            {/* 3. Tactical Court Workspace - Perfect Screen Fit Scale */}
            <div className="flex-1 min-h-0 relative p-3 flex items-center justify-center overflow-hidden bg-black/25">
              <div className="w-full max-w-[370px] sm:max-w-[500px] lg:max-w-[580px] aspect-[4/3] relative border border-zinc-900/50 bg-zinc-950/20 rounded-2xl overflow-hidden shadow-2xl p-2 flex items-center justify-center shrink-0">
                
                {/* Basketball court markings SVG */}
                <svg className="absolute inset-0 w-full h-full opacity-5 pointer-events-none stroke-current" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100" y2="0" stroke="white" strokeWidth="0.8" />
                  <path d="M 12 100 A 42 42 0 0 1 88 100" fill="none" stroke="white" strokeWidth="0.5" />
                  <rect x="36" y="65" width="28" height="35" fill="none" stroke="white" strokeWidth="0.5" />
                  <circle cx="50" cy="65" r="14" fill="none" stroke="white" strokeWidth="0.5" />
                </svg>

                {/* Elegant dynamic linking wires */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  {cohesionLines.map((line, lIdx) => {
                    const fromSlot = coords[line.from];
                    const toSlot = coords[line.to];
                    if (!fromSlot || !toSlot) return null;
                    return (
                      <line
                        key={lIdx}
                        x1={`${fromSlot.x}%`}
                        y1={`${fromSlot.y}%`}
                        x2={`${toSlot.x}%`}
                        y2={`${toSlot.y}%`}
                        stroke="rgba(245, 158, 11, 0.12)"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        className="stroke-amber-500/15"
                      />
                    );
                  })}
                </svg>

                {/* Space integrated slots */}
                {slots.map((card, idx) => {
                  const coord = coords[idx];
                  if (!coord) return null;
                  const expectedPos = coord.label;
                  const isCorrectPos = card ? card.position === expectedPos : false;

                  return (
                    <div 
                      key={idx}
                      className="absolute z-10 transition-all duration-300"
                      style={{ 
                        left: `${coord.x}%`, 
                        top: `${coord.y}%`, 
                        transform: 'translate(-50%, -50%)',
                        width: '18%',
                        maxWidth: '85px',
                        minWidth: '55px',
                      }}
                    >
                      {card ? (
                        <div className="relative group cursor-pointer aspect-[2.5/3.5] w-full">
                           {/* Small color status bullet */}
                           <span className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border border-black z-40 flex items-center justify-center text-[5px] font-black leading-none ${
                             isCorrectPos ? 'bg-green-500' : 'bg-amber-500 animate-pulse'
                           }`} />

                           <CardItem card={card} isOwned={true} mode="mini" />

                           {/* Mini remove button */}
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleRemoveCard(idx);
                             }}
                             className="absolute -bottom-1 -right-1 bg-red-650 hover:bg-red-500 p-1 rounded-md z-40 shadow-xl opacity-80 hover:opacity-100 transition-all text-white border border-red-500"
                           >
                             <X size={8} strokeWidth={3} />
                           </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setActiveSlotIndex(idx);
                            setIsSelectorOpen(true);
                          }}
                          className="w-full aspect-[2.5/3.5] relative rounded-xl border border-dashed border-zinc-800 bg-black/60 flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/40 hover:bg-zinc-950/40 transition-all p-1"
                        >
                          <span className="text-xs sm:text-sm font-black text-zinc-700 uppercase tracking-tighter leading-none mb-0.5">
                            {expectedPos}
                          </span>
                          <span className="text-[5.5px] font-black text-zinc-650 uppercase tracking-widest leading-none">
                            ADD
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Barra de Herramientas Flotante / Compacta al Fondo */}
            <div className="p-3 border-t border-white/5 bg-zinc-950/90 backdrop-blur-md flex items-center justify-center gap-3 shrink-0">
               <button 
                 onClick={() => setSlots(new Array(selectedChallenge.cardsRequired).fill(null))}
                 className="p-3 bg-zinc-900 hover:bg-zinc-850 hover:text-red-400 text-zinc-650 rounded-xl transition-all border border-zinc-850 cursor-pointer"
                 title="CLEAR ALL"
               >
                 <Trash2 size={14} />
               </button>

               <button 
                disabled={!validation.allFulfilled || isSubmitting}
                onClick={handleSubmit}
                className={`py-3.5 px-10 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  validation.allFulfilled 
                    ? 'bg-green-600 text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] hover:scale-102 active:scale-98 cursor-pointer' 
                    : 'bg-zinc-900 border border-zinc-850/50 text-zinc-600 cursor-not-allowed'
                }`}
               >
                 {isSubmitting ? (
                   <RefreshCw className="animate-spin text-green-400" size={12} />
                 ) : (
                   <>SUBMIT SQUAD <ArrowRight size={10} /></>
                 )}
               </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-black/10 select-none">
             <Puzzle size={30} className="text-zinc-700 mb-4 animate-pulse" />
             <h3 className="text-sm font-black uppercase tracking-widest text-zinc-600 mb-1">No Challenge Selected</h3>
             <p className="text-[9px] text-zinc-550 uppercase tracking-widest max-w-[200px] leading-relaxed">
               Pick a squad building challenge on the side board to begin!
             </p>
          </div>
        )}
      </main>

      {/* --- DUPLICATE SELECTOR MODAL (Compact, dense, 4 columns on mobile) --- */}
      <AnimatePresence>
        {isSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7500] bg-black/95 backdrop-blur-xl flex items-center justify-center p-0 md:p-6"
          >
            <div className="w-full h-full max-w-5xl flex flex-col bg-zinc-950 border border-zinc-900 rounded-none md:rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Header */}
              <header className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-zinc-900 shrink-0">
                 <div>
                    <h2 className="text-sm font-black italic uppercase tracking-tighter mb-0.5 leading-none">DUPLICATES ROSTER</h2>
                    <p className="text-zinc-600 text-[7px] font-black uppercase tracking-widest leading-none">
                       SLOT: {activeSlotIndex !== null ? coords[activeSlotIndex]?.label : ''} • EXPECTED POSITION REQUIRED
                    </p>
                 </div>
                 
                 <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-60">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={12} />
                       <input 
                         type="text" 
                         placeholder="SEARCH ATHLETES..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full bg-zinc-900 border border-zinc-850 rounded-lg py-2.5 pl-9 pr-4 text-[9px] font-black uppercase tracking-wider focus:border-amber-500 focus:outline-none transition-all placeholder-zinc-700 text-white"
                       />
                    </div>
                    <button 
                      onClick={() => setIsSelectorOpen(false)}
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 cursor-pointer"
                    >
                       <X size={15} />
                    </button>
                 </div>
              </header>

               {/* Filters Fila única */}
               <div className="px-4 py-2 border-b border-zinc-900 flex flex-col gap-2 bg-black/20 shrink-0">
                 {/* Position Filters */}
                 <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[8px] font-black uppercase">
                   <span className="text-zinc-550 mr-2 text-[7px]">POS:</span>
                   {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map(pos => (
                     <button 
                       key={pos}
                       onClick={() => setPosFilter(pos)}
                       className={`px-2.5 py-1.5 rounded transition-all shrink-0 ${posFilter === pos ? 'bg-amber-500 text-black font-extrabold' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                     >
                       {pos}
                     </button>
                   ))}
                 </div>
                 
                 {/* Rarity Filters */}
                 <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[8px] font-black uppercase">
                    <span className="text-zinc-550 mr-2 text-[7px]">RARITY:</span>
                    {['ALL', 'bench', 'starter', 'allstar', 'franchise', 'legend', 'rookie', 'rising_star', 'dpoy', 'roty', 'record', 'coach', 'invincible', 'galaxy', 'future_star', 'moments_sbc', 'icon_sbc', 'legend_sbc'].map(rar => (
                      <button 
                        key={rar}
                        onClick={() => setRarityFilter(rar)}
                        className={`px-2.5 py-1.5 rounded transition-all shrink-0 ${rarityFilter === rar ? 'bg-white text-black font-extrabold' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {rar === 'allstar' ? 'All-Star' : rar === 'rising_star' ? 'Rising Star' : rar.replace('_sbc', '').toUpperCase()}
                      </button>
                    ))}
                 </div>
                 {/* Sorting Row */}
                 <div className="flex items-center gap-1 text-[8px] font-black uppercase pt-1 border-t border-zinc-900/50">
                    <span className="text-zinc-550 mr-2 text-[7px]">SORT BY:</span>
                    {(['OVR', 'Name', 'Count'] as const).map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setSortDuplicatesBy(mode)}
                        className={`px-2.5 py-1 rounded transition-all shrink-0 ${sortDuplicatesBy === mode ? 'bg-purple-600 text-white font-extrabold' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                      >
                        {mode === 'Count' ? 'Duplicates Count' : mode}
                      </button>
                    ))}
                 </div>
               </div>

              {/* Grid Compacto de Duplicados */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/40">
                {filteredDuplicates.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
                    {filteredDuplicates.map(card => {
                      const impact = getLiveOVRDiff(card);
                      const isWinning = impact ? impact.diff > 0 : false;
                      const isLosing = impact ? impact.diff < 0 : false;

                      return (
                        <div 
                          key={card.id}
                          onClick={() => handleSelectCard(card)}
                          className="relative cursor-pointer group flex flex-col items-center w-full"
                        >
                           {/* Rating variation indicator label */}
                           {impact !== null && (
                             <div className={`absolute top-1 left-1 z-[95] text-[6.5px] font-mono font-black scale-90 rounded p-0.5 shadow-md flex items-center leading-none ${
                               isWinning 
                                 ? 'bg-green-950 text-green-400 border border-green-900' 
                                 : isLosing 
                                   ? 'bg-red-950 text-red-400 border border-red-950' 
                                   : 'bg-zinc-900/90 text-zinc-500 border border-zinc-800'
                             }`}>
                               {isWinning ? `+${impact.diff.toFixed(1)}` : impact.diff === 0 ? '=' : impact.diff.toFixed(1)}
                             </div>
                           )}

                           <CardItem card={card} isOwned={true} mode="mini" />

                           {/* Compact Duplicates Unit badge */}
                           <div className="absolute -bottom-1 -right-1 bg-cyan-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded shadow-lg z-40 leading-none">
                              ×{(collection[card.id] || 1) - 1}
                           </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-35 select-none py-10">
                     <Puzzle size={30} className="mb-3 text-zinc-650 animate-bounce" />
                     <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500">NO AVAILABLE DUPLICATES</h4>
                     <p className="text-[7px] font-bold uppercase tracking-wider text-zinc-600 mt-1">Keep tearing free packs to collect duplicates first!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- REWARD REVEAL PANEL --- */}
      <AnimatePresence>
        {rewardReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            <motion.div 
              initial={{ width: 0, height: 0 }}
              animate={{ width: '400vw', height: '400vw' }}
              transition={{ duration: 1.2, ease: "circIn" }}
              className="absolute bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.06)_0%,_transparent_65%)] rounded-full"
            />

            <div className="relative z-[10001] flex flex-col items-center p-4 text-center max-w-sm">
               <motion.div
                 initial={{ scale: 0, rotateY: 180 }}
                 animate={{ scale: 1, rotateY: 0 }}
                 transition={{ delay: 0.3, duration: 1.5, type: 'spring' }}
                 className="mb-6 w-44"
               >
                 <SBCCard card={rewardReveal} size="lg" />
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, y: 15 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 1 }}
               >
                 <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-1.5 text-shadow">
                   CHALLENGE COMPLETE
                 </h2>
                 
                 <p className={`text-xs font-black uppercase tracking-[0.2em] mb-8 ${
                    rewardReveal.rarity === 'future_star' ? 'text-[#00ff88]' :
                    rewardReveal.rarity === 'moments_sbc' ? 'text-white' :
                    rewardReveal.rarity === 'icon_sbc' ? 'text-[#ffd700]' :
                    rewardReveal.rarity === 'legend_sbc' ? 'text-[#ffb300]' :
                    rewardReveal.rarity === 'galaxy' ? 'text-[#00e5ff]' : 'text-amber-500'
                  }`}>
                   {rewardReveal.rarity.replace(/_sbc|_/g, ' ')}
                 </p>
                 
                 <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => setRewardReveal(null)}
                      className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black uppercase tracking-widest text-[9px] transition-all cursor-pointer shadow-lg shadow-green-600/20"
                    >
                      COLLECT REWARD
                    </button>
                    <button 
                      onClick={() => {
                        setRewardReveal(null);
                        setSelectedChallenge(null);
                      }}
                      className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all border border-zinc-800 cursor-pointer"
                    >
                      ALL SQUADS
                    </button>
                 </div>
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default SbcView;
