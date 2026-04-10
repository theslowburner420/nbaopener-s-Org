import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Coins, 
  Zap, 
  User as UserIcon, 
  TrendingUp, 
  Shield, 
  Users, 
  Play, 
  ArrowRight, 
  Sparkles, 
  RotateCcw,
  LayoutGrid,
  X,
  Package
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';
import { useEngine } from '../hooks/useEngine';
import { Card } from '../types';
import { ALL_CARDS } from '../data/cards';
import CardDetailModal from '../components/CardDetailModal';
import CardItem from '../components/CardItem';

type DraftPhase = 'entry' | 'captain' | 'starters' | 'bench' | 'review' | 'summary' | 'tournament_selection' | 'bracket';

interface DraftSlot {
  id: string;
  label: string;
  position: string | null; // null means any for bench
  card: Card | null;
}

interface GhostTeam {
  name: string;
  ovr: number;
}

interface BracketMatch {
  id: string;
  team1: GhostTeam | 'USER';
  team2: GhostTeam | 'USER';
  winner: GhostTeam | 'USER' | null;
  score1?: number;
  score2?: number;
  status: 'pending' | 'simulating' | 'finished';
}

interface MatchEvent {
  id: string;
  text: string;
  score1: number;
  score2: number;
  quarter: number;
  team: 'USER' | 'OPP';
  points: number;
}

interface PlayerStats {
  cardId: string;
  name: string;
  imageUrl: string;
  pts: number;
  reb: number;
  ast: number;
  ovr: number;
  position: string;
}

interface Tournament {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  recommendedOvr: number;
  rewards: string;
  minOpponentOvr: number;
  maxOpponentOvr: number;
  opponentPool: string[];
}

const TOURNAMENTS: Tournament[] = [
  {
    id: 'summer',
    name: 'Summer League',
    difficulty: 'Easy',
    recommendedOvr: 75,
    rewards: '15,000 Coins + 2 Rookie Packs',
    minOpponentOvr: 70,
    maxOpponentOvr: 80,
    opponentPool: ['Lakers Summer Roster', 'Celtics Rookies', 'Heat Prospects', 'Warriors G-League', 'Bucks Summer Squad', 'Suns Young Guns', 'Nets Future', 'Bulls Newcomers']
  },
  {
    id: 'cup',
    name: 'NBA Cup',
    difficulty: 'Medium',
    recommendedOvr: 85,
    rewards: '50,000 Coins + 2 All-Star Packs',
    minOpponentOvr: 82,
    maxOpponentOvr: 90,
    opponentPool: ['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Milwaukee Bucks', 'Phoenix Suns', 'Miami Heat', 'Denver Nuggets', 'Philadelphia 76ers']
  },
  {
    id: 'playoffs',
    name: 'NBA Playoffs',
    difficulty: 'Hard',
    recommendedOvr: 94,
    rewards: '150,000 Coins + MVP & HOF Packs',
    minOpponentOvr: 92,
    maxOpponentOvr: 98,
    opponentPool: ['Celtics \'24', 'Warriors \'17', 'Bulls \'96', 'Lakers \'01', 'Spurs \'14', 'Heat \'13', 'Cavaliers \'16', 'Bucks \'71']
  }
];

const DRAFT_COST = 5000;

const STARTER_SLOTS: DraftSlot[] = [
  { id: 'pg', label: 'PG', position: 'PG', card: null },
  { id: 'sg', label: 'SG', position: 'SG', card: null },
  { id: 'sf', label: 'SF', position: 'SF', card: null },
  { id: 'pf', label: 'PF', position: 'PF', card: null },
  { id: 'c', label: 'C', position: 'C', card: null },
];

const BENCH_SLOTS: DraftSlot[] = Array.from({ length: 7 }).map((_, i) => ({ 
  id: `bench-${i}`, 
  label: 'BN', 
  position: null, 
  card: null 
}));

