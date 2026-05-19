import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Puzzle, Star, CheckCircle2, XCircle, Search, Filter, 
  Trash2, ArrowRight, Trophy, Sparkles, Clock, AlertCircle,
  Menu, X, ChevronRight, Check
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

const RequirementChip: React.FC<{ 
  req: SbcRequirement; 
  fulfilled: boolean; 
}> = ({ req, fulfilled }) => {
  const getReqText = () => {
    switch (req.type) {
      case 'MIN_RARITY': return `MIN. RARITY: ${req.value}`;
      case 'EXACT_RARITY': return `${req.count}x ${req.value}`;
      case 'POSITION': return `${req.count}x ${req.value}`;
      case 'MIN_OVR': return `MIN. OVR: ${req.value}`;
      case 'TOTAL_CARDS': return `CARDS: ${req.value}`;
      case 'UNIQUE_PLAYERS': return `UNIQUE PLAYERS`;
      default: return req.type;
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        scale: fulfilled ? [1, 1.1, 1] : 1,
        borderColor: fulfilled ? '#22c55e' : 'rgba(255,255,255,0.1)',
        backgroundColor: fulfilled ? 'rgba(34,197,94,0.1)' : 'rgba(0,0,0,0.4)'
      }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-colors"
    >
      {fulfilled ? <Check size={10} className="text-green-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
      <span className={fulfilled ? 'text-green-500' : 'text-zinc-400'}>{getReqText()}</span>
    </motion.div>
  );
};

const SbcListItem: React.FC<{ 
  challenge: SbcChallenge; 
  active: boolean; 
  completed: boolean;
  onClick: () => void;
}> = ({ challenge, active, completed, onClick }) => {
  const diffConfigs = {
    bronze: 'diff-bronze',
    silver: 'diff-silver',
    gold: 'diff-gold',
    elite: 'diff-elite',
    legendary: 'diff-legendary'
  };

  return (
    <div 
      onClick={onClick}
      className={`sbc-list-item p-3 rounded-xl cursor-pointer flex items-center gap-4 relative overflow-hidden ${active ? 'active border-l-amber-500 bg-white/10' : ''} ${completed ? 'opacity-60' : ''}`}
    >
      <div className="w-16 h-24 shrink-0 relative flex items-center justify-center bg-black/40 rounded-lg overflow-hidden border border-white/5">
        <Trophy size={24} className={`text-zinc-800 ${!completed ? 'animate-pulse' : ''}`} />
        {completed && (
          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-[2px] flex items-center justify-center">
            <Check Circle2 className="text-green-500" size={24} />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[8px] font-black uppercase ${diffConfigs[challenge.difficulty]}`}>
            {challenge.difficulty}
          </span>
          {challenge.type === 'limited' && (
            <span className="text-[7px] font-black text-red-500 flex items-center gap-1 animate-pulse">
              <Clock size={8} /> LIMITED
            </span>
          )}
        </div>
        <h3 className="text-sm font-black text-white uppercase italic truncate">
          {challenge.name}
        </h3>
        <p className="text-[9px] text-zinc-500 uppercase truncate">
          {challenge.description}
        </p>
      </div>

      <ChevronRight size={16} className={`text-zinc-700 transition-transform ${active ? 'translate-x-1 text-white' : ''}`} />
    </div>
  );
};

// --- Main View Component ---

const SbcView: React.FC = () => {
  const { collection, customCards, updateGameStateAsync, user, completedSbcs = [], coins } = useGame();
  const [selectedChallenge, setSelectedChallenge] = useState<SbcChallenge | null>(null);
  const [slots, setSlots] = useState<(Card | null)[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rewardReveal, setRewardReveal] = useState<Card | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters for Selector
  const [searchTerm, setSearchTerm] = useState('');
  const [posFilter, setPosFilter] = useState('ALL');
  const [rarityFilter, setRarityFilter] = useState('ALL');

  useEffect(() => {
    if (selectedChallenge) {
      setSlots(new Array(selectedChallenge.cardsRequired).fill(null));
      setIsMobileMenuOpen(false);
    }
  }, [selectedChallenge]);

  const duplicates = useMemo(() => {
    const allAvailable = [...ALL_CARDS, ...customCards];
    return sbcService.getDuplicates(collection, allAvailable);
  }, [collection, customCards]);

  const filteredDuplicates = useMemo(() => {
    const usedIds = slots.filter(s => s !== null).map(s => s!.id);
    return duplicates.filter(card => {
      const matchSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchPos = posFilter === 'ALL' || card.position === posFilter;
      const matchRarity = rarityFilter === 'ALL' || card.rarity === rarityFilter;
      const notInSlots = !usedIds.includes(card.id);
      return matchSearch && matchPos && matchRarity && notInSlots;
    });
  }, [duplicates, searchTerm, posFilter, rarityFilter, slots]);

  const validation = useMemo(() => {
    if (!selectedChallenge) return { allFulfilled: false, details: [] };
    const filledSlots = slots.filter(s => s !== null) as Card[];
    return sbcService.checkRequirements(filledSlots, selectedChallenge.requirements);
  }, [slots, selectedChallenge]);

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

    // 1. Prepare updates
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
      ALL_CARDS
    );
    newCollection[rewardCard.id] = (newCollection[rewardCard.id] || 0) + 1;
    const newCompleted = [...completedSbcs, selectedChallenge.id];

    // 2. Wait for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      await updateGameStateAsync({
        collection: newCollection,
        completedSbcs: newCompleted,
        customCards: [...customCards, rewardCard]
      });

      // 3. Reveal Animation Trigger
      setRewardReveal(rewardCard);
      
      // Explosion logic by rarity
      const particleConfig = {
        'future_star': { colors: ['#00ff88', '#ffffff'] },
        'moments_sbc': { colors: ['#ffffff', '#c0c0c0'] },
        'icon_sbc': { colors: ['#ffd700', '#1a4fd4'] },
        'legend_sbc': { colors: ['#ffd700', '#000000'] },
        'galaxy': { colors: ['#00ffff', '#9b59b6', '#0000ff'] },
        'invincible': { colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'] },
      }[rewardCard.rarity] || { colors: ['#ffd700'] };

      confetti({
        particleCount: 200,
        spread: 160,
        origin: { y: 0.6 },
        colors: particleConfig.colors
      });

    } catch (err) {
      console.error('SBC Submission failed', err);
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
    <div className="min-h-screen sbc-bg text-white selection:bg-amber-500/30 overflow-x-hidden font-sans">
      
      {/* --- Main Layout --- */}
      <div className="flex h-screen overflow-hidden">
        
        {/* Left Column: List (Desktop) / Bottom Sheet (Mobile) */}
        <aside className="hidden md:flex w-[350px] lg:w-[450px] border-r border-white/5 flex-col bg-black/40 backdrop-blur-xl">
          <div className="p-6 border-b border-white/5">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-black">
                   <Puzzle size={24} strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-black italic uppercase tracking-tighter">SBC HUB</h1>
             </div>
             <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Build Squads • Earn Legends</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {groupedChallenges.limited.length > 0 && (
              <div>
                <h2 className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                  <Clock size={12} /> ⏱ LIMITED TIME
                </h2>
                <div className="space-y-3">
                  {groupedChallenges.limited.map(c => (
                    <SbcListItem 
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
              <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                🔥 ACTIVE CHALLENGES
              </h2>
              <div className="space-y-3">
                {groupedChallenges.active.map(c => (
                  <SbcListItem 
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
              <details className="group">
                <summary className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2 cursor-pointer list-none">
                  <CheckCircle2 size={12} /> ✅ COMPLETED ({groupedChallenges.completed.length})
                </summary>
                <div className="space-y-3 pt-2">
                  {groupedChallenges.completed.map(c => (
                    <SbcListItem 
                      key={c.id} 
                      challenge={c} 
                      active={selectedChallenge?.id === c.id}
                      completed={true}
                      onClick={() => setSelectedChallenge(c)} 
                    />
                  ))}
                </div>
              </details>
            )}
          </div>
        </aside>

        {/* Right Column: Constructor Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {selectedChallenge ? (
            <>
              {/* Constructor Header */}
              <header className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 shrink-0">
                <div>
                   <div className="flex items-center gap-4 mb-2">
                     <h2 className="text-xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                       {selectedChallenge.name}
                     </h2>
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border border-current diff-${selectedChallenge.difficulty}`}>
                        {selectedChallenge.difficulty}
                     </span>
                   </div>
                   <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{selectedChallenge.description}</p>
                </div>
                
                <div className="flex items-center gap-4">
                  {selectedChallenge.type === 'limited' && (
                    <div className="hidden lg:flex items-center gap-2 text-red-500 bg-red-500/10 px-4 py-2 rounded-xl border border-red-500/20">
                      <Clock size={16} className="animate-pulse" />
                      <span className="text-sm font-black italic uppercase">EXPIRES SOON</span>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedChallenge(null);
                      setSlots([]);
                    }}
                    className="p-3 bg-zinc-900 rounded-xl hover:bg-white hover:text-black transition-all md:hidden"
                  >
                    <ArrowRight size={20} className="rotate-180" />
                  </button>
                </div>
              </header>

              {/* Requirements Area */}
              <div className="px-6 md:px-8 py-4 flex flex-wrap gap-3 border-b border-white/5 bg-black/20 shrink-0">
                {(selectedChallenge.requirements || []).map((req, idx) => {
                  const detail = validation.details.find(d => d.type === req.type);
                  return <RequirementChip key={idx} req={req} fulfilled={detail?.fulfilled || false} />;
                })}
              </div>

              {/* Grid Area */}
              <div className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center custom-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-10 max-w-5xl justify-center items-center">
                  <AnimatePresence mode="popLayout">
                    {slots.map((card, idx) => (
                      <div key={idx} className="relative group">
                        {card ? (
                          <motion.div
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className="relative fifa-card-pro w-[100px] md:w-[130px] rounded-xl overflow-hidden"
                          >
                             <CardItem card={card} isOwned={true} mode="mini" />
                             <button
                               onClick={() => handleRemoveCard(idx)}
                               className="absolute -top-2 -right-2 bg-red-600 p-1.5 rounded-lg z-[80] shadow-xl group-hover:scale-110 opacity-0 group-hover:opacity-100 transition-all"
                             >
                               <X size={12} />
                             </button>
                          </motion.div>
                        ) : (
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setActiveSlotIndex(idx);
                              setIsSelectorOpen(true);
                            }}
                            className="sbc-slot fifa-card-pro w-[100px] md:w-[130px] flex flex-col items-center justify-center cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-all group-hover:bg-amber-500 group-hover:text-black">
                               <span className="text-2xl font-light">+</span>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="p-6 md:p-10 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl shrink-0 flex flex-col sm:flex-row items-center justify-center gap-4">
                 <button 
                   onClick={() => setSlots(new Array(selectedChallenge.cardsRequired).fill(null))}
                   className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-zinc-500 hover:text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                 >
                   CLEAR ALL
                 </button>
                 <button 
                  disabled={!validation.allFulfilled || isSubmitting}
                  onClick={handleSubmit}
                  className={`w-full sm:w-auto px-16 py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 ${
                    validation.allFulfilled 
                    ? 'bg-green-600 text-white shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95' 
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                 >
                   {isSubmitting ? (
                     <Sparkles className="animate-spin" size={16} />
                   ) : (
                     <>SUBMIT SBC <ArrowRight size={16} /></>
                   )}
                 </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,_#111_0%,_#0d0f14_100%)]">
               <div className="w-24 h-24 bg-zinc-800 rounded-3xl flex items-center justify-center text-zinc-600 mb-8 animate-bounce">
                  <Puzzle size={48} strokeWidth={1} />
               </div>
               <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white/20 mb-4 select-none">
                 SELECT A CHALLENGE
               </h2>
               <p className="text-zinc-700 text-sm font-bold uppercase tracking-[0.3em] max-w-md select-none">
                 Exchange players from your collection to earn special edition rewards.
               </p>
               
               {/* Mobile Switcher Button */}
               <button 
                 onClick={() => setIsMobileMenuOpen(true)}
                 className="mt-12 px-10 py-5 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl md:hidden"
               >
                 VIEW CHALLENGES
               </button>
            </div>
          )}
        </main>
      </div>

      {/* --- Duplicate Selector Modal --- */}
      <AnimatePresence>
        {isSelectorOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-8"
          >
            <div className="w-full h-full max-w-7xl flex flex-col">
              {/* Modal Header */}
              <header className="p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shrink-0">
                 <div>
                    <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter mb-1">SELECT YOUR DUPLICATES</h2>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                       {slots.filter(s => s).length} / {slots.length} slots filled
                    </p>
                 </div>
                 
                 <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                       <input 
                         type="text" 
                         placeholder="Search Player..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-black uppercase tracking-widest focus:border-amber-500 focus:outline-none transition-all"
                       />
                    </div>
                    <button 
                      onClick={() => setIsSelectorOpen(false)}
                      className="p-4 bg-zinc-900 border border-white/10 rounded-2xl hover:bg-white hover:text-black transition-all"
                    >
                       <X size={24} />
                    </button>
                 </div>
              </header>

              {/* Filters */}
              <div className="px-6 md:px-10 py-4 flex items-center gap-4 overflow-x-auto no-scrollbar shrink-0 border-b border-white/5">
                <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                  {['ALL', 'PG', 'SG', 'SF', 'PF', 'C'].map(pos => (
                    <button 
                      key={pos}
                      onClick={() => setPosFilter(pos)}
                      className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${posFilter === pos ? 'bg-white text-black' : 'bg-white/5 text-zinc-500 hover:bg-white/10'}`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                   {['ALL', 'COMMON', 'RARE', 'EPIC', 'STAR', 'FRANCHISE'].map(rar => (
                     <button 
                       key={rar}
                       onClick={() => setRarityFilter(rar)}
                       className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${rarityFilter === rar ? 'bg-amber-600 text-white' : 'bg-white/5 text-zinc-500'}`}
                     >
                        {rar}
                     </button>
                   ))}
                </div>
              </div>

              {/* Grid of Duplicates */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                {filteredDuplicates.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-10">
                    {filteredDuplicates.map(card => (
                      <motion.div 
                        key={card.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelectCard(card)}
                        className="relative cursor-pointer group"
                      >
                         <CardItem card={card} isOwned={true} mode="mini" />
                         <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-xl border border-white/20 z-[90]">
                            ×{(collection[card.id] || 1) - 1}
                         </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 select-none">
                     <Puzzle size={80} strokeWidth={1} className="mb-6 animate-pulse" />
                     <h3 className="text-2xl font-black italic uppercase tracking-tighter mb-2">NO DUPLICATES AVAILABLE</h3>
                     <p className="text-xs font-bold uppercase tracking-[0.2em] max-w-sm text-center">
                        Open more packs to get duplicates and unlock SBC rewards! 🏀
                     </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Reward Reveal Overlay --- */}
      <AnimatePresence>
        {rewardReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center overflow-hidden"
          >
            {/* Reveal Pulse Circle */}
            <motion.div 
              initial={{ width: 0, height: 0 }}
              animate={{ width: '400vw', height: '400vw' }}
              transition={{ duration: 1.5, ease: "circIn" }}
              className="reveal-circle"
            />

            <div className="relative z-[10001] flex flex-col items-center">
               <motion.div
                 initial={{ scale: 0, rotateY: 180 }}
                 animate={{ scale: 1, rotateY: 0 }}
                 transition={{ delay: 0.5, duration: 1.8, type: 'spring' }}
                 className="mb-12"
               >
                 <SBCCard card={rewardReveal} size="lg" />
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, y: 50 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 1.5 }}
                 className="text-center"
               >
                 <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-2">
                   NEW PLAYER REVEALED
                 </h2>
                 <p className={`text-xl font-black uppercase tracking-[0.4em] mb-12 flex items-center justify-center gap-3 ${
                    rewardReveal.rarity === 'future_star' ? 'text-[#00ff88]' :
                    rewardReveal.rarity === 'moments_sbc' ? 'text-white' :
                    rewardReveal.rarity === 'icon_sbc' ? 'text-[#ffd700]' :
                    rewardReveal.rarity === 'legend_sbc' ? 'text-[#ffb300]' :
                    rewardReveal.rarity === 'galaxy' ? 'text-[#00e5ff]' : 'text-amber-500'
                 }`}>
                   <Star fill="currentColor" size={24} /> {rewardReveal.rarity.replace(/_sbc|_/g, ' ')} <Star fill="currentColor" size={24} />
                 </p>
                 
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setRewardReveal(null)}
                      className="px-12 py-5 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_50px_rgba(34,197,94,0.4)]"
                    >
                      ADD TO COLLECTION
                    </button>
                    <button 
                      onClick={() => {
                        setRewardReveal(null);
                        setSelectedChallenge(null);
                      }}
                      className="px-12 py-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all"
                    >
                      VIEW SBC LIST
                    </button>
                 </div>
               </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Mobile Bottom Sheet (List) --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[6001] bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-hidden flex flex-col md:hidden"
            >
               <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">SELECT CHALLENGE</h2>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-zinc-900 rounded-full">
                     <X size={20} />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar">
                  {/* Reuse same lists as desktop */}
                  <div>
                    <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4">ACTIVE CHALLENGES</h2>
                    <div className="space-y-3">
                      {groupedChallenges.active.map(c => (
                        <SbcListItem 
                          key={c.id} 
                          challenge={c} 
                          active={selectedChallenge?.id === c.id}
                          completed={false}
                          onClick={() => setSelectedChallenge(c)} 
                        />
                      ))}
                    </div>
                  </div>
                  {/* ... other groups if needed */}
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Mobile Switcher Button */}
      {selectedChallenge && (
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] bg-zinc-900/80 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl flex items-center gap-3 md:hidden"
        >
          CHANGE SBC <ChevronRight size={16} className="-rotate-90" />
        </button>
      )}

    </div>
  );
};

export default SbcView;
