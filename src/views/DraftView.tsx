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
  X
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useEngine } from '../hooks/useEngine';
import { Card } from '../types';
import { ALL_CARDS } from '../data/cards';
import CardDetailModal from '../components/CardDetailModal';

type DraftPhase = 'entry' | 'captain' | 'starters' | 'bench' | 'summary' | 'tournament_selection' | 'bracket';

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
    rewards: '2,500 Coins + Draft Pack',
    minOpponentOvr: 70,
    maxOpponentOvr: 80,
    opponentPool: ['Lakers Summer Roster', 'Celtics Rookies', 'Heat Prospects', 'Warriors G-League', 'Bucks Summer Squad', 'Suns Young Guns', 'Nets Future', 'Bulls Newcomers']
  },
  {
    id: 'cup',
    name: 'NBA Cup',
    difficulty: 'Medium',
    recommendedOvr: 85,
    rewards: '10,000 Coins + Elite Pack',
    minOpponentOvr: 82,
    maxOpponentOvr: 90,
    opponentPool: ['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Milwaukee Bucks', 'Phoenix Suns', 'Miami Heat', 'Denver Nuggets', 'Philadelphia 76ers']
  },
  {
    id: 'playoffs',
    name: 'NBA Playoffs',
    difficulty: 'Hard',
    recommendedOvr: 94,
    rewards: '50,000 Coins + Legend Pack',
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

const Slot: React.FC<{ 
  slot: DraftSlot; 
  mini?: boolean; 
  onClick: () => void; 
  disabled?: boolean; 
}> = ({ slot, mini, onClick, disabled }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative group transition-all duration-500 ${mini ? 'w-[11vw] max-w-[65px] aspect-[2.5/3.5]' : 'w-[18vw] max-w-[115px] aspect-[2.5/3.5]'} ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : ''}`}
    >
      {slot.card ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-full w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-[0_10px_25px_rgba(0,0,0,0.5)] group-hover:border-amber-500 transition-all group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          <img src={slot.card.imageUrl} alt={slot.card.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <p className={`font-black uppercase italic text-white truncate ${mini ? 'text-[6px]' : 'text-[8px]'}`}>{slot.card.name}</p>
            <p className={`font-bold text-amber-500 ${mini ? 'text-[5px]' : 'text-[7px]'}`}>{slot.card.stats?.ovr} OVR</p>
          </div>
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
          
          <span className={`font-black uppercase tracking-[0.2em] text-zinc-700 group-hover:text-amber-500/50 transition-colors ${mini ? 'text-[7px]' : 'text-[11px]'}`}>
            {slot.label}
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
  const { coins, spendCoins, setCurrentView } = useGame();
  const { generateDraftOptions } = useEngine();

  const [phase, setPhase] = useState<DraftPhase>('entry');
  const [starters, setStarters] = useState<DraftSlot[]>(STARTER_SLOTS);
  const [bench, setBench] = useState<DraftSlot[]>(BENCH_SLOTS);
  const [currentOptions, setCurrentOptions] = useState<Card[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<Card | null>(null);

  // Tournament State
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [bracket, setBracket] = useState<BracketMatch[]>([]);
  const [currentRound, setCurrentRound] = useState<'QF' | 'SF' | 'F'>('QF');
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchResult, setMatchResult] = useState<{ score1: number, score2: number, winner: string } | null>(null);

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

  const handleStartDraft = (method: 'coins' | 'ad') => {
    if (method === 'coins') {
      if (!spendCoins(DRAFT_COST)) return;
    }
    
    // Start with Captain selection
    const options = generateDraftOptions(5, null, [], true);
    setCurrentOptions(options);
    setPhase('captain');
    setIsFlipping(true);
  };

  const handleSelectCard = (card: Card) => {
    if (phase === 'captain') {
      // Captain goes to their position automatically
      setStarters(prev => prev.map(s => s.position === card.position ? { ...s, card } : s));
      setPhase('starters');
      setCurrentOptions([]);
    } else if (activeSlotId) {
      // Regular selection
      if (activeSlotId.startsWith('bench')) {
        setBench(prev => prev.map(s => s.id === activeSlotId ? { ...s, card } : s));
      } else {
        setStarters(prev => prev.map(s => s.id === activeSlotId ? { ...s, card } : s));
      }
      setActiveSlotId(null);
      setCurrentOptions([]);
      
      // Check if all starters are filled
      const allStartersFilled = starters.every(s => s.card || (s.id === activeSlotId && card));
      const allBenchFilled = bench.every(b => b.card || (b.id === activeSlotId && card));

      if (allStartersFilled && !allBenchFilled) {
        setPhase('bench');
      } else if (allStartersFilled && allBenchFilled) {
        setPhase('summary');
      }
    }
  };

  const handleSlotClick = (slot: DraftSlot) => {
    if (slot.card) {
      setSelectedCardForDetail(slot.card);
      return;
    }
    
    setActiveSlotId(slot.id);
    const options = generateDraftOptions(5, slot.position, seenCardIds, false);
    setCurrentOptions(options);
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

    setBracket(prev => prev.map(m => m.id === matchId ? { ...m, status: 'simulating' } : m));
    setIsSimulating(true);
    
    // Artificial delay for tension
    await new Promise(resolve => setTimeout(resolve, 2500));

    const t1Ovr = match.team1 === 'USER' ? teamOVR : (match.team1 as GhostTeam).ovr;
    const t2Ovr = match.team2 === 'USER' ? teamOVR : (match.team2 as GhostTeam).ovr;

    // Simulation logic: OVR based with randomness (Home court advantage + random factor)
    const t1Strength = t1Ovr + (Math.random() * 15);
    const t2Strength = t2Ovr + (Math.random() * 15);

    const winner = t1Strength > t2Strength ? match.team1 : match.team2;
    
    // Realistic basketball scores
    const baseScore = 95;
    const score1 = Math.floor(baseScore + (t1Ovr - 80) + (Math.random() * 25));
    const score2 = Math.floor(baseScore + (t2Ovr - 80) + (Math.random() * 25));

    setMatchResult({ 
      score1, 
      score2, 
      winner: winner === 'USER' ? 'Your Team' : (winner as GhostTeam).name 
    });

    setBracket(prev => prev.map(m => m.id === matchId ? { 
      ...m, 
      winner, 
      score1, 
      score2, 
      status: 'finished' 
    } : m));

    setIsSimulating(false);
  };

  const advanceRound = () => {
    const userLost = matchResult && matchResult.winner !== 'Your Team';
    setMatchResult(null);
    
    if (userLost) {
      setPhase('summary');
      return;
    }

    // Helper to simulate a match between two ghost teams
    const simulateGhostMatch = (m: BracketMatch): GhostTeam | 'USER' => {
      if (m.winner) return m.winner;
      const t1Ovr = m.team1 === 'USER' ? teamOVR : (m.team1 as GhostTeam).ovr;
      const t2Ovr = m.team2 === 'USER' ? teamOVR : (m.team2 as GhostTeam).ovr;
      const t1Strength = t1Ovr + Math.random() * 12;
      const t2Strength = t2Ovr + Math.random() * 12;
      return t1Strength > t2Strength ? m.team1 : m.team2;
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

  const teamChemistry = useMemo(() => {
    // Simple chemistry logic: +5 for each pair of teammates
    const allPlayers = [...starters, ...bench].map(s => s.card).filter(Boolean) as Card[];
    if (allPlayers.length === 0) return 0;
    
    const teams = allPlayers.map(p => p.team);
    const teamCounts: Record<string, number> = {};
    teams.forEach(t => teamCounts[t] = (teamCounts[t] || 0) + 1);
    
    let chem = 50; // Base chemistry
    Object.values(teamCounts).forEach(count => {
      if (count > 1) chem += (count - 1) * 10;
    });
    
    return Math.min(100, chem);
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
          disabled={coins < DRAFT_COST}
          className="group relative bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-amber-400 transition-all disabled:opacity-50"
        >
          <Coins size={18} />
          <span>Entry: {DRAFT_COST.toLocaleString()}</span>
        </button>
        
        <button 
          onClick={() => handleStartDraft('ad')}
          className="group relative bg-zinc-900 text-white border border-zinc-800 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all"
        >
          <Play size={18} />
          <span>Watch Ad to Enter</span>
        </button>
      </div>
    </div>
  );

  const renderDraftBoard = () => (
    <div className="flex-1 flex flex-col p-2 md:p-4 space-y-2 overflow-hidden max-w-6xl mx-auto w-full h-full relative">
      {/* Tactical Board Header */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-3 flex items-center justify-between shadow-xl shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500">Team OVR</p>
            <p className="text-xl font-black italic text-amber-500">{teamOVR}</p>
          </div>
          <div className="w-px h-6 bg-zinc-900" />
          <div className="text-center">
            <p className="text-[7px] font-black uppercase tracking-widest text-zinc-500">Chemistry</p>
            <p className="text-xl font-black italic text-blue-500">{teamChemistry}%</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-tighter text-white italic">Draft Mode</p>
          <p className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">
            {phase === 'captain' ? 'Captain Pick' : phase === 'starters' ? 'Starters' : 'Bench'}
          </p>
        </div>
      </div>

      {/* Main Board Container (Full Screen Split) */}
      <div className="flex-1 flex flex-col min-h-0 gap-4 relative">
        {/* Top Half: Tactical Starting Five */}
        <div className="flex-[1.2] bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] p-4 flex flex-col justify-center relative overflow-hidden shadow-2xl">
          {/* Court Lines Overlay (More prominent for tactical feel) */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-1/2 border-b-2 border-x-2 border-white rounded-b-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white" />
          </div>

          <div className="relative z-10 h-full w-full flex flex-col justify-around py-4">
            {/* Row 1: PG (Top Center) */}
            <div className="flex justify-center">
              <div className="transform -translate-y-2">
                <Slot slot={starters[0]} onClick={() => handleSlotClick(starters[0])} disabled={phase === 'captain'} />
              </div>
            </div>
            
            {/* Row 2: SG & SF (Middle Wings) */}
            <div className="flex justify-between px-[10%] md:px-[20%]">
              <div className="transform -translate-x-4">
                <Slot slot={starters[1]} onClick={() => handleSlotClick(starters[1])} disabled={phase === 'captain'} />
              </div>
              <div className="transform translate-x-4">
                <Slot slot={starters[2]} onClick={() => handleSlotClick(starters[2])} disabled={phase === 'captain'} />
              </div>
            </div>
            
            {/* Row 3: PF & C (Bottom Paint) */}
            <div className="flex justify-center gap-8 md:gap-16">
              <div className="transform translate-y-2">
                <Slot slot={starters[3]} onClick={() => handleSlotClick(starters[3])} disabled={phase === 'captain'} />
              </div>
              <div className="transform translate-y-2">
                <Slot slot={starters[4]} onClick={() => handleSlotClick(starters[4])} disabled={phase === 'captain'} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Half: Bench Strip */}
        <div className="flex-none bg-zinc-950/80 border border-zinc-900 rounded-3xl p-4 flex flex-col shadow-xl">
          <div className="flex items-center gap-3 mb-3 shrink-0">
            <div className="h-px flex-1 bg-zinc-900" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-2">Bench</h3>
            <div className="h-px flex-1 bg-zinc-900" />
          </div>
          
          <div className="flex justify-center items-center gap-2 md:gap-3 w-full overflow-x-auto scrollbar-hide py-1">
            {bench.map(slot => (
              <div key={slot.id} className="shrink-0">
                <Slot slot={slot} mini onClick={() => handleSlotClick(slot)} disabled={phase === 'captain'} />
              </div>
            ))}
          </div>
        </div>

        {/* Captain Selection Backdrop Overlay */}
        {phase === 'captain' && (
          <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-md rounded-[2.5rem] pointer-events-none transition-all duration-500" />
        )}
      </div>
    </div>
  );

  const renderSelection = () => (
    <div className="fixed inset-0 z-[8000] flex flex-col items-center justify-center p-4">
      {/* Backdrop for the modal */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-5xl bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 md:p-10 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col items-center"
      >
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
            {phase === 'captain' ? 'Choose Your Captain' : `Select ${activeSlotId?.toUpperCase()}`}
          </h2>
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-2">
            {phase === 'captain' ? 'Elite & Legend Stars Only' : 'Select one to add to your roster'}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 md:gap-6 w-full">
          {currentOptions.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20, rotateY: phase === 'captain' ? 180 : 0 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="w-[35vw] max-w-[160px] md:max-w-[180px] flex flex-col gap-2 cursor-pointer group"
              onClick={() => handleSelectCard(card)}
            >
              <div className="relative aspect-[2.5/3.5] w-full bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden group-hover:border-amber-500 transition-all group-hover:scale-105 shadow-2xl">
                <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <p className="text-[9px] md:text-[10px] font-black uppercase italic text-white truncate">{card.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[8px] font-bold text-amber-500">{card.stats?.ovr} OVR</span>
                    <span className="text-[8px] font-bold text-zinc-400">{card.position}</span>
                  </div>
                </div>
              </div>
              
              {/* Stats Panel */}
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-1.5 grid grid-cols-3 gap-1 group-hover:border-amber-500/30 transition-colors">
                <div className="text-center">
                  <p className="text-[5px] font-black text-zinc-500 uppercase">PTS</p>
                  <p className="text-[9px] font-black text-white">{card.stats.points}</p>
                </div>
                <div className="text-center">
                  <p className="text-[5px] font-black text-zinc-500 uppercase">AST</p>
                  <p className="text-[9px] font-black text-white">{card.stats.assists}</p>
                </div>
                <div className="text-center">
                  <p className="text-[5px] font-black text-zinc-500 uppercase">REB</p>
                  <p className="text-[9px] font-black text-white">{card.stats.rebounds}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );

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

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Team OVR</p>
          <p className="text-4xl font-black italic text-amber-500">{teamOVR}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Chemistry</p>
          <p className="text-4xl font-black italic text-blue-500">{teamChemistry}%</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {TOURNAMENTS.map((t) => (
          <motion.div
            key={t.id}
            whileHover={{ scale: 1.02, translateY: -5 }}
            onClick={() => handleSelectTournament(t)}
            className="relative group cursor-pointer bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-6 overflow-hidden shadow-2xl"
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
    const qfMatches = currentRound === 'QF' ? bracket : [];
    const sfMatches = currentRound === 'SF' ? bracket : [];
    const fMatch = currentRound === 'F' ? bracket[0] : null;

    return (
      <div className="flex-1 flex flex-col p-4 md:p-8 space-y-8 overflow-hidden relative bg-zinc-950">
        <div className="flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center">
              <Trophy size={24} className="text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase text-white leading-none">{selectedTournament?.name}</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                {currentRound === 'QF' ? 'Quarter-Finals' : currentRound === 'SF' ? 'Semi-Finals' : 'Grand Final'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Your Team</p>
              <p className="text-lg font-black italic text-amber-500">{teamOVR} OVR</p>
            </div>
            <div className="w-px h-8 bg-zinc-900" />
            <button 
              onClick={() => setPhase('tournament_selection')}
              className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Bracket Tree Container */}
        <div className="flex-1 flex items-center justify-center min-h-0 overflow-x-auto pb-8">
          <div className="flex items-center gap-4 md:gap-16 min-w-max px-8">
            {/* Quarter Finals */}
            <div className={`flex flex-col gap-4 md:gap-8 transition-all duration-500 ${currentRound !== 'QF' ? 'opacity-30 scale-90 blur-[2px]' : ''}`}>
              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Quarter Finals</span>
              </div>
              {currentRound === 'QF' ? bracket.map((m) => (
                <BracketMatchCard 
                  key={m.id} 
                  match={m} 
                  isUserMatch={m.team1 === 'USER' || m.team2 === 'USER'} 
                  onSimulate={() => simulateMatch(m.id)}
                  isSimulating={isSimulating}
                  teamOVR={teamOVR}
                />
              )) : Array.from({ length: 4 }).map((_, i) => (
                <BracketMatchCard key={`qf-placeholder-${i}`} match={null} isUserMatch={false} onSimulate={() => {}} isSimulating={false} teamOVR={teamOVR} />
              ))}
            </div>

            {/* Connector Lines 1 */}
            <div className="hidden md:flex flex-col justify-around h-[400px] w-12 text-zinc-800">
              <div className="h-1/2 border-y-2 border-r-2 rounded-r-2xl" />
              <div className="h-1/2 border-y-2 border-r-2 rounded-r-2xl" />
            </div>

            {/* Semi Finals */}
            <div className={`flex flex-col gap-8 md:gap-24 transition-all duration-500 ${currentRound !== 'SF' ? 'opacity-30 scale-90 blur-[2px]' : ''}`}>
              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">Semi Finals</span>
              </div>
              {currentRound === 'SF' ? bracket.map((m) => (
                <BracketMatchCard 
                  key={m.id} 
                  match={m} 
                  isUserMatch={m.team1 === 'USER' || m.team2 === 'USER'} 
                  onSimulate={() => simulateMatch(m.id)}
                  isSimulating={isSimulating}
                  teamOVR={teamOVR}
                />
              )) : Array.from({ length: 2 }).map((_, i) => (
                <BracketMatchCard key={`sf-placeholder-${i}`} match={null} isUserMatch={false} onSimulate={() => {}} isSimulating={false} teamOVR={teamOVR} />
              ))}
            </div>

            {/* Connector Lines 2 */}
            <div className="hidden md:flex flex-col justify-center h-[400px] w-12 text-zinc-800">
              <div className="h-1/4 border-y-2 border-r-2 rounded-r-2xl" />
            </div>

            {/* Final */}
            <div className={`flex flex-col gap-8 transition-all duration-500 ${currentRound !== 'F' ? 'opacity-30 scale-90 blur-[2px]' : ''}`}>
              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">The Grand Final</span>
              </div>
              {currentRound === 'F' ? (
                <BracketMatchCard 
                  match={bracket[0]} 
                  isUserMatch={bracket[0].team1 === 'USER' || bracket[0].team2 === 'USER'} 
                  onSimulate={() => simulateMatch(bracket[0].id)}
                  isSimulating={isSimulating}
                  teamOVR={teamOVR}
                  isFinal
                />
              ) : (
                <BracketMatchCard match={null} isUserMatch={false} onSimulate={() => {}} isSimulating={false} teamOVR={teamOVR} isFinal />
              )}
            </div>
          </div>
        </div>

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
        {(phase === 'captain' || phase === 'starters' || phase === 'bench') && <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">{renderDraftBoard()}</motion.div>}
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
}> = ({ match, isUserMatch, onSimulate, isSimulating, teamOVR, isFinal }) => {
  if (!match) {
    return (
      <div className={`w-full max-w-[200px] md:max-w-[240px] bg-zinc-900/10 border border-zinc-800/30 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center gap-2 opacity-30 ${isFinal ? 'scale-110' : ''}`}>
        <div className="w-full h-8 bg-zinc-800/20 rounded-lg" />
        <div className="w-4 h-4 bg-zinc-800/20 rounded-full" />
        <div className="w-full h-8 bg-zinc-800/20 rounded-lg" />
      </div>
    );
  }

  const isFinished = match.status === 'finished';
  const isSim = match.status === 'simulating';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`w-full max-w-[200px] md:max-w-[240px] bg-zinc-950 border-2 rounded-[1.5rem] p-3 md:p-4 relative overflow-hidden transition-all duration-500 ${
        isUserMatch ? 'border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.1)]' : 'border-zinc-900'
      } ${isFinal ? 'scale-110 md:scale-125 shadow-[0_0_60px_rgba(245,158,11,0.2)] border-amber-500/60' : ''}`}
    >
      <div className="flex flex-col gap-3">
        {/* Team 1 */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${match.winner === match.team1 ? 'bg-green-500/10 border border-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' : 'bg-zinc-900/40 border border-transparent'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${match.team1 === 'USER' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
              {match.team1 === 'USER' ? 'YOU' : (match.team1 as GhostTeam)?.name?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-black uppercase truncate ${match.winner === match.team1 ? 'text-green-500' : 'text-white'}`}>
                {match.team1 === 'USER' ? 'Your Team' : (match.team1 as GhostTeam)?.name || 'Unknown Team'}
              </p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">OVR: {match.team1 === 'USER' ? teamOVR : (match.team1 as GhostTeam)?.ovr || 0}</p>
            </div>
          </div>
          {isFinished && (
            <p className={`text-sm font-black italic ${match.winner === match.team1 ? 'text-white' : 'text-zinc-600'}`}>{match.score1}</p>
          )}
        </div>

        <div className="flex items-center justify-center -my-1">
          <span className="text-[8px] font-black text-zinc-800 italic tracking-widest">VS</span>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${match.winner === match.team2 ? 'bg-green-500/10 border border-green-500/20 shadow-[inset_0_0_20px_rgba(34,197,94,0.05)]' : 'bg-zinc-900/40 border border-transparent'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${match.team2 === 'USER' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
              {match.team2 === 'USER' ? 'YOU' : (match.team2 as GhostTeam)?.name?.[0] || '?'}
            </div>
            <div className="min-w-0">
              <p className={`text-[10px] font-black uppercase truncate ${match.winner === match.team2 ? 'text-green-500' : 'text-white'}`}>
                {match.team2 === 'USER' ? 'Your Team' : (match.team2 as GhostTeam)?.name || 'Unknown Team'}
              </p>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">OVR: {match.team2 === 'USER' ? teamOVR : (match.team2 as GhostTeam)?.ovr || 0}</p>
            </div>
          </div>
          {isFinished && (
            <p className={`text-sm font-black italic ${match.winner === match.team2 ? 'text-white' : 'text-zinc-600'}`}>{match.score2}</p>
          )}
        </div>
      </div>

      {/* Action Overlay */}
      {isUserMatch && !isFinished && !isSim && (
        <div className="mt-4">
          <button
            onClick={onSimulate}
            disabled={isSimulating}
            className="w-full bg-amber-500 text-black py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center justify-center gap-2 hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/10 active:scale-95"
          >
            <Play size={12} fill="currentColor" />
            <span>Simulate</span>
          </button>
        </div>
      )}

      {isSim && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center space-y-3 z-20">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-amber-500 animate-pulse">Simulating...</p>
        </div>
      )}
    </motion.div>
  );
};

export default DraftView;