const REWARDS = {
  'Summer League': {
    champion: { coins: 15000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Rookie Pack' }, { id: 'rookie-2', type: 'rookie', name: 'Rookie Pack' }] },
    finalist: { coins: 8000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Rookie Pack' }] },
    semis: { coins: 4000, packs: [] },
    quarters: { coins: 1000, packs: [] },
  },
  'NBA Cup': {
    champion: { coins: 50000, packs: [{ id: 'allstar-1', type: 'allstar', name: 'All-Star Pack' }, { id: 'allstar-2', type: 'allstar', name: 'All-Star Pack' }] },
    finalist: { coins: 25000, packs: [{ id: 'allstar-1', type: 'allstar', name: 'All-Star Pack' }] },
    semis: { coins: 12000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Rookie Pack' }] },
    quarters: { coins: 5000, packs: [] },
  },
  'NBA Playoffs': {
    champion: { coins: 150000, packs: [{ id: 'mvp-1', type: 'mvp', name: 'Finals MVP Pack' }, { id: 'hof-1', type: 'hof', name: 'HOF Pack' }] },
    finalist: { coins: 75000, packs: [{ id: 'mvp-1', type: 'mvp', name: 'Finals MVP Pack' }] },
    semis: { coins: 35000, packs: [{ id: 'allstar-1', type: 'allstar', name: 'All-Star Pack' }] },
    quarters: { coins: 15000, packs: [] },
  }
};

const TournamentSummaryModal: React.FC<{
  show: boolean;
  position: string;
  rewards: { coins: number; packs: any[] } | null;
  onClaim: () => void;
  isSaving: boolean;
}> = ({ show, position, rewards, onClaim, isSaving }) => {
  if (!show || !rewards) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[3.5rem] p-10 text-center space-y-10 shadow-[0_0_150px_rgba(245,158,11,0.2)] relative overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />

        <div className="space-y-4 relative z-10">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] rotate-12">
              <Trophy size={40} className="text-black" />
            </div>
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">
            Tournament<br />Finished!
          </h2>
          <div className="inline-block px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-500">
              {position === 'champion' ? '🏆 CHAMPION' : position.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Your Rewards</p>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Coins Reward */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 group hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Coins size={24} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black italic text-white">{rewards.coins.toLocaleString()}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Coins</p>
              </div>
            </div>

            {/* Packs Reward */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 group hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black italic text-white">{rewards.packs.length}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Packs Earned</p>
              </div>
            </div>
          </div>

          {/* Pack Icons List */}
          {rewards.packs.length > 0 && (
            <div className="flex justify-center gap-3 pt-2">
              {rewards.packs.map((pack, idx) => (
                <div key={idx} className="w-10 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center relative group">
                  <Package size={16} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-black text-black">1</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClaim}
          disabled={isSaving}
          className="w-full bg-amber-500 text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-[0_20px_40px_rgba(245,158,11,0.2)] active:scale-95 relative z-10 disabled:opacity-50"
        >
          <span>{isSaving ? 'Saving Progress...' : 'Claim Rewards'}</span>
          <ArrowRight size={20} />
        </button>
      </motion.div>
    </motion.div>
  );
};

const Slot: React.FC<{ 
  slot: DraftSlot; 
  mini?: boolean; 
  onClick: () => void; 
  disabled?: boolean; 
  isSelected?: boolean;
}> = ({ slot, mini, onClick, disabled, isSelected }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative group transition-all duration-500 w-full aspect-[2.5/3.5] ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : ''} ${isSelected ? 'scale-110 z-50' : ''}`}
    >
      {slot.card ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1.05 : 1, 
            opacity: 1,
            boxShadow: isSelected ? [
              "0 0 20px rgba(245,158,11,0.4)",
              "0 0 40px rgba(245,158,11,0.8)",
              "0 0 20px rgba(245,158,11,0.4)"
            ] : "0 10px 25px rgba(0,0,0,0.5)"
          }}
          whileTap={{ scale: 0.95 }}
          transition={isSelected ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }}
          className={`h-full w-full bg-zinc-900 rounded-xl border-2 overflow-hidden transition-all ${isSelected ? 'border-amber-500 ring-4 ring-amber-500/20' : 'border-zinc-800 group-hover:border-amber-500'}`}
        >
          <img src={slot.card.imageUrl} alt={slot.card.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <p className={`font-black uppercase italic text-white truncate ${mini ? 'text-[6px]' : 'text-[8px]'}`}>{slot.card.name}</p>
            <p className={`font-bold text-amber-500 ${mini ? 'text-[5px]' : 'text-[7px]'}`}>{slot.card.stats?.ovr} OVR</p>
          </div>
          {isSelected && (
            <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />
          )}
        </motion.div>
      ) : (
        <div className="h-full w-full bg-zinc-900/30 border-2 border-dashed border-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-1 group-hover:border-amber-500/50 group-hover:bg-zinc-900/60 transition-all relative overflow-hidden">
          {/* Ghost Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-50" />
          
          <div className={`rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner ${mini ? 'w-7 h-7' : 'w-10 h-10'}`}>
            <Zap size={mini ? 14 : 20} className={mini ? '' : 'fill-current opacity-20'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-black text-white/10 ${mini ? 'text-xs' : 'text-xl'}`}>+</span>
            </div>
          </div>
          
          <span className={`font-black uppercase tracking-[0.2em] text-zinc-700 group-hover:text-amber-500/50 transition-colors ${mini ? 'text-[7px]' : 'text-[10px]'}`}>
            {slot.position || slot.label}
          </span>

          {/* Decorative Corner Accents */}
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-zinc-800" />
          <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-zinc-800" />
          <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-zinc-800" />
          <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-zinc-800" />
        </div>
      )}
      
      {!slot.card && !disabled && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10">
          <span className="text-black font-black text-[10px]">+</span>
        </div>
      )}
    </button>
  );
};

const DraftView: React.FC = () => {
  const { 
    coins, 
    spendCoins, 
    setCurrentView, 
    addCoins, 
    addPackToInventory, 
    unlockAchievement,
    updateGameState,
    isSaving 
  } = useGame();
  const { notify } = useNotification();
  const { generateDraftOptions } = useEngine();

  const [phase, setPhase] = useState<DraftPhase>('entry');
  const [starters, setStarters] = useState<DraftSlot[]>(STARTER_SLOTS);
  const [bench, setBench] = useState<DraftSlot[]>(BENCH_SLOTS);
  const [currentOptions, setCurrentOptions] = useState<Card[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<Card | null>(null);
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [isBenchExpanded, setIsBenchExpanded] = useState(false);

  // Tournament State
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [currentRound, setCurrentRound] = useState<'QF' | 'SF' | 'F'>('QF');
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchResult, setMatchResult] = useState<{ score1: number, score2: number, winner: string } | null>(null);

  // Live Match State
  const [isLiveMatchActive, setIsLiveMatchActive] = useState(false);
  const [liveScore, setLiveScore] = useState({ s1: 0, s2: 0 });
  const [liveQuarter, setLiveQuarter] = useState(1);
  const [liveEvents, setLiveEvents] = useState<MatchEvent[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [boxScore, setBoxScore] = useState<PlayerStats[]>([]);
  const [showBoxScore, setShowBoxScore] = useState(false);

  // Rewards State
  const [showTournamentSummary, setShowTournamentSummary] = useState(false);
  const [finalPosition, setFinalPosition] = useState<'quarters' | 'semis' | 'finalist' | 'champion' | null>(null);
  const [earnedRewards, setEarnedRewards] = useState<{ coins: number, packs: any[] } | null>(null);

  // State Persistence
  useEffect(() => {
    const savedState = localStorage.getItem('hoops_draft_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPhase(parsed.phase || 'entry');
        setStarters(parsed.starters || STARTER_SLOTS);
        setBench(parsed.bench || BENCH_SLOTS);
        setBracket(parsed.bracket || []);
        setCurrentRound(parsed.currentRound || 'QF');
        setSelectedTournament(parsed.selectedTournament || null);
      } catch (e) {
        console.error("Failed to load state", e);
      }
    }
  }, []);

  useEffect(() => {
    const state = { phase, starters, bench, bracket, currentRound, selectedTournament };
    localStorage.setItem('hoops_draft_state', JSON.stringify(state));
  }, [phase, starters, bench, bracket, currentRound, selectedTournament]);

  // Performance: Image Preloading
  useEffect(() => {
    const preloadImages = () => {
      const urls = [
        ...ALL_CARDS.map(c => c.imageUrl),
        'https://picsum.photos/seed/nba1/1920/1080',
        'https://picsum.photos/seed/nba2/1920/1080',
        'https://picsum.photos/seed/nba3/1920/1080'
      ];
      urls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    };
    preloadImages();
  }, []);

  // Track all cards seen in this draft to prevent duplicates
  const seenCardIds = useMemo(() => {
    const ids = new Set<string>();
    starters.forEach(s => s.card && ids.add(s.card.id));
    bench.forEach(b => b.card && ids.add(b.card.id));
    return Array.from(ids);
  }, [starters, bench]);

  const handleStartDraft = async (method: 'coins' | 'ad') => {
    if (method === 'coins') {
      const success = await spendCoins(DRAFT_COST);
      if (!success) return;
    }
    
    // Reset slots
    setStarters(STARTER_SLOTS.map(s => ({ ...s, card: null })));
    setBench(BENCH_SLOTS.map(b => ({ ...b, card: null })));
    setBracket([]);
    setSelectedTournament(null);
    setCurrentRound('QF');
    
    // Start with Starters phase, but don't show options yet
    // User must click a slot to pick their first player (Captain)
    setPhase('starters');
    setCurrentOptions([]);
    setIsFlipping(false);
    setActiveSlotId(null);
  };

  const handleSelectCard = async (card: Card) => {
    // If it's the very first card picked, it's the captain
    const isFirstPick = starters.every(s => !s.card) && bench.every(b => !b.card);

    if (activeSlotId) {
      // Selection
      if (activeSlotId.startsWith('bench')) {
        setBench(prev => prev.map(s => s.id === activeSlotId ? { ...s, card } : s));
      } else {
        setStarters(prev => prev.map(s => s.id === activeSlotId ? { ...s, card } : s));
      }

      if (isFirstPick) {
        // Achievement: Generational Talent (Local only during draft)
        if ((card.stats?.ovr || 0) >= 97) {
          const unlocked = await unlockAchievement('generational_talent', false);
          if (unlocked) notify(unlocked);
        }
      }

      setActiveSlotId(null);
      setCurrentOptions([]);
      setIsBenchExpanded(false);
      
      // Check if all starters are filled
      const allStartersFilled = starters.every(s => s.card || (s.id === activeSlotId && card));
      const allBenchFilled = bench.every(b => b.card || (b.id === activeSlotId && card));

      if (allStartersFilled && !allBenchFilled) {
        setPhase('bench');
      } else if (allStartersFilled && allBenchFilled) {
        setPhase('review');
        
        // Achievement: Trust the Process (Local only during draft)
        const unlocked1 = await unlockAchievement('trust_the_process', false);
        if (unlocked1) notify(unlocked1);

        // Achievement: Superteam (Local only during draft)
        if (teamOVR >= 92) {
          const unlocked2 = await unlockAchievement('superteam', false);
          if (unlocked2) notify(unlocked2);
        }

        // Achievement: Bench Mob (Local only during draft)
        const benchPlayers = bench.map(s => s.card).filter(Boolean) as Card[];
        const benchAvg = benchPlayers.length > 0 
          ? benchPlayers.reduce((acc, p) => acc + (p.stats?.ovr || 0), 0) / benchPlayers.length 
          : 0;
        if (benchAvg >= 85) {
          const unlocked3 = await unlockAchievement('bench_mob', false);
          if (unlocked3) notify(unlocked3);
        }
      }
    }
  };

  // Manual slot selection logic (FUT Draft Style)
  const handleSlotClick = (slot: DraftSlot) => {
    // If we're in a phase where drafting is done, allow swapping
    const isDraftFinished = phase === 'review' || phase === 'summary' || phase === 'tournament_selection' || phase === 'bracket';
    
    if (isDraftFinished && slot.card) {
      if (!swapSource) {
        setSwapSource(slot.id);
      } else if (swapSource === slot.id) {
        setSwapSource(null);
        setSelectedCardForDetail(slot.card);
      } else {
        // Perform Swap
        const sourceId = swapSource;
        const targetId = slot.id;
        
        let newStarters = [...starters];
        let newBench = [...bench];
        
        const sourceInStarters = starters.find(s => s.id === sourceId);
        const targetInStarters = starters.find(s => s.id === targetId);
        
        const sourceInBench = bench.find(b => b.id === sourceId);
        const targetInBench = bench.find(b => b.id === targetId);
        
        const sourceCard = sourceInStarters?.card || sourceInBench?.card;
        const targetCard = targetInStarters?.card || targetInBench?.card;
        
        if (sourceInStarters) {
          newStarters = newStarters.map(s => s.id === sourceId ? { ...s, card: targetCard || null } : s);
        } else if (sourceInBench) {
          newBench = newBench.map(b => b.id === sourceId ? { ...b, card: targetCard || null } : b);
        }
        
        if (targetInStarters) {
          newStarters = newStarters.map(s => s.id === targetId ? { ...s, card: sourceCard || null } : s);
        } else if (targetInBench) {
          newBench = newBench.map(b => b.id === targetId ? { ...b, card: sourceCard || null } : b);
        }
        
        setStarters(newStarters);
        setBench(newBench);
        setSwapSource(null);
        setIsBenchExpanded(false);
      }
      return;
    }

    if (slot.card) {
      setSelectedCardForDetail(slot.card);
      return;
    }
    
    // Drafting logic: only allow clicking empty slots if in the right phase
    if ((phase === 'starters' && starters.some(s => s.id === slot.id)) || 
        (phase === 'bench' && bench.some(b => b.id === slot.id))) {
      setActiveSlotId(slot.id);
      setIsBenchExpanded(false);
      
      // If it's the first pick, it's a Captain pick (Elite options)
      const isFirstPick = starters.every(s => !s.card) && bench.every(b => !b.card);
      const options = generateDraftOptions(5, slot.position, seenCardIds, isFirstPick);
      
      setCurrentOptions(options);
      setIsFlipping(true);
    }
  };

  const generateGhostTeam = (tournament: Tournament): GhostTeam => {
    const name = tournament.opponentPool[Math.floor(Math.random() * tournament.opponentPool.length)];
    const ovr = Math.floor(Math.random() * (tournament.maxOpponentOvr - tournament.minOpponentOvr + 1)) + tournament.minOpponentOvr;
    return { name, ovr };
  };

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    
    // Generate Bracket (8 teams: User + 7 Ghosts)
    const opponents = Array.from({ length: 7 }).map(() => generateGhostTeam(tournament));
    
    const qf: BracketMatch[] = [
      { id: 'qf1', team1: 'USER', team2: opponents[0], winner: null, status: 'pending' },
      { id: 'qf2', team1: opponents[1], team2: opponents[2], winner: null, status: 'pending' },
      { id: 'qf3', team1: opponents[3], team2: opponents[4], winner: null, status: 'pending' },
      { id: 'qf4', team1: opponents[5], team2: opponents[6], winner: null, status: 'pending' },
    ];
    
    setBracket(qf);
    setCurrentRound('QF');
    setPhase('bracket');
  };

  const simulateMatch = async (matchId: string) => {
    const match = bracket.find(m => m.id === matchId);
    if (!match || match.status !== 'pending') return;

    setActiveMatchId(matchId);
    setIsLiveMatchActive(true);
    setLiveScore({ s1: 0, s2: 0 });
    setLiveQuarter(1);
    setLiveEvents([]);
    setShowBoxScore(false);
    
    const t1Ovr = match.team1 === 'USER' ? teamOVR : (match.team1 as GhostTeam).ovr;
    const t2Ovr = match.team2 === 'USER' ? teamOVR : (match.team2 as GhostTeam).ovr;
    
    const userStarters = starters.map(s => s.card).filter(Boolean) as Card[];
    const userBench = bench.map(s => s.card).filter(Boolean) as Card[];
    const allUserPlayers = [...userStarters, ...userBench];
    
    const oppName = match.team1 === 'USER' ? (match.team2 as GhostTeam).name : (match.team1 as GhostTeam).name;

    // 1. Realistic Team Score Generation (90-130)
    // Base score 105 +/- 15
    const baseScore = 105 + (Math.random() * 30 - 15);
    const ovrDiff = (match.team1 === 'USER' ? t1Ovr - t2Ovr : t2Ovr - t1Ovr);
    
    // OVR impact on total score (subtle)
    const userScoreTarget = Math.round(baseScore + (ovrDiff * 0.5));
    const finalUserScore = Math.max(90, Math.min(130, userScoreTarget));

    // 2. Opponent Score Logic (Round Difficulty)
    // Round multipliers: QF (0.95), SF (1.0), F (1.05)
    const roundMultiplier = currentRound === 'QF' ? 0.95 : currentRound === 'SF' ? 1.0 : 1.05;
    const oppBaseScore = 105 + (Math.random() * 20 - 10);
    const oppScoreTarget = Math.round((oppBaseScore - (ovrDiff * 0.5)) * roundMultiplier);
    
    // Ensure close matches (2-15 points difference usually)
    let finalOppScore = Math.max(85, Math.min(135, oppScoreTarget));
    const scoreDiff = Math.abs(finalUserScore - finalOppScore);
    if (scoreDiff > 20) {
      // Pull it closer if it's a blowout
      finalOppScore = finalUserScore + (finalOppScore > finalUserScore ? 15 : -15);
    } else if (scoreDiff < 2) {
      // Ensure at least 2 points diff if not a tie (NBA rarely ties in regulation, but we'll just ensure a winner)
      finalOppScore = finalUserScore + (Math.random() > 0.5 ? 2 : -2);
    }

    // 3. Player Scoring Distribution (Hierarchy)
    // Identify Captain (Highest OVR starter)
    const captain = [...userStarters].sort((a, b) => (b.stats?.ovr || 0) - (a.stats?.ovr || 0))[0];
    
    const playerWeights = allUserPlayers.map(player => {
      const isCaptain = player.id === captain?.id;
      const isStarter = userStarters.some(s => s.id === player.id);
      const ovr = player.stats?.ovr || 70;
      
      let weight = ovr / 100;
      if (isCaptain) weight *= 2.5; // Captain gets most shots
      else if (isStarter) weight *= 1.5; // Starters get more shots
      else weight *= 0.4; // Bench gets fewer shots
      
      return { id: player.id, weight };
    });

    const totalWeight = playerWeights.reduce((acc, w) => acc + w.weight, 0);
    let distributedPoints = 0;
    
    const stats: PlayerStats[] = allUserPlayers.map((player, index) => {
      const weight = playerWeights.find(w => w.id === player.id)!.weight;
      let pPts = 0;
      
      if (index === allUserPlayers.length - 1) {
        // Last player gets the remainder to ensure exact total
        pPts = finalUserScore - distributedPoints;
      } else {
        // Proportional distribution with some variance
        const share = weight / totalWeight;
        const variance = 0.85 + Math.random() * 0.3; // +/- 15%
        pPts = Math.round(finalUserScore * share * variance);
        
        // Clamp to realistic ranges
        const isCaptain = player.id === captain?.id;
        const isStarter = userStarters.some(s => s.id === player.id);
        
        if (isCaptain) pPts = Math.max(20, Math.min(45, pPts));
        else if (isStarter) pPts = Math.max(8, Math.min(30, pPts));
        else pPts = Math.max(0, Math.min(15, pPts));
        
        // Check if we're exceeding total
        if (distributedPoints + pPts > finalUserScore - (allUserPlayers.length - index - 1)) {
          pPts = Math.max(0, finalUserScore - distributedPoints - (allUserPlayers.length - index - 1));
        }
      }

      distributedPoints += pPts;

      // Rebounds and Assists (Standard logic)
      const roleWeight = userStarters.some(s => s.id === player.id) ? 1.0 : 0.4;
      const baseReb = (player.reb || 5) * roleWeight;
      const reb = Math.round(baseReb * (0.7 + Math.random() * 0.6));
      const baseAst = (player.ast || 5) * roleWeight;
      const ast = Math.round(baseAst * (0.7 + Math.random() * 0.6));

      return {
        cardId: player.id,
        name: player.name,
        imageUrl: player.imageUrl,
        pts: pPts,
        reb: Math.max(0, reb),
        ast: Math.max(0, ast),
        ovr: player.stats?.ovr || 0,
        position: player.position
      };
    });

    setBoxScore(stats);

    // Achievements: In-Match Feats (Stats)
    if (stats.some(s => s.pts >= 40)) {
      const unlocked = await unlockAchievement('the_carry', false);
      if (unlocked) notify(unlocked);
    }
    if (stats.some(s => s.ast >= 15)) {
      const unlocked = await unlockAchievement('floor_general', false);
      if (unlocked) notify(unlocked);
    }

    const s1Final = match.team1 === 'USER' ? finalUserScore : finalOppScore;
    const s2Final = match.team1 === 'USER' ? finalOppScore : finalUserScore;

    const eventTemplates = [
      "{player} scores with a reverse layup (+2)",
      "{player} drains a corner three! (+3)",
      "Steal and fastbreak dunk by {player}! (+2)",
      "{player} scores on a tough second-chance bucket (+2)",
      "Deep three from the top of the key by {player}! (+3)",
      "{player} hits a smooth mid-range jumper (+2)",
      "{player} throws it down with authority! (+2)",
      "{player} finishes the alley-oop! (+2)",
      "Clutch bucket from {player} in the paint (+2)"
    ];

    const oppTemplates = [
      "{opp} scores after a great team play (+2)",
      "Deep three-pointer from {opp}! (+3)",
      "{opp} scores an easy layup (+2)",
      "{opp} punishes the defense from downtown (+3)",
      "{opp} hits a contested fadeaway (+2)",
      "{opp} converts the and-one play (+3)",
      "Powerful finish at the rim by {opp} (+2)"
    ];

    const commentaryPhrases = [
      "Clutch bucket!",
      "Defensive stop!",
      "Three point dagger!",
      "What a move!",
      "The crowd is going wild!",
      "Total dominance!",
      "Unstoppable force!",
      "Lockdown defense!"
    ];

    // 3. Event Generation to reach final scores
    let currentS1 = 0;
    let currentS2 = 0;
    const newEvents: MatchEvent[] = [];
    
    // We need enough events to reach s1Final and s2Final
    // Average points per event is ~2.4
    const totalEventsNeeded = Math.ceil((s1Final + s2Final) / 2.4);
    const eventsPerQuarter = Math.ceil(totalEventsNeeded / 4);

    for (let i = 0; i < totalEventsNeeded; i++) {
      const quarter = Math.min(4, Math.floor(i / eventsPerQuarter) + 1);
      
      // Determine who scores this event based on remaining points needed
      const s1Remaining = s1Final - currentS1;
      const s2Remaining = s2Final - currentS2;
      
      let scoringTeam: 'USER' | 'OPP' = 'USER';
      let points = Math.random() > 0.7 ? 3 : 2;

      if (s1Remaining > 0 && s2Remaining > 0) {
        const prob1 = s1Remaining / (s1Remaining + s2Remaining);
        scoringTeam = Math.random() < prob1 ? 'USER' : 'OPP';
      } else if (s1Remaining > 0) {
        scoringTeam = 'USER';
      } else if (s2Remaining > 0) {
        scoringTeam = 'OPP';
      } else {
        break; // Reached final scores
      }

      // Ensure we don't overshoot
      if (scoringTeam === 'USER') {
        if (currentS1 + points > s1Final) points = s1Final - currentS1;
        if (points <= 0) continue;
        currentS1 += points;
      } else {
        if (currentS2 + points > s2Final) points = s2Final - currentS2;
        if (points <= 0) continue;
        currentS2 += points;
      }

      let text = "";
      if (match.team1 === 'USER') {
        if (scoringTeam === 'USER') {
          // Weighted RNG based on card PTS stat
          const totalPtsWeight = userStarters.reduce((acc, p) => acc + (p.pts || 10), 0);
          let r = Math.random() * totalPtsWeight;
          let selectedPlayer = userStarters[0].name;
          for (const p of userStarters) {
            if (r < (p.pts || 10)) {
              selectedPlayer = p.name;
              break;
            }
            r -= (p.pts || 10);
          }
          text = eventTemplates[Math.floor(Math.random() * eventTemplates.length)].replace("{player}", selectedPlayer);
          
          // Add random commentary phrase
          if (Math.random() > 0.7) {
            text = `${commentaryPhrases[Math.floor(Math.random() * commentaryPhrases.length)]} ${text}`;
          }
        } else {
          text = oppTemplates[Math.floor(Math.random() * oppTemplates.length)].replace("{opp}", oppName);
        }
      } else {
        if (scoringTeam === 'OPP') {
          text = oppTemplates[Math.floor(Math.random() * oppTemplates.length)].replace("{opp}", oppName);
        } else {
          // Weighted RNG based on card PTS stat
          const totalPtsWeight = userStarters.reduce((acc, p) => acc + (p.pts || 10), 0);
          let r = Math.random() * totalPtsWeight;
          let selectedPlayer = userStarters[0].name;
          for (const p of userStarters) {
            if (r < (p.pts || 10)) {
              selectedPlayer = p.name;
              break;
            }
            r -= (p.pts || 10);
          }
          text = eventTemplates[Math.floor(Math.random() * eventTemplates.length)].replace("{player}", selectedPlayer);
          
          // Add random commentary phrase
          if (Math.random() > 0.7) {
            text = `${commentaryPhrases[Math.floor(Math.random() * commentaryPhrases.length)]} ${text}`;
          }
        }
      }

      newEvents.push({
        id: `event-${i}`,
        text,
        score1: currentS1,
        score2: currentS2,
        quarter,
        team: scoringTeam,
        points
      });
    }

    // Final result logic
    const winner = s1Final > s2Final ? match.team1 : (s1Final < s2Final ? match.team2 : (Math.random() > 0.5 ? match.team1 : match.team2));
    
    // Start the simulation loop
    let eventIdx = 0;
    const interval = setInterval(() => {
      if (eventIdx < newEvents.length) {
        const event = newEvents[eventIdx];
        setLiveEvents(prev => [event, ...prev]);
        setLiveScore({ s1: event.score1, s2: event.score2 });
        setLiveQuarter(event.quarter);
        eventIdx++;
      } else {
        clearInterval(interval);
        finishMatch(matchId, s1Final, s2Final, winner);
      }
    }, 800); // Faster rhythm to reach higher scores in reasonable time

    (window as any).matchInterval = interval;
    (window as any).skipMatch = () => {
      clearInterval((window as any).matchInterval);
      setLiveEvents(newEvents.reverse());
      setLiveScore({ s1: s1Final, s2: s2Final });
      setLiveQuarter(4);
      finishMatch(matchId, s1Final, s2Final, winner);
    };
  };

  const finishMatch = async (matchId: string, s1: number, s2: number, winner: 'USER' | GhostTeam) => {
    const match = bracket.find(m => m.id === matchId);
    if (!match) return;

    // Wait 2 seconds for the "Match Finished" feel
    await new Promise(resolve => setTimeout(resolve, 2000));

    setMatchResult({ 
      score1: s1, 
      score2: s2, 
      winner: winner === 'USER' ? 'Your Team' : (winner as GhostTeam).name 
    });

    // Achievements: In-Match Feats (Score)
    if (winner === 'USER') {
      const diff = Math.abs(s1 - s2);
      if (diff >= 20) {
        const unlocked = await unlockAchievement('blowout', false);
        if (unlocked) notify(unlocked);
      }
      if (diff >= 1 && diff <= 2) {
        const unlocked = await unlockAchievement('clutch_time', false);
        if (unlocked) notify(unlocked);
      }

      // Achievement: David vs Goliath
      if (selectedTournament?.name === 'NBA Playoffs' && teamOVR < 88) {
        const unlocked = await unlockAchievement('david_vs_goliath', false);
        if (unlocked) notify(unlocked);
      }
    }

    setBracket(prev => prev.map(m => m.id === matchId ? { 
      ...m, 
      winner, 
      score1: s1, 
      score2: s2, 
      status: 'finished' 
    } : m));

    setIsLiveMatchActive(false);
  };

  const handleTournamentEnd = async (position: 'quarters' | 'semis' | 'finalist' | 'champion') => {
    if (!selectedTournament) return;
    const rewards = REWARDS[selectedTournament.name as keyof typeof REWARDS][position];
    setFinalPosition(position);
    setEarnedRewards(rewards);
    setShowTournamentSummary(true);

    // Achievements: Tournament Success
    if (position === 'champion') {
      if (selectedTournament.name === 'Summer League') {
        const unlocked = await unlockAchievement('summer_mvp', false);
        if (unlocked) notify(unlocked);
      } else if (selectedTournament.name === 'NBA Cup') {
        const unlocked = await unlockAchievement('cup_champion', false);
        if (unlocked) notify(unlocked);
      } else if (selectedTournament.name === 'NBA Playoffs') {
        const unlocked = await unlockAchievement('ring_chaser', false);
        if (unlocked) notify(unlocked);
      }
    }
  };

  const claimRewards = async () => {
    if (earnedRewards) {
      // Final sync to Supabase
      await addCoins(earnedRewards.coins, true);
      for (const pack of earnedRewards.packs) {
        await addPackToInventory({ 
          id: `${pack.type}-${Date.now()}-${Math.random()}`, 
          type: pack.type, 
          name: pack.name 
        }, true);
      }
    }
    // Reset Draft State
    setPhase('entry');
    setStarters(STARTER_SLOTS);
    setBench(BENCH_SLOTS);
    setBracket([]);
    setSelectedTournament(null);
    setShowTournamentSummary(false);
    setFinalPosition(null);
    setEarnedRewards(null);
    localStorage.removeItem('hoops_draft_state'); // Corrected key
  };

  const advanceRound = () => {
    if (!showBoxScore) {
      setShowBoxScore(true);
      return;
    }

    const userLost = matchResult && matchResult.winner !== 'Your Team';
    const isFinal = currentRound === 'F';
    
    setShowBoxScore(false);
    setMatchResult(null);
    
    if (userLost || isFinal) {
      const position = userLost 
        ? (currentRound === 'QF' ? 'quarters' : currentRound === 'SF' ? 'semis' : 'finalist')
        : 'champion';
      handleTournamentEnd(position);
      return;
    }

    // Helper to simulate a match between two ghost teams
    const simulateGhostMatch = (m: BracketMatch): GhostTeam | 'USER' => {
      if (m.winner) return m.winner;
      const t1Ovr = m.team1 === 'USER' ? teamOVR : (m.team1 as GhostTeam).ovr;
      const t2Ovr = m.team2 === 'USER' ? teamOVR : (m.team2 as GhostTeam).ovr;
      
      // Realistic NBA scoring for ghost matches too
      const baseScore = 105 + (Math.random() * 20 - 10);
      const t1Score = Math.round(baseScore + (t1Ovr - 85) + (Math.random() * 10 - 5));
      const t2Score = Math.round(baseScore + (t2Ovr - 85) + (Math.random() * 10 - 5));
      
      return t1Score > t2Score ? m.team1 : m.team2;
    };

    if (currentRound === 'QF') {
      // Simulate all other QF matches
      const qfWinners = bracket.map(m => simulateGhostMatch(m));
      
      const sf: BracketMatch[] = [
        { id: 'sf1', team1: qfWinners[0], team2: qfWinners[1], winner: null, status: 'pending' },
        { id: 'sf2', team1: qfWinners[2], team2: qfWinners[3], winner: null, status: 'pending' },
      ];
      setBracket(sf);
      setCurrentRound('SF');
    } else if (currentRound === 'SF') {
      // Simulate all other SF matches
      const sfWinners = bracket.map(m => simulateGhostMatch(m));
      
      const f: BracketMatch = { id: 'f1', team1: sfWinners[0], team2: sfWinners[1], winner: null, status: 'pending' };
      setBracket([f]);
      setCurrentRound('F');
    } else {
      // Won the final!
      setPhase('summary');
      // Add rewards logic here if needed
    }
  };

  const teamOVR = useMemo(() => {
    const starterPlayers = starters.map(s => s.card).filter(Boolean) as Card[];
    const benchPlayers = bench.map(s => s.card).filter(Boolean) as Card[];
    
    if (starterPlayers.length === 0 && benchPlayers.length === 0) return 0;
    
    const startersAvg = starterPlayers.length > 0 
      ? starterPlayers.reduce((acc, p) => acc + (p.stats?.ovr || 0), 0) / starterPlayers.length 
      : 0;
      
    const benchAvg = benchPlayers.length > 0 
      ? benchPlayers.reduce((acc, p) => acc + (p.stats?.ovr || 0), 0) / benchPlayers.length 
      : 0;

    // Weighted OVR: 80% Starters, 20% Bench
    const finalOvr = (startersAvg * 0.8) + (benchAvg * 0.2);
    return Math.round(finalOvr);
  }, [starters, bench]);

  const renderEntry = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
      <div className="w-24 h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.4)]">
        <Trophy size={48} className="text-white" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Hoops Draft</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Build your dream squad and compete</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <button 
          onClick={() => handleStartDraft('coins')}
          disabled={coins < DRAFT_COST || isSaving}
          className="group relative bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-amber-400 transition-all disabled:opacity-50"
        >
          <Coins size={18} />
          <span>{isSaving ? 'Processing...' : `Entry: ${DRAFT_COST.toLocaleString()}`}</span>
        </button>
        
        <button 
          onClick={() => handleStartDraft('ad')}
          disabled={isSaving}
          className="group relative bg-zinc-900 text-white border border-zinc-800 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50"
        >
          <Play size={18} />
          <span>Watch Ad to Enter</span>
        </button>
      </div>
    </div>
  );

  const renderDraftBoard = () => (
    <div className="flex-1 flex flex-col lg:flex-row px-4 py-2 md:p-4 gap-4 max-w-7xl mx-auto w-full h-full relative overflow-y-auto no-scrollbar">
      {/* Tactical Board Header - Floating on Mobile, Sidebar on Desktop */}
      <div className="lg:w-48 flex flex-col gap-4 shrink-0 z-30">
        <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 flex lg:flex-col items-center justify-between lg:justify-center gap-4 shadow-xl">
          <div className="text-center">
            <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-zinc-500">Team OVR</p>
            <p className="text-2xl md:text-3xl font-black italic text-amber-500">{teamOVR}</p>
          </div>
          <div className="hidden lg:block w-full h-px bg-zinc-900" />
          <div className="text-right lg:text-center">
            <p className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-white italic">Draft Mode</p>
            <p className="text-[7px] md:text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
              {phase === 'captain' ? 'Captain Pick' : phase === 'starters' ? 'Starters' : 'Bench'}
            </p>
          </div>
        </div>

        {/* Desktop Bench - Visible on the side */}
        <div className="hidden lg:flex flex-col bg-zinc-950/80 border border-zinc-900 rounded-3xl p-4 shadow-xl flex-1 overflow-hidden">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 text-center">Bench</h3>
          <div className="flex flex-col gap-3 overflow-y-auto pr-2 scrollbar-hide">
            {bench.map(slot => (
              <Slot 
                key={slot.id} 
                slot={slot} 
                mini 
                onClick={() => handleSlotClick(slot)} 
                disabled={phase === 'captain'} 
                isSelected={swapSource === slot.id || activeSlotId === slot.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Board Container */}
      <div className="flex-1 flex flex-col min-h-0 gap-4 relative pb-10 lg:pb-0">
        {/* Top Half: Tactical Starting Five */}
        <div className="flex-1 bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] p-4 md:p-8 flex flex-col justify-center relative overflow-hidden shadow-2xl mb-8">
          {/* Court Lines Overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-1/2 border-b-2 border-x-2 border-white/20 rounded-b-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/20 rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white/20" />
          </div>

          <div className="relative z-10 h-full w-full flex flex-col justify-around py-2 md:py-4">
            {/* Mobile Layout: 2 Rows (3+2) | Desktop: Tactical 1-2-2 */}
            <div className="lg:hidden flex flex-col gap-4 md:gap-8">
              {/* Row 1: PG, SG, SF */}
              <div className="flex justify-center gap-2 md:gap-4">
                {[starters[0], starters[1], starters[2]].map(slot => (
                  <div key={slot.id} className="w-[30%] max-w-[100px]">
                    <Slot 
                      slot={slot} 
                      onClick={() => handleSlotClick(slot)} 
                      disabled={phase === 'captain'} 
                      isSelected={swapSource === slot.id || activeSlotId === slot.id}
                    />
                  </div>
                ))}
              </div>
              {/* Row 2: PF, C */}
              <div className="flex justify-center gap-4 md:gap-8">
                {[starters[3], starters[4]].map(slot => (
                  <div key={slot.id} className="w-[35%] max-w-[110px]">
                    <Slot 
                      slot={slot} 
                      onClick={() => handleSlotClick(slot)} 
                      disabled={phase === 'captain'} 
                      isSelected={swapSource === slot.id || activeSlotId === slot.id}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop Tactical Layout */}
            <div className="hidden lg:flex flex-col justify-between h-full">
              <div className="flex justify-center">
                <Slot 
                  slot={starters[0]} 
                  onClick={() => handleSlotClick(starters[0])} 
                  disabled={phase === 'captain'} 
                  isSelected={swapSource === starters[0].id || activeSlotId === starters[0].id}
                />
              </div>
              <div className="flex justify-between px-[15%]">
                <Slot 
                  slot={starters[1]} 
                  onClick={() => handleSlotClick(starters[1])} 
                  disabled={phase === 'captain'} 
                  isSelected={swapSource === starters[1].id || activeSlotId === starters[1].id}
                />
                <Slot 
                  slot={starters[2]} 
                  onClick={() => handleSlotClick(starters[2])} 
                  disabled={phase === 'captain'} 
                  isSelected={swapSource === starters[2].id || activeSlotId === starters[2].id}
                />
              </div>
              <div className="flex justify-center gap-24">
                <Slot 
                  slot={starters[3]} 
                  onClick={() => handleSlotClick(starters[3])} 
                  disabled={phase === 'captain'} 
                  isSelected={swapSource === starters[3].id || activeSlotId === starters[3].id}
                />
                <Slot 
                  slot={starters[4]} 
                  onClick={() => handleSlotClick(starters[4])} 
                  disabled={phase === 'captain'} 
                  isSelected={swapSource === starters[4].id || activeSlotId === starters[4].id}
                />
              </div>
            </div>
          </div>

          {/* Squad Review Button Overlay */}
          {phase === 'review' && (
            <div className="absolute inset-x-0 bottom-8 flex justify-center z-50 px-8">
              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => setPhase('summary')}
                className="w-full max-w-xs bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(245,158,11,0.3)] hover:bg-amber-400 transition-all active:scale-95"
              >
                <span>Finish Draft and Play</span>
                <ArrowRight size={20} />
              </motion.button>
            </div>
          )}
        </div>

        {/* Mobile Bench Accordion - Hidden on Desktop */}
        <div className="lg:hidden flex-none relative z-[100] mt-8">
          <button 
            onClick={() => setIsBenchExpanded(!isBenchExpanded)}
            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl py-4 px-6 flex items-center justify-between shadow-2xl active:bg-zinc-900 transition-all relative z-[110]"
          >
            <div className="flex-1 flex justify-center items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-white">
                Bench <span className="text-zinc-500 ml-2">({bench.filter(s => s.card).length}/{bench.length})</span>
              </span>
            </div>
            <motion.div
              animate={{ rotate: isBenchExpanded ? 180 : 0 }}
              className="text-amber-500"
            >
              <ArrowRight size={18} className="rotate-90" />
            </motion.div>
          </button>

          <AnimatePresence>
            {isBenchExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2 z-[105] relative"
              >
                <div className="bg-zinc-950/98 border border-zinc-900 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl max-h-[50vh] overflow-y-auto scrollbar-hide">
                  <div className="grid grid-cols-3 gap-4">
                    {bench.map(slot => (
                      <div key={slot.id} className="w-full">
                        <Slot 
                          slot={slot} 
                          onClick={() => handleSlotClick(slot)} 
                          disabled={phase === 'captain'} 
                          isSelected={swapSource === slot.id || activeSlotId === slot.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Captain Selection Backdrop Overlay */}
        {phase === 'captain' && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md rounded-[2.5rem] pointer-events-none transition-all duration-500" />
        )}
      </div>
    </div>
  );

  const renderSelection = () => (
    <div className="fixed inset-0 z-[8000] flex flex-col items-center justify-center p-4 md:p-8">
      {/* Backdrop for the modal */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        onClick={() => {
          if (phase !== 'captain' && phase !== 'starters' && phase !== 'bench') {
            setCurrentOptions([]);
          }
        }}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-6xl flex flex-col items-center"
      >
        <div className="text-center mb-8 md:mb-12 shrink-0">
          <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            {phase === 'captain' ? 'Choose Your Captain' : `Select ${activeSlotId?.toUpperCase()}`}
          </h2>
          <p className="text-[10px] md:text-sm font-bold text-amber-500 uppercase tracking-[0.3em] mt-3">
            {phase === 'captain' ? 'Elite & Legend Stars Only' : 'Select one to add to your roster'}
          </p>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar pb-12 px-4">
          <div className="flex flex-row gap-4 md:gap-8 min-w-max px-4 md:px-0">
            {currentOptions.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5, type: "spring" }}
                className="w-[240px] md:w-[280px] shrink-0"
              >
                <CardItem 
                  card={card} 
                  isOwned={true} 
                  mode="large" 
                  onClick={() => handleSelectCard(card)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-zinc-500 animate-pulse lg:hidden">
          <ArrowRight size={14} className="rotate-180" />
          <span className="text-[10px] font-black uppercase tracking-widest">Swipe to explore</span>
          <ArrowRight size={14} />
        </div>
      </motion.div>
    </div>
  );

  const renderLiveMatch = () => {
    const match = bracket.find(m => m.id === activeMatchId);
    if (!match) return null;

    const t1 = match.team1;
    const t2 = match.team2;
    const t1Name = t1 === 'USER' ? 'Your Team' : (t1 as GhostTeam).name;
    const t2Name = t2 === 'USER' ? 'Your Team' : (t2 as GhostTeam).name;
    const t1Ovr = t1 === 'USER' ? teamOVR : (t1 as GhostTeam).ovr;
    const t2Ovr = t2 === 'USER' ? teamOVR : (t2 as GhostTeam).ovr;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] bg-zinc-950 flex flex-col overflow-hidden"
      >
        {/* Background Court Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 border-[10px] border-white m-10 rounded-[50px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-[10px] border-white rounded-full" />
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white" />
        </div>

        {/* Header / Scoreboard */}
        <div className="relative z-10 bg-zinc-900/50 border-b border-zinc-800 p-6 md:p-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
            <div className="flex items-center justify-between w-full">
              {/* Team 1 */}
              <div className="flex flex-col items-center gap-3 w-1/3">
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-3xl flex items-center justify-center text-3xl font-black ${t1 === 'USER' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                  {t1Name[0]}
                </div>
                <p className="text-sm md:text-lg font-black uppercase italic text-white truncate w-full text-center">{t1Name}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">OVR: {t1Ovr}</p>
              </div>

              {/* Score Display */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-black px-8 py-4 rounded-3xl border-2 border-zinc-800 shadow-2xl flex items-center gap-6">
                  <span className="text-5xl md:text-7xl font-black italic text-white tabular-nums">{liveScore.s1}</span>
                  <span className="text-2xl font-black text-zinc-800">-</span>
                  <span className="text-5xl md:text-7xl font-black italic text-white tabular-nums">{liveScore.s2}</span>
                </div>
                <div className="px-4 py-1 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest">
                  Q{liveQuarter}
                </div>
              </div>

              {/* Team 2 */}
              <div className="flex flex-col items-center gap-3 w-1/3">
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-3xl flex items-center justify-center text-3xl font-black ${t2 === 'USER' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                  {t2Name[0]}
                </div>
                <p className="text-sm md:text-lg font-black uppercase italic text-white truncate w-full text-center">{t2Name}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">OVR: {t2Ovr}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Feed */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 md:p-10 relative z-10">
          <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-4 overflow-y-auto pr-4 scrollbar-hide">
            <AnimatePresence initial={false}>
              {liveEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className={`p-4 rounded-2xl border ${
                    event.team === 'USER' 
                      ? 'bg-amber-500/10 border-amber-500/20' 
                      : 'bg-zinc-900/50 border-zinc-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${event.team === 'USER' ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {event.team === 'USER' ? 'Your Team' : 'Opponent'}
                    </span>
                    <span className="text-[8px] font-bold text-zinc-600">Q{event.quarter}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{event.text}</p>
                </motion.div>
              ))}
            </AnimatePresence>
            {liveEvents.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 space-y-4">
                <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
                <p className="text-xs font-black uppercase tracking-widest">Waiting for tip-off...</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer / Controls */}
        <div className="p-6 md:p-10 bg-zinc-900/30 border-t border-zinc-800 flex justify-center relative z-10">
          <button
            onClick={() => (window as any).skipMatch?.()}
            className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3"
          >
            <Zap size={16} className="fill-amber-500 text-amber-500" />
            Skip Simulation
          </button>
        </div>
      </motion.div>
    );
  };

  const renderBoxScore = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] bg-zinc-950 flex flex-col p-6 md:p-10 overflow-hidden"
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Match Summary</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Individual Box Score</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-800">
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Player</th>
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">PTS</th>
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">REB</th>
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">AST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {boxScore.map((player) => (
                    <tr key={player.cardId} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase italic text-white group-hover:text-amber-500 transition-colors">{player.name}</p>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase">{player.position} • {player.ovr} OVR</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black italic text-white">{player.pts}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black italic text-zinc-400">{player.reb}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black italic text-zinc-400">{player.ast}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={advanceRound}
            className="w-full bg-amber-500 text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-[0_20px_40px_rgba(245,158,11,0.2)] active:scale-95"
          >
            <span>Continue Tournament</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderSummary = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-32 h-32 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.4)]"
      >
        <Sparkles size={64} className="text-black" />
      </motion.div>
      
      <div className="space-y-2">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Draft Complete</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your dynasty is ready for the playoffs</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Team OVR</p>
          <p className="text-4xl font-black italic text-amber-500">{teamOVR}</p>
        </div>
      </div>

      <div className="space-y-4 w-full max-w-xs">
        <button 
          onClick={() => setPhase('tournament_selection')}
          className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-2xl"
        >
          <span>Enter Tournament</span>
          <ArrowRight size={20} />
        </button>
        
        <button 
          onClick={() => {
            setPhase('entry');
            setStarters(prev => prev.map(s => ({ ...s, card: null })));
            setBench(prev => prev.map(b => ({ ...b, card: null })));
            setBracket([]);
            setSelectedTournament(null);
          }}
          className="w-full bg-zinc-900 text-white border border-zinc-800 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all"
        >
          <RotateCcw size={16} />
          <span>New Draft</span>
        </button>
      </div>
    </div>
  );

  const renderTournamentSelection = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">Select Tournament</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Choose your challenge level</p>
      </div>

      <div className="flex md:grid md:grid-cols-3 gap-6 w-full max-w-6xl overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0">
        {TOURNAMENTS.map((t) => (
          <motion.div
            key={t.id}
            whileHover={{ scale: 1.02, translateY: -5 }}
            onClick={() => handleSelectTournament(t)}
            className="relative group cursor-pointer bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-6 overflow-hidden shadow-2xl min-w-[85%] md:min-w-0 snap-center"
          >
            {/* Difficulty Badge */}
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              t.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
              t.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {t.difficulty}
            </div>

            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
              t.difficulty === 'Easy' ? 'bg-green-600' :
              t.difficulty === 'Medium' ? 'bg-blue-600' :
              'bg-red-600'
            }`}>
              <Trophy size={40} className="text-white" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black italic uppercase text-white">{t.name}</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rec. OVR: {t.recommendedOvr}+</p>
            </div>

            <div className="w-full pt-6 border-t border-zinc-900 space-y-4">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Rewards</p>
                <p className="text-xs font-bold text-amber-500">{t.rewards}</p>
              </div>
              
              <button className="w-full bg-white text-black py-3 rounded-xl font-black uppercase tracking-widest text-[10px] group-hover:bg-amber-400 transition-all">
                Enter Tournament
              </button>
            </div>

            {/* Background Glow */}
            <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 ${
              t.difficulty === 'Easy' ? 'bg-green-500' :
              t.difficulty === 'Medium' ? 'bg-blue-500' :
              'bg-red-500'
            }`} />
          </motion.div>
        ))}
      </div>

      <button 
        onClick={() => setPhase('summary')}
        className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
      >
        <RotateCcw size={14} />
        Back to Summary
      </button>
    </div>
  );

  const renderBracket = () => {
    // Group matches by round for easier rendering
    const qfMatches = bracket.filter(m => m.id.startsWith('qf'));
    const sfMatches = bracket.filter(m => m.id.startsWith('sf'));
    const fMatch = bracket.find(m => m.id.startsWith('f'));

    return (
      <div className="flex-1 flex flex-col p-0 md:p-8 space-y-4 md:space-y-8 overflow-hidden relative bg-zinc-950">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 z-10 p-4 md:p-0 border-b md:border-none border-zinc-900 bg-zinc-950/80 backdrop-blur-md md:bg-transparent">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 border border-zinc-800 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Trophy size={20} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg md:text-2xl font-black italic uppercase text-white leading-none truncate max-w-[150px] md:max-w-none">{selectedTournament?.name}</h2>
              <p className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                Playoff Bracket
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            <div className="text-right">
              <p className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest">Your Team</p>
              <p className="text-sm md:text-lg font-black italic text-amber-500">{teamOVR} OVR</p>
            </div>
            <div className="w-px h-6 md:h-8 bg-zinc-900" />
            <button 
              onClick={() => setPhase('tournament_selection')}
              className="p-2 md:p-3 bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Bracket Tree Container */}
        <div className="flex-1 flex items-center min-h-0 overflow-x-auto pb-24 md:pb-8 scrollbar-hide snap-x snap-mandatory">
          <div className="flex items-center gap-8 md:gap-24 min-w-max px-8 md:px-24 mx-auto h-full py-10">
            {/* Quarterfinals */}
            <div className="flex flex-col justify-center gap-8 md:gap-12 relative snap-center">
              <div className="text-center mb-4">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-600">Quarterfinals</span>
              </div>
              <div className="flex flex-col gap-8 md:gap-12">
                {qfMatches.map((m) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    isUserMatch={m.team1 === 'USER' || m.team2 === 'USER'} 
                    onSimulate={() => simulateMatch(m.id)}
                    isSimulating={isSimulating && activeMatchId === m.id}
                    teamOVR={teamOVR}
                    isActive={currentRound === 'QF' && (m.team1 === 'USER' || m.team2 === 'USER') && m.status === 'pending'}
                  />
                ))}
              </div>
            </div>

            {/* Semifinals */}
            <div className="flex flex-col justify-center gap-24 md:gap-48 relative snap-center">
              <div className="text-center mb-4">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-600">Semifinals</span>
              </div>
              <div className="flex flex-col gap-24 md:gap-48">
                {sfMatches.length > 0 ? sfMatches.map((m) => (
                  <BracketMatchCard 
                    key={m.id} 
                    match={m} 
                    isUserMatch={m.team1 === 'USER' || m.team2 === 'USER'} 
                    onSimulate={() => simulateMatch(m.id)}
                    isSimulating={isSimulating && activeMatchId === m.id}
                    teamOVR={teamOVR}
                    isActive={currentRound === 'SF' && (m.team1 === 'USER' || m.team2 === 'USER') && m.status === 'pending'}
                  />
                )) : Array.from({ length: 2 }).map((_, i) => (
                  <BracketMatchCard key={`sf-placeholder-${i}`} match={null} isUserMatch={false} onSimulate={() => {}} isSimulating={false} teamOVR={teamOVR} />
                ))}
              </div>
            </div>

            {/* Finals */}
            <div className="flex flex-col justify-center relative snap-center">
              <div className="text-center mb-4">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-amber-500">Finals</span>
              </div>
              <div className="flex flex-col">
                {fMatch ? (
                  <BracketMatchCard 
                    match={fMatch} 
                    isUserMatch={fMatch.team1 === 'USER' || fMatch.team2 === 'USER'} 
                    onSimulate={() => simulateMatch(fMatch.id)}
                    isSimulating={isSimulating && activeMatchId === fMatch.id}
                    teamOVR={teamOVR}
                    isFinal
                    isActive={currentRound === 'F' && (fMatch.team1 === 'USER' || fMatch.team2 === 'USER') && fMatch.status === 'pending'}
                  />
                ) : (
                  <BracketMatchCard match={null} isUserMatch={false} onSimulate={() => {}} isSimulating={false} teamOVR={teamOVR} isFinal />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Button */}
        <AnimatePresence>
          {bracket.some(m => (m.team1 === 'USER' || m.team2 === 'USER') && m.status === 'pending') && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-0 inset-x-0 p-4 md:p-8 bg-gradient-to-t from-black via-black/90 to-transparent z-50 flex justify-center"
            >
              <button
                onClick={() => {
                  const userMatch = bracket.find(m => (m.team1 === 'USER' || m.team2 === 'USER') && m.status === 'pending');
                  if (userMatch) simulateMatch(userMatch.id);
                }}
                disabled={isSimulating}
                className="w-full max-w-md bg-amber-500 text-black py-4 md:py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs md:text-sm flex items-center justify-center gap-3 shadow-[0_20px_50px_rgba(245,158,11,0.3)] hover:bg-amber-400 transition-all active:scale-95"
              >
                <Play size={20} fill="currentColor" />
                <span>Simulate Match</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match Result Modal Overlay */}
        <AnimatePresence>
          {matchResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-[3rem] p-10 text-center space-y-8 shadow-[0_0_100px_rgba(245,158,11,0.2)]"
              >
                <div className="space-y-2">
                  <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                    {matchResult.winner === 'Your Team' ? 'Victory!' : 'Defeat'}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {matchResult.winner === 'Your Team' ? 'You advanced to the next round' : 'Your tournament run has ended'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">YOU</p>
                    <p className={`text-6xl font-black italic ${matchResult.winner === 'Your Team' ? 'text-white' : 'text-zinc-700'}`}>{matchResult.score1}</p>
                  </div>
                  <div className="text-4xl font-black italic text-zinc-800">VS</div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">OPP</p>
                    <p className={`text-6xl font-black italic ${matchResult.winner !== 'Your Team' ? 'text-white' : 'text-zinc-700'}`}>{matchResult.score2}</p>
                  </div>
                </div>

                <button
                  onClick={advanceRound}
                  className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all"
                >
                  <span>{matchResult.winner === 'Your Team' ? (currentRound === 'F' ? 'Claim Rewards' : 'Continue') : 'Exit Tournament'}</span>
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-black overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {phase === 'entry' && <motion.div key="entry" exit={{ opacity: 0 }} className="flex-1 flex flex-col">{renderEntry()}</motion.div>}
        {(phase === 'captain' || phase === 'starters' || phase === 'bench' || phase === 'review') && <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">{renderDraftBoard()}</motion.div>}
        {phase === 'summary' && <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">{renderSummary()}</motion.div>}
        {phase === 'tournament_selection' && <motion.div key="tournament" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">{renderTournamentSelection()}</motion.div>}
        {phase === 'bracket' && <motion.div key="bracket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">{renderBracket()}</motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === 'captain' || currentOptions.length > 0) && renderSelection()}
      </AnimatePresence>

      <CardDetailModal 
        card={selectedCardForDetail} 
        onClose={() => setSelectedCardForDetail(null)} 
      />

      <TournamentSummaryModal 
        show={showTournamentSummary}
        position={finalPosition || ''}
        rewards={earnedRewards}
        onClaim={claimRewards}
      />

      <AnimatePresence>
        {isLiveMatchActive && renderLiveMatch()}
        {showBoxScore && renderBoxScore()}
      </AnimatePresence>
    </div>
  );
};

const BracketMatchCard: React.FC<{ 
  match: BracketMatch | null; 
  isUserMatch: boolean; 
  onSimulate: () => void; 
  isSimulating: boolean;
  teamOVR: number;
  isFinal?: boolean;
  isActive?: boolean;
}> = ({ match, isUserMatch, onSimulate, isSimulating, teamOVR, isFinal, isActive }) => {
  if (!match) {
    return (
      <div className={`w-48 md:w-64 bg-zinc-900/10 border border-zinc-800/30 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 opacity-30 ${isFinal ? 'scale-110' : ''}`}>
        <div className="w-full h-8 bg-zinc-800/20 rounded-lg" />
        <div className="w-4 h-4 bg-zinc-800/20 rounded-full" />
        <div className="w-full h-8 bg-zinc-800/20 rounded-lg" />
      </div>
    );
  }

  const isFinished = match.status === 'finished';
  const isPending = match.status === 'pending';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`relative ${isFinal ? 'w-64 md:w-80' : 'w-48 md:w-64'} transition-all duration-500`}
    >
      {/* Connector Lines - Professional Tree Look */}
      {!isFinal && (
        <div className="absolute -right-8 md:-right-24 top-1/2 w-8 md:w-24 h-px bg-zinc-800 z-0" />
      )}

      <div className={`
        relative overflow-hidden rounded-[2rem] border transition-all duration-500 z-10
        ${isFinished ? 'bg-zinc-950/60 border-zinc-900 opacity-50 grayscale-[0.5]' : 
          isActive ? 'bg-zinc-900 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.3)] scale-110 z-20' : 
          'bg-zinc-900/80 border-zinc-800'}
        ${isFinal ? 'border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.2)]' : ''}
      `}>
        {/* Match Header */}
        <div className="px-4 py-2 bg-black/40 border-b border-zinc-800/50 flex justify-between items-center">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {isFinal ? 'Championship' : 'Matchup'}
          </span>
          {isFinished && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Final</span>
            </div>
          )}
          {isActive && (
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 bg-amber-500 rounded-full animate-ping" />
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Next Match</span>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {/* Team 1 */}
          <div className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${match.winner === match.team1 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-900/40 border border-transparent'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${match.team1 === 'USER' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {match.team1 === 'USER' ? <UserIcon size={16} /> : <Shield size={16} />}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-black uppercase italic truncate ${match.winner === match.team1 ? 'text-amber-500' : 'text-white'}`}>
                  {match.team1 === 'USER' ? 'Your Team' : (match.team1 as GhostTeam)?.name || 'TBD'}
                </p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">OVR: {match.team1 === 'USER' ? teamOVR : (match.team1 as GhostTeam)?.ovr || '??'}</p>
              </div>
            </div>
            {isFinished && (
              <span className={`text-sm font-black italic ${match.winner === match.team1 ? 'text-white' : 'text-zinc-600'}`}>{match.score1}</span>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3 px-2">
            <div className="h-px flex-1 bg-zinc-800/50" />
            <span className="text-[9px] font-black text-zinc-800 italic tracking-widest">VS</span>
            <div className="h-px flex-1 bg-zinc-800/50" />
          </div>

          {/* Team 2 */}
          <div className={`flex items-center justify-between p-2.5 rounded-2xl transition-all ${match.winner === match.team2 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-zinc-900/40 border border-transparent'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${match.team2 === 'USER' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                {match.team2 === 'USER' ? <UserIcon size={16} /> : <Shield size={16} />}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-black uppercase italic truncate ${match.winner === match.team2 ? 'text-amber-500' : 'text-white'}`}>
                  {match.team2 === 'USER' ? 'Your Team' : (match.team2 as GhostTeam)?.name || 'TBD'}
                </p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">OVR: {match.team2 === 'USER' ? teamOVR : (match.team2 as GhostTeam)?.ovr || '??'}</p>
              </div>
            </div>
            {isFinished && (
              <span className={`text-sm font-black italic ${match.winner === match.team2 ? 'text-white' : 'text-zinc-600'}`}>{match.score2}</span>
            )}
          </div>
        </div>

        {/* Action Area */}
        {isUserMatch && isPending && !isSimulating && (
          <button 
            onClick={onSimulate}
            className="w-full py-3 bg-amber-500 text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-400 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Play size={12} fill="currentColor" />
            Play Match
          </button>
        )}

        {isSimulating && (
          <div className="w-full py-3 bg-zinc-800 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Simulating...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DraftView;
